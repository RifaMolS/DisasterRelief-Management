import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Activity, Clock, Zap, Globe, CheckCircle } from 'lucide-react';
import { Row, Col, Card, CardBody, Button, Badge, Spinner } from 'reactstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import LiveDisasterMap from './LiveDisasterMap';
import WeatherWidget from '../User/WeatherWidget';

const VolunteerDashboard = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [tasks, setTasks] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [verificationPhotos, setVerificationPhotos] = useState({});

    useEffect(() => {
        fetchAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [tasksRes, reqRes] = await Promise.all([
                axios.get(`http://localhost:5000/task/volunteer/${user.id}`),
                axios.get(`http://localhost:5000/request`)
            ]);
            setTasks(tasksRes.data || []);
            setPendingRequests((reqRes.data || []).filter(r => r.status === 'Pending'));
        } catch (err) {
            console.error("Dashboard sync failed", err);
            toast.error("Failed to sync dashboard data.");
        } finally {
            setLoading(false);
        }
    };

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

    const updateTaskStatus = async (id, newStatus) => {
        let payload = { status: newStatus };
        if (newStatus === 'Completed') {
            if (!verificationPhotos[id]) {
                return toast.error("Please select a NEW verification photo to submit.");
            }
            payload.verificationPhoto = verificationPhotos[id];
        }
        setActionLoading(true);
        try {
            await axios.put(`http://localhost:5000/task/${id}`, payload);
            toast.success(`Mission updated to "${newStatus}"`);
            setVerificationPhotos(prev => { const copy = {...prev}; delete copy[id]; return copy; });
            fetchAllData();
        } catch (err) {
            toast.error("Status update failed. (If photo is large, restart backend server)");
        } finally {
            setActionLoading(false);
        }
    };

    const joinMission = async (req) => {
        setActionLoading(true);
        try {
            // 1. Mark request as In Progress and assign to this Volunteer
            await axios.put(`http://localhost:5000/request/${req._id}`, { status: 'In Progress', assignedTo: user.id });
            
            // 2. Automatically create a Task assigned to this Volunteer so it lands in Active Field Missions
            await axios.post('http://localhost:5000/task', {
                title: `SOS EXTRACTION: ${req.helpType}`,
                description: `Field rescue operation for citizen: ${req.description || 'Immediate assistance requested.'}`,
                volunteerId: user.id,
                priority: 'High',
                requestId: req._id
            });

            toast.success("Rescue mission joined! Check your Active Field Missions below.");
            fetchAllData();
        } catch (err) {
            console.error("Rescue joining mismatch:", err);
            toast.error("Failed to join mission.");
        } finally {
            setActionLoading(false);
        }
    };

    const activeTasks = tasks.filter(t => t.status !== 'Completed');
    const completedTasks = tasks.filter(t => t.status === 'Completed');

    const getPriorityColor = (priority) => {
        if (priority === 'High') return '#ef4444';
        if (priority === 'Medium') return '#f59e0b';
        return '#3b82f6';
    };

    return (
        <DashboardLayout
            role="Volunteer"
            title={`${user.name || 'Field'} Command`}
            subtitle="Tracking operational missions and field deployment logistics."
            themeColor="#f59e0b"
            withGlassCard={false}
        >
            {/* ── Stats Row ── */}
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card style={{ borderRadius: '24px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                        <CardBody className="p-4 d-flex align-items-center gap-3">
                            <div style={{ backgroundColor: 'rgba(245,158,11,0.15)', padding: '12px', borderRadius: '16px' }}>
                                <Briefcase size={24} color="#f59e0b" />
                            </div>
                            <div>
                                <p className="small text-muted mb-0 fw-bold text-uppercase">Active Missions</p>
                                <h3 className="text-white mb-0" style={{ fontWeight: 900 }}>
                                    {loading ? <Spinner size="sm" /> : activeTasks.length}
                                </h3>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card style={{ borderRadius: '24px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                        <CardBody className="p-4 d-flex align-items-center gap-3">
                            <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', padding: '12px', borderRadius: '16px' }}>
                                <Activity size={24} color="#ef4444" />
                            </div>
                            <div>
                                <p className="small text-muted mb-0 fw-bold text-uppercase">Pending SOS Signals</p>
                                <h3 className="text-white mb-0" style={{ fontWeight: 900 }}>
                                    {loading ? <Spinner size="sm" /> : pendingRequests.length}
                                </h3>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card style={{ borderRadius: '24px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)', backdropFilter: 'blur(10px)' }}>
                        <CardBody className="p-4 d-flex align-items-center gap-3">
                            <div style={{ backgroundColor: 'rgba(34,197,94,0.1)', padding: '12px', borderRadius: '16px' }}>
                                <CheckCircle size={24} color="#22c55e" />
                            </div>
                            <div>
                                <p className="small text-muted mb-0 fw-bold text-uppercase">Completed Missions</p>
                                <h3 className="text-success mb-0" style={{ fontWeight: 900 }}>
                                    {loading ? <Spinner size="sm" /> : completedTasks.length}
                                </h3>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                {/* ── Active Field Missions — from /task/volunteer/:id ── */}
                <Col md={12}>
                    <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '32px', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-5 text-white">
                            <div className="d-flex justify-content-between align-items-center mb-5">
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ padding: '10px', backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                                        <Briefcase size={20} color="#f59e0b" />
                                    </div>
                                    <h4 style={{ fontWeight: 800, margin: 0 }}>Active Field Missions</h4>
                                </div>
                                <Badge pill color="warning" className="px-3 py-2 fw-bold text-dark">PROTOCOL LIVE</Badge>
                            </div>

                            {loading ? (
                                <div className="text-center py-5"><Spinner color="warning" /></div>
                            ) : activeTasks.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="mb-4 opacity-25"><Briefcase size={64} /></div>
                                    <p className="fs-5 fw-bold mb-1 opacity-75">No active missions currently assigned to your axis.</p>
                                    <p className="small opacity-50">Join an open signal from the feed below to begin tactical extraction.</p>
                                </div>
                            ) : (
                                <Row className="g-4">
                                    {activeTasks.map((task, i) => (
                                        <Col md={4} key={task._id}>
                                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                                <Card className="border-0 h-100" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${getPriorityColor(task.priority)}33` }}>
                                                    <CardBody className="p-4 d-flex flex-column text-white">
                                                        <div className="d-flex justify-content-between mb-3">
                                                            <Badge pill style={{ background: `${getPriorityColor(task.priority)}22`, color: getPriorityColor(task.priority), border: `1px solid ${getPriorityColor(task.priority)}55` }}>
                                                                {task.priority || 'Medium'} PRIORITY
                                                            </Badge>
                                                            <Badge color={task.status === 'Completed' ? 'success' : task.status === 'Rejected' ? 'danger' : task.status === 'In Progress' ? 'primary' : 'warning'} pill>
                                                                {task.status}
                                                            </Badge>
                                                        </div>
                                                        <h5 className="fw-bold mb-2">{task.title}</h5>
                                                        <p className="small opacity-75 mb-3 flex-grow-1" style={{ lineHeight: 1.6 }}>{task.description}</p>
                                                        
                                                        {/* Victim Details on Task Card */}
                                                        {task.requestId?.victimId && (
                                                            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                                                <div className="mb-1 text-white fw-bold">
                                                                    <span className="opacity-50 small mr-1">Victim:</span> {task.requestId.victimId.name}
                                                                </div>
                                                                {task.requestId.victimId.contact && (
                                                                    <div className="text-info font-monospace" style={{ fontSize: '0.75rem' }}>
                                                                        <span className="opacity-50 text-white small mr-1">Contact:</span> {task.requestId.victimId.contact}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="small mb-3 opacity-75 d-flex align-items-center gap-1">
                                                            <MapPin size={12} className="text-danger" />
                                                            {task.requestId?.location?.address || task.incidentId?.address || task.requestId?.victimId?.location || 'Location pending'}
                                                        </div>
                                                        <div className="d-flex flex-column gap-3">
                                                            {task.status === 'Pending' && (
                                                                <Button block outline color="warning" className="rounded-pill fw-bold py-2" onClick={() => updateTaskStatus(task._id, 'In Progress')} disabled={actionLoading}>
                                                                    <Activity size={14} className="me-2" />INITIATE
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
                                                                    <Button block color="success" className="rounded-pill fw-bold py-2 border-0" onClick={() => updateTaskStatus(task._id, 'Completed')} disabled={actionLoading}>
                                                                        <CheckCircle size={14} className="me-2" />MARK RESCUED (COMPLETE)
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {task.status === 'Rejected' && (
                                                                <div className="p-3 rounded mb-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                                    <h6 className="small fw-bold text-uppercase text-danger mb-2">Verification Failed</h6>
                                                                    <p className="small text-white-50 mb-3">Admin rejected the completion. Please upload a clearer image.</p>
                                                                    <input 
                                                                        type="file" 
                                                                        accept="image/*" 
                                                                        onChange={(e) => handlePhotoUpload(e, task._id)} 
                                                                        className="form-control form-control-sm bg-dark text-white border-secondary mb-3" 
                                                                    />
                                                                    <Button onClick={() => updateTaskStatus(task._id, 'Completed')} block color="warning" className="rounded-pill py-2 fw-bold border-0 shadow-lg" disabled={actionLoading}>
                                                                        <CheckCircle size={14} className="me-2" /> RE-SUBMIT FOR COMPLETION
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </motion.div>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </CardBody>
                    </Card>
                </Col>

                {/* ── Open SOS Signal Feed ── */}
                <Col md={8}>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '28px', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-4 text-white">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ padding: '10px', backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: '12px' }}>
                                        <Activity size={20} color="#ef4444" />
                                    </div>
                                    <h4 style={{ fontWeight: 800, margin: 0 }}>Open SOS Signal Feed</h4>
                                </div>
                                <Badge pill color="danger" className="px-3 py-2 fw-bold">
                                    {pendingRequests.length} LIVE
                                </Badge>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {loading ? (
                                    <div className="text-center py-4"><Spinner color="danger" /></div>
                                ) : pendingRequests.length === 0 ? (
                                    <div className="text-center py-5">
                                        <Activity size={48} className="text-muted opacity-25 mb-3" />
                                        <p className="small opacity-50">All signals currently monitored by network personnel.</p>
                                    </div>
                                ) : (
                                    pendingRequests.slice(0, 5).map((req, i) => (
                                        <div key={req._id} className="p-4 rounded-4" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                            {/* Header row: type + join button */}
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <p className="fw-bold mb-1 fs-6">{req.helpType} — <span className="text-warning">URGENT</span></p>
                                                    <p className="small opacity-75 mb-0">{req.description?.slice(0, 80) || 'No description provided'}</p>
                                                </div>
                                                <Button
                                                    outline
                                                    style={{ color: '#f59e0b', borderColor: '#f59e0b', flexShrink: 0 }}
                                                    onClick={() => joinMission(req)}
                                                    disabled={actionLoading}
                                                    className="rounded-pill px-4 py-2 fw-bold ms-3"
                                                >
                                                    {actionLoading ? <Spinner size="sm" /> : 'JOIN MISSION'}
                                                </Button>
                                            </div>

                                            {/* Victim info row */}
                                            <div className="d-flex flex-wrap gap-3 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                                    <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Victim:</span>
                                                    <span className="text-white fw-bold">{req.victimId?.name || 'Unknown'}</span>
                                                </div>
                                                {req.victimId?.contact && (
                                                    <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                                        <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact:</span>
                                                        <span className="text-info fw-bold">{req.victimId.contact}</span>
                                                    </div>
                                                )}
                                                {(req.victimId?.location || req.location?.address) && (
                                                    <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                                        <MapPin size={12} color="#f87171" />
                                                        <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location:</span>
                                                        <span className="text-white">{req.location?.address || req.victimId?.location || 'GPS Coordinates Active'}</span>
                                                    </div>
                                                )}
                                                <div className="d-flex align-items-center gap-1 ms-auto" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                                    <Clock size={11} />
                                                    {new Date(req.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* ── Operator Stats ── */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '28px', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-4 text-white">
                            <h4 style={{ fontWeight: 800, marginBottom: '2rem' }}>Operator Stats</h4>
                            <div className="d-flex flex-column gap-3">
                                {[
                                    { label: 'Active Missions',    value: activeTasks.length,                              color: '#f59e0b' },
                                    { label: 'Completed',          value: completedTasks.length,                           color: '#22c55e' },
                                    { label: 'Open SOS Signals',   value: pendingRequests.length,                          color: '#ef4444' },
                                    { label: 'In Progress Tasks',  value: tasks.filter(t => t.status === 'In Progress').length, color: '#3b82f6' },
                                ].map((stat, i) => (
                                    <div key={i} className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span className="small fw-bold opacity-75 text-uppercase">{stat.label}</span>
                                        <span className="fw-bold fs-5" style={{ color: stat.color }}>
                                            {loading ? '—' : stat.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* ── Tactical Map & Weather ── */}
            <Row className="g-4 mt-2 mb-5">
                <Col lg={8}>
                    <Card style={{ borderRadius: '32px', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-4">
                            <h4 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                <Globe size={24} className="text-warning" /> Tactical Command View
                            </h4>
                            <LiveDisasterMap />
                        </CardBody>
                    </Card>
                </Col>
                <Col lg={4}>
                    <h5 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                        <Zap size={20} className="text-warning" /> Atmospheric Awareness
                    </h5>
                    <WeatherWidget />
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default VolunteerDashboard;
