import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Table, Badge, Spinner, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { ClipboardList, Plus, Trash2, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const TaskAssignment = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        volunteerId: '',
        priority: 'Medium',
        resourceId: '',
        allocateQty: ''
    });
    const [formErrors, setFormErrors] = useState({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVolunteerId, setModalVolunteerId] = useState('');

    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [photoTask, setPhotoTask] = useState(null);
    const [adminFeedback, setAdminFeedback] = useState('');

    const [volunteerSearch, setVolunteerSearch] = useState('');
    const [showFormDropdown, setShowFormDropdown] = useState(false);
    const [showModalDropdown, setShowModalDropdown] = useState(false);

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const handleVerification = async (status) => {
        if (!photoTask) return;
        try {
            await axios.put(`http://localhost:5000/task/${photoTask._id}`, { status, adminFeedback });
            toast.success(`Task ${status === 'Resolved' ? 'Resolved successfully' : 'Rejected'}`);
            setIsPhotoModalOpen(false);
            setPhotoTask(null);
            setAdminFeedback('');
            const tasksRes = await axios.get('http://localhost:5000/task');
            setTasks(tasksRes.data);
        } catch (err) {
            toast.error("Verification update failed");
        }
    };

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

    const nearbyVolunteers = searchFilteredVolunteers.filter(v => isNearby(v, selectedTask?.incidentId));
    const regularVolunteers = searchFilteredVolunteers.filter(v => !isNearby(v, selectedTask?.incidentId));

    const toggleModal = (task = null) => {
        setSelectedTask(task);
        setModalVolunteerId('');
        setVolunteerSearch('');
        setShowModalDropdown(false);
        setIsModalOpen(!isModalOpen);
    };

    const handleModalAssign = async () => {
        if (!modalVolunteerId) return toast.error("Select a volunteer unit.");
        setIsSubmitting(true);
        try {
            await axios.put(`http://localhost:5000/task/${selectedTask._id}`, { volunteerId: modalVolunteerId });
            toast.success("Personnel dispatched successfully.");
            toggleModal();
            fetchData();
        } catch (err) {
            toast.error("Dispatch failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchData = async () => {
        try {
            const [vRes, tRes, rRes] = await Promise.all([
                axios.get('http://localhost:5000/auth/volunteers'),
                axios.get('http://localhost:5000/task'),
                axios.get('http://localhost:5000/resource')
            ]);
            
            const tasksData = tRes.data;
            const volunteersData = vRes.data;
            const resourcesData = rRes.data.filter(r => r.quantity > 0);

            // Display all approved volunteers
            const availableVolunteers = volunteersData.filter(u => u.isApproved);

            setVolunteers(availableVolunteers);
            setTasks(tasksData);
            setResources(resourcesData);
        } catch (err) {
            toast.error("Failed to fetch data mesh.");
        } finally {
            setLoading(false);
        }
    };

    const pollRef = useRef(null);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 5 seconds so completed tasks and new assignments
        // appear immediately without the admin needing to reload the page
        pollRef.current = setInterval(() => fetchData(), 5000);
        return () => clearInterval(pollRef.current);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!formData.title.trim()) errors.title = 'Title is required';
        if (!formData.description.trim()) errors.description = 'Brief is required';
        if (!formData.volunteerId) errors.volunteerId = 'Select a volunteer unit';

        if (formData.resourceId) {
            const selectedRes = resources.find(r => r._id === formData.resourceId);
            if (!formData.allocateQty || isNaN(formData.allocateQty) || formData.allocateQty <= 0) {
                errors.allocateQty = 'Invalid qty';
            } else if (selectedRes && formData.allocateQty > selectedRes.quantity) {
                errors.allocateQty = `Max available is ${selectedRes.quantity}`;
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});
        setIsSubmitting(true);

        const payload = {
            title: formData.title,
            description: formData.description,
            volunteerId: formData.volunteerId,
            priority: formData.priority
        };

        if (formData.resourceId && formData.allocateQty) {
            payload.allocatedResources = [{
                originalId: formData.resourceId,
                quantityToAllocate: Number(formData.allocateQty)
            }];
        }

        try {
            await axios.post('http://localhost:5000/task', payload);
            toast.success("Task assigned and synchronized.");
            setFormData({ title: '', description: '', volunteerId: '', priority: 'Medium', resourceId: '', allocateQty: '' });
            fetchData();
        } catch (err) {
            toast.error("Assignment failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteTask = async (id) => {
        if (!window.confirm("Purge task record?")) return;
        try {
            await axios.delete(`http://localhost:5000/task/${id}`);
            toast.success("Task record purged.");
            fetchData();
        } catch (err) {
            toast.error("Deletion failed.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Rejected': return 'danger';
            case 'In Progress': return 'primary';
            default: return 'warning';
        }
    };

    return (
        <>
            <AdminLayout title="Task Dispatch Center" subtitle="Coordinating field personnel and asset deployment.">
                <Row>
                    <Col lg={4}>
                        <Card className="border-0 shadow-lg mb-4" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <CardBody className="p-4">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-white">
                                    <Plus size={20} className="text-success" /> New Assignment
                                </h5>
                                <Form onSubmit={handleSubmit}>
                                    <FormGroup className="mb-3">
                                        <Label className="small fw-bold text-uppercase text-white opacity-75">Task Title</Label>
                                        <Input 
                                            placeholder="Enter mission title..."
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none p-2 px-3 ${formErrors.title ? 'is-invalid' : ''}`}
                                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                        {formErrors.title && <div className="text-danger small mt-1">{formErrors.title}</div>}
                                    </FormGroup>
                                    <FormGroup className="mb-3 position-relative">
                                        <Label className="small fw-bold text-uppercase text-white opacity-75">Assignee (Volunteer)</Label>
                                        <div 
                                            className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white p-2 px-3 d-flex justify-content-between align-items-center ${formErrors.volunteerId ? 'is-invalid' : ''}`}
                                            style={{ border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                            onClick={() => setShowFormDropdown(!showFormDropdown)}
                                        >
                                            {formData.volunteerId 
                                                ? volunteers.find(v => v._id === formData.volunteerId)?.name || 'Unknown' 
                                                : 'Select Personnel...'}
                                            <span>▼</span>
                                        </div>

                                        {showFormDropdown && (
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
                                                        setFormData({...formData, volunteerId: ''});
                                                        setShowFormDropdown(false);
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    Select Personnel...
                                                </div>
                                                
                                                {searchFilteredVolunteers.map(v => (
                                                    <div 
                                                        key={v._id} 
                                                        className="px-3 py-2 text-white"
                                                        style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                        onClick={() => {
                                                            setFormData({...formData, volunteerId: v._id});
                                                            setShowFormDropdown(false);
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div className="fw-bold">{v.name}</div>
                                                        <div className="small text-info">Residing Loc: {v.location || 'Unknown Sector'}</div>
                                                    </div>
                                                ))}

                                                {searchFilteredVolunteers.length === 0 && (
                                                    <div className="px-3 py-3 text-center text-muted small">No volunteers match your search.</div>
                                                )}
                                            </div>
                                        )}
                                        {formErrors.volunteerId && <div className="text-danger small mt-1">{formErrors.volunteerId}</div>}
                                    </FormGroup>
                                    <FormGroup className="mb-3">
                                        <Label className="small fw-bold text-uppercase text-white opacity-75">Priority Level</Label>
                                        <Input 
                                            type="select" 
                                            value={formData.priority}
                                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                            className="rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none p-2 px-3"
                                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            <option className="bg-dark">Low</option>
                                            <option className="bg-dark">Medium</option>
                                            <option className="bg-dark">High</option>
                                        </Input>
                                    </FormGroup>
                                    <FormGroup className="mb-4">
                                        <Label className="small fw-bold text-uppercase text-white opacity-75">Operational Brief</Label>
                                        <Input 
                                            type="textarea" 
                                            rows={3}
                                            placeholder="Enter critical field instructions..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none p-2 px-3 ${formErrors.description ? 'is-invalid' : ''}`}
                                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                        {formErrors.description && <div className="text-danger small mt-1">{formErrors.description}</div>}
                                    </FormGroup>

                                    <div className="p-3 mb-4 rounded-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h6 className="small fw-bold text-uppercase text-white opacity-75 mb-3 d-flex align-items-center gap-2">
                                            <ClipboardList size={14} className="text-info" /> Allocate Supplies (Optional)
                                        </h6>
                                        <FormGroup className="mb-3">
                                            <Label className="small text-white-50">Select Resource</Label>
                                            <Input 
                                                type="select" 
                                                value={formData.resourceId}
                                                onChange={(e) => setFormData({...formData, resourceId: e.target.value})}
                                                className="rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none p-2 px-3"
                                                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                            >
                                                <option value="" className="bg-dark">No supplies needed</option>
                                                {resources.map(r => (
                                                    <option key={r._id} value={r._id} className="bg-dark">
                                                        {r.type} - {r.quantity} available ({r.location})
                                                    </option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                        {formData.resourceId && (
                                            <FormGroup className="mb-2">
                                                <Label className="small text-white-50">Allocation Quantity</Label>
                                                <Input 
                                                    type="number"
                                                    placeholder="Enter quantity to dispatch..."
                                                    value={formData.allocateQty}
                                                    onChange={(e) => setFormData({...formData, allocateQty: e.target.value})}
                                                    className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none p-2 px-3 ${formErrors.allocateQty ? 'is-invalid' : ''}`}
                                                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                                />
                                                {formErrors.allocateQty && <div className="text-danger small mt-1">{formErrors.allocateQty}</div>}
                                            </FormGroup>
                                        )}
                                    </div>
                                    <Button color="success" block className="rounded-pill py-2 fw-bold border-0 shadow-lg" disabled={isSubmitting}>
                                        {isSubmitting ? <Spinner size="sm" /> : 'DISPATCH TASK'}
                                    </Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
    
                    <Col lg={8}>
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner color="success" />
                            </div>
                        ) : (
                            <>
                                <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                                    <CardBody className="p-0">
                                        <div className="table-responsive">
                                            <Table hover borderless className="m-0 text-white align-middle">
                                                <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                                    <tr className="text-uppercase small fw-bold text-muted">
                                                        <th className="px-4 py-3">Task Details</th>
                                                        <th className="py-3">Personnel</th>
                                                        <th className="py-3">Priority</th>
                                                        <th className="py-3">Status</th>
                                                        <th className="py-3 text-end px-4">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tasks.filter(t => t.status !== 'Resolved').map((task, idx) => (
                                                        <motion.tr 
                                                            key={task._id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                        >
                                                            <td className="px-4 py-4">
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: '10px', borderRadius: '12px' }}>
                                                                        <ClipboardList size={18} className="text-success" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="d-flex align-items-center gap-2 fw-bold">
                                                                            {task.title}
                                                                            {task.isNGOAlert && (
                                                                                <span
                                                                                    style={{
                                                                                        fontSize: '0.6rem', fontWeight: 800,
                                                                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                                                                        backgroundColor: 'rgba(249,115,22,0.15)',
                                                                                        color: '#f97316',
                                                                                        border: '1px solid rgba(249,115,22,0.4)',
                                                                                        borderRadius: '999px',
                                                                                        padding: '2px 8px',
                                                                                        whiteSpace: 'nowrap',
                                                                                        animation: 'pulse 2s infinite'
                                                                                    }}
                                                                                >
                                                                                    🔶 NGO Alert
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="small text-muted">{task.description?.substring(0, 30)}...</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {task.volunteerId ? (
                                                                    <>
                                                                        <div className="small fw-bold">{task.volunteerId?.name}</div>
                                                                        <div className="small opacity-50">{task.volunteerId?.email}</div>
                                                                    </>
                                                                ) : (
                                                                    <div className="d-flex flex-column gap-2 align-items-start">
                                                                        <Button 
                                                                            color="info" 
                                                                            size="sm" 
                                                                            className="rounded-pill px-3 fw-bold border-0 shadow-sm" 
                                                                            style={{ fontSize: '0.65rem', backgroundColor: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9', width: '140px' }}
                                                                            onClick={() => toggleModal(task)}
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            Assign
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Badge color={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'} pill>
                                                                    {task.priority}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Clock size={14} className="text-muted" />
                                                                    <span className={`small fw-bold text-${getStatusColor(task.status)}`}>{task.status}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4">
                                                                <div className="d-flex justify-content-end align-items-center gap-2">
                                                                    {task.status === 'Completed' && (
                                                                        <Button 
                                                                            onClick={() => { setPhotoTask(task); setIsPhotoModalOpen(true); }} 
                                                                            color="success" 
                                                                            size="sm" 
                                                                            className="rounded-pill px-3 fw-bold border-0 shadow-sm"
                                                                        >
                                                                            Audit Photo
                                                                        </Button>
                                                                    )}
                                                                    <Button onClick={() => deleteTask(task._id)} color="danger" size="sm" className="rounded-circle p-2 border-0 opacity-50 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                        {tasks.filter(t => t.status !== 'Resolved').length === 0 && (
                                            <div className="text-center py-5 text-muted">
                                                No active dispatches in queue.
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* RESOLVED TASKS SECTION */}
                                <h5 className="text-white mt-5 mb-3 fw-bold">Resolved Operations Archive</h5>
                                <Card className="border-0 shadow-lg overflow-hidden mb-4" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                                    <CardBody className="p-0">
                                    <div className="table-responsive">
                                        <Table hover borderless className="m-0 text-white align-middle">
                                            <thead style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
                                                <tr className="text-uppercase small fw-bold text-muted">
                                                    <th className="px-4 py-3">Task ID / Details</th>
                                                    <th className="py-3">User (Victim)</th>
                                                    <th className="py-3">Volunteer</th>
                                                    <th className="py-3">Proof & Notes</th>
                                                    <th className="py-3">Resolution Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tasks.filter(t => t.status === 'Resolved').map((task, idx) => (
                                                    <tr key={task._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td className="px-4 py-3">
                                                            <div className="fw-bold text-success">{task.title}</div>
                                                            <div className="small text-muted" style={{ fontFamily: 'monospace' }}>ID: {task._id.substring(18)}</div>
                                                        </td>
                                                        <td className="small">
                                                            {task.requestId ? 'Verified Victim Request' : 'Admin Directed'}
                                                        </td>
                                                        <td>
                                                            <div className="small fw-bold">{task.volunteerId?.name || 'Unknown'}</div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex flex-column align-items-start gap-2">
                                                                {task.verificationPhoto ? (
                                                                    <img 
                                                                        src={task.verificationPhoto} 
                                                                        alt="Proof" 
                                                                        onClick={() => {
                                                                            setPhotoTask(task);
                                                                            setIsLightboxOpen(true);
                                                                        }}
                                                                        style={{ cursor: 'zoom-in', width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} 
                                                                        title="Click to preview details"
                                                                    />
                                                                ) : (
                                                                    <span className="small text-muted">No Photo</span>
                                                                )}
                                                                {task.completionDetails && (
                                                                    <span className="small text-white-50" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.completionDetails}>
                                                                        "{task.completionDetails}"
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="small text-muted">
                                                            {new Date(task.updatedAt).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                    {tasks.filter(t => t.status === 'Resolved').length === 0 && (
                                        <div className="text-center py-4 text-muted small">
                                            No operations have been resolved yet.
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                            </>
                        )}
                    </Col>
                </Row>
            </AdminLayout>
            <Modal isOpen={isModalOpen} toggle={() => toggleModal()} centered>
                <ModalHeader toggle={() => toggleModal()} className="bg-dark text-white border-0 py-4">
                    <div className="fw-bold">Dispatch Personnel</div>
                </ModalHeader>
                <ModalBody className="bg-dark text-white border-0 px-4 pb-5">
                    {selectedTask && (
                        <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="small fw-bold text-uppercase opacity-50 mb-1">Target Mission</div>
                            <div className="fw-bold text-info">{selectedTask.title}</div>
                            <div className="small opacity-75">{selectedTask.description?.substring(0, 50)}...</div>
                        </div>
                    )}
                    <FormGroup className="mb-4 position-relative">
                        <Label className="small fw-bold text-uppercase opacity-50">Select Available Volunteer</Label>
                        <div 
                            className="rounded-3 border-0 bg-secondary bg-opacity-25 text-white p-2 px-3 d-flex justify-content-between align-items-center"
                            style={{ border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                            onClick={() => setShowModalDropdown(!showModalDropdown)}
                        >
                            {modalVolunteerId 
                                ? volunteers.find(v => v._id === modalVolunteerId)?.name || 'Unknown' 
                                : 'Choose Unit...'}
                            <span>▼</span>
                        </div>

                        {showModalDropdown && (
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
                                        setModalVolunteerId('');
                                        setShowModalDropdown(false);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    Choose Unit...
                                </div>
                                
                                {nearbyVolunteers.length > 0 && (
                                    <div className="px-3 py-1 bg-success bg-opacity-25 text-success small fw-bold text-uppercase border-top border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                        Nearby Suggestions
                                    </div>
                                )}
                                {nearbyVolunteers.length > 0 ? nearbyVolunteers.map(v => (
                                    <div 
                                        key={v._id} 
                                        className="px-3 py-2 text-white"
                                        style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        onClick={() => {
                                            setModalVolunteerId(v._id);
                                            setShowModalDropdown(false);
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div className="fw-bold text-success">{v.name}</div>
                                        <div className="small text-info">Residing Loc: {v.location || 'Unknown Sector'}</div>
                                    </div>
                                )) : (
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
                                            setModalVolunteerId(v._id);
                                            setShowModalDropdown(false);
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div className="fw-bold">{v.name}</div>
                                        <div className="small text-info">Residing Loc: {v.location || 'Unknown Sector'}</div>
                                    </div>
                                ))}

                                {searchFilteredVolunteers.length === 0 && (
                                    <div className="px-3 py-3 text-center text-muted small">No volunteers match your search.</div>
                                )}
                            </div>
                        )}
                    </FormGroup>
                    <Button color="info" block className="rounded-pill py-3 fw-bold border-0 shadow-lg" onClick={handleModalAssign} disabled={isSubmitting}>
                        {isSubmitting ? <Spinner size="sm" /> : 'CONFIRM DISPATCH'}
                    </Button>
                </ModalBody>
            </Modal>
            <Modal isOpen={isPhotoModalOpen} toggle={() => { setIsPhotoModalOpen(false); setIsLightboxOpen(false); }} centered size="lg">
                <ModalHeader toggle={() => { setIsPhotoModalOpen(false); setIsLightboxOpen(false); }} className="bg-dark text-white border-0 py-4">
                    <div className="fw-bold">Verify Task Completion</div>
                </ModalHeader>
                <ModalBody className="bg-dark text-white border-0 px-4 pb-5 text-center">
                    {photoTask && (
                        <>
                            {/* ── Task Info Header ── */}
                            <div className="mb-4 text-start p-3 rounded-3" style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.15)' }}>
                                <div className="small fw-bold text-uppercase opacity-50 mb-1">Mission Title</div>
                                <h5 className="text-info mb-1">{photoTask.title}</h5>
                                <p className="small text-white-50 mb-0">{photoTask.description}</p>
                                {photoTask.volunteerId && (
                                    <div className="mt-2 small" style={{ color: '#94a3b8' }}>
                                        <span className="text-uppercase opacity-50 me-1">Submitted by:</span>
                                        <span className="text-white fw-bold">{photoTask.volunteerId?.name || 'Unknown Volunteer'}</span>
                                    </div>
                                )}
                                {photoTask.updatedAt && (
                                    <div className="small mt-1" style={{ color: '#64748b' }}>
                                        Submitted at: {new Date(photoTask.updatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {/* ── Clickable Verification Photo ── */}
                            <div className="mb-4 position-relative">
                                {photoTask.verificationPhoto ? (
                                    <div
                                        onClick={() => setIsLightboxOpen(true)}
                                        style={{ cursor: 'zoom-in', position: 'relative', display: 'inline-block', width: '100%' }}
                                        title="Click to view full size"
                                    >
                                        <img
                                            src={photoTask.verificationPhoto}
                                            alt="Verification"
                                            className="img-fluid rounded-3"
                                            style={{ maxHeight: '320px', objectFit: 'contain', width: '100%', transition: 'opacity 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        />
                                        <div
                                            className="position-absolute bottom-0 end-0 m-2 px-2 py-1 rounded-2 d-flex align-items-center gap-1"
                                            style={{ background: 'rgba(0,0,0,0.65)', fontSize: '0.7rem', color: '#94a3b8', backdropFilter: 'blur(4px)' }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                                            Click to preview
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5 text-muted bg-secondary bg-opacity-25 rounded-3">No photo provided</div>
                                )}
                            </div>

                            {/* ── Volunteer Notes ── */}
                            {photoTask.completionDetails && (
                                <div className="text-start mb-4 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="small fw-bold text-uppercase opacity-50 mb-1">📝 Volunteer Notes</div>
                                    <div className="text-white small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{photoTask.completionDetails}</div>
                                </div>
                            )}

                            {/* ── Admin Feedback ── */}
                            <FormGroup className="text-start mb-4">
                                <Label className="small fw-bold text-uppercase opacity-75">Admin Feedback (If rejecting)</Label>
                                <Input
                                    type="textarea"
                                    rows="2"
                                    value={adminFeedback}
                                    onChange={(e) => setAdminFeedback(e.target.value)}
                                    className="bg-secondary bg-opacity-25 text-white border-secondary shadow-none"
                                    placeholder="Explain what is missing or unclear..."
                                />
                            </FormGroup>
                            <div className="d-flex gap-3 mt-4">
                                <Button onClick={() => handleVerification('Resolved')} color="success" className="w-50 rounded-pill fw-bold border-0 shadow-lg">VERIFY & RESOLVE</Button>
                                <Button onClick={() => handleVerification('Rejected')} color="danger" outline className="w-50 rounded-pill fw-bold">REJECT COMPLETION</Button>
                            </div>
                        </>
                    )}
                </ModalBody>
            </Modal>

            {/* ── Full-Screen Lightbox ── */}
            {isLightboxOpen && photoTask?.verificationPhoto && (
                <div
                    onClick={() => setIsLightboxOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.92)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px', gap: '32px', flexWrap: 'wrap'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        style={{
                            position: 'absolute', top: '20px', right: '24px',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff', borderRadius: '50%', width: '40px', height: '40px',
                            fontSize: '1.2rem', cursor: 'pointer', lineHeight: '1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Close preview"
                    >
                        ✕
                    </button>

                    {/* Full-size image */}
                    <img
                        src={photoTask.verificationPhoto}
                        alt="Full Preview"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '65vw', maxHeight: '85vh',
                            objectFit: 'contain', borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 0 60px rgba(0,0,0,0.8)'
                        }}
                    />

                    {/* Details panel */}
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '280px', color: '#fff',
                            display: 'flex', flexDirection: 'column', gap: '16px'
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>Mission</div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#38bdf8' }}>{photoTask.title}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>Brief</div>
                            <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>{photoTask.description}</div>
                        </div>
                        {photoTask.volunteerId && (
                            <div>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>Submitted By</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{photoTask.volunteerId?.name || 'Unknown'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{photoTask.volunteerId?.email || ''}</div>
                            </div>
                        )}
                        {photoTask.completionDetails && (
                            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '6px' }}>📝 Volunteer Notes</div>
                                <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{photoTask.completionDetails}</div>
                            </div>
                        )}
                        {photoTask.updatedAt && (
                            <div>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>Submitted At</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(photoTask.updatedAt).toLocaleString()}</div>
                            </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#475569', textAlign: 'center' }}>
                            Click outside image to close
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskAssignment;
