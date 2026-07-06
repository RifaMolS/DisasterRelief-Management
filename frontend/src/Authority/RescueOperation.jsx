import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Badge, Table, Spinner, Button } from 'reactstrap';
import { Shield, MapPin, CheckCircle, User, Phone, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RescueOperation = () => {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const intervalRef = useRef(null);

    const fetchMissions = async (silent = false) => {
        try {
            const res = await axios.get('http://localhost:5000/request');
            setMissions(res.data || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Rescue sync failure:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        fetchMissions();

        // Auto-refresh every 5 seconds so volunteer actions immediately reflect here
        intervalRef.current = setInterval(() => fetchMissions(true), 5000);

        return () => clearInterval(intervalRef.current);
    }, []);

    const completeMission = async (id) => {
        try {
            await axios.put(`http://localhost:5000/request/${id}`, { status: 'Completed' });
            toast.success("Extraction Protocol Concluded");
            fetchMissions(true);
        } catch (err) {
            toast.error("Operation finalization failed.");
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Completed':   return 'success';   // green
            case 'Rescued':     return 'warning';   // orange
            case 'In Progress': return 'primary';   // blue
            case 'Pending':     return 'secondary'; // grey/yellow
            default:            return 'secondary';
        }
    };

    const statusCounts = {
        pending:    missions.filter(m => m.status === 'Pending').length,
        inProgress: missions.filter(m => m.status === 'In Progress').length,
        rescued:    missions.filter(m => m.status === 'Rescued').length,
        completed:  missions.filter(m => m.status === 'Completed').length,
    };

    return (
        <DashboardLayout role="NGO" title="Rescue Ops Terminal" subtitle="Strategic coordination of extraction protocols and field personnel." themeColor="#0ea5e9">
            <Row>
                <Col md={12}>
                    {/* ── Live Status Summary ── */}
                    <div className="d-flex gap-3 mb-4 flex-wrap">
                        {[
                            { label: 'Pending',     count: statusCounts.pending,    color: '#94a3b8' },
                            { label: 'In Progress', count: statusCounts.inProgress, color: '#3b82f6' },
                            { label: 'Rescued',     count: statusCounts.rescued,    color: '#f59e0b' },
                            { label: 'Completed',   count: statusCounts.completed,  color: '#22c55e' },
                        ].map(s => (
                            <div key={s.label} className="px-4 py-2 rounded-pill d-flex align-items-center gap-2"
                                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.color}44` }}>
                                <span className="fw-bold" style={{ color: s.color, fontSize: '1.1rem' }}>{s.count}</span>
                                <span className="small text-white opacity-75">{s.label}</span>
                            </div>
                        ))}
                        <div className="ms-auto d-flex align-items-center gap-2 small text-white opacity-40">
                            <RefreshCw size={12} />
                            {lastUpdated ? `Live · ${lastUpdated.toLocaleTimeString()}` : 'Syncing...'}
                        </div>
                    </div>

                    {loading ? <div className="text-center py-5"><Spinner color="info" /></div> : (
                        <Card style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <CardBody className="p-4">
                                <Table responsive borderless className="text-white align-middle">
                                    <thead className="small fw-bold text-uppercase opacity-50">
                                        <tr>
                                            <th>Protocol Type</th>
                                            <th>Victim Details</th>
                                            <th>Deployment Area</th>
                                            <th>Personnel Status</th>
                                            <th className="text-end">Command</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {missions.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-5 text-muted">No active rescue operations in sector.</td></tr>
                                        ) : missions.map((m, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td className="py-4 fw-bold">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <Shield size={18} className="text-info" />
                                                        {m.helpType} SIGNAL
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column gap-1">
                                                        <div className="d-flex align-items-center gap-1 small text-white fw-bold">
                                                            <User size={12} className="text-muted" />
                                                            {m.victimId?.name || "Unknown Victim"}
                                                        </div>
                                                        {m.victimId?.contact && (
                                                            <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                                                                <Phone size={12} />
                                                                {m.victimId.contact}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="small">
                                                    <div className="d-flex align-items-center gap-1">
                                                        <MapPin size={14} className="opacity-50 text-danger" />
                                                        <span>{m.location?.address || m.victimId?.location || 'Sector Lock Active'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge color={getStatusBadgeColor(m.status)} pill className="px-3 py-2">
                                                        {m.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">
                                                    {m.status === 'Rescued' ? (
                                                        <Button outline size="sm" color="success" className="rounded-pill px-3 border-0 fw-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }} onClick={() => completeMission(m._id)}>
                                                            <CheckCircle size={14} className="me-1" /> RESOLVE
                                                        </Button>
                                                    ) : m.status === 'Completed' ? (
                                                        <Badge color="success" pill className="px-3 py-2 border-0 fw-bold" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>MISSION ARCHIVED</Badge>
                                                    ) : m.status === 'Pending' ? (
                                                        <Button disabled size="sm" color="warning" className="rounded-pill px-3 border-0 fw-bold opacity-75" style={{ cursor: 'not-allowed' }}>
                                                            Awaiting Volunteer Deploy
                                                        </Button>
                                                    ) : (
                                                        <Button disabled size="sm" color="primary" className="rounded-pill px-3 border-0 fw-bold opacity-75" style={{ cursor: 'not-allowed' }}>
                                                            Field Rescue In Progress
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    )}
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default RescueOperation;
