import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Table, Badge, Spinner, Input, InputGroup, InputGroupText, Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Button } from 'reactstrap';
import { AlertTriangle, MapPin, Search, Activity, Filter, BarChart3, Clock, Package } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ReportAnalyzing = () => {
    const [incidents, setIncidents] = useState([]);
    const [allocatedIncidentIds, setAllocatedIncidentIds] = useState(new Set());
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
            
            const allocatedIds = new Set();
            if (Array.isArray(tasksRes.data)) {
                tasksRes.data.forEach(task => {
                    // Only consider it 'Allocated' if there is an operational task (not just an Admin-to-NGO alert signal)
                    if (task.incidentId && task.isNGOAlert !== true) {
                        const id = task.incidentId._id || task.incidentId;
                        if (id) {
                            allocatedIds.add(id.toString());
                        }
                    }
                });
            }
            setAllocatedIncidentIds(allocatedIds);
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
                    "INVALID_REQUEST": "Malfomred coordinate signal.",
                };
                toast.error(errorMap[status] || `Resolution failure: ${status}`, { id });
            }
        } catch (err) {
            toast.error("Geocoding protocol failure.", { id });
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [allocationData, setAllocationData] = useState({
        helpType: 'Medical Support',
        description: '',
        urgency: 'Medium',
        volunteerId: '',
        selectedResources: {}
    });

    const [volunteerSearch, setVolunteerSearch] = useState('');
    const [showVolunteerDropdown, setShowVolunteerDropdown] = useState(false);

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
                if (word.length > 3 && !ignoreWords.includes(word) && v.location.toLowerCase().includes(word)) {
                    return true;
                }
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

    const toggleModal = (incident = null) => {
        setSelectedIncident(incident);
        setAllocationData({
            helpType: 'Medical Support',
            description: '',
            urgency: incident ? incident.severity : 'Medium',
            volunteerId: '',
            selectedResources: {}
        });
        setVolunteerSearch('');
        setShowVolunteerDropdown(false);
        setIsModalOpen(!isModalOpen);
    };

    const handleAllocate = async (e) => {
        e.preventDefault();
        
        if (allocatedIncidentIds && allocatedIncidentIds.has(selectedIncident._id)) {
            toast.error("Already notified");
            return;
        }

        const id = toast.loading("Deploying tactical units...");
        try {
            const payload = {
                title: `DEPLOYMENT: ${allocationData.helpType}`,
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

            toast.success("Tactical units deployed and synchronized.", { id });
            toggleModal();
            fetchIncidents();
            fetchResources();
        } catch (err) {
            toast.error("Deployment protocol failed.", { id });
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
        <DashboardLayout role="NGO" title="Report Analyzing" subtitle="Strategic intelligence mesh for reported disaster signals." themeColor="#0ea5e9">
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
                                        <th className="px-5 text-end">Identity</th>
                                        <th className="px-5 text-end">Strategic Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredIncidents.map((incident, idx) => (
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
                                                                className="text-info small fw-bold text-uppercase cursor-pointer opacity-75 hover-opacity-100" 
                                                                style={{ fontSize: '0.65rem', borderBottom: '1px solid rgba(14, 165, 233, 0.3)', width: 'fit-content' }}
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
                                                <td className="px-5 text-end">
                                                    <div className="small opacity-75">{new Date(incident.createdAt).toLocaleDateString()}</div>
                                                    <div className="small fw-bold text-info">UID: {incident._id.slice(-6).toUpperCase()}</div>
                                                </td>
                                                <td className="px-5 text-end">
                                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                                        {allocatedIncidentIds.has(incident._id.toString()) ? (
                                                            <Button 
                                                                color="success" 
                                                                size="sm" 
                                                                className="rounded-pill px-3 fw-bold border-0" 
                                                                style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '0.75rem' }}
                                                                disabled
                                                            >
                                                                ALLOCATED
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                color="info" 
                                                                outline 
                                                                size="sm" 
                                                                className="rounded-pill px-3 fw-bold border-0" 
                                                                style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', fontSize: '0.75rem' }}
                                                                onClick={() => toggleModal(incident)}
                                                            >
                                                                ALLOCATE
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
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

            <Modal isOpen={isModalOpen} toggle={() => toggleModal()} centered className="border-0">
                <ModalHeader toggle={() => toggleModal()} className="bg-dark text-white border-0 py-4">
                    <div className="d-flex align-items-center gap-2">
                        <Package size={20} className="text-info" />
                        <span className="fw-bold">Allocate Tactical Support</span>
                    </div>
                </ModalHeader>
                <ModalBody className="bg-dark text-white border-0 px-4 pb-4">
                    {selectedIncident && (
                        <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="small fw-bold text-uppercase opacity-50 mb-1">Target Incident</div>
                            <div className="fw-bold text-info">{selectedIncident.type}</div>
                            <div className="small opacity-75">{selectedIncident.address || "Coordinates Verified"}</div>
                            <Badge color={getSeverityColor(selectedIncident.severity)} className="mt-2 text-uppercase" style={{ fontSize: '0.6rem' }}>
                                {selectedIncident.severity} RISK
                            </Badge>
                        </div>
                    )}
                    <Form onSubmit={handleAllocate}>
                        <FormGroup className="mb-3">
                            <Label className="small fw-bold text-uppercase opacity-50">Relief Protocol</Label>
                            <Input 
                                type="select"
                                value={allocationData.helpType}
                                onChange={(e) => setAllocationData({...allocationData, helpType: e.target.value})}
                                className="bg-secondary bg-opacity-25 text-white border-0 shadow-none py-2"
                            >
                                <option className="bg-dark">Medical Support</option>
                                <option className="bg-dark">Food & Rations</option>
                                <option className="bg-dark">Logistics/Equipment</option>
                            </Input>
                        </FormGroup>
                        <FormGroup className="mb-3 position-relative">
                            <Label className="small fw-bold text-uppercase opacity-50">Assign Field Volunteer</Label>
                            
                            <div 
                                className="bg-secondary bg-opacity-25 text-white border-0 py-2 px-3 rounded d-flex justify-content-between align-items-center"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowVolunteerDropdown(!showVolunteerDropdown)}
                            >
                                {allocationData.volunteerId 
                                    ? volunteers.find(v => v._id === allocationData.volunteerId)?.name || 'Unknown' 
                                    : '-- Unassigned (Auto-Assign Queue) --'}
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
                                        onClick={() => {
                                            setAllocationData({...allocationData, volunteerId: ''});
                                            setShowVolunteerDropdown(false);
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        -- Unassigned (Auto-Assign Queue) --
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
                                                onClick={() => {
                                                    setAllocationData({...allocationData, volunteerId: v._id});
                                                    setShowVolunteerDropdown(false);
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <div className="fw-bold text-success">{v.name}</div>
                                                <div className="small text-info">Residing Loc: {v.location || 'Unknown Sector'}</div>
                                                {v.coordinates?.lat && (
                                                    <div className="small text-white">
                                                        Current Loc: {v.coordinates.lat.toFixed(4)}, {v.coordinates.lng.toFixed(4)}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-3 text-center text-white small border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                            No nearby volunteers detected.
                                        </div>
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
                                            onClick={() => {
                                                setAllocationData({...allocationData, volunteerId: v._id});
                                                setShowVolunteerDropdown(false);
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <div className="fw-bold">{v.name}</div>
                                            <div className="small text-info">Residing Loc: {v.location || 'Unknown Sector'}</div>
                                            {v.coordinates?.lat && (
                                                <div className="small text-white">
                                                    Current Loc: {v.coordinates.lat.toFixed(4)}, {v.coordinates.lng.toFixed(4)}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {searchFilteredVolunteers.length === 0 && (
                                        <div className="px-3 py-3 text-center text-muted small">No volunteers match your search.</div>
                                    )}
                                </div>
                            )}
                        </FormGroup>
                        <FormGroup className="mb-4">
                            <Label className="small fw-bold text-uppercase opacity-50">Attach Stockpiled Resources</Label>
                            <div 
                                className="p-2 rounded bg-secondary bg-opacity-25 border-0" 
                                style={{ maxHeight: '150px', overflowY: 'auto' }}
                            >
                                {resources.length > 0 ? resources.map(r => (
                                    <div key={r._id} className="d-flex align-items-center gap-2 mb-2">
                                        <Input 
                                            type="checkbox" 
                                            className="bg-dark border-secondary shadow-none m-0"
                                            checked={!!allocationData.selectedResources?.[r._id]}
                                            onChange={(e) => {
                                                const currentSelection = { ...(allocationData.selectedResources || {}) };
                                                if (e.target.checked) {
                                                    currentSelection[r._id] = 1;
                                                } else {
                                                    delete currentSelection[r._id];
                                                }
                                                setAllocationData({...allocationData, selectedResources: currentSelection});
                                            }}
                                        />
                                        <div className="small text-white flex-grow-1">
                                            <span className="fw-bold text-info">{r.type}</span> 
                                            <span className="opacity-75"> ({r.quantity} available)</span> - 
                                            <span className="opacity-50"> {r.location}</span>
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
                                                    setAllocationData({
                                                        ...allocationData, 
                                                        selectedResources: { ...allocationData.selectedResources, [r._id]: val }
                                                    });
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
                                placeholder="Specify units and mission objectives..."
                                value={allocationData.description}
                                onChange={(e) => setAllocationData({...allocationData, description: e.target.value})}
                                className="bg-secondary bg-opacity-25 text-white border-0 shadow-none"
                                required
                            />
                        </FormGroup>
                        <Button color="info" block className="rounded-pill py-3 fw-bold border-0 shadow-lg">
                            INITIATE DEPLOYMENT
                        </Button>
                    </Form>
                </ModalBody>
            </Modal>
        </DashboardLayout>
    );
};

export default ReportAnalyzing;
