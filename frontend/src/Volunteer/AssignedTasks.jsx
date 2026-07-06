import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Badge, Button, Spinner } from 'reactstrap';
import { ClipboardList, CheckCircle, Activity, AlertCircle, MapPin, Package } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AssignedTasks = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verificationPhotos, setVerificationPhotos] = useState({});
    const [completionDetails, setCompletionDetails] = useState({});

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/task/volunteer/${user.id}`);
            setTasks(res.data);
        } catch (err) {
            toast.error("Failed to sync field assignments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.id) fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    const handlePhotoUpload = (e, taskId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setVerificationPhotos(prev => ({ ...prev, [taskId]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const updateStatus = async (id, newStatus) => {
        let payload = { status: newStatus };
        if (newStatus === 'Completed') {
            if (!verificationPhotos[id]) {
                return toast.error("Please select a NEW verification photo to submit.");
            }
            payload.verificationPhoto = verificationPhotos[id];
            payload.completionDetails = completionDetails[id] || '';
        }
        try {
            await axios.put(`http://localhost:5000/task/${id}`, payload);
            toast.success(`Protocol updated to ${newStatus}`);
            setVerificationPhotos(prev => { const copy = {...prev}; delete copy[id]; return copy; });
            setCompletionDetails(prev => { const copy = {...prev}; delete copy[id]; return copy; });
            fetchTasks();
        } catch (err) {
            toast.error("Status update failed. (If photo is large, restart backend server)");
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    const handleCollectResource = async (resourceId) => {
        try {
            await axios.put(`http://localhost:5000/resource/${resourceId}`, { status: 'Used' });
            toast.success("Stock marked as collected.");
            fetchTasks();
        } catch (err) {
            toast.error("Failed to update resource stock.");
        }
    };

    return (
        <DashboardLayout role="Volunteer" title="Field Assignments" subtitle="Synchronize with localized emergency protocols and mission targets." themeColor="#f59e0b">
            <Row>
                {loading ? (
                    <Col className="text-center py-5">
                        <Spinner color="warning" />
                    </Col>
                ) : (
                    <AnimatePresence>
                        {tasks.length > 0 ? (
                            tasks.map((task, idx) => (
                                <Col lg={6} key={task._id} className="mb-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card className="border-0 shadow-lg h-100" style={{ borderRadius: '24px', background: 'rgba(245, 158, 11, 0.05)', border: `1px solid rgba(245, 158, 11, 0.1)`, overflow: 'hidden' }}>
                                            <CardBody className="p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-4">
                                                    <div className="d-flex align-items-center gap-3">
                                                       <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '15px' }}>
                                                            <ClipboardList size={22} className="text-warning" />
                                                       </div>
                                                       <div>
                                                           <h5 className="fw-bold mb-0 text-white" style={{ letterSpacing: '0.5px' }}>{task.title}</h5>
                                                           <Badge 
                                                               style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority), border: `1px solid ${getPriorityColor(task.priority)}40` }} 
                                                               pill className="mt-2"
                                                            >
                                                               {task.priority} PRIORITY
                                                            </Badge>
                                                       </div>
                                                    </div>
                                                    <Badge color={task.status === 'Completed' ? 'success' : task.status === 'Rejected' ? 'danger' : task.status === 'In Progress' ? 'primary' : 'warning'} className="p-2 px-3 rounded-pill">
                                                        {task.status}
                                                    </Badge>
                                                </div>

                                                <div className="d-flex flex-column gap-2 mb-3">
                                                    {/* Location — full fallback chain */}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <MapPin size={14} className="text-warning flex-shrink-0" />
                                                        <span className="small text-white-50">
                                                            {task.requestId?.location?.address
                                                                || task.requestId?.victimId?.location
                                                                || task.incidentId?.address
                                                                || (task.incidentId?.location?.coordinates
                                                                    ? `${task.incidentId.location.coordinates[1].toFixed(4)}, ${task.incidentId.location.coordinates[0].toFixed(4)}`
                                                                    : null)
                                                                || 'Location not provided'}
                                                        </span>
                                                    </div>

                                                    {/* Victim details from linked SOS request */}
                                                    {task.requestId?.victimId && (
                                                        <div className="d-flex flex-wrap gap-3 ps-1" style={{ fontSize: '0.8rem' }}>
                                                            <div style={{ color: '#94a3b8' }}>
                                                                Victim:{' '}
                                                                <span className="text-white fw-bold">
                                                                    {task.requestId.victimId.name || 'Unknown'}
                                                                </span>
                                                            </div>
                                                            {task.requestId.victimId.contact && (
                                                                <div style={{ color: '#94a3b8' }}>
                                                                    Contact:{' '}
                                                                    <span className="fw-bold" style={{ color: '#38bdf8' }}>
                                                                        {task.requestId.victimId.contact}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-white-50 mb-4 small" style={{ lineHeight: 1.6 }}>{task.description}</p>

                                                {task.resources && task.resources.length > 0 && (
                                                    <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <h6 className="small fw-bold text-uppercase text-warning opacity-75 mb-2">Allocated Resources</h6>
                                                        {task.resources.map((r, idx) => (
                                                            <div key={r._id || idx} className="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary pb-2">
                                                                <div className="small text-white">
                                                                    <div className="d-flex align-items-center mb-1">
                                                                        <Package size={14} className="me-2 text-info" />
                                                                        <span className="fw-bold">{r.type}</span> <span className="opacity-50 ms-1">({r.quantity} units)</span>
                                                                    </div>
                                                                    <div className="d-flex align-items-center text-white-50 ms-4" style={{ fontSize: '0.75rem' }}>
                                                                        <MapPin size={12} className="me-1" /> Loc: {r.location || 'Central NGO Node'}
                                                                    </div>
                                                                </div>
                                                                {r.status === 'Used' ? (
                                                                    <Badge color="success" className="small">COLLECTED</Badge>
                                                                ) : (
                                                                    <Button 
                                                                        size="sm" 
                                                                        color="info" 
                                                                        outline 
                                                                        className="py-1 px-2 text-uppercase" 
                                                                        style={{ fontSize: '0.65rem' }}
                                                                        onClick={() => handleCollectResource(r._id)}
                                                                    >
                                                                        Mark Collected
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="d-flex flex-column gap-3">
                                                    {task.status === 'Pending' && (
                                                        <Button onClick={() => updateStatus(task._id, 'In Progress')} block outline color="warning" className="rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2">
                                                            <Activity size={16} /> INITIATE PROTOCOL
                                                        </Button>
                                                    )}
                                                    {task.status === 'In Progress' && (
                                                        <div className="p-3 rounded mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <h6 className="small fw-bold text-uppercase text-white opacity-75 mb-2">Completion Verification</h6>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={(e) => handlePhotoUpload(e, task._id)} 
                                                                className="form-control form-control-sm bg-dark text-white border-secondary mb-3" 
                                                            />
                                                            <textarea
                                                                className="form-control form-control-sm bg-dark text-white border-secondary mb-3"
                                                                placeholder="Enter completion details / notes..."
                                                                rows="2"
                                                                value={completionDetails[task._id] || ''}
                                                                onChange={(e) => setCompletionDetails(prev => ({ ...prev, [task._id]: e.target.value }))}
                                                            ></textarea>
                                                            <Button onClick={() => updateStatus(task._id, 'Completed')} block color="success" className="rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0 shadow-lg">
                                                                <CheckCircle size={16} /> MARK AS RESCUED (COMPLETE)
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {task.status === 'Rejected' && (
                                                        <div className="p-3 rounded mb-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                            <h6 className="small fw-bold text-uppercase text-danger mb-2">Verification Failed</h6>
                                                            <p className="small text-white-50 mb-3">Admin rejected the completion. Please upload a clearer image or complete the missing requirements.</p>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={(e) => handlePhotoUpload(e, task._id)} 
                                                                className="form-control form-control-sm bg-dark text-white border-secondary mb-3" 
                                                            />
                                                            <textarea
                                                                className="form-control form-control-sm bg-dark text-white border-secondary mb-3"
                                                                placeholder="Enter updated completion details / notes..."
                                                                rows="2"
                                                                value={completionDetails[task._id] || ''}
                                                                onChange={(e) => setCompletionDetails(prev => ({ ...prev, [task._id]: e.target.value }))}
                                                            ></textarea>
                                                            <Button onClick={() => updateStatus(task._id, 'Completed')} block color="warning" className="rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0 shadow-lg">
                                                                <CheckCircle size={16} /> RE-SUBMIT FOR COMPLETION
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {task.status === 'Completed' && (
                                                        <Button block disabled color="success" outline className="rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 opacity-50">
                                                            <CheckCircle size={16} /> SIGNAL SECURED (RESCUED)
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))
                        ) : (
                            <Col className="text-center py-5">
                                <AlertCircle size={48} className="text-muted mb-3 opacity-20" />
                                <h5 className="text-muted">No tactical signals detected for your node.</h5>
                            </Col>
                        )}
                    </AnimatePresence>
                )}
            </Row>
        </DashboardLayout>
    );
};

export default AssignedTasks;

