import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table, Badge, Button, Spinner } from 'reactstrap';
import axios from 'axios';
import { UserCheck, Mail, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManageVolunteers = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVolunteers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/auth/volunteers');
            setVolunteers(res.data);
        } catch (err) {
            console.error("Error fetching volunteers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const handleApprove = async (id) => {
        try {
            await axios.put(`http://localhost:5000/auth/approve/${id}`);
            toast.success("Volunteer approved successfully");
            fetchVolunteers();
        } catch (err) {
            toast.error("Failed to approve volunteer");
        }
    };

    return (
        <AdminLayout title="Volunteer Force" subtitle="Authorize and moderate rapid response field agents.">
            {loading ? (
                <div className="text-center py-5">
                    <Spinner color="success" />
                    <p className="mt-3 text-muted">Scanning for volunteer signals...</p>
                </div>
            ) : (
                <Table responsive borderless className="align-middle text-white mb-0">
                    <thead className="small fw-bold text-uppercase opacity-75" style={{ color: '#94a3b8' }}>
                        <tr>
                            <th className="ps-0 pb-3">Agent</th>
                            <th className="pb-3">Credentials</th>
                            <th className="pb-3 text-center">Authorization</th>
                            <th className="pb-3 text-end">Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        {volunteers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-5 text-muted small">No volunteers found in the registry.</td>
                            </tr>
                        ) : volunteers.map((v) => (
                            <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="py-4 ps-0">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ padding: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                            <UserCheck size={18} color="#38bdf8" />
                                        </div>
                                        <div>
                                            <div className="fw-bold fs-6">{v.name}</div>
                                            <div className="small text-muted"><MapPin size={12} /> {v.location || 'Unknown'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="small d-flex flex-column gap-1">
                                        <div className="d-flex align-items-center gap-2"><Mail size={14} className="opacity-50" /> {v.email}</div>
                                        <div className="text-muted d-flex align-items-center gap-2 small">Contact: {v.contact || 'N/A'}</div>
                                        <div className="text-muted small">Age: {v.age || 'N/A'} | Gender: {v.gender || 'N/A'}</div>
                                        <div className="text-muted small">Skills: {v.skills?.join(', ') || 'Not provided'}</div>
                                        <div className="text-muted small">Emergency: {v.emergencyContact || 'N/A'}</div>
                                    </div>
                                </td>
                                <td className="text-center">
                                    {v.isApproved ? (
                                        <Badge pill color="success" className="px-3 py-2 border-0 small d-inline-flex align-items-center gap-1">
                                            <CheckCircle size={14} /> AUTHORIZED
                                        </Badge>
                                    ) : (
                                        <Badge pill color="warning" className="px-3 py-2 border-0 small d-inline-flex align-items-center gap-1">
                                            <XCircle size={14} /> PENDING
                                        </Badge>
                                    )}
                                </td>
                                <td className="text-end">
                                    {!v.isApproved && (
                                        <Button 
                                            size="sm" 
                                            className="rounded-pill px-4 border-0 fw-bold" 
                                            style={{ backgroundColor: '#22c55e', color: '#fff' }}
                                            onClick={() => handleApprove(v._id)}
                                        >
                                            GRANT ACCESS
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

export default ManageVolunteers;
