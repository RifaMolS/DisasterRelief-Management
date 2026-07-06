import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Row, Col, Card, CardBody, Table, Badge, Spinner, Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { AlertTriangle, MapPin, MoreVertical, CheckCircle, Trash2, Clock, Bell, Activity } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ManageIncidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);

    const toggleModal = (incident = null) => {
        setSelectedIncident(incident);
        setIsModalOpen(!isModalOpen);
    };

    const [tasks, setTasks] = useState([]);

    const fetchIncidents = async () => {
        try {
            const [disastersRes, tasksRes] = await Promise.all([
                axios.get('http://localhost:5000/disaster'),
                axios.get('http://localhost:5000/task')
            ]);
            setIncidents(disastersRes.data);
            setTasks(tasksRes.data);
        } catch (err) {
            toast.error("Failed to fetch incidents.");
        } finally {
            setLoading(false);
        }
    };

    const notifyAuthority = async (incident) => {
        const alreadyNotified = tasks.some(t => (t.incidentId?._id === incident._id || t.incidentId === incident._id) && t.isNGOAlert);
        if (alreadyNotified) {
            toast.error("Already notified");
            return;
        }

        try {
            // Logic to bridge Admin signal to Authority
            await axios.post('http://localhost:5000/task', {
                title: `EMERGENCY: ${incident.type}`,
                description: `Authority intervention required at ${incident.address}. Severity: ${incident.severity}.`,
                priority: incident.severity === 'Critical' ? 'High' : 'Medium',
                isNGOAlert: true,
                incidentId: incident._id
            });
            toast.success("Authority mesh notified and synchronized.");
            fetchIncidents(); // Refresh tasks

        } catch (err) {
            toast.error("Network synchronization failed.");
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/disaster/${id}`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchIncidents();
        } catch (err) {
            toast.error("Status update failed.");
        }
    };

    const deleteIncident = async (id) => {
        if (!window.confirm("Are you sure you want to purge this incident record?")) return;
        try {
            await axios.delete(`http://localhost:5000/disaster/${id}`);
            toast.success("Incident record purged.");
            if (isModalOpen) toggleModal();
            fetchIncidents();
        } catch (err) {
            toast.error("Deletion failed.");
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return 'secondary';
            case 'Ongoing': return 'primary';
            case 'Resolved': return 'success';
            default: return 'light';
        }
    };

    return (
        <AdminLayout title="Global Incident Control" subtitle="AI-prioritized mesh of active and historical disaster signals.">
            <Row>
                <Col md={12}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="success" />
                        </div>
                    ) : (
                        <Card className="border-0 shadow-lg" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                            <CardBody className="p-0">
                                <div className="table-responsive">
                                    <Table hover borderless className="m-0 text-white align-middle" style={{ backgroundColor: 'transparent' }}>
                                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                            <tr className="text-uppercase small fw-bold text-muted">
                                                <th className="px-4 py-3">Incident Metadata</th>
                                                <th className="py-3">Location & Area</th>
                                                <th className="py-3">Severity Core</th>
                                                <th className="py-3">Current Status</th>
                                                <th className="py-3 text-end px-4">Manage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {incidents.map((incident, idx) => (
                                                    <motion.tr 
                                                        key={incident._id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                        className="hover-row"
                                                    >
                                                        <td className="px-4 py-4">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div style={{ backgroundColor: `${getSeverityColor(incident.severity)}33`, padding: '10px', borderRadius: '12px' }}>
                                                                    <AlertTriangle size={20} color={getSeverityColor(incident.severity) === 'danger' ? '#ef4444' : '#22c55e'} />
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold">{incident.type}</div>
                                                                    <div className="small text-muted">{incident.description?.substring(0, 30)}...</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <MapPin size={14} className="text-success" />
                                                                <span className="small">
                                                                    {incident.address && incident.address !== "GPS Coordinates Verified" 
                                                                        ? incident.address 
                                                                        : incident.location?.coordinates 
                                                                            ? `${incident.location.coordinates[1].toFixed(4)}, ${incident.location.coordinates[0].toFixed(4)}`
                                                                            : 'GPS Locked'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Badge color={getSeverityColor(incident.severity)} pill className="px-3 py-1">
                                                                {incident.severity}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(incident.status) === 'primary' ? '#3b82f6' : getStatusColor(incident.status) === 'success' ? '#22c55e' : '#64748b' }}></div>
                                                                <span className="small fw-bold">{incident.status}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-end px-4 align-middle">
                                                            <Button 
                                                                color="light" 
                                                                size="sm" 
                                                                className="rounded-pill px-3 fw-bold border-0 text-dark"
                                                                style={{ background: 'rgba(255,255,255,0.8)' }}
                                                                onClick={() => toggleModal(incident)}
                                                            >
                                                                MANAGE
                                                            </Button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </Table>
                                </div>
                                {incidents.length === 0 && (
                                    <div className="text-center py-5 text-muted">
                                        No disaster signals detected in current mesh.
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </Col>
            </Row>
            
            <Modal isOpen={isModalOpen} toggle={() => toggleModal()} centered>
                <ModalHeader toggle={() => toggleModal()} className="bg-white text-dark border-0 py-4 border-bottom">
                    <div className="fw-bold">Incident Operations Center</div>
                </ModalHeader>
                <ModalBody className="bg-white text-dark border-0 px-4 pb-5">
                    {selectedIncident && (
                        <>
                            <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                                <div className="small fw-bold text-uppercase opacity-50 mb-1">Target Mission</div>
                                <div className="fw-bold text-info">{selectedIncident.type}</div>
                                <div className="small opacity-75">{selectedIncident.description}</div>
                            </div>
                            
                            <h6 className="fw-bold opacity-75 mb-3 small text-uppercase">Update Status</h6>
                            <div className="d-grid gap-2 mb-4">
                                <Button 
                                    outline color="secondary" 
                                    onClick={() => updateStatus(selectedIncident._id, 'Reported')} 
                                    className="text-start d-flex align-items-center gap-2 border-secondary"
                                >
                                    <Clock size={16} /> Mark as Reported
                                </Button>
                                <Button 
                                    outline color="primary" 
                                    onClick={() => updateStatus(selectedIncident._id, 'Ongoing')} 
                                    className="text-start d-flex align-items-center gap-2 border-primary"
                                >
                                    <Activity size={16} /> Move to Ongoing
                                </Button>
                                <Button 
                                    outline color="success" 
                                    onClick={() => updateStatus(selectedIncident._id, 'Resolved')} 
                                    className="text-start d-flex align-items-center gap-2 border-success"
                                >
                                    <CheckCircle size={16} /> Finalize/Resolved
                                </Button>
                            </div>

                            <h6 className="fw-bold opacity-75 mb-3 small text-uppercase mt-4">Command Actions</h6>
                            <div className="d-grid gap-2">
                                <Button 
                                    color="info" 
                                    onClick={() => notifyAuthority(selectedIncident)} 
                                    className="text-start d-flex align-items-center gap-2 text-white border-0 shadow-sm"
                                >
                                    <Bell size={16} /> Notify Authority (NGO)
                                </Button>
                                <Button 
                                    color="danger" 
                                    onClick={() => deleteIncident(selectedIncident._id)} 
                                    className="text-start d-flex align-items-center gap-2 text-white border-0 shadow-sm mt-2"
                                >
                                    <Trash2 size={16} /> Purge Records
                                </Button>
                            </div>
                        </>
                    )}
                </ModalBody>
            </Modal>

            <style>{`
                .hover-row:hover {
                    background: rgba(255,255,255,0.03) !important;
                }
            `}</style>
        </AdminLayout>
    );
};

export default ManageIncidents;
