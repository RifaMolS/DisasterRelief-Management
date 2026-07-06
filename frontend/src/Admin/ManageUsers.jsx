import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table, Badge, Spinner } from 'reactstrap';
import axios from 'axios';
import { User, Mail, MapPin, Phone } from 'lucide-react';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('http://localhost:5000/auth/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    return (
        <AdminLayout title="System Users" subtitle="View and manage all registered citizens on the platform.">
            {loading ? (
                <div className="text-center py-5">
                    <Spinner color="success" />
                    <p className="mt-3 text-muted">Synchronizing user database...</p>
                </div>
            ) : (
                <Table responsive borderless className="align-middle text-white mb-0">
                    <thead className="small fw-bold text-uppercase opacity-75" style={{ color: '#94a3b8' }}>
                        <tr>
                            <th className="ps-0 pb-3">Identification</th>
                            <th className="pb-3">Contact Payload</th>
                            <th className="pb-3">Location Node</th>
                            <th className="pb-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-5 text-muted small">No registered users found.</td>
                            </tr>
                        ) : users.map((u) => (
                            <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="py-4 ps-0">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                            <User size={18} color="#4ade80" />
                                        </div>
                                        <div>
                                            <div className="fw-bold fs-6">{u.name}</div>
                                            <div className="small text-muted">ID: {u._id.substring(0, 10)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex flex-column gap-1">
                                        <div className="small d-flex align-items-center gap-2"><Mail size={14} className="text-muted" /> {u.email}</div>
                                        <div className="small d-flex align-items-center gap-2"><Phone size={14} className="text-muted" /> {u.contact || 'N/A'}</div>
                                    </div>
                                </td>
                                <td>
                                    <div className="small d-flex align-items-center gap-2">
                                        <MapPin size={14} className="text-muted" /> {u.location || 'Unknown'}
                                    </div>
                                </td>
                                <td className="text-center">
                                    <Badge pill style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }} className="px-3 py-2 border-0 small">ACTIVE</Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </AdminLayout>
    );
};

export default ManageUsers;

