import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Package, 
  MapPin,
  Cpu,
  BarChart3,
  Zap,
  Radio,
  CloudLightning
} from 'lucide-react';
import { 
  Row, Col, Card, CardBody, 
  CardTitle, Table, Badge, Button, 
  Nav, NavItem, NavLink, Form, FormGroup, Input, Label
} from 'reactstrap';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import axios from 'axios';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const keralaDistricts = {
    "Alappuzha": ["Alappuzha", "Kuttanad", "Chengannur", "Ambalappuzha", "Cherthala", "Karthikappally", "Mavelikkara", "Harippad", "Kayamkulam", "Aroor", "Edathua"],
    "Ernakulam": ["Kochi", "Aluva", "Paravur", "Kothamangalam", "Muvattupuzha", "Kanayannur", "Kakkanad", "Angamaly", "Perumbavoor", "Tripunithura", "Vypin", "Kizhakkambalam", "Kalamassery", "Edappally"],
    "Idukki": ["Devikulam", "Peermade", "Udumbanchola", "Thodupuzha", "Idukki", "Munnar", "Kumily", "Adimali", "Kattappana", "Nedumkandam", "Vagamon"],
    "Kannur": ["Thalassery", "Taliparamba", "Kannur", "Iritty", "Payyanur", "Mattannur", "Kuthuparamba", "Dharmadom", "Azhikode", "Pappinisseri"],
    "Kasaragod": ["Kasaragod", "Hosdurg", "Vellarikundu", "Manjeshwaram", "Kanhangad", "Nileshwaram", "Uppala", "Cheruvathur"],
    "Kollam": ["Kollam", "Karunagappally", "Kunnathur", "Kottarakkara", "Pathanapuram", "Punalur", "Paravur", "Sasthamcotta", "Chathannoor", "Ochira"],
    "Kottayam": ["Kottayam", "Changanassery", "Vaikom", "Meenachil", "Kanjirappally", "Pala", "Ettumanoor", "Pampady", "Erattupetta", "Kumarakom"],
    "Kozhikode": ["Kozhikode", "Thamarassery", "Koyilandy", "Vatakara", "Beypore", "Feroke", "Ramanattukara", "Mukkom", "Kunnamangalam", "Balussery"],
    "Malappuram": ["Eranad", "Tirur", "Tirurangadi", "Ponnani", "Perinthalmanna", "Nilambur", "Kondotty", "Manjeri", "Kottakkal", "Malappuram", "Edappal", "Tanur", "Parappanangadi"],
    "Palakkad": ["Alathur", "Chittur", "Palakkad", "Pattambi", "Ottappalam", "Mannarkkad", "Shoranur", "Cherpulassery", "Vadakkencherry", "Kollengode"],
    "Pathanamthitta": ["Adoor", "Kozhencherry", "Mallappally", "Ranni", "Tiruvalla", "Pathanamthitta", "Pandalam", "Konni", "Aranmula"],
    "Thiruvananthapuram": ["Neyyattinkara", "Kattakkada", "Nedumangad", "Thiruvananthapuram", "Chirayinkeezhu", "Varkala", "Kazhakootam", "Kovalam", "Attingal", "Balaramapuram", "Parassala", "Vizhinjam"],
    "Thrissur": ["Thrissur", "Chalakudy", "Mukundapuram", "Kodungallur", "Talappilly", "Chavakkad", "Guruvayur", "Kunnamkulam", "Irinjalakuda", "Wadakkanchery", "Nattika"],
    "Wayanad": ["Mananthavady", "Sulthan Bathery", "Vythiri", "Kalpetta", "Meenangadi", "Panamaram", "Pulpally"]
};

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeAlerts: 0,
        pendingRequests: 0,
        totalResources: 0
    });
    const [disasters, setDisasters] = useState([]);
    
    const [broadcastData, setBroadcastData] = useState({ 
        title: '', 
        message: '', 
        district: '',
        place: '',
        roles: ['NGO', 'Volunteer'] 
    });

    const handleRoleToggle = (role) => {
        setBroadcastData(prev => ({
            ...prev,
            roles: prev.roles.includes(role) 
                ? prev.roles.filter(r => r !== role) 
                : [...prev.roles, role]
        }));
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastData.title || !broadcastData.message) {
            return toast.error("Title and message are required.");
        }
        if (broadcastData.roles.length === 0) {
            return toast.error("Select at least one target audience.");
        }
        const id = toast.loading("Broadcasting tactical signal...");
        try {
            let computedLocation = broadcastData.district;
            if (broadcastData.place) {
                computedLocation = `${broadcastData.place}, ${broadcastData.district}`;
            }

            const res = await axios.post('http://localhost:5000/disaster/broadcast', {
                title: broadcastData.title,
                message: broadcastData.message,
                targetRoles: broadcastData.roles,
                targetLocation: computedLocation
            });
            toast.success(res.data.message || "Broadcast successful. Personnel updated.", { id });
            setBroadcastData({ title: '', message: '', district: '', place: '', roles: ['NGO', 'Volunteer'] });
        } catch (err) {
            toast.error("Bridge failure. Signal mismatch.", { id });
        }
    };

    const handleSynchronize = async (id, type) => {
        const toastId = toast.loading(`Synchronizing ${type} signal with satellite mesh...`);
        try {
            await axios.put(`http://localhost:5000/disaster/sync/${id}`);
            toast.success(`${type} verified & volunteers notified. Signal anchored.`, { id: toastId });
        } catch (err) {
            toast.error("Synchronization failed. Check satellite link.", { id: toastId });
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:5000/analytics/global');
                setStats({
                    totalUsers: res.data.counts.users || 0,
                    activeAlerts: res.data.counts.disasters || 0,
                    pendingRequests: res.data.counts.requests || 0,
                    totalResources: res.data.counts.resources || 0,
                    disasterBreakdown: res.data.disasters || []
                });
                const dRes = await axios.get('http://localhost:5000/disaster');
                setDisasters(dRes.data.slice(0, 5));
            } catch (err) {
                console.error("Error fetching admin stats", err);
            }
        };
        fetchStats();
    }, []);

    const chartData = {
        labels: stats.disasterBreakdown?.length > 0 ? stats.disasterBreakdown.map(d => d._id) : ['Floods', 'Fire', 'Earthquake', 'Landslide'],
        datasets: [{
            label: 'Incidents Captured',
            data: stats.disasterBreakdown?.length > 0 ? stats.disasterBreakdown.map(d => d.count) : [stats.activeAlerts, stats.pendingRequests, 0, 0],
            backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#38bdf8', '#a855f7'],
            borderColor: 'transparent',
            borderRadius: 8
        }]
    };

    const cards = [
        { title: 'Personnel', value: stats.totalUsers ?? 0, icon: <Users color="#22c55e" />, color: 'rgba(34, 197, 94, 0.15)', change: '+5%' },
        { title: 'Global Alerts', value: stats.activeAlerts ?? 0, icon: <AlertTriangle color="#ef4444" />, color: 'rgba(239, 68, 68, 0.15)', change: '-2%' },
        { title: 'Signal Requests', value: stats.pendingRequests ?? 0, icon: <Activity color="#f59e0b" />, color: 'rgba(245, 158, 11, 0.15)', change: '+12%' },
        { title: 'Supply Units', value: stats.totalResources ?? 0, icon: <Package color="#38bdf8" />, color: 'rgba(56, 189, 248, 0.15)', change: '+10%' }
    ];

    return (
        <AdminLayout 
            title={<span>Command Center <span style={{ color: '#22c55e' }}>{'//'} Administrator</span></span>} 
            subtitle="Global synchronization of planetary relief assets."
            withGlassCard={false}
        >
            <Row className="g-4 mb-5">
                {cards.map((card, i) => (
                    <Col md={3} key={i}>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="border-0 shadow-lg" style={{ 
                                borderRadius: '24px', 
                                background: 'rgba(15, 23, 42, 0.65)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div style={{ padding: '14px', backgroundColor: card.color, borderRadius: '16px', display: 'flex' }}>{card.icon}</div>
                                        <Badge style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }} className="border-0 px-2 py-1" pill>{card.change}</Badge>
                                    </div>
                                    <CardTitle tag="h6" className="small fw-bold text-uppercase mb-1" style={{ color: '#94a3b8' }}>{card.title}</CardTitle>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>{card.value}</h2>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                <Col md={8}>
                    <Card className="border-0 shadow-lg mb-4" style={{ 
                        borderRadius: '28px', 
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardBody className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-5">
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: '12px' }}>
                                        <BarChart3 size={20} color="#4ade80" />
                                    </div>
                                    <h4 style={{ fontWeight: 800, margin: 0, color: '#fff' }}>Incident Analytics</h4>
                                </div>
                                <Nav pill className="gap-2">
                                    <NavItem><NavLink href="#" active className="rounded-pill px-3 bg-success border-0 small fw-bold text-white">Live</NavLink></NavItem>
                                    <NavItem><NavLink href="#" className="rounded-pill px-3 border-0 small fw-bold" style={{ color: '#94a3b8' }}>Archive</NavLink></NavItem>
                                </Nav>
                            </div>
                            <div style={{ height: '320px' }}>
                                <Bar 
                                    data={chartData} 
                                    options={{ 
                                    maintainAspectRatio: false, 
                                    scales: { 
                                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 } },
                                        x: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 10, weight: 700 } } } 
                                    },
                                    plugins: { legend: { display: false } }
                                    }} 
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-0 shadow-lg" style={{ 
                        borderRadius: '28px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardBody className="p-4">
                            <h4 style={{ fontWeight: 800, marginBottom: '2rem', color: '#fff' }}>Global Signal Feed</h4>
                             <Table responsive borderless className="align-middle text-dark bg-white rounded-4 overflow-hidden">
                                <thead className="small fw-bold text-uppercase opacity-75" style={{ color: '#94a3b8' }}>
                                    <tr>
                                        <th className="px-3 pb-3">Protocol</th>
                                        <th className="px-3 pb-3">Coordinates</th>
                                        <th className="px-3 pb-3">Severity</th>
                                        <th className="px-3 text-end pb-3">Control</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disasters.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-5 small" style={{ color: '#94a3b8' }}>No active signals on the mesh.</td></tr>
                                    ) : disasters.map((d, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td className="px-3 py-3 fw-bold text-dark">{d.type}</td>
                                            <td className="px-3 py-3 small" style={{ color: '#475569', fontWeight: '500' }}><MapPin size={12} className="me-1" /> {d.address}</td>
                                            <td className="px-3 py-3">
                                                <Badge pill color={d.severity === 'Critical' ? 'danger' : 'warning'} className="px-3 py-2 small border-0 text-white">{d.severity}</Badge>
                                            </td>
                                            <td className="px-3 text-end py-3">
                                                <Button 
                                                    outline 
                                                    size="sm" 
                                                    className="rounded-pill px-3 border-0 small fw-bold" 
                                                    style={{ color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)' }}
                                                    onClick={() => handleSynchronize(d._id, d.type)}
                                                >
                                                    Synchronize
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </Col>

                <Col md={4}>
                        <Card className="border-0 shadow-lg h-100" style={{ 
                            borderRadius: '28px', 
                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                        <CardBody className="p-4">
                                <div className="d-flex align-items-center gap-3 mb-5">
                                <div style={{ padding: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px' }}>
                                    <Cpu size={20} color="#38bdf8" />
                                </div>
                                <h4 style={{ fontWeight: 800, margin: 0, color: '#fff' }}>Network Pulse</h4>
                                </div>

                                <div className="d-flex flex-column gap-4">
                                    {['Red Cross Protocol', 'UN Relief Node', 'Medic Frontiers'].map((node, i) => (
                                        <div key={i} className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3">
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulse 2s infinite', boxShadow: '0 0 10px #22c55e' }}></div>
                                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0' }}>{node}</span>
                                            </div>
                                            <Badge pill style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }} className="small fw-bold py-2 px-3">LIVE</Badge>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                    <div className="p-4 rounded-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                        <h5 className="small fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: '#4ade80' }}>
                                            <Zap size={16} fill="#4ade80" /> AI PREDICTION
                                        </h5>
                                        <p className="small mb-0" style={{ color: '#cbd5e1' }}>Reroute NGO assets to Sector 4. Incident probability increased by 14%.</p>
                                    </div>
                                </div>
                                <style>{`
                                    @keyframes pulse {
                                        0% { transform: scale(1); opacity: 1; }
                                        50% { transform: scale(1.5); opacity: 0.5; }
                                        100% { transform: scale(1); opacity: 1; }
                                    }
                                `}</style>
                        </CardBody>
                        </Card>
                </Col>
            </Row>
            <Row className="g-4 mt-2">
                <Col md={12}>
                    <Card className="border-0 shadow-lg" style={{ 
                        borderRadius: '28px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardBody className="p-4">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px' }}>
                                    <CloudLightning size={20} color="#f87171" />
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 800, margin: 0, color: '#fff' }}>Emergency Weather Broadcast</h4>
                                    <p className="small mb-0 opacity-50 text-white">Push dynamic weather alerts and tactical instructions directly to personnel.</p>
                                </div>
                            </div>
                            
                            <Form onSubmit={handleBroadcast}>
                                <Row className="g-3">
                                    <Col md={12}>
                                        <Input 
                                            placeholder="Alert Title (e.g. SEVERE CYCLONE WARNING)" 
                                            value={broadcastData.title}
                                            onChange={e => setBroadcastData({...broadcastData, title: e.target.value})}
                                            className="bg-dark text-white border-secondary shadow-none mb-3"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <Input 
                                            type="textarea"
                                            rows="3"
                                            placeholder="Emergency instructions and weather details..." 
                                            value={broadcastData.message}
                                            onChange={e => setBroadcastData({...broadcastData, message: e.target.value})}
                                            className="bg-dark text-white border-secondary shadow-none mb-3"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Input 
                                            type="select"
                                            value={broadcastData.district}
                                            onChange={e => setBroadcastData({...broadcastData, district: e.target.value, place: ''})}
                                            className="bg-dark text-white border-secondary shadow-none mb-3"
                                        >
                                            <option value="">Target District (Global Broadcast if empty)</option>
                                            {Object.keys(keralaDistricts).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </Input>
                                    </Col>
                                    <Col md={6}>
                                        <Input 
                                            type="select"
                                            value={broadcastData.place}
                                            disabled={!broadcastData.district}
                                            onChange={e => setBroadcastData({...broadcastData, place: e.target.value})}
                                            className="bg-dark text-white border-secondary shadow-none mb-3"
                                        >
                                            <option value="">Target Place (Optional)</option>
                                            {broadcastData.district && keralaDistricts[broadcastData.district].map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </Input>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <div className="d-flex gap-3">
                                        <div className="small fw-bold text-white opacity-75 mt-2 me-2">TARGET GROUPS:</div>
                                        {['NGO', 'Volunteer', 'User'].map(role => (
                                            <Button 
                                                key={role}
                                                type="button"
                                                size="sm"
                                                onClick={() => handleRoleToggle(role)}
                                                style={{ 
                                                    backgroundColor: broadcastData.roles.includes(role) ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.05)', 
                                                    color: broadcastData.roles.includes(role) ? '#4ade80' : '#94a3b8',
                                                    border: `1px solid ${broadcastData.roles.includes(role) ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255,255,255,0.1)'}`
                                                }}
                                                className="rounded-pill px-3 fw-bold"
                                            >
                                                {role === 'User' ? 'Victims' : role}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button 
                                        type="submit"
                                        className="rounded-pill px-4 fw-bold border-0 shadow-sm d-flex align-items-center gap-2" 
                                        style={{ backgroundColor: '#f87171', color: '#fff' }}
                                    >
                                        <Radio size={16} /> TRANSMIT ALERT
                                    </Button>
                                </div>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
};

export default AdminDashboard;;
