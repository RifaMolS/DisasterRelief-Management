import React, { useState, useEffect } from 'react';
import Sidebar from '../Common/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  LifeBuoy, 
  MapPin, 
  History, 
  Send,
  Plus,
  ShieldAlert,
  ChevronRight,
  Loader2,
  Zap
} from 'lucide-react';
import { 
  Container, Row, Col, Card, CardBody, 
  Form, FormGroup, Label, Input, Button, 
  Nav, NavItem, NavLink, Badge, Spinner 
} from 'reactstrap';
import axios from 'axios';
import CustomCursor from '../Common/CustomCursor';
import NearbyLocator from './NearbyLocator';
import { toast, Toaster } from 'react-hot-toast';

const UserDashboard = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [disasters, setDisasters] = useState([]);
    const [requests, setRequests] = useState([]);
    const [prevRequests, setPrevRequests] = useState([]); // For tracking state changes
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('report');
    const scrollRef = React.useRef(null);

    const [disasterFormData, setDisasterFormData] = useState({
        type: 'Flood',
        description: '',
        severity: 'Medium',
        address: '',
        location: { coordinates: [0, 0] }
    });
    const [disasterErrors, setDisasterErrors] = useState({});

    const [requestFormData, setRequestFormData] = useState({
        disasterId: '',
        helpType: 'Rescue',
        description: ''
    });
    const [requestErrors, setRequestErrors] = useState({});

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 3000); // Polling for updates (requests + messages)
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        // Dynamic Alert System: check for request status updates
        if (prevRequests.length > 0) {
            requests.forEach(currentReq => {
                const prevReq = prevRequests.find(r => r._id === currentReq._id);
                if (prevReq && prevReq.status !== currentReq.status) {
                    toast.success(`UPDATE: Your SOS for ${currentReq.helpType} is now ${currentReq.status}!`, {
                        position: 'top-right',
                        style: {
                            borderRadius: '10px',
                            background: '#1e293b',
                            color: '#fff',
                        }
                    });
                }
            });
        }
        setPrevRequests(requests);
    }, [requests]);

    const fetchData = async () => {
        try {
            const queryParams = user && user.id ? `?userId=${user.id}&role=${user.role}` : '';
            const [dRes, rRes, mRes] = await Promise.all([
                axios.get(`http://localhost:5000/disaster${queryParams}`),
                axios.get('http://localhost:5000/request'),
                axios.get('http://localhost:5000/message') // Global Mesh / Direct messages
            ]);
            setDisasters(dRes.data || []);
            setRequests((rRes.data || []).filter(r => r.victimId?._id === user.id || r.victimId === user.id));
            
            // Filter messages for Global Mesh OR Direct to the user
            const relevantMessages = (mRes.data || []).filter(
                m => !m.recipient || m.recipient === user.id || m.sender === user.id
            );
            setMessages(relevantMessages);
        } catch (err) {
            console.error("Error fetching user data", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await axios.post('http://localhost:5000/message', {
                sender: user.id,
                senderName: user.name,
                senderRole: user.role,
                content: newMessage,
                recipient: null // Global broadcast
            });
            setNewMessage('');
            fetchData();
        } catch (err) {
            toast.error("Transmission breakdown.");
        }
    };

    const handleReportDisaster = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!disasterFormData.description.trim()) errors.description = 'Description is required';
        if (!disasterFormData.address.trim()) errors.address = 'Location address is required';
        
        if (Object.keys(errors).length > 0) {
            setDisasterErrors(errors);
            return;
        }
        setDisasterErrors({});
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/disaster', { ...disasterFormData, reportedBy: user.id });
            toast.success("REPORT SUCCESSFUL: Crisis protocol initiated.");
            setDisasterFormData({ type: 'Flood', description: '', severity: 'Medium', address: '', location: { coordinates: [0, 0] } });
            fetchData();
        } catch (err) {
            toast.error("PROTOCOL FAILURE: Unable to transmit signal.");
        } finally {
            setLoading(false);
        }
    };

    const handleHelpRequest = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!requestFormData.description.trim()) errors.description = 'Description is required';
        if (!requestFormData.disasterId) errors.disasterId = 'Please select a related disaster for context';

        if (Object.keys(errors).length > 0) {
            setRequestErrors(errors);
            return;
        }
        setRequestErrors({});
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/request', { ...requestFormData, victimId: user.id });
            toast.success("SOS SIGNAL DEPLOYED: Personnel incoming.");
            setRequestFormData({ disasterId: '', helpType: 'Rescue', description: '' });
            fetchData();
        } catch (err) {
            toast.error("SOS FAILURE: Signal intercepted.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', backgroundColor: '#0f172a', minHeight: '100vh', cursor: 'none', color: '#f1f5f9' }}>
            <CustomCursor />
            <Sidebar role="User" theme="dark" accentColor="#22c55e" />
            <main style={{ marginLeft: '280px', padding: '3.5rem', flexGrow: 1 }}>
                <header className="mb-5 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>Signal Console <span style={{ color: '#22c55e' }}>// {user.name}</span></h1>
                        <p className="text-muted">Transmit secure emergency identifiers to the global mesh.</p>
                    </div>
                </header>

                <Row className="g-4">
                    <Col lg={8}>
                        <div className="glass-card p-5 h-100" style={{ borderRadius: '32px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <Nav pills className="mb-5 gap-3 border-bottom border-secondary pb-4">
                                    <NavItem>
                                        <NavLink 
                                            active={activeTab === 'report'} 
                                            onClick={() => setActiveTab('report')}
                                            className="px-4 py-2 rounded-pill fw-bold border-0"
                                            style={{ 
                                                backgroundColor: activeTab === 'report' ? '#22c55e' : 'transparent', 
                                                color: activeTab === 'report' ? '#fff' : '#94a3b8',
                                                transition: 'all 0.3s',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Report New Detection
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink 
                                            active={activeTab === 'requests'} 
                                            onClick={() => setActiveTab('requests')}
                                            className="px-4 py-2 rounded-pill fw-bold border-0"
                                            style={{ 
                                                backgroundColor: activeTab === 'requests' ? '#ef4444' : 'transparent', 
                                                color: activeTab === 'requests' ? '#fff' : '#94a3b8',
                                                transition: 'all 0.3s',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Transmit SOS
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink 
                                            active={activeTab === 'nearby'} 
                                            onClick={() => setActiveTab('nearby')}
                                            className="px-4 py-2 rounded-pill fw-bold border-0"
                                            style={{ 
                                                backgroundColor: activeTab === 'nearby' ? '#3b82f6' : 'transparent', 
                                                color: activeTab === 'nearby' ? '#fff' : '#94a3b8',
                                                transition: 'all 0.3s',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Local Hubs
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink 
                                            active={activeTab === 'comms'} 
                                            onClick={() => setActiveTab('comms')}
                                            className="px-4 py-2 rounded-pill fw-bold border-0"
                                            style={{ 
                                                backgroundColor: activeTab === 'comms' ? '#8b5cf6' : 'transparent', 
                                                color: activeTab === 'comms' ? '#fff' : '#94a3b8',
                                                transition: 'all 0.3s',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Comm Mesh
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                <AnimatePresence mode="wait">
                                    {activeTab === 'report' ? (
                                        <motion.div key="report" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                            <Form onSubmit={handleReportDisaster}>
                                                <Row className="mb-4 g-3">
                                                    <Col md={6}>
                                                        <FormGroup>
                                                            <Label className="small fw-bold text-uppercase opacity-75 text-white mb-3">Detection Type</Label>
                                                            <Input 
                                                                type="select" 
                                                                value={disasterFormData.type} 
                                                                onChange={(e) => setDisasterFormData({...disasterFormData, type: e.target.value})} 
                                                                style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '12px' }}
                                                            >
                                                                <option>Flood</option><option>Fire</option><option>Earthquake</option><option>Landslide</option>
                                                            </Input>
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup>
                                                            <Label className="small fw-bold text-uppercase opacity-75 text-white mb-3">Priority Level</Label>
                                                            <Input 
                                                                type="select" 
                                                                value={disasterFormData.severity} 
                                                                onChange={(e) => setDisasterFormData({...disasterFormData, severity: e.target.value})} 
                                                                style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '12px' }}
                                                            >
                                                                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                                                            </Input>
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                                <FormGroup className="mb-4">
                                                    <Label className="small fw-bold text-uppercase opacity-75 text-white mb-3">Base Coordinate (Address)</Label>
                                                    <div className="position-relative">
                                                        <MapPin size={18} className="position-absolute" style={{ left: '15px', top: '14px', color: '#22c55e' }} />
                                                        <Input 
                                                            type="text" 
                                                            placeholder="Sector 4 Headquarters" 
                                                            value={disasterFormData.address} 
                                                            onChange={(e) => setDisasterFormData({...disasterFormData, address: e.target.value})} 
                                                            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '12px 12px 12px 50px' }} 
                                                            required 
                                                        />
                                                    </div>
                                                </FormGroup>
                                                <FormGroup className="mb-5">
                                                    <Label className="small fw-bold text-uppercase opacity-75 text-white mb-3">Detection Log Description</Label>
                                                    <Input 
                                                        type="textarea" 
                                                        rows={4} 
                                                        placeholder="Note specific threats..." 
                                                        value={disasterFormData.description} 
                                                        onChange={(e) => setDisasterFormData({...disasterFormData, description: e.target.value})} 
                                                        style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '20px', padding: '15px' }} 
                                                        required 
                                                    />
                                                </FormGroup>
                                                <Button 
                                                    color="success" 
                                                    className="rounded-pill px-5 py-3 fw-bold border-0 shadow-sm" 
                                                    disabled={loading}
                                                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', fontWeight: 800 }}
                                                >
                                                    {loading ? <Spinner size="sm" /> : <><Send size={18} className="me-2" /> TRANSMIT DETECTION</>}
                                                </Button>
                                            </Form>
                                        </motion.div>
                                    ) : activeTab === 'requests' ? (
                                        <motion.div key="requests" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                            <Form onSubmit={handleHelpRequest}>
                                                <FormGroup className="mb-4">
                                                    <Label className="small fw-bold text-uppercase opacity-75 text-white mb-3">Primary Protocol Association</Label>
                                                    <Input 
                                                        type="select" 
                                                        value={requestFormData.disasterId} 
                                                        onChange={(e) => setRequestFormData({...requestFormData, disasterId: e.target.value})} 
                                                        style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '12px' }}
                                                    >
                                                        <option value="">Select Incident Protocol (Optional)</option>
                                                        {disasters.map(d => <option key={d._id} value={d._id}>{d.type} - {d.address}</option>)}
                                                    </Input>
                                                </FormGroup>
                                                <FormGroup className="mb-4">
                                                    <Label className="small fw-bold text-uppercase opacity-75 text-white mb-3">SOS Assistance Axis</Label>
                                                    <Input 
                                                        type="select" 
                                                        value={requestFormData.helpType} 
                                                        onChange={(e) => setRequestFormData({...requestFormData, helpType: e.target.value})} 
                                                        style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', padding: '12px' }}
                                                    >
                                                        <option>Rescue</option><option>Medical Emergency</option><option>Asset Supply</option>
                                                    </Input>
                                                </FormGroup>
                                                <FormGroup className="mb-5">
                                                    <Label className="small fw-bold text-uppercase opacity-75 text-white mb-3">Distress Explanation</Label>
                                                    <Input 
                                                        type="textarea" 
                                                        rows={4} 
                                                        placeholder="Explain situation for triage..." 
                                                        value={requestFormData.description} 
                                                        onChange={(e) => setRequestFormData({...requestFormData, description: e.target.value})} 
                                                        style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '20px', padding: '15px' }} 
                                                        required 
                                                    />
                                                </FormGroup>
                                                <Button 
                                                    color="danger" 
                                                    className="rounded-pill px-5 py-3 fw-bold border-0 shadow-sm" 
                                                    disabled={loading}
                                                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', fontWeight: 800 }}
                                                >
                                                    {loading ? <Spinner size="sm" /> : <><ShieldAlert size={18} className="me-2" /> EXECUTE SOS SIGNAL</>}
                                                </Button>
                                            </Form>
                                        </motion.div>
                                    ) : activeTab === 'nearby' ? (
                                        <motion.div key="nearby" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                            <h4 className="fw-bold text-white mb-4">Nearby Relief Shelters</h4>
                                            <div className="mb-5">
                                                <NearbyLocator type="shelter" />
                                            </div>
                                            <h4 className="fw-bold text-white mb-4">Emergency Hospitals</h4>
                                            <div>
                                                <NearbyLocator type="hospital" />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="comms" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="d-flex flex-column" style={{ height: '500px' }}>
                                            <div 
                                                className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3 mb-4 rounded-4" 
                                                style={{ background: 'rgba(15, 23, 42, 0.4)', scrollbarWidth: 'thin', border: '1px solid rgba(255,255,255,0.05)' }}
                                                ref={scrollRef}
                                            >
                                                {messages.length === 0 ? (
                                                    <div className="h-100 d-flex flex-column align-items-center justify-content-center opacity-50 text-center">
                                                        <Loader2 size={40} className="mb-3 spin" />
                                                        <p>Listening to Global Mesh... No transmissions yet.</p>
                                                    </div>
                                                ) : (
                                                    messages.map((m, i) => (
                                                        <div key={i} className={`d-flex flex-column ${m.sender === user.id ? 'align-items-end' : 'align-items-start'}`}>
                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                <span className="small fw-bold text-white opacity-50" style={{ fontSize: '0.65rem' }}>{m.senderName}</span>
                                                                <Badge color={m.senderRole === 'Admin' ? 'danger' : m.senderRole === 'NGO' ? 'primary' : m.senderRole === 'Volunteer' ? 'warning' : 'success'} className="px-2" style={{ fontSize: '0.6rem' }}>{m.senderRole}</Badge>
                                                            </div>
                                                            <div 
                                                                className="p-3 shadow-sm" 
                                                                style={{ 
                                                                    borderRadius: m.sender === user.id ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                                    background: m.sender === user.id ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                                                                    maxWidth: '80%',
                                                                    border: m.sender === user.id ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                                                }}
                                                            >
                                                                <p className="m-0 text-white" style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{m.content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <form onSubmit={handleSendMessage}>
                                                <div className="position-relative d-flex align-items-center gap-3">
                                                    <Input 
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder="Transmit to Global Mesh..."
                                                        className="rounded-pill border-0 py-3 px-4 text-white shadow-none"
                                                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '0.95rem' }}
                                                        autoComplete="off"
                                                    />
                                                    <Button 
                                                        type="submit"
                                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                                        style={{ width: '52px', height: '52px', border: 'none', background: '#8b5cf6', color: '#fff' }}
                                                    >
                                                        <Send size={20} />
                                                    </Button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                        </div>
                    </Col>

                    <Col lg={4}>
                         <div className="d-flex flex-column gap-4">
                             <div className="glass-card p-4" style={{ borderRadius: '28px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 style={{ fontWeight: 800, margin: 0, color: '#fff' }}>Signal Tracks</h4>
                                        <History size={18} color="#22c55e" />
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {requests.length === 0 ? (
                                            <p className="text-center py-4 text-muted small">No active signals in session.</p>
                                        ) : requests.slice(0, 3).map((r, i) => (
                                            <div key={i} className="p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="fw-bold small" style={{ color: '#f1f5f9' }}>{r.helpType} AXIS</span>
                                                    <Badge pill color={r.status === 'Pending' ? 'warning' : 'success'} className="px-2 border-0">{r.status}</Badge>
                                                </div>
                                                <p className="small text-muted mb-0">{r.description.slice(0, 50)}...</p>
                                            </div>
                                        ))}
                                    </div>
                                    <Button outline block style={{ borderRadius: '16px', borderColor: '#22c55e', color: '#22c55e', fontWeight: 700, marginTop: '20px' }}>VIEW SIGNAL LOG</Button>
                             </div>

                             <div className="glass-card p-4" style={{ borderRadius: '28px', background: 'linear-gradient(145deg, rgba(34,197,94,0.1), rgba(15,23,42,0.8))', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <h4 className="mb-3 d-flex align-items-center gap-2" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                                        <Zap size={18} fill="#22c55e" color="#22c55e" /> SAFETY PROTOCOL
                                    </h4>
                                    <ul className="list-unstyled d-flex flex-column gap-3 small text-muted">
                                        <li className="d-flex gap-2 text-glow"><ChevronRight size={14} color="#22c55e" className="flex-shrink-0 mt-1" /> Maintain terminal visibility at all times.</li>
                                        <li className="d-flex gap-2 text-glow"><ChevronRight size={14} color="#22c55e" className="flex-shrink-0 mt-1" /> Stay at current coordinates unless redirected by HQ.</li>
                                        <li className="d-flex gap-2 text-glow"><ChevronRight size={14} color="#22c55e" className="flex-shrink-0 mt-1" /> Do not initiate movement during SOS.</li>
                                    </ul>
                             </div>
                         </div>
                    </Col>
                </Row>
            </main>
            <Toaster />
        </div>
    );
};

export default UserDashboard;
