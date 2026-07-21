import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Table, Badge, Spinner, Input, InputGroup, InputGroupText, Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Button } from 'reactstrap';
import { AlertTriangle, MapPin, Search, Activity, Filter, BarChart3, Clock, Package, UserCheck, Plus, Zap } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ReportAnalyzing = () => {
    const [incidents, setIncidents] = useState([]);
    // Map: incidentId (string) → array of tasks for that incident
    const [incidentTaskMap, setIncidentTaskMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [volunteers, setVolunteers] = useState([]);
    const [resources, setResources] = useState([]);

    const fetchIncidents = async () => {
        try {
            const [incidentsRes, tasksRes] = await Promise.all([
                axios.get('http://localhost:5000/disaster'),
                axios.get('http://localhost:5000/task')
            ]);
            setIncidents(incidentsRes.data);

            // Build incidentId → tasks[] map (only operational tasks, not NGO broadcast alerts)
            const taskMap = {};
            if (Array.isArray(tasksRes.data)) {
                tasksRes.data.forEach(task => {
                    if (task.incidentId && task.isNGOAlert !== true) {
                        const id = (task.incidentId._id || task.incidentId).toString();
                        if (!taskMap[id]) taskMap[id] = [];
                        taskMap[id].push(task);
                    }
                });
            }
            setIncidentTaskMap(taskMap);
        } catch (err) {
            console.error("Failed to fetch analytical signals and tasks.", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchVolunteers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/auth/volunteers');
            setVolunteers(res.data.filter(v => v.isApproved));
        } catch (err) {
            console.error("Failed to fetch volunteer roster");
        }
    };

    const fetchResources = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await axios.get('http://localhost:5000/resource');
            setResources(res.data.filter(r => r.ngoId?._id === user.id && r.status === 'In Stock'));
        } catch (err) {
            console.error("Failed to fetch NGO resources");
        }
    };

    useEffect(() => {
        fetchIncidents();
        fetchVolunteers();
        fetchResources();
        // Poll every 10 seconds so volunteer assignment notifications reflect quickly
        const poll = setInterval(() => { fetchIncidents(); fetchResources(); }, 10000);
        return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resolveLocation = async (incident) => {
        const id = toast.loading("Resolving tactical geography...");
        try {
            const [lng, lat] = incident.location.coordinates;
            const res = await axios.get(`http://localhost:5000/api/config/geocode?lat=${lat}&lon=${lng}`);
            if (res.data.status === "OK" && res.data.results && res.data.results.length > 0) {
                const address = res.data.results[0].formatted_address;
                await axios.put(`http://localhost:5000/disaster/${incident._id}`, { address });
                toast.success(`Identity established: ${address.substring(0, 30)}...`, { id });
                fetchIncidents();
            } else {
                const status = res.data.status || "UNKNOWN_ERROR";
                const errorMap = {
                    "ZERO_RESULTS": "No geographical matches found for these coordinates.",
                    "OVER_QUERY_LIMIT": "Mesh resolution capacity exceeded (API Limit).",
                    "REQUEST_DENIED": "Geocoding protocol denied (Invalid API Key).",
                    "INVALID_REQUEST": "Malformed coordinate signal.",
                };
                toast.error(errorMap[status] || `Resolution failure: ${status}`, { id });
            }
        } catch (err) {
            toast.error("Geocoding protocol failure.", { id });
        }
    };

    // ── Modal State ──
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [isAdditional, setIsAdditional] = useState(false); // true = adding extra task to already-allocated incident
    const [allocationData, setAllocationData] = useState({
        helpType: 'Medical Support',
        description: '',
        urgency: 'Medium',
        volunteerId: '',
        selectedResources: {}
    });
    const [volunteerSearch, setVolunteerSearch] = useState('');
    const [showVolunteerDropdown, setShowVolunteerDropdown] = useState(false);

    // ── Distance helpers ──
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const isNearby = (v, incident) => {
        if (!incident) return false;
        if (v.coordinates?.lat && v.coordinates?.lng && incident.location?.coordinates) {
            const dist = getDistance(incident.location.coordinates[1], incident.location.coordinates[0], v.coordinates.lat, v.coordinates.lng);
            if (dist <= 50) return true;
        }
        if (v.location && incident.address && incident.address !== "GPS Coordinates Verified") {
            const ignoreWords = ['kerala', 'india', 'district', 'state', 'city', 'town', 'village'];
            const cleanAddress = incident.address.toLowerCase().replace(/[,.-]/g, ' ');
            const incAddrWords = cleanAddress.split(' ').filter(w => w.trim() !== '');
            for (let word of incAddrWords) {
                if (word.length > 3 && !ignoreWords.includes(word) && v.location.toLowerCase().includes(word)) return true;
            }
        }
        return false;
    };

    const searchFilteredVolunteers = volunteers.filter(v =>
        !volunteerSearch ||
        v.name?.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
        v.location?.toLowerCase().includes(volunteerSearch.toLowerCase())
    );
    const nearbyVolunteers = searchFilteredVolunteers.filter(v => isNearby(v, selectedIncident));
    const regularVolunteers = searchFilteredVolunteers.filter(v => !isNearby(v, selectedIncident));

    /**
     * Open modal for a given incident.
     * If additional=true, it means this incident already has tasks but NGO wants to add more.
     * We pre-populate the volunteer from the existing assigned task.
     */
    const toggleModal = (incident = null, additional = false) => {
        setSelectedIncident(incident);
        setIsAdditional(additional);

        // Pre-populate volunteer if admin already assigned one for this incident
        let preVol = '';
        if (incident) {
            const existingTasks = incidentTaskMap[incident._id] || [];
            const dispatched = existingTasks.find(t => t.volunteerId?._id || t.volunteerId);
            if (dispatched) {
                preVol = dispatched.volunteerId?._id || dispatched.volunteerId || '';
            }
        }

        setAllocationData({
            helpType: 'Medical Support',
            description: '',
            urgency: incident ? incident.severity : 'Medium',
            volunteerId: preVol,
            selectedResources: {}
        });
        setVolunteerSearch('');
        setShowVolunteerDropdown(false);
        setIsModalOpen(!isModalOpen);
    };

    const handleAllocate = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Deploying tactical units...");
        try {
            const payload = {
                title: `${isAdditional ? 'ADDITIONAL SUPPORT' : 'DEPLOYMENT'}: ${allocationData.helpType}`,
                description: `Strategic Allocation for ${selectedIncident.type}: ${allocationData.description}`,
                priority: allocationData.urgency,
                incidentId: selectedIncident._id
            };
            if (allocationData.volunteerId) {
                payload.volunteerId = allocationData.volunteerId;
            }
            if (allocationData.selectedResources && Object.keys(allocationData.selectedResources).length > 0) {
                payload.allocatedResources = Object.keys(allocationData.selectedResources).map(id => ({
                    originalId: id,
                    quantityToAllocate: allocationData.selectedResources[id]
                }));
            }

            await axios.post('http://localhost:5000/task', payload);

            const volunteerNote = allocationData.volunteerId
                ? `Volunteer assigned and notified.`
                : "Task sent to Admin Command Center — a volunteer will be dispatched shortly.";
            toast.success(`${isAdditional ? 'Additional support' : 'Deployment'} initiated. ${volunteerNote}`, { id: toastId, duration: 5000 });
            toggleModal();
            fetchIncidents();
            fetchResources();
        } catch (err) {
            toast.error("Deployment protocol failed.", { id: toastId });
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return 'danger';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            default: return 'success';
        }
    };

    const getTaskStatusColor = (status) => {
        switch (status) {
            case 'Completed': return '#22c55e';
            case 'In Progress': return '#3b82f6';
            case 'Rejected': return '#ef4444';
            case 'Resolved': return '#a78bfa';
            default: return '#f59e0b';
        }
    };

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch = incident.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incident.address?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterSeverity === 'All' || incident.severity === filterSeverity;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: incidents.length,
        critical: incidents.filter(i => i.severity === 'Critical').length,
        ongoing: incidents.filter(i => i.status === 'Ongoing').length,
        resolved: incidents.filter(i => i.status === 'Resolved').length
    };

    return (
        <DashboardLayout role="NGO" title="Incident Analysis" subtitle="Strategic intelligence mesh for reported disaster signals." themeColor="#0ea5e9">
            <Row className="g-4 mb-5">
                {[
                    { label: 'Total signals', value: stats.total, color: '#0ea5e9', icon: <Activity size={20} /> },
                    { label: 'Critical Ops', value: stats.critical, color: '#ef4444', icon: <AlertTriangle size={20} /> },
                    { label: 'Field Ongoing', value: stats.ongoing, color: '#3b82f6', icon: <Clock size={20} /> },
                    { label: 'Resolved', value: stats.resolved, color: '#22c55e', icon: <BarChart3 size={20} /> }
                ].map((stat, i) => (
                    <Col md={3} key={i}>
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                            <CardBody className="p-4">
                                <div className="d-flex align-items-center gap-3 mb-2 opacity-50 text-white small fw-bold text-uppercase">
                                    {stat.icon} {stat.label}
                                </div>
                                <h2 className="fw-black text-white m-0">{stat.value}</h2>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="border-0 shadow-lg mb-5" style={{ borderRadius: '28px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardBody className="p-4">
                    <Row className="g-3 align-items-center">
                        <Col md={8}>
                            <InputGroup className="rounded-pill overflow-hidden border-0 bg-white bg-opacity-10">
                                <InputGroupText className="bg-transparent border-0 text-white opacity-50 px-4">
                                    <Search size={18} />
                                </InputGroupText>
                                <Input
                                    placeholder="Search by signal type or sector..."
                                    className="bg-transparent border-0 text-white py-3 shadow-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex align-items-center gap-3">
                                <Filter size={18} className="text-info" />
                                <Input
                                    type="select"
                                    className="rounded-pill border-0 py-2 px-4 shadow-none text-white fs-6"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value)}
                                >
                                    <option className="text-dark" value="All">All Severities</option>
                                    <option className="text-dark" value="Critical">Critical Only</option>
                                    <option className="text-dark" value="High">High Risk</option>
                                    <option className="text-dark" value="Medium">Medium Risk</option>
                                </Input>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {loading ? (
                <div className="text-center py-5 text-info">
                    <Spinner size="lg" />
                    <p className="mt-3 small fw-bold text-uppercase opacity-50">Syncing planetary signals...</p>
                </div>
            ) : (
                <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '28px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                    <CardBody className="p-0">
                        <div className="table-responsive">
                            <Table hover borderless className="m-0 text-white align-middle">
                                <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <tr className="text-uppercase small fw-bold text-muted">
                                        <th className="px-5 py-4">Incident Logic</th>
                                        <th>Sector Axis</th>
                                        <th>Risk Core</th>
                                        <th>Status Mesh</th>
                                        <th className="px-4 text-end">Identity</th>
                                        <th className="px-4 text-end">Dispatch Status & Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredIncidents.map((incident, idx) => {
                                            const incTasks = incidentTaskMap[incident._id] || [];
                                            const hasTask = incTasks.length > 0;
                                            // Find highest-priority task with volunteer assigned
                                            const assignedTask = incTasks.find(t => t.volunteerId?.name || t.volunteerId);
                                            const assignedVolunteerName = assignedTask?.volunteerId?.name || null;
                                            const latestStatus = incTasks[incTasks.length - 1]?.status || null;

                                            return (
                                                <motion.tr
                                                    key={incident._id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="fw-bold fs-5">{incident.type}</div>
                                                        <div className="small opacity-50">{incident.description?.substring(0, 50)}...</div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <MapPin size={14} className="text-info" />
                                                                <span className="small">
                                                                    {incident.address && incident.address !== "GPS Coordinates Verified"
                                                                        ? incident.address
                                                                        : incident.location?.coordinates
                                                                            ? `${incident.location.coordinates[1].toFixed(4)}, ${incident.location.coordinates[0].toFixed(4)}`
                                                                            : 'GPS Lock Active'}
                                                                </span>
                                                            </div>
                                                            {(!incident.address || incident.address === "GPS Coordinates Verified" || incident.address.includes(',')) && (
                                                                <div
                                                                    className="text-info small fw-bold text-uppercase cursor-pointer opacity-75"
                                                                    style={{ fontSize: '0.65rem', borderBottom: '1px solid rgba(14, 165, 233, 0.3)', width: 'fit-content', cursor: 'pointer' }}
                                                                    onClick={() => resolveLocation(incident)}
                                                                >
                                                                    Identify Signal Location
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge color={getSeverityColor(incident.severity)} pill className="px-3 py-1">
                                                            {incident.severity}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: incident.status === 'Ongoing' ? '#3b82f6' : incident.status === 'Resolved' ? '#22c55e' : '#64748b' }}></div>
                                                            <span className="small fw-bold">{incident.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 text-end">
                                                        <div className="small opacity-75">{new Date(incident.createdAt).toLocaleDateString()}</div>
                                                        <div className="small fw-bold text-info">UID: {incident._id.slice(-6).toUpperCase()}</div>
                                                    </td>

                                                    {/* ── Dispatch Status & Action Column ── */}
                                                    <td className="px-4 text-end">
                                                        {hasTask ? (
                                                            <div className="d-flex flex-column align-items-end gap-2">
                                                                {/* Task status badge */}
                                                                <div
                                                                    className="px-2 py-1 rounded-3 d-flex align-items-center gap-2"
                                                                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.7rem' }}
                                                                >
                                                                    <Zap size={10} style={{ color: '#22c55e' }} />
                                                                    <span style={{ color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                                        {incTasks.length} Task{incTasks.length > 1 ? 's' : ''} Allocated
                                                                    </span>
                                                                </div>

                                                                {/* Volunteer assignment info from admin */}
                                                                {assignedVolunteerName ? (
                                                                    <div
                                                                        className="px-2 py-1 rounded-3 d-flex align-items-center gap-2"
                                                                        style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', fontSize: '0.7rem', maxWidth: '180px' }}
                                                                    >
                                                                        <UserCheck size={10} className="text-info flex-shrink-0" />
                                                                        <span className="text-" style={{ fontWeight: 600 }}>{assignedVolunteerName}</span>
                                                                        <span
                                                                            className="rounded-pill px-1"
                                                                            style={{ background: getTaskStatusColor(latestStatus) + '22', color: getTaskStatusColor(latestStatus), fontSize: '0.6rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                                                                        >
                                                                            {latestStatus}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className="px-2 py-1 rounded-3 d-flex align-items-center gap-2"
                                                                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.7rem' }}
                                                                    >
                                                                        <Clock size={10} style={{ color: '#f59e0b' }} />
                                                                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>Awaiting Admin Dispatch</span>
                                                                    </div>
                                                                )}

                                                                {/* Add Additional Support button */}
                                                                <Button
                                                                    size="sm"
                                                                    className="rounded-pill px-3 fw-bold border-0 d-flex align-items-center gap-1"
                                                                    style={{ backgroundColor: 'rgba(14,165,233,0.15)', color: '#0ea5e9', fontSize: '0.7rem' }}
                                                                    onClick={() => toggleModal(incident, true)}
                                                                >
                                                                    <Plus size={11} /> Add Support
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                color="info"
                                                                outline
                                                                size="sm"
                                                                className="rounded-pill px-3 fw-bold border-0"
                                                                style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', fontSize: '0.75rem' }}
                                                                onClick={() => toggleModal(incident, false)}
                                                            >
                                                                ALLOCATE
                                                            </Button>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </Table>
                        </div>
                        {filteredIncidents.length === 0 && (
                            <div className="text-center py-5 opacity-50">
                                <Activity size={48} className="mb-3" />
                                <p>No disaster signals detected in filtered mesh.</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
            <style>{`.fw-black { font-weight: 900; }`}</style>

            {/* ── Allocation Modal ── */}
            <Modal isOpen={isModalOpen} toggle={() => toggleModal()} centered className="border-0" size="lg">
                <ModalHeader toggle={() => toggleModal()} className="bg-dark text-white border-0 py-4">
                    <div className="d-flex align-items-center gap-2">
                        <Package size={20} className="text-info" />
                        <span className="fw-bold">
                            {isAdditional ? 'Add Additional Tactical Support' : 'Allocate Tactical Support'}
                        </span>
                        {isAdditional && (
                            <Badge color="warning" pill style={{ fontSize: '0.6rem' }}>SUPPLEMENTAL</Badge>
                        )}
                    </div>
                </ModalHeader>
                <ModalBody className="bg-dark text-white border-0 px-4 pb-4">
                    {selectedIncident && (
                        <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="small fw-bold text-uppercase opacity-50 mb-1">Target Incident</div>
                            <div className="fw-bold text-info fs-5">{selectedIncident.type}</div>
                            <div className="small opacity-75 mb-2">{selectedIncident.address || "Coordinates Verified"}</div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <Badge color={getSeverityColor(selectedIncident.severity)} className="text-uppercase" style={{ fontSize: '0.6rem' }}>
                                    {selectedIncident.severity} RISK
                                </Badge>
                                {/* Show existing tasks for this incident */}
                                {(incidentTaskMap[selectedIncident._id] || []).map((t, i) => (
                                    <div key={i} className="d-flex align-items-center gap-1 px-2 py-1 rounded-3"
                                        style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', fontSize: '0.65rem' }}>
                                        <Zap size={9} className="text-info" />
                                        <span className="text-white-50">{t.title?.substring(0, 25)}</span>
                                        {t.volunteerId?.name && (
                                            <>
                                                <span className="text-white-50">→</span>
                                                <UserCheck size={9} className="text-success" />
                                                <span style={{ color: '#22c55e', fontWeight: 700 }}>{t.volunteerId.name}</span>
                                            </>
                                        )}
                                        <span className="rounded-pill px-1" style={{ background: getTaskStatusColor(t.status) + '22', color: getTaskStatusColor(t.status), fontWeight: 700 }}>
                                            {t.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <Form onSubmit={handleAllocate}>
                        <Row className="g-3">
                            <Col md={6}>
                                <FormGroup className="mb-3">
                                    <Label className="small fw-bold text-uppercase opacity-50">Relief Protocol</Label>
                                    <Input
                                        type="select"
                                        value={allocationData.helpType}
                                        onChange={(e) => setAllocationData({ ...allocationData, helpType: e.target.value })}
                                        className="bg-secondary bg-opacity-25 text-white border-0 shadow-none py-2"
                                    >
                                        <option className="bg-dark">Medical Support</option>
                                        <option className="bg-dark">Food & Rations</option>
                                        <option className="bg-dark">Logistics/Equipment</option>
                                        <option className="bg-dark">Search & Rescue</option>
                                        <option className="bg-dark">Evacuation Support</option>
                                        <option className="bg-dark">Shelter Setup</option>
                                    </Input>
                                </FormGroup>
                                <FormGroup className="mb-3">
                                    <Label className="small fw-bold text-uppercase opacity-50">Priority / Urgency</Label>
                                    <Input
                                        type="select"
                                        value={allocationData.urgency}
                                        onChange={(e) => setAllocationData({ ...allocationData, urgency: e.target.value })}
                                        className="bg-secondary bg-opacity-25 text-white border-0 shadow-none py-2"
                                    >
                                        <option className="bg-dark">Low</option>
                                        <option className="bg-dark">Medium</option>
                                        <option className="bg-dark">High</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup className="mb-3 position-relative">
                                    <Label className="small fw-bold text-uppercase opacity-50">
                                        Assign Field Volunteer
                                        {allocationData.volunteerId && (
                                            <span className="ms-2 text-success" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                                                ✓ {volunteers.find(v => v._id === allocationData.volunteerId)?.name}
                                            </span>
                                        )}
                                    </Label>
                                    <div
                                        className="bg-secondary bg-opacity-25 text-white border-0 py-2 px-3 rounded d-flex justify-content-between align-items-center"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowVolunteerDropdown(!showVolunteerDropdown)}
                                    >
                                        {allocationData.volunteerId
                                            ? volunteers.find(v => v._id === allocationData.volunteerId)?.name || 'Unknown'
                                            : '-- Unassigned (Admin will dispatch) --'}
                                        <span>▼</span>
                                    </div>

                                    {showVolunteerDropdown && (
                                        <div
                                            className="position-absolute w-100 bg-dark shadow-lg rounded mt-1 border"
                                            style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto', borderColor: 'rgba(255,255,255,0.1)' }}
                                        >
                                            <div className="p-2 position-sticky top-0 bg-dark" style={{ zIndex: 10 }}>
                                                <Input
                                                    type="text"
                                                    placeholder="Search volunteer by name or location..."
                                                    className="bg-secondary bg-opacity-25 border-0 shadow-none mb-1"
                                                    style={{ color: '#ffffff' }}
                                                    value={volunteerSearch}
                                                    onChange={(e) => setVolunteerSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div
                                                className="px-3 py-2 text-white opacity-75"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => { setAllocationData({ ...allocationData, volunteerId: '' }); setShowVolunteerDropdown(false); }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                -- Unassigned (Admin will dispatch) --
                                            </div>
                                            <div className="px-3 py-1 bg-success bg-opacity-25 text-success small fw-bold text-uppercase border-top border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                Nearby Suggestions
                                            </div>
                                            {nearbyVolunteers.length > 0 ? (
                                                nearbyVolunteers.map(v => (
                                                    <div
                                                        key={v._id}
                                                        className="px-3 py-2 text-white"
                                                        style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                        onClick={() => { setAllocationData({ ...allocationData, volunteerId: v._id }); setShowVolunteerDropdown(false); }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div className="fw-bold text-success">{v.name}</div>
                                                        <div className="small text-info">Loc: {v.location || 'Unknown Sector'}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3 py-3 text-center text-white small border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>No nearby volunteers.</div>
                                            )}
                                            {regularVolunteers.length > 0 && (
                                                <div className="px-3 py-1 bg-dark text-muted small fw-bold text-uppercase border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                    Other Volunteers
                                                </div>
                                            )}
                                            {regularVolunteers.map(v => (
                                                <div
                                                    key={v._id}
                                                    className="px-3 py-2 text-white border-top"
                                                    style={{ cursor: 'pointer', borderColor: 'rgba(255,255,255,0.05)' }}
                                                    onClick={() => { setAllocationData({ ...allocationData, volunteerId: v._id }); setShowVolunteerDropdown(false); }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <div className="fw-bold">{v.name}</div>
                                                    <div className="small text-info">Loc: {v.location || 'Unknown Sector'}</div>
                                                </div>
                                            ))}
                                            {searchFilteredVolunteers.length === 0 && (
                                                <div className="px-3 py-3 text-center text-muted small">No volunteers match your search.</div>
                                            )}
                                        </div>
                                    )}
                                </FormGroup>
                            </Col>
                        </Row>

                        <FormGroup className="mb-4">
                            <Label className="small fw-bold text-uppercase opacity-50">Attach Stockpiled Resources</Label>
                            <div className="p-2 rounded bg-secondary bg-opacity-25 border-0" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {resources.length > 0 ? resources.map(r => (
                                    <div key={r._id} className="d-flex align-items-center gap-2 mb-2">
                                        <Input
                                            type="checkbox"
                                            className="bg-dark border-secondary shadow-none m-0"
                                            checked={!!allocationData.selectedResources?.[r._id]}
                                            onChange={(e) => {
                                                const currentSelection = { ...(allocationData.selectedResources || {}) };
                                                if (e.target.checked) { currentSelection[r._id] = 1; } else { delete currentSelection[r._id]; }
                                                setAllocationData({ ...allocationData, selectedResources: currentSelection });
                                            }}
                                        />
                                        <div className="small text-white flex-grow-1">
                                            <span className="fw-bold text-info">{r.type}</span>
                                            <span className="opacity-75"> ({r.quantity} available)</span>
                                            <span className="opacity-50"> — {r.location}</span>
                                        </div>
                                        {!!allocationData.selectedResources?.[r._id] && (
                                            <Input
                                                type="number"
                                                min="1"
                                                max={r.quantity}
                                                value={allocationData.selectedResources[r._id]}
                                                onChange={(e) => {
                                                    let val = parseInt(e.target.value) || 1;
                                                    if (val > r.quantity) val = r.quantity;
                                                    if (val < 1) val = 1;
                                                    setAllocationData({ ...allocationData, selectedResources: { ...allocationData.selectedResources, [r._id]: val } });
                                                }}
                                                className="bg-dark text-white border-secondary shadow-none p-1 text-center"
                                                style={{ width: '70px', height: '28px', fontSize: '0.8rem' }}
                                            />
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-muted small p-2 text-center">No available resources in inventory.</div>
                                )}
                            </div>
                        </FormGroup>

                        <FormGroup className="mb-4">
                            <Label className="small fw-bold text-uppercase opacity-50">Deployment Details</Label>
                            <Input
                                type="textarea"
                                rows="3"
                                placeholder="Specify units, quantities, and mission objectives..."
                                value={allocationData.description}
                                onChange={(e) => setAllocationData({ ...allocationData, description: e.target.value })}
                                className="bg-secondary bg-opacity-25 text-white border-0 shadow-none"
                                required
                            />
                        </FormGroup>
                        <Button color="info" block className="rounded-pill py-3 fw-bold border-0 shadow-lg">
                            {isAdditional ? '+ DISPATCH ADDITIONAL SUPPORT' : 'INITIATE DEPLOYMENT'}
                        </Button>
                    </Form>
                </ModalBody>
            </Modal>
        </DashboardLayout>
    );
};

export default ReportAnalyzing;
