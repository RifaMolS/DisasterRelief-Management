import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardBody, Button, Spinner, Row, Col } from 'reactstrap';
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, ShieldAlert } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import UserLayout from './UserLayout';

const BACKEND_URL = "http://localhost:5000";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = JSON.parse(localStorage.getItem('user')) || {};

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/notification/user/${auth.id}`);
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 3000);
            return () => clearInterval(interval);
        }
    }, [auth.id]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${BACKEND_URL}/notification/read/${id}`);
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark as read");
        }
    };

    const clearAll = async () => {
        try {
            await axios.delete(`${BACKEND_URL}/notification/clear/${auth.id}`);
            setNotifications([]);
        } catch (err) {
            console.error("Failed to clear notifications");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Alert': return <AlertTriangle className="text-danger" size={20} />;
            case 'Help': return <Bell className="text-warning" size={20} />;
            default: return <Info className="text-info" size={20} />;
        }
    };

    const getThemeColor = () => {
        switch (auth.role) {
            case 'Admin': return '#22c55e';
            case 'Volunteer': return '#f59e0b';
            case 'NGO': return '#0ea5e9';
            default: return '#22c55e';
        }
    };

    const NotificationContent = () => (
        <div className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <h2 className="fw-bold m-0 d-flex align-items-center gap-3 text-white">
                    <ShieldAlert size={32} color={getThemeColor()} /> Communication Mesh
                </h2>
                {notifications.length > 0 && (
                    <Button color="link" className="text-danger fw-bold text-decoration-none" onClick={clearAll}>
                        <Trash2 size={16} /> CLEAR GRID
                    </Button>
                )}
            </div>

            {loading ? <div className="text-center p-5"><Spinner color="success" /></div> : (
                notifications.length > 0 ? (
                    <Row className="g-3">
                        {notifications.map((n) => (
                            <Col md={12} key={n._id}>
                                <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.05)', borderLeft: n.isRead ? '4px solid rgba(255,255,255,0.1)' : `4px solid ${getThemeColor()}` }}>
                                    <CardBody className="p-4 d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-4">
                                            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="text-white">
                                                <h6 className="fw-bold mb-1">{n.title}</h6>
                                                <p className="opacity-75 small m-0">{n.message}</p>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(n.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <Button color="success" outline size="sm" className="rounded-pill px-3" onClick={() => markAsRead(n._id)}>
                                                <CheckCircle size={14} className="me-1" /> READ
                                            </Button>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-5">
                        <Bell size={64} className="text-muted opacity-20 mb-4" />
                        <p className="text-muted">No tactical signals detected at this node.</p>
                    </div>
                )
            )}
        </div>
    );

    if (auth.role === 'User') {
        return (
            <UserLayout>
                <div className="container"><NotificationContent /></div>
            </UserLayout>
        );
    }

    return (
        <DashboardLayout role={auth.role} themeColor={getThemeColor()} title="Alert Mesh" subtitle="Synchronized tactical notifications across your node.">
            <NotificationContent />
        </DashboardLayout>
    );
};

export default Notifications;
