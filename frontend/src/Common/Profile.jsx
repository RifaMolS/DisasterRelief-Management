import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import AdminLayout from '../Admin/AdminLayout';
import UserLayout from './UserLayout';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Shield, Edit3, Save, X, Activity } from 'lucide-react';
import { Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Spinner, Alert, Badge } from 'reactstrap';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [profileData, setProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        location: '',
        status: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/auth/profile/${user.id}`);
                setProfileData(res.data);
                setFormData({
                    name: res.data.name || '',
                    contact: res.data.contact || '',
                    location: res.data.location || '',
                    status: res.data.status || 'Available'
                });
            } catch (err) {
                console.error("Error fetching profile", err);
                toast.error("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };
        if (user.id) fetchProfile();
    }, [user.id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.contact.trim() || formData.contact.length < 10) errors.contact = 'Valid contact required';
        if (!formData.location.trim()) errors.location = 'Location is required';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});
        setSaving(true);
        try {
            const res = await axios.put(`http://localhost:5000/auth/profile/${user.id}`, formData);
            setProfileData(res.data.user);
            setEditMode(false);
            // Update local storage if name changed
            const updatedUser = { ...user, name: formData.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success("Profile updated successfully!");
        } catch (err) {
            toast.error("Update failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const Layout = user.role === 'Admin' ? AdminLayout : (user.role === 'User' ? UserLayout : DashboardLayout);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#0f172a' }}>
            <Spinner color="success" />
        </div>
    );

    return (
        <Layout 
            role={user.role} 
            title={editMode ? "Edit Profile" : "Profile Overview"} 
            subtitle="Manage your personal identity and operational status."
            themeColor={user.role === 'NGO' ? '#0ea5e9' : user.role === 'Volunteer' ? '#f59e0b' : '#22c55e'}
        >
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Row className="justify-content-center">
                    <Col lg={10}>
                        <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '28px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                            <div style={{ height: '120px', background: 'linear-gradient(90deg, #1e293b, #334155)', position: 'relative' }}>
                                <div className="position-absolute" style={{ bottom: '-50px', left: '50px' }}>
                                    <div style={{ 
                                        width: '100px', height: '100px', borderRadius: '30px', 
                                        backgroundColor: '#0f172a', border: '4px solid rgba(255,255,255,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <User size={50} color="#22c55e" />
                                    </div>
                                </div>
                                <div className="position-absolute" style={{ bottom: '20px', right: '40px' }}>
                                     {!editMode ? (
                                        <Button color="success" className="rounded-pill px-4 fw-bold border-0 shadow-sm" onClick={() => setEditMode(true)}>
                                            <Edit3 size={18} className="me-2" /> EDIT PROFILE
                                        </Button>
                                     ) : (
                                        <Button color="danger" className="rounded-pill px-4 fw-bold border-0 shadow-sm" onClick={() => setEditMode(false)}>
                                            <X size={18} className="me-2" /> CANCEL
                                        </Button>
                                     )}
                                </div>
                            </div>

                            <CardBody className="p-5 pt-5 mt-4">
                                <Row className="mt-4">
                                    <Col md={7}>
                                        <Form onSubmit={handleUpdate}>
                                            <Row>
                                                <Col md={12}>
                                                    <FormGroup className="mb-4">
                                                        <Label className="small fw-bold text-uppercase opacity-50 mb-2">Full Legal Name</Label>
                                                        {editMode ? (
                                                            <Input 
                                                                value={formData.name} 
                                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                                className={`rounded-4 border-0 py-3 px-4 text-white shadow-none ${fieldErrors.name ? 'is-invalid' : ''}`} 
                                                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                            />
                                                        ) : (
                                                            <h3 className="fw-bold text-white mb-0">{profileData?.name}</h3>
                                                        )}
                                                        {editMode && fieldErrors.name && <div className="text-danger small mt-1">{fieldErrors.name}</div>}
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <FormGroup className="mb-4">
                                                        <Label className="small fw-bold text-uppercase opacity-50 mb-2">Protocol Email</Label>
                                                        <div className="d-flex align-items-center gap-3 text-white opacity-75 py-2">
                                                            <Mail size={20} />
                                                            <span className="fs-5">{profileData?.email}</span>
                                                        </div>
                                                        <Alert color="info" className="mt-2 py-2 px-3 rounded-3 small border-0 opacity-75" style={{ backgroundColor: 'rgba(30, 64, 175, 0.2)', color: '#93c5fd' }}>
                                                            Email identifier is locked to system protocol.
                                                        </Alert>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <FormGroup className="mb-4">
                                                        <Label className="small fw-bold text-uppercase opacity-50 mb-2">Contact Signal (Phone)</Label>
                                                        {editMode ? (
                                                            <Input 
                                                                value={formData.contact} 
                                                                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                                                                placeholder="+1 234 567 890"
                                                                className={`rounded-4 border-0 py-3 px-4 text-white shadow-none ${fieldErrors.contact ? 'is-invalid' : ''}`} 
                                                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                            />
                                                        ) : (
                                                            <div className="d-flex align-items-center gap-3 text-white opacity-75 py-2">
                                                                <Phone size={20} />
                                                                <span className="fs-5">{profileData?.contact || 'No signal data found.'}</span>
                                                            </div>
                                                        )}
                                                        {editMode && fieldErrors.contact && <div className="text-danger small mt-1">{fieldErrors.contact}</div>}
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <FormGroup className="mb-4">
                                                        <Label className="small fw-bold text-uppercase opacity-50 mb-2">Geographical Axis (Location)</Label>
                                                        {editMode ? (
                                                            <Input 
                                                                value={formData.location} 
                                                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                                                placeholder="Sector 7, Grid B"
                                                                className={`rounded-4 border-0 py-3 px-4 text-white shadow-none ${fieldErrors.location ? 'is-invalid' : ''}`} 
                                                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                            />
                                                        ) : (
                                                            <div className="d-flex align-items-center gap-3 text-white opacity-75 py-2">
                                                                <MapPin size={20} />
                                                                <span className="fs-5">{profileData?.location || 'Coordinate mesh incomplete.'}</span>
                                                            </div>
                                                        )}
                                                        {editMode && fieldErrors.location && <div className="text-danger small mt-1">{fieldErrors.location}</div>}
                                                    </FormGroup>
                                                </Col>
                                                {editMode && (
                                                    <Col md={12} className="mt-4">
                                                        <Button color="success" block className="rounded-pill py-3 fw-bold border-0 shadow-lg" disabled={saving}>
                                                            {saving ? <Spinner size="sm" /> : <><Save size={18} className="me-2" /> SYNCHRONIZE DATA</>}
                                                        </Button>
                                                    </Col>
                                                )}
                                            </Row>
                                        </Form>
                                    </Col>
                                    
                                    <Col md={1} className="d-none d-md-block">
                                        <div style={{ width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)', margin: '0 auto' }}></div>
                                    </Col>

                                    <Col md={4}>
                                        <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                                            <h5 className="small fw-bold text-success mb-3 d-flex align-items-center gap-2">
                                                <Shield size={16} /> SYSTEM CLEARANCE
                                            </h5>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-white opacity-75">Assigned Role</span>
                                                <Badge color="success" pill className="px-3 py-2">{profileData?.role}</Badge>
                                            </div>
                                            {profileData?.role !== 'User' && (
                                                <div className="mt-3 d-flex justify-content-between align-items-center">
                                                    <span className="text-white opacity-75">Verification</span>
                                                    <Badge color={profileData?.isApproved ? "info" : "warning"} pill className="px-3 py-2">
                                                        {profileData?.isApproved ? "AUTHENTICATED" : "PENDING"}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {(profileData?.role === 'Volunteer' || profileData?.role === 'NGO') && (
                                            <div className="p-4 rounded-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                                <h5 className="small fw-bold text-warning mb-3 d-flex align-items-center gap-2">
                                                    <Activity size={16} /> OPERATIONAL STATUS
                                                </h5>
                                                {editMode ? (
                                                    <Input 
                                                        type="select" 
                                                        value={formData.status} 
                                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                                        className="rounded-pill border-0 text-white" 
                                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                                    >
                                                        <option className="text-dark">Available</option>
                                                        <option className="text-dark">Busy</option>
                                                        <option className="text-dark">Inactive</option>
                                                    </Input>
                                                ) : (
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div style={{ 
                                                            width: '12px', height: '12px', borderRadius: '50%', 
                                                            backgroundColor: profileData?.status === 'Available' ? '#22c55e' : profileData?.status === 'Busy' ? '#ef4444' : '#64748b',
                                                            boxShadow: `0 0 10px ${profileData?.status === 'Available' ? '#22c55e' : profileData?.status === 'Busy' ? '#ef4444' : 'transparent'}`
                                                        }}></div>
                                                        <span className="text-white fw-bold fs-5">{profileData?.status}</span>
                                                    </div>
                                                )}
                                                <p className="small opacity-50 mt-3 mb-0">Status changes affect mission assignment algorithms.</p>
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </Layout>
    );
};

export default Profile;
