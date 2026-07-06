import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Spinner, Button, Input, Badge, Label } from 'reactstrap';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';

const AuthorityCommunication = () => {
    const [messages, setMessages] = useState([]);
    const [msgLoading, setMsgLoading] = useState(true);
    const [nodes, setNodes] = useState({ admins: [], volunteers: [], ngos: [] });
    const [newMessage, setNewMessage] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState(null); // null = Global Mesh
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const scrollRef = useRef(null);

    const fetchMessages = useCallback(async () => {
        try {
            const params = selectedRecipient ? { sender: user.id, recipient: selectedRecipient._id } : {};
            const res = await axios.get('http://localhost:5000/message', { params });
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to sync mesh messages.");
        } finally {
            setMsgLoading(false);
        }
    }, [selectedRecipient, user.id]);

    const fetchNodes = useCallback(async () => {
        try {
            // Fetch Admins, Tasks (to get assigned volunteers), and NGOs
            const [adminsRes, tasksRes, ngosRes] = await Promise.all([
                axios.get('http://localhost:5000/auth/admins'),
                axios.get('http://localhost:5000/task'),
                axios.get('http://localhost:5000/auth/ngos')
            ]);

            const admins = adminsRes.data;
            
            // Map assigned volunteers
            const activeVolunteers = Array.from(new Set(
                tasksRes.data
                    .filter(t => t.volunteerId)
                    .map(t => JSON.stringify(t.volunteerId))
            )).map(s => JSON.parse(s));

            // Filter approved NGOs
            const approvedNGOs = ngosRes.data.filter(n => n.isApproved);

            setNodes({ admins, volunteers: activeVolunteers, ngos: approvedNGOs });
        } catch (err) {
            console.error("Node synchronization failed.");
        }
    }, [user.id]);

    useEffect(() => {
        fetchMessages();
        fetchNodes();
        const interval = setInterval(() => {
            fetchMessages();
            fetchNodes();
        }, 3000); // Polling for updates
        return () => clearInterval(interval);
    }, [fetchMessages, fetchNodes]); // Functional dependencies correctly tracked now

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await axios.post('http://localhost:5000/message', {
                sender: user.id,
                senderName: user.name,
                senderRole: user.role,
                content: newMessage,
                recipient: selectedRecipient?._id || null
            });
            setMessages([...messages, res.data]);
            setNewMessage('');
        } catch (err) {
            console.error("Transmission breakdown.");
        }
    };

    const clearMesh = async () => {
        if (!window.confirm("Purge all mesh communications?")) return;
        try {
            await axios.delete('http://localhost:5000/message/clear');
            setMessages([]);
        } catch (err) {
            console.error("Failed to clear mesh.");
        }
    };

    const getThemeColor = () => {
        switch (user.role) {
            case 'Admin': return '#22c55e';
            case 'Volunteer': return '#f59e0b';
            case 'NGO': return '#0ea5e9';
            default: return '#22c55e';
        }
    };

    return (
        <DashboardLayout role={user.role} title="Tactical Chat Bridge" subtitle="Direct secure communication between NGO HQ, Admin, and Field Volunteers." themeColor={getThemeColor()} withGlassCard={false}>
            <div className="d-flex shadow-lg overflow-hidden" style={{ borderRadius: '32px', height: 'calc(100vh - 250px)', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {/* Left Sidebar - Active Nodes */}
                <div style={{ width: '320px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.2)' }} className="d-none d-md-flex flex-column">
                    <div className="p-4 border-bottom border-white border-opacity-10">
                        <h6 className="fw-bold text-white mb-0 text-uppercase small" style={{ letterSpacing: '1px', opacity: 0.9 }}>Field Network Nodes</h6>
                    </div>
                    <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2">
                        {/* Global Mesh Option */}
                        <div 
                            onClick={() => setSelectedRecipient(null)}
                            className="p-3 rounded-4 d-flex align-items-center gap-3 cursor-pointer mb-2" 
                            style={{ 
                                background: !selectedRecipient ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.02)', 
                                border: !selectedRecipient ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div className="rounded-circle bg-success shadow-sm" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.2)' }}></div>
                            <div>
                                <div className="fw-bold text-white small">Global Mesh Channel</div>
                                <div className="small opacity-50" style={{ fontSize: '0.65rem' }}>Broadcast to all active units (Public)</div>
                            </div>
                        </div>

                        {/* Always show one "Global HQ" representing Admins generally or list all */}
                        <Label className="small text-uppercase fw-bold mt-2 mb-2 px-2" style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.5px' }}>Command Center (Admins)</Label>
                        {nodes.admins.filter(a => a._id !== user.id).map(admin => (
                            <div 
                                key={admin._id} 
                                onClick={() => setSelectedRecipient(admin)}
                                className="p-3 rounded-4 d-flex align-items-center gap-3" 
                                style={{ 
                                    background: selectedRecipient?._id === admin._id ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)', 
                                    border: selectedRecipient?._id === admin._id ? '1px solid #22c55e' : '1px solid rgba(34, 197, 94, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div className="rounded-circle bg-success" style={{ width: '10px', height: '10px', boxShadow: '0 0 10px #22c55e' }}></div>
                                <div>
                                    <div className="fw-bold text-white small">{admin.name}</div>
                                    <div className="small opacity-50" style={{ fontSize: '0.65rem' }}>Global Admin • HQ</div>
                                </div>
                            </div>
                        ))}

                        {/* Show Active Volunteers */}
                        <Label className="small text-uppercase fw-bold mt-4 mb-2 px-2" style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.5px' }}>Field Units (Assigned)</Label>
                        {nodes.volunteers.filter(v => v._id !== user.id).length === 0 ? (
                            <div className="px-2 small opacity-30 text-white italic">Scanning for active field units...</div>
                        ) : nodes.volunteers.filter(v => v._id !== user.id).map(v => (
                            <div 
                                key={v._id} 
                                onClick={() => setSelectedRecipient(v)}
                                className="p-3 rounded-4 d-flex align-items-center gap-3" 
                                style={{ 
                                    background: selectedRecipient?._id === v._id ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)', 
                                    border: selectedRecipient?._id === v._id ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div className="rounded-circle bg-warning" style={{ width: '10px', height: '10px', boxShadow: '0 0 10px #f59e0b' }}></div>
                                <div>
                                    <div className="fw-bold text-white small">{v.name}</div>
                                    <div className="small opacity-50" style={{ fontSize: '0.65rem' }}>Volunteer • Unit {v._id.substring(18)}</div>
                                </div>
                            </div>
                        ))}

                        {/* Show Approved NGOs */}
                        <Label className="small text-uppercase fw-bold mt-4 mb-2 px-2" style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.5px' }}>Strategic Partners (NGO)</Label>
                        {nodes.ngos.filter(n => n._id !== user.id).length === 0 ? (
                            <div className="px-2 small opacity-30 text-white italic">No active NGOs in mesh...</div>
                        ) : nodes.ngos.filter(n => n._id !== user.id).map(n => (
                            <div 
                                key={n._id} 
                                onClick={() => setSelectedRecipient(n)}
                                className="p-3 rounded-4 d-flex align-items-center gap-3" 
                                style={{ 
                                    background: selectedRecipient?._id === n._id ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.05)', 
                                    border: selectedRecipient?._id === n._id ? '1px solid #0ea5e9' : '1px solid rgba(14, 165, 233, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div className="rounded-circle bg-info" style={{ width: '10px', height: '10px', boxShadow: '0 0 10px #0ea5e9' }}></div>
                                <div>
                                    <div className="fw-bold text-white small">{n.name}</div>
                                    <div className="small opacity-50" style={{ fontSize: '0.65rem' }}>NGO • Resource Hub</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-grow-1 d-flex flex-column" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
                    {/* Chat Header */}
                    <div className="px-4 py-3 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10" style={{ minHeight: '70px' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 rounded-3" style={{ background: `${getThemeColor()}22` }}>
                                <MessageSquare size={20} color={getThemeColor()} />
                            </div>
                            <div>
                                <h6 className="fw-bold text-white mb-0">{selectedRecipient ? `Direct Link: ${selectedRecipient.name}` : 'Disaster Response Network'}</h6>
                                <div className="small text-success" style={{ fontSize: '0.65rem' }}>
                                    ● {selectedRecipient ? `SECURE CHANNEL • ${selectedRecipient.role?.toUpperCase() || 'UNIT'}` : `OPERATIONAL • ${messages.length} SIGNALS LOGGED`}
                                </div>
                            </div>
                        </div>
                        {user.role === 'Admin' && (
                            <Button color="link" className="text-danger p-0" title="Purge Channel" onClick={clearMesh}>
                                <Trash2 size={20} />
                            </Button>
                        )}
                    </div>

                    {/* Messages Window */}
                    <div 
                        className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-4" 
                        style={{ scrollbarWidth: 'thin' }}
                        ref={scrollRef}
                    >
                        {msgLoading ? (
                            <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-20">
                                <Spinner color="info" />
                                <span className="mt-3 small">Synchronizing mesh history...</span>
                            </div>
                        ) : (
                            <>
                                {messages.length === 0 ? (
                                    <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-10 text-center">
                                        <MessageSquare size={80} className="mb-3" />
                                        <h4>{selectedRecipient ? `Private Channel with ${selectedRecipient.name}` : 'Secure Bridge Established'}</h4>
                                        <p>{selectedRecipient ? 'Encrypted point-to-point communication ready.' : 'Field communications are ready for transmission.'}</p>
                                    </div>
                                ) : (
                                    messages.map((m, i) => (
                                        <div key={i} className={`d-flex flex-column ${m.sender === user.id ? 'align-items-end' : 'align-items-start'}`}>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                {! (m.sender === user.id) && (
                                                     <Badge color={m.senderRole === 'Admin' ? 'danger' : m.senderRole === 'NGO' ? 'primary' : 'warning'} className="px-2" style={{ fontSize: '0.6rem' }}>{m.senderRole}</Badge>
                                                )}
                                                <span className="small fw-bold text-white opacity-40" style={{ fontSize: '0.65rem' }}>{m.senderName}</span>
                                                {m.sender === user.id && (
                                                     <Badge color={m.senderRole === 'Admin' ? 'danger' : m.senderRole === 'NGO' ? 'primary' : 'warning'} className="px-2" style={{ fontSize: '0.6rem' }}>{m.senderRole}</Badge>
                                                )}
                                            </div>
                                            <div 
                                                className="p-3 shadow-sm" 
                                                style={{ 
                                                    borderRadius: m.sender === user.id ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                    background: m.sender === user.id ? getThemeColor() : 'rgba(255,255,255,0.06)',
                                                    maxWidth: '75%',
                                                    border: m.sender === user.id ? 'none' : '1px solid rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                <p className="m-0 text-white" style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.5' }}>{m.content}</p>
                                            </div>
                                            <span className="opacity-25 text-white mt-2" style={{ fontSize: '0.6rem' }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-top border-white border-opacity-10 bg-black bg-opacity-20">
                        <form onSubmit={handleSendMessage}>
                            <div className="position-relative d-flex align-items-center gap-3">
                                <Input 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={selectedRecipient ? `Message ${selectedRecipient.name}...` : "Type your message to the network..."}
                                    className="rounded-pill border-0 py-3 px-4 text-white shadow-none"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '0.95rem' }}
                                    autoComplete="off"
                                />
                                <Button 
                                    type="submit"
                                    outline
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '52px', height: '52px', borderColor: getThemeColor(), color: getThemeColor() }}
                                >
                                    <Send size={20} />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AuthorityCommunication;
