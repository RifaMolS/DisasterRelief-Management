import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table, Badge, Button, Spinner } from 'reactstrap';
import axios from 'axios';
import { Shield, Mail, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManageAuthorities = () => {
    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAuthorities = async () => {
        try {
            const res = await axios.get('http://localhost:5000/auth/ngos');
            setAuthorities(res.data);
        } catch (err) {
            console.error("Error fetching authorities:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthorities();
    }, []);

    const handleApprove = async (id) => {
        try {
            await axios.put(`http://localhost:5000/auth/approve/${id}`);
            toast.success("Authority approved successfully");
            fetchAuthorities();
        } catch (err) {
            toast.error("Failed to approve authority");
        }
    };

    return (
        <AdminLayout title="Strategic Authorities" subtitle="Review and authorize NGO/Organizational protocols.">
            {loading ? (
                <div className="text-center py-5">
                    <Spinner color="success" />
                    <p className="mt-3 text-muted">Authenticating authority nodes...</p>
                </div>
            ) : (
                <Table responsive borderless className="align-middle text-white mb-0">
                    <thead className="small fw-bold text-uppercase opacity-75" style={{ color: '#94a3b8' }}>
                        <tr>
                            <th className="ps-0 pb-3">Organization</th>
                            <th className="pb-3">Comm Link</th>
                            <th className="pb-3 text-center">Protocol Status</th>
                            <th className="pb-3 text-end">Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        {authorities.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-5 text-muted small">No authority entities registered.</td>
                            </tr>
                        ) : authorities.map((a) => (
                            <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="py-4 ps-0">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                            <Shield size={18} color="#a78bfa" />
                                        </div>
                                        <div>
                                            <div className="fw-bold fs-6">{a.name}</div>
                                            <div className="small text-muted"><MapPin size={12} /> {a.location || 'Unknown'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="small d-flex flex-column gap-1">
                                        <div className="d-flex align-items-center gap-2"><Mail size={14} className="opacity-50" /> {a.email}</div>
                                        <div className="text-muted d-flex align-items-center gap-2 small">Direct: {a.contact || 'N/A'}</div>
                                    </div>
                                </td>
                                <td className="text-center">
                                    {a.isApproved ? (
                                        <Badge pill style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }} className="px-3 py-2 border-0 small d-inline-flex align-items-center gap-1">
                                            <CheckCircle size={14} /> VERIFIED
                                        </Badge>
                                    ) : (
                                        <Badge pill style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }} className="px-3 py-2 border-0 small d-inline-flex align-items-center gap-1">
                                            <XCircle size={14} /> UNAUTHORIZED
                                        </Badge>
                                    )}
                                </td>
                                <td className="text-end">
                                    {!a.isApproved && (
                                        <Button 
                                            size="sm" 
                                            className="rounded-pill px-4 border-0 fw-bold" 
                                            style={{ backgroundColor: '#22c55e', color: '#fff' }}
                                            onClick={() => handleApprove(a._id)}
                                        >
                                            VERIFY NODE
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </AdminLayout>
    );
};

export default ManageAuthorities;
