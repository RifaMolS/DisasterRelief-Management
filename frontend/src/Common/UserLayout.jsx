import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Bell, User, LogOut } from 'lucide-react';
import { Badge } from 'reactstrap';


import axios from 'axios';


const UserLayout = ({ children }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const auth = JSON.parse(localStorage.getItem('user')) || null;

    const fetchUnread = async () => {
        if (!auth?.id) return;
        try {
            const res = await axios.get(`http://localhost:5000/notification/user/${auth.id}`);
            const unread = res.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error("Signal count sync failed");
        }
    };

    React.useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, [auth?.id]);

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff' }}>
            <header className="bg-white px-4 px-lg-5 shadow-sm border-bottom fixed-top w-100 d-flex align-items-center justify-content-between" style={{ zIndex: 1000, height: '85px' }}>
                <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
                    <div style={{ backgroundColor: '#22c55e', padding: '8px', borderRadius: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={26} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.5px', color: '#1e293b' }}>RESQ<span style={{ color: '#22c55e' }}>AI</span></span>
                </Link>

                <nav className="d-none d-lg-flex justify-content-center align-items-center gap-4 flex-grow-1 mx-4">
                    <Link to="/" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#22c55e' }}>Home</Link>
                    <a href="/#about" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>About</a>
                    {auth && auth.role === 'User' && (
                        <>
                            <a href="/#disaster-reporting" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Disaster Reporting</a>
                            <a href="/#request-emergency" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Request emergency</a>
                            <a href="/#view-disaster-updates" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>View Disaster updates</a>
                        </>
                    )}
                    <a href="/#footer" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Contact</a>
                </nav>

                <div className="d-flex align-items-center gap-4">
                    <Link to="/notifications" style={{ position: 'relative', cursor: 'pointer', textDecoration: 'none' }}>
                        <Bell size={22} color="#1e293b" />
                        {unreadCount > 0 && (
                            <Badge color="danger" pill style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '0.6rem' }}>
                                {unreadCount}
                            </Badge>
                        )}
                    </Link>

                    <div className="position-relative">
                        <div onClick={toggleDropdown} className="d-flex align-items-center gap-2">
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `rgba(34, 197, 94, 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid #22c55e` }}>
                                <User size={20} color="#22c55e" />
                            </div>
                        </div>
                        {dropdownOpen && (
                            <div className="position-absolute shadow-lg bg-white" style={{ top: '50px', right: 0, borderRadius: '12px', minWidth: '200px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                <div onClick={() => window.location.href='/profile'} className="px-3 py-3" style={{ fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <User size={16} /> Profile
                                </div>
                                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)' }}></div>
                                <div onClick={handleLogout} className="px-3 py-3 text-danger fw-bold" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <LogOut size={16} /> Terminate Session
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main style={{ paddingTop: '120px', paddingBottom: '60px' }}>
                {children}
            </main>
        </div>
    );
};

export default UserLayout;
