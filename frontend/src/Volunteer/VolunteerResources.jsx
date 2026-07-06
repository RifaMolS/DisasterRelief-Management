import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Badge, Button, Spinner } from 'reactstrap';
import { Package, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const VolunteerResources = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [tasksWithResources, setTasksWithResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAllocations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAllocations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/task/volunteer/${user.id}`);
            // Filter only tasks that have resources assigned
            const resourceTasks = (res.data || []).filter(t => t.resources && t.resources.length > 0);
            setTasksWithResources(resourceTasks);
        } catch (err) {
            console.error("Failed to fetch allocated resources:", err);
            toast.error("Could not sync resource allocations.");
        } finally {
            setLoading(false);
        }
    };

    const markResourceCollected = async (resourceId) => {
        setActionLoading(true);
        try {
            await axios.put(`http://localhost:5000/resource/${resourceId}`, { status: 'Collected' });
            toast.success("Resource marked as Collected.");
            fetchAllocations();
        } catch (err) {
            toast.error("Failed to update resource status.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <DashboardLayout 
            role="Volunteer" 
            title="Resource Allocation" 
            subtitle="Manage and collect emergency relief supplies assigned to your tasks." 
            themeColor="#f59e0b" 
            bgImage="https://images.unsplash.com/photo-1593113580327-023a1aab614c?q=80&w=2070&auto=format&fit=crop"
        >
            <Row>
                <Col md={12}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="warning" />
                        </div>
                    ) : tasksWithResources.length === 0 ? (
                        <Card className="border-0 shadow-lg text-center py-5" style={{ borderRadius: '24px', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)' }}>
                            <CardBody>
                                <Package size={48} className="text-muted opacity-50 mb-3" />
                                <h4 className="text-white fw-bold">No Resources Allocated</h4>
                                <p className="text-muted">You do not have any pending resource collections for your assigned tasks.</p>
                            </CardBody>
                        </Card>
                    ) : (
                        <Row className="g-4">
                            {tasksWithResources.map((task, idx) => (
                                <Col lg={6} key={task._id}>
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="h-100">
                                        <Card className="border-0 shadow-lg h-100" style={{ borderRadius: '24px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <CardBody className="p-4 d-flex flex-column text-white">
                                                <div className="mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h5 className="fw-bold text-warning mb-0">{task.title}</h5>
                                                        <Badge color={task.status === 'Completed' ? 'success' : 'primary'} pill>{task.status}</Badge>
                                                    </div>
                                                    <p className="small text-white-50 mb-2">{task.description}</p>
                                                    <div className="small d-flex align-items-center gap-2 opacity-75">
                                                        <MapPin size={14} className="text-info" /> {task.incidentId?.address || 'Location pending'}
                                                    </div>
                                                </div>

                                                <h6 className="fw-bold text-uppercase opacity-75 mb-3 d-flex align-items-center gap-2">
                                                    <Package size={16} /> Allocated Supplies
                                                </h6>

                                                <div className="d-flex flex-column gap-3 flex-grow-1">
                                                    {task.resources.map(resource => (
                                                        <div key={resource._id} className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="fw-bold text-info fs-5">{resource.type}</span>
                                                                <Badge color={resource.status === 'Collected' ? 'success' : resource.status === 'Allocated' ? 'warning' : 'secondary'}>
                                                                    {resource.status.toUpperCase()}
                                                                </Badge>
                                                            </div>
                                                            <div className="d-flex justify-content-between align-items-end">
                                                                <div>
                                                                    <div className="small fw-bold opacity-75">Quantity: {resource.quantity} Units</div>
                                                                    <div className="small text-white-50 mt-1">Pickup Loc: {resource.location || 'Central NGO Node'}</div>
                                                                    {resource.expiryDate && (
                                                                        <div className="small text-danger mt-1">
                                                                            <AlertTriangle size={12} className="me-1" /> Exp: {new Date(resource.expiryDate).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    {resource.status === 'Allocated' && (
                                                                        <Button 
                                                                            color="success" 
                                                                            size="sm" 
                                                                            className="rounded-pill px-3 fw-bold border-0 shadow-sm d-flex align-items-center gap-2"
                                                                            onClick={() => markResourceCollected(resource._id)}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <CheckCircle size={14} /> Mark Collected
                                                                        </Button>
                                                                    )}
                                                                    {resource.status === 'Collected' && (
                                                                        <Button disabled color="success" outline size="sm" className="rounded-pill px-3 fw-bold border-0 opacity-50 d-flex align-items-center gap-2">
                                                                            <CheckCircle size={14} /> Collected
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default VolunteerResources;
