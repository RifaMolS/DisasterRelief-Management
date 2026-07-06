import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Row, Col, Card, CardBody, Table, Badge, Spinner, Progress, Button } from 'reactstrap';
import { Truck, Layers } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ManageResources = () => {
    const [resources, setResources] = useState([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    const fetchResources = async () => {
        try {
            const res = await axios.get('http://localhost:5000/resource');
            setResources(res.data);
        } catch (err) {
            toast.error("Failed to fetch resources.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const filteredResources = filter === 'All' 
        ? resources 
        : resources.filter(r => r.type.toLowerCase().includes(filter.toLowerCase()));

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Stock': return 'success';
            case 'Allocated': return 'warning';
            case 'Used': return 'info';
            case 'Expired': return 'danger';
            default: return 'secondary';
        }
    };

    const getTypeIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes('food')) return '🍎';
        if (t.includes('water')) return '💧';
        if (t.includes('med')) return '💊';
        return '📦';
    };

    return (
        <AdminLayout title="Inventory Strategic Command" subtitle="Monitoring global supply chain nodes and resource stockpiles.">
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <CardBody className="p-4">
                            <h6 className="small fw-bold text-success text-uppercase mb-3">Total Supply Nodes</h6>
                            <h2 className="fw-bold mb-0 text-white">{resources.length}</h2>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={3}>
                   <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <CardBody className="p-4">
                            <h6 className="small fw-bold text-danger text-uppercase mb-3">Expired Food Nodes</h6>
                            <h2 className="fw-bold mb-0 text-white">{resources.filter(r => r.status === 'Expired').length}</h2>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={3}>
                   <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <CardBody className="p-4">
                            <h6 className="small fw-bold text-primary text-uppercase mb-3">In Transit</h6>
                            <h2 className="fw-bold mb-0 text-white">{resources.filter(r => r.status === 'Allocated').length}</h2>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <div className="d-flex gap-2 mb-4">
                {['All', 'Food', 'Medical', 'Water'].map(cat => (
                    <Button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`rounded-pill px-4 py-2 fw-bold border-0 shadow-sm ${filter === cat ? 'bg-success text-white' : 'bg-secondary bg-opacity-25 text-white opacity-50'}`}
                        style={{ fontSize: '0.8rem' }}
                    >
                        {cat.toUpperCase()} AXIS
                    </Button>
                ))}
            </div>

            <Row>
                <Col md={12}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="success" />
                        </div>
                    ) : (
                        <>
                            {[
                                { status: 'In Stock', title: 'In Stock (Available Stockpile)', color: 'rgba(34, 197, 94, 0.05)', opacity: 1 },
                                { status: 'Allocated', title: 'Allocated (Pending Dispatch)', color: 'rgba(59, 130, 246, 0.05)', opacity: 1 },
                                { status: 'Used', title: 'Used (Deployed & Consumed)', color: 'rgba(255,255,255,0.05)', opacity: 0.8 },
                                { status: 'Collected', title: 'Collected (Returned/Recovered)', color: 'rgba(255,255,255,0.05)', opacity: 0.8 },
                                { status: 'Expired', title: 'Expired (Unusable)', color: 'rgba(239, 68, 68, 0.05)', opacity: 0.8 }
                            ].map(({ status, title, color, opacity }) => {
                                const resources = filteredResources.filter(r => r.status === status);
                                if (resources.length === 0) return null;

                                return (
                                    <div key={status} className="mb-5">
                                        <h5 className="text-white mt-2 mb-3 fw-bold">{title}</h5>
                                        <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                                            <CardBody className="p-0">
                                                <div className="table-responsive">
                                                    <Table hover borderless className="m-0 text-white align-middle">
                                                        <thead style={{ backgroundColor: color }}>
                                                            <tr className="text-uppercase small fw-bold text-muted">
                                                                <th className="px-4 py-3">Resource Type</th>
                                                                <th className="py-3">NGO Custodian</th>
                                                                <th className="py-3">Quantity Pulse</th>
                                                                <th className="py-3">Current Status</th>
                                                                <th className="py-3">Expiry Date</th>
                                                                <th className="py-3 text-end px-4">Sector Location</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {resources.map((resource, idx) => (
                                                                <motion.tr 
                                                                    key={resource._id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.05 }}
                                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: opacity }}
                                                                    className="hover-row"
                                                                >
                                                                    <td className="px-4 py-4">
                                                                        <div className="d-flex align-items-center gap-3">
                                                                            <div style={{ fontSize: '1.5rem' }}>{getTypeIcon(resource.type)}</div>
                                                                            <div className="fw-bold">{resource.type}</div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <Layers size={14} className="text-primary" />
                                                                            <span className="small">{resource.ngoId?.name || 'Unassigned'}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ minWidth: '150px' }}>
                                                                        <div className="d-flex justify-content-between mb-1 small fw-bold">
                                                                            <span>{resource.quantity} units</span>
                                                                            {status === 'In Stock' || status === 'Allocated' ? (
                                                                                <span className="opacity-50">{(resource.quantity / 1000 * 100).toFixed(0)}% Cap</span>
                                                                            ) : null}
                                                                        </div>
                                                                        {status === 'In Stock' || status === 'Allocated' ? (
                                                                            <Progress value={resource.quantity / 1000 * 100} color={status === 'In Stock' ? "success" : "info"} style={{ height: '4px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                                                        ) : (
                                                                            <Progress value={100} color="secondary" style={{ height: '4px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <Badge color={getStatusColor(resource.status)} pill className="px-3 py-1">
                                                                            {resource.status}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className={resource.status === 'Expired' ? 'text-danger fw-bold' : ''}>
                                                                        {resource.expiryDate ? new Date(resource.expiryDate).toLocaleDateString() : 'N/A'}
                                                                    </td>
                                                                    <td className="text-end px-4">
                                                                        <div className="d-flex align-items-center justify-content-end gap-2 text-muted">
                                                                            <Truck size={14} />
                                                                            <span className="small">{resource.location || 'Local Grid'}</span>
                                                                        </div>
                                                                    </td>
                                                                </motion.tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                );
                            })}
                            {filteredResources.length === 0 && (
                                <div className="text-center py-5 text-muted">
                                    No supply nodes detected in this axis.
                                </div>
                            )}
                        </>
                    )}
                </Col>
            </Row>
            <style>{`
                .hover-row:hover {
                    background: rgba(255,255,255,0.03) !important;
                    transition: all 0.2s ease;
                }
            `}</style>
        </AdminLayout>
    );
};

export default ManageResources;
