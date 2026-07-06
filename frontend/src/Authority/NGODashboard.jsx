import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { motion } from 'framer-motion';
import { MapPin, Plus, Trash2, TrendingUp, Archive, AlertTriangle } from 'lucide-react';
import { Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Table, Badge, Spinner } from 'reactstrap';
import axios from 'axios';
import SearchableDropdown from '../Common/SearchableDropdown';
import { FOOD_OPTIONS } from './ResourceAllocation';

const NGODashboard = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [resources, setResources] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ type: 'Food Supply', customType: '', foodCategory: 'Canned Goods', quantity: 0, location: '', expiryDate: '' });

    const fetchNGOData = async () => {
        try {
            const [resRes, reqRes] = await Promise.all([
                axios.get('http://localhost:5000/resource'),
                axios.get('http://localhost:5000/request')
            ]);
            setResources((resRes.data || []).filter(r => r.ngoId?._id === user.id));
            setRequests((reqRes.data || []).filter(r => r.status === 'Pending'));
        } catch (err) {
            console.error("Error fetching NGO data", err);
        }
    };

    useEffect(() => {
        fetchNGOData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddResource = async (e) => {
        e.preventDefault();
        if (formData.type === 'Other' && (!formData.customType || !formData.customType.trim())) {
            alert("TYPE REQUIRED: Please specify the custom asset type.");
            return;
        }

        const isFood = formData.type.toLowerCase().includes('food') || (formData.type === 'Other' && formData.customType.toLowerCase().includes('food'));
        if (isFood && !formData.foodCategory) {
            alert("CATEGORY REQUIRED: Food supplies must include a specific food category.");
            return;
        }
        if (isFood && !formData.expiryDate) {
            alert("EXPIRY REQUIRED: Food supplies must include a valid expiry date.");
            return;
        }
        setLoading(true);
        try {
            let finalType = formData.type === 'Other' ? formData.customType : formData.type;
            if (isFood) {
                finalType = `${finalType} (${formData.foodCategory})`;
            }
            await axios.post('http://localhost:5000/resource', { ...formData, type: finalType, ngoId: user.id });
            alert("ASSET LOGGED: Operational inventory updated.");
            setFormData({ type: 'Food Supply', customType: '', foodCategory: 'Canned Goods', quantity: 0, location: '', expiryDate: '' });
            fetchNGOData();
        } catch (err) {
            alert(err.response?.data?.message || "ASSET FAILURE: Logging mismatch.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResource = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/resource/${id}`);
            fetchNGOData();
        } catch (err) {
            alert("DELETE REJECTED: Resource locked.");
        }
    };

    const handleAssignMission = async (id, request) => {
        try {
            // 1. Update the Request status and assign to this NGO
            await axios.put(`http://localhost:5000/request/${id}`, { status: 'In Progress', assignedTo: user.id });
            
            // 2. Create an unassigned Task that the Admin will see in Task Assignment
            await axios.post('http://localhost:5000/task', {
                title: `SOS DEPLOYMENT: ${request.helpType}`,
                description: `NGO ${user.name} has committed assets for victim ${request.victimId?.name}. Needs volunteer unit for final delivery.`,
                priority: 'High',
                isNGOAlert: true,
                requestId: id // Critical link for status sync later
            });

            alert("MISSION DEPLOYED: Strategic alerts sent to Command Center.");
            fetchNGOData();
        } catch (err) {
            alert("MISSION ABORTED: Mesh synchronization failed.");
        }
    };

    return (
        <DashboardLayout role="NGO" title="Relief Terminal" subtitle="Synchronizing asset distribution and operational missions." themeColor="#0ea5e9" withGlassCard={false}>
            <Row className="g-4">
                <Col md={8}>
                    <div className="d-flex flex-column gap-4">
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '28px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardBody className="p-4 text-white">
                                 <div className="d-flex justify-content-between align-items-center mb-5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ padding: '10px', backgroundColor: 'rgba(14, 165, 233, 0.2)', borderRadius: '12px' }}>
                                            <Archive size={20} color="#0ea5e9" />
                                        </div>
                                        <h4 style={{ fontWeight: 800, margin: 0 }}>Asset Inventory</h4>
                                    </div>
                                </div>
                                {[
                                    { status: 'In Stock', title: 'In Stock (Available Stockpile)', color: 'rgba(34, 197, 94, 0.05)', bgOpacity: '0.02' },
                                    { status: 'Allocated', title: 'Allocated (Pending Dispatch)', color: 'rgba(59, 130, 246, 0.05)', bgOpacity: '0.02' },
                                    { status: 'Used', title: 'Used (Deployed & Consumed)', color: 'rgba(255,255,255,0.05)', bgOpacity: '0.01' },
                                    { status: 'Collected', title: 'Collected (Returned/Recovered)', color: 'rgba(255,255,255,0.05)', bgOpacity: '0.01' },
                                    { status: 'Expired', title: 'Expired (Unusable)', color: 'rgba(239, 68, 68, 0.05)', bgOpacity: '0.01' }
                                ].map(({ status, title, color, bgOpacity }) => {
                                    const statusResources = resources.filter(r => r.status === status);
                                    if (statusResources.length === 0) return null;

                                    return (
                                        <div key={status} className="mb-4">
                                            <h6 className="text-white mb-2 fw-bold opacity-75">{title}</h6>
                                            <div className="table-responsive rounded-4 overflow-hidden" style={{ background: `rgba(255,255,255,${bgOpacity})`, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Table responsive borderless className="align-middle text-white m-0">
                                                    <thead className="small fw-bold text-uppercase opacity-75" style={{ backgroundColor: color }}>
                                                        <tr>
                                                            <th className="px-3 py-3">Category</th>
                                                            <th className="px-3 py-3">Units</th>
                                                            <th className="px-3 py-3">Location</th>
                                                            <th className="px-3 py-3">Expiry / Status</th>
                                                            {(status === 'In Stock' || status === 'Allocated') && <th className="px-3 py-3 text-end">Action</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {statusResources.map((r, i) => (
                                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <td className="px-3 fw-bold">{r.type} AXIS</td>
                                                                <td className="px-3 fw-bold" style={{ color: '#0ea5e9' }}>{r.quantity}</td>
                                                                <td className="px-3 small opacity-75">{r.location}</td>
                                                                <td className="px-3 small">
                                                                    <div>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : 'N/A'}</div>
                                                                    <Badge color={r.status === 'Expired' ? 'danger' : (r.status === 'In Stock' ? 'success' : (r.status === 'Allocated' ? 'info' : 'secondary'))} pill>{r.status}</Badge>
                                                                </td>
                                                                {(status === 'In Stock' || status === 'Allocated') && (
                                                                    <td className="px-3 text-end">
                                                                        <Button outline size="sm" onClick={() => handleDeleteResource(r._id)} className="rounded-circle p-2 border-0 text-danger"><Trash2 size={16} /></Button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>
                                    );
                                })}
                                {resources.length === 0 && (
                                    <div className="text-center py-5 small opacity-50">No assets detected in sector log.</div>
                                )}
                            </CardBody>
                        </Card>

                        <Card className="border-0 shadow-sm" style={{ borderRadius: '28px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardBody className="p-4 text-white">
                                <div className="d-flex justify-content-between align-items-center mb-5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                                            <AlertTriangle size={20} color="#ef4444" />
                                        </div>
                                        <h4 style={{ fontWeight: 800, margin: 0 }}>Strategic Signals</h4>
                                    </div>
                                    <Badge pill color="danger" className="px-3 py-2">LIVE SOS FEED</Badge>
                                </div>
                                <div className="d-flex flex-column gap-3">
                                    {requests.length === 0 ? (
                                        <p className="text-center py-4 small opacity-50">No active signals requiring asset dispatch.</p>
                                    ) : requests.map((req, i) => (
                                        <motion.div key={i} whileHover={{ x: 10 }} className="p-4 rounded-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <p className="fw-bold mb-1 fs-5">{req.helpType} PROTOCOL</p>
                                                    <p className="small opacity-50 mt-1">{req.description}</p>
                                                </div>
                                                <Button style={{ backgroundColor: '#0ea5e9', flexShrink: 0 }} onClick={() => handleAssignMission(req._id, req)} className="rounded-pill px-4 py-2 border-0 fw-bold shadow-sm ms-3">DEPLOY ASSET</Button>
                                            </div>
                                            
                                            {/* Victim details row at the bottom of the card */}
                                            <div className="d-flex flex-wrap gap-3 mt-1 pt-2 align-items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
                                                <div className="text-white-50">
                                                    Victim: <span className="text-white fw-bold">{req.victimId?.name || 'Unknown'}</span>
                                                </div>
                                                {req.victimId?.contact && (
                                                    <div className="text-white-50">
                                                        Contact: <span className="text-info fw-bold">{req.victimId.contact}</span>
                                                    </div>
                                                )}
                                                <div className="text-white-50 d-flex align-items-center gap-1">
                                                    <MapPin size={12} className="text-danger" />
                                                    <span>{req.location?.address || req.victimId?.location || 'Sector Lock Active'}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </Col>

                <Col md={4}>
                     <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '28px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <CardBody className="p-4 text-white">
                            <h4 style={{ fontWeight: 800, marginBottom: '2rem' }}>Asset Registration</h4>
                            <Form onSubmit={handleAddResource}>
                                <FormGroup className="mb-4">
                                    <Label className="small fw-bold text-uppercase opacity-75">Strategic Category</Label>
                                    <Input type="select" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="rounded-pill border-0 py-2 px-4 shadow-none" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                                        <option className="text-dark">Food Supply</option><option className="text-dark">Medical Axis</option><option className="text-dark">Water Resource</option><option className="text-dark">Tentage</option><option className="text-dark">Other</option>
                                    </Input>
                                </FormGroup>
                                {formData.type === 'Other' && (
                                    <FormGroup className="mb-4">
                                        <Label className="small fw-bold text-uppercase opacity-75">Specify Asset Type</Label>
                                        <Input type="text" placeholder="e.g. Blankets" value={formData.customType} onChange={(e) => setFormData({...formData, customType: e.target.value})} className="rounded-pill border-0 py-2 px-4 shadow-none text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                    </FormGroup>
                                )}
                                {(formData.type.toLowerCase().includes('food') || (formData.type === 'Other' && (formData.customType || '').toLowerCase().includes('food'))) && (
                                    <FormGroup className="mb-4">
                                        <Label className="small fw-bold text-uppercase opacity-75">Food Category</Label>
                                        <SearchableDropdown 
                                            options={FOOD_OPTIONS}
                                            value={formData.foodCategory}
                                            onChange={(val) => setFormData({...formData, foodCategory: val})}
                                            placeholder="Search Food Category..."
                                        />
                                    </FormGroup>
                                )}
                                <FormGroup className="mb-4">
                                    <Label className="small fw-bold text-uppercase opacity-75">Unit Count</Label>
                                    <Input type="number" placeholder="500" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="rounded-pill border-0 py-2 px-4 shadow-none text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                </FormGroup>
                                <FormGroup className="mb-5">
                                    <Label className="small fw-bold text-uppercase opacity-75">Dispatch Base</Label>
                                    <Input type="text" placeholder="Central Depot A" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="rounded-pill border-0 py-2 px-4 shadow-none text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                </FormGroup>
                                {(formData.type.toLowerCase().includes('food') || formData.type === 'Other') && (
                                    <FormGroup className="mb-5">
                                        <Label className="small fw-bold text-uppercase opacity-75">
                                            Expiry Date {formData.type === 'Other' && !(formData.customType || '').toLowerCase().includes('food') ? '(Optional)' : ''}
                                        </Label>
                                        <Input
                                            type="date"
                                            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                            className="rounded-pill border-0 py-2 px-4 shadow-none text-white"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                        />
                                    </FormGroup>
                                )}
                                <Button style={{ backgroundColor: '#0ea5e9' }} block className="rounded-pill py-3 fw-bold border-0 shadow-sm" disabled={loading}>
                                    {loading ? <Spinner size="sm" /> : <><Plus size={18} className="me-2" /> REGISTER ASSET</>}
                                </Button>
                            </Form>
                        </CardBody>
                     </Card>

                     <Card className="border-0 shadow-sm" style={{ borderRadius: '28px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), transparent)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <CardBody className="p-4 text-white">
                            <h4 className="mb-3 d-flex align-items-center gap-2" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                <TrendingUp size={18} color="#0ea5e9" /> PROTOCOL OPS
                            </h4>
                            <ul className="list-unstyled d-flex flex-column gap-3 small opacity-75">
                                <li className="d-flex gap-2"><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', marginTop: '6px' }} /> Update inventory axis every 2 hours.</li>
                                <li className="d-flex gap-2"><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', marginTop: '6px' }} /> Emergency dispatch prioritized for Category B.</li>
                                <li className="d-flex gap-2"><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', marginTop: '6px' }} /> Maintain satellite link for all missions.</li>
                            </ul>
                        </CardBody>
                     </Card>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default NGODashboard;
