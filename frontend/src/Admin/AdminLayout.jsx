import React, { useState } from 'react';
import Sidebar from '../Common/Sidebar';
import { Bell, User, LogOut } from 'lucide-react';
import { Badge } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminLayout = ({ children, title, subtitle, withGlassCard = true }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const auth = JSON.parse(localStorage.getItem('user')) || {};

    const toggleDropdown = () => setDropdownOpen((prevState) => !prevState);

    const fetchUnread = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/notification/user/${auth.id}`);
            const unread = res.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error("Signal count sync failed");
        }
    };

    React.useEffect(() => {
        if (auth.id) {
            fetchUnread();
            const interval = setInterval(fetchUnread, 5000);
            return () => clearInterval(interval);
        }
    }, [auth.id]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            backgroundImage: 'url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            position: 'relative'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 0 }}></div>
            
            <div style={{ zIndex: 1, position: 'relative', width: '100%', display: 'flex' }}>
                <Sidebar role="Admin" theme="dark" />
                
                <main style={{ marginLeft: '280px', flexGrow: 1, color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    {/* Admin Navbar */}
                    <div className="d-flex justify-content-between align-items-center w-100" style={{ 
                        padding: '1.5rem 3.5rem', 
                        background: 'rgba(15, 23, 42, 0.4)', 
                        backdropFilter: 'blur(10px)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ width: '40px' }}></div> {/* Spacer for balance */}
                        
                        <div className="d-flex align-items-center gap-4 ms-auto">
                            <Link to="/notifications" style={{ position: 'relative', cursor: 'pointer', textDecoration: 'none' }}>
                                <Bell size={22} color="#cbd5e1" />
                                {unreadCount > 0 && (
                                    <Badge color="danger" pill style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '0.6rem' }}>
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Link>

                            <div className="position-relative">
                                <div onClick={toggleDropdown} className="d-flex align-items-center gap-2">
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '50%', 
                                        backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid #22c55e',
                                        cursor: 'pointer'
                                    }}>
                                        <User size={20} color="#4ade80" />
                                    </div>
                                </div>
                                {dropdownOpen && (
                                    <div className="position-absolute shadow-lg" style={{ 
                                        top: '100%', 
                                        right: 0, 
                                        marginTop: '10px',
                                        background: 'rgba(15, 23, 42, 0.95)', 
                                        backdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        borderRadius: '12px', 
                                        minWidth: '200px', 
                                        overflow: 'hidden', 
                                        zIndex: 1050 
                                    }}>
                                        <div onClick={handleLogout} className="px-3 py-3 text-danger fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <LogOut size={16} /> Terminate Session
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '3.5rem' }}>
                        <header className="mb-5 d-flex justify-content-between align-items-center">
                            <div>
                                <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{title}</h1>
                                {subtitle && <p style={{ color: '#94a3b8' }}>{subtitle}</p>}
                            </div>
                        </header>
                        
                        {/* Page Content */}
                        {withGlassCard ? (
                            <div className="shadow-lg" style={{
                                borderRadius: '28px', 
                                background: 'rgba(15, 23, 42, 0.65)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '3rem',
                                minHeight: '500px'
                            }}>
                                {children}
                            </div>
                        ) : children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
