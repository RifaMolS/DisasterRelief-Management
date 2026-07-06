import React, { useState } from 'react';
import { 
  Container, Row, Col, Button, Card, CardImg, CardTitle, 
  CardText, Badge, Form, FormGroup, Label, Input, Spinner,
  Modal, ModalHeader, ModalBody
} from 'reactstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Heart, AlertTriangle, ShieldCheck, 
  ArrowRight, HeartHandshake, Globe, Zap, Stethoscope, Droplets, Utensils,
  Bell, User, LogOut, Tent, Hospital, Layers, Mail, Phone, MapPin,
  History, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomCursor from './CustomCursor';
import WeatherWidget from '../User/WeatherWidget';
import NearbyLocator from '../User/NearbyLocator';
import LiveDisasterMap from '../Volunteer/LiveDisasterMap';
import UserAIPrediction from '../User/UserAIPrediction';

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reportingData, setReportingData] = useState({
    type: 'Flood',
    severity: 'Medium',
    description: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navigationTarget, setNavigationTarget] = useState(null);
  const auth = JSON.parse(localStorage.getItem('user')) || null;

  // History states for incidents, help, and resources received
  const [historyData, setHistoryData] = useState({ disasters: [], requests: [], tasks: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const fetchUserHistory = async () => {
    if (!auth?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/request/history/${auth.id}`);
      if (res.data) {
        setHistoryData(res.data);
      }
    } catch (err) {
      console.error("Failed to load user history", err);
    }
  };

  React.useEffect(() => {
    fetchUnread();
    fetchUserHistory();
    const interval = setInterval(() => {
      fetchUnread();
      fetchUserHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, [auth?.id]);

  const toggle = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!auth) return toast.error("Please login to report incidents.");
    
    setIsSubmitting(true);
    const id = toast.loading("Capturing high-fidelity coordinates...");

    if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.", { id });
        setIsSubmitting(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                
                // 1. Capture the Real Address from Google
                let finalAddress = "GPS Coordinates Verified";
                try {
                    const geoRes = await axios.get(`http://localhost:5000/api/config/geocode?lat=${latitude}&lon=${longitude}`);
                    if (geoRes.data.results && geoRes.data.results.length > 0) {
                        finalAddress = geoRes.data.results[0].formatted_address;
                    }
                } catch (err) {
                    console.error("Geocoding failed, using coordinates fallback.");
                    finalAddress = `Coord: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                }

                // 2. VISUALLY update the box for the examiner
                setReportingData(prev => ({ ...prev, address: finalAddress }));

                // 3. FORCE the final data sent to DB to use the detected address
                const disasterPayload = {
                    type: reportingData.type,
                    severity: reportingData.severity,
                    description: reportingData.description,
                    address: finalAddress, // THIS FORCES THE SYNC
                    location: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    reportedBy: auth.id
                };
                
                await axios.post(`http://localhost:5000/disaster`, disasterPayload);
                
                toast.success(`VERIFIED: Signal anchored to ${finalAddress.substring(0, 30)}...`, { id });
                setReportingData({ type: 'Flood', severity: 'Medium', description: '', address: '' });
            } catch (err) {
                toast.error("Signal synchronization failed.", { id });
            } finally {
                setIsSubmitting(false);
            }
        },
        (error) => {
            toast.error("Location access denied. Manual coordinate entry required.", { id });
            setIsSubmitting(false);
        },
        { enableHighAccuracy: true }
    );
  };

  const handleEmergencyRequest = async (type, desc) => {
    if (!auth) return toast.error("Please login to request emergency assistance.");
    const loadingToast = toast.loading(`Broadcasting ${type} signal...`);
    try {
      await axios.post(`http://localhost:5000/request`, {
        victimId: auth.id,
        helpType: type,
        description: desc,
        urgency: 'Critical' // Ensures alerts show correct priority instead of undefined
      });
      toast.dismiss(loadingToast);
      toast.success(`${type} request synchronized with response team!`);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to broadcast signal. Secondary frequencies active.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  const causes = [
    {
      title: "Immediate Flood Rescue",
      desc: "Providing life-saving evacuations and immediate aquatic survival kits to displaced families in high-risk zones.",
      img: "/assets/hero.png",
      progress: 92,
      raised: 140000,
      icon: <Droplets size={16} />
    },
    {
      title: "Mobile Medical Units",
      desc: "Deploying rapid-response healthcare centers with essential supplies and anti-viral medication for outbreak prevention.",
      img: "/assets/medical.png",
      progress: 78,
      raised: 85200,
      icon: <Stethoscope size={16} />
    },
    {
      title: "Crisis Food Security",
      desc: "Coordinating with supply chain assets to deliver nutrient-dense meals to inaccessible disaster sectors globally.",
      img: "/assets/mission.png",
      progress: 85,
      raised: 112000,
      icon: <Utensils size={16} />
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', cursor: 'none' }}>
      <CustomCursor />

      {/* Reconfigured Header: Bulletproof Glassmorphism */}
      <header className="px-4 px-lg-5 shadow-sm fixed-top w-100 d-flex align-items-center justify-content-between" style={{ zIndex: 1000, height: '85px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {/* Left: Brand / Logo */}
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none" style={{ flexShrink: 0 }}>
            <div style={{ backgroundColor: '#22c55e', padding: '8px', borderRadius: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.5px', color: '#fff' }}>RESQ<span style={{ color: '#22c55e' }}>AI</span></span>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="d-none d-lg-flex justify-content-center align-items-center gap-4 flex-grow-1 mx-4">
            <a href="/" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#22c55e' }}>Home</a>
            <a href="#about" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1' }}>About</a>
            {auth && auth.role === 'User' && (
                <>
                  {['Live Map', 'Weather Alerts', 'AI Prediction', 'Nearby Shelters', 'Disaster Reporting', 'Request emergency', 'History'].map((item) => (
                    <a key={item} href={`#${item.replace(/\s+/g, '-').toLowerCase()}`} className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1', transition: 'color 0.2s' }}>{item}</a>
                  ))}
                </>
            )}
            {!auth && (
                <>
                  {['Causes', 'Portals', 'Safety'].map((item) => (
                    <a key={item} href={`#${item.toLowerCase()}`} className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1', transition: 'color 0.2s' }}>{item}</a>
                  ))}
                </>
            )}
            <a href="#footer" className="text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1' }}>Contact</a>
          </nav>

          {/* Right: Action Buttons */}
          <div className="d-none d-lg-flex align-items-center justify-content-end gap-3" style={{ flexShrink: 0 }}>
              {auth ? (
                  <div className="d-flex align-items-center gap-4">
                      {auth.role !== 'User' && (
                           <Link to={`/${auth.role.toLowerCase()}-dashboard`} className="text-decoration-none fw-bold" style={{ color: '#22c55e', fontSize: '0.85rem' }}>GO TO DASHBOARD</Link>
                      )}

                      <Link to="/notifications" style={{ position: 'relative', cursor: 'none' }}>
                          <Bell size={22} color="#fff" />
                          {unreadCount > 0 && (
                            <Badge color="danger" pill style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '0.6rem' }}>
                              {unreadCount}
                            </Badge>
                          )}
                      </Link>

                      <div className="position-relative">
                          <div onClick={toggleDropdown} style={{ cursor: 'none', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `rgba(34, 197, 94, 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid #22c55e` }}>
                              <User size={20} color="#22c55e" />
                          </div>
                          {dropdownOpen && (
                              <div className="position-absolute shadow-lg" style={{ top: '50px', right: 0, borderRadius: '12px', minWidth: '200px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                  <div onClick={() => window.location.href='/profile'} className="px-3 py-3 text-white" style={{ cursor: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <User size={16} /> Profile
                                  </div>
                                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                  <div onClick={handleLogout} className="px-3 py-3 text-danger fw-bold" style={{ cursor: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <LogOut size={16} /> Terminate Session
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              ) : (
                  <>
                      <Button outline className="rounded-pill px-4 py-2 fw-bold" tag={Link} to="/login" style={{ fontSize: '0.85rem', border: '2px solid rgba(255,255,255,0.2)', color: '#fff' }}>LOGIN</Button>
                      <Button className="rounded-pill px-4 py-2 border-0 fw-bold shadow-sm text-white" tag={Link} to="/register" style={{ fontSize: '0.85rem', backgroundColor: '#22c55e' }}>INITIALIZE SIGNAL</Button>
                  </>
              )}
          </div>

          {/* Right: Mobile Toggler */}
          <div className="d-lg-none" style={{ flexShrink: 0 }}>
             <button onClick={toggle} className="border-0 bg-transparent shadow-none px-2 py-1" style={{ color: '#fff' }}>
               {isOpen ? <ShieldCheck size={28} /> : 
                 <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
               }
             </button>
          </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
         <div className="fixed-top bg-dark shadow-lg w-100 d-lg-none" style={{ top: '85px', zIndex: 999, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="d-flex flex-column p-4 gap-3">
              <a href="/" onClick={() => setIsOpen(false)} className="text-decoration-none pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: '#22c55e' }}>Home</a>
              <a href="#about" onClick={() => setIsOpen(false)} className="text-decoration-none pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: '#cbd5e1' }}>About</a>
              {auth && auth.role === 'User' && (
                  <>
                    {['AI Prediction', 'Disaster Reporting', 'Request emergency', 'History'].map((item) => (
                      <a key={item} href={`#${item.replace(/\s+/g, '-').toLowerCase()}`} onClick={() => setIsOpen(false)} className="text-decoration-none pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: '#cbd5e1' }}>
                        {item}
                      </a>
                    ))}
                  </>
              )}
              <a href="#footer" onClick={() => setIsOpen(false)} className="text-decoration-none pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: '#cbd5e1' }}>Contact</a>
              
              <div className="d-flex flex-column gap-3 mt-2">
                 {auth ? (
                     <>
                       {auth.role !== 'User' && (
                          <Button className="rounded-pill px-4 py-3 border-0 fw-bold shadow-sm text-white w-100" tag={Link} to={`/${auth.role.toLowerCase()}-dashboard`} style={{ fontSize: '0.9rem', backgroundColor: '#22c55e' }}>GO TO DASHBOARD</Button>
                       )}

                       <Button onClick={handleLogout} outline color="danger" className="rounded-pill px-4 py-3 fw-bold w-100" style={{ fontSize: '0.9rem', borderWidth: '2px' }}>TERMINATE SESSION</Button>
                     </>
                 ) : (
                     <>
                         <Button outline className="rounded-pill px-4 py-3 fw-bold w-100" tag={Link} to="/login" style={{ fontSize: '0.9rem', border: '2px solid rgba(255,255,255,0.2)', color: '#fff' }}>LOGIN</Button>
                         <Button className="rounded-pill px-4 py-3 border-0 fw-bold shadow-sm text-white w-100" tag={Link} to="/register" style={{ fontSize: '0.9rem', backgroundColor: '#22c55e' }}>INITIALIZE SIGNAL</Button>
                     </>
                 )}
              </div>
            </div>
         </div>
      )}

      {/* Hero Section */}
      <section style={{ 
        position: 'relative', height: '100vh', overflow: 'hidden', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        textAlign: 'center', color: '#fff' 
      }}>
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundImage: 'url("/assets/hero.png")', backgroundSize: 'cover', 
          backgroundPosition: 'center', filter: 'brightness(0.6)' 
        }} />
        <Container className="position-relative" style={{ zIndex: 5 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.25)', padding: '8px 20px', borderRadius: '30px', border: '1px solid rgba(34, 197, 94, 0.4)', marginBottom: '30px' }}>
                <Heart size={14} fill="#22c55e" color="#22c55e" />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#22c55e' }}>PRIORITY PROTOCOL V.24 LIVE</span>
             </div>
             <h1 style={{ fontSize: '5.5rem', fontWeight: 900, lineHeight: 1, marginBottom: '30px', letterSpacing: '-2px' }}>
                Help The Global Mesh <br />
                <span style={{ color: '#22c55e' }}>Secure A Better Future.</span>
             </h1>
             <p style={{ maxWidth: '800px', margin: '0 auto 45px', fontSize: '1.35rem', opacity: 0.9, lineHeight: 1.6 }}>
                Synchronizing victims, volunteers, and relief organizations via a high-fidelity AI environment for immediate life-saving coordination.
             </p>
          </motion.div>
        </Container>
      </section>

      {/* Feature Cards Section */}
      <section className="py-5" style={{ backgroundColor: '#0f172a' }}>
        <Container>
          <Row className="g-4" style={{ marginTop: '-120px', position: 'relative', zIndex: 10 }}>
            {[
              { icon: <HeartHandshake size={36} color="#22c55e" />, title: 'Humanitarian Node', desc: 'Become a certified field volunteer in less than 24 hours.' },
              { icon: <Zap size={36} color="#f59e0b" />, title: 'Real-time Triage', desc: 'AI-driven prioritization of life-critical signals across data mesh.' },
              { icon: <Globe size={36} color="#38bdf8" />, title: 'Unified Network', desc: 'Secure synchronization between local NGOs and global assets.' },
              { icon: <AlertTriangle size={36} color="#ef4444" />, title: 'Critical Response', desc: 'Direct SOS mapping for immediate dispatch of emergency personnel.' }
            ].map((f, i) => (
              <Col lg={3} md={6} key={i}>
                <motion.div whileHover={{ y: -15 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Card className="border-0 shadow-lg text-center p-4 py-5 h-100 feature-card" style={{ borderRadius: '30px', background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}>
                    <div className="mb-4 d-flex justify-content-center">
                       <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '24px' }}>{f.icon}</div>
                    </div>
                    <CardTitle tag="h5" style={{ fontWeight: 800, marginBottom: '15px', color: '#ffffff' }}>{f.title}</CardTitle>
                    <CardText className="px-3" style={{ lineHeight: 1.6, fontSize: '0.95rem', color: '#cbd5e1' }}>{f.desc}</CardText>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* About Us Section */}
      <section className="py-5 my-5" id="about" style={{ backgroundColor: '#0f172a' }}>
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <div style={{ position: 'relative' }}>
                <img src="/assets/mission.png" alt="Rescue" className="img-fluid rounded-5 shadow-2" style={{ transform: 'rotate(-2deg)', filter: 'brightness(0.9) contrast(1.1)' }} />
                <div style={{ 
                  position: 'absolute', top: '-30px', left: '-30px', 
                  backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '30px', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: '30px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  zIndex: 2, border: '1px solid rgba(255,255,255,0.1)'
                }}>
                   <h3 className="m-0 text-success" style={{ fontWeight: 900, fontSize: '2.5rem' }}>2.4k</h3>
                   <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Volunteers</span>
                </div>
              </div>
            </Col>
            <Col lg={6} className="ps-lg-5">
               <Badge color="success-subtle" className="text-success px-4 py-2 mb-4 fs-6 rounded-pill" style={{ border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.1)' }}>OUR MISSION AXIS</Badge>
               <h2 style={{ fontSize: '4.2rem', fontWeight: 900, lineHeight: 1.05, marginBottom: '30px', letterSpacing: '-1.5px', color: '#fff' }}>Every Life Secured, <br /> Every Signal Heard.</h2>
               <p style={{ color: '#cbd5e1', marginBottom: '3rem', fontSize: '1.25rem', lineHeight: 1.8 }}>
                  Our objective is to streamline the relief coordination mesh through an ethical AI approach. Every second counts in disaster situations, and RESQAI ensures that help reaches the target destination without jurisdictional delays or communication blackouts.
               </p>
               <Button color="success" className="rounded-pill px-5 py-3 border-0 fw-bold shadow-sm" style={{ fontSize: '1rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>LEARN PROTOCOL <ArrowRight size={20} className="ms-2" /></Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Portals Section */}
      <section className="py-5" id="portals" style={{ backgroundColor: '#0f172a' }}>
          <Container className="py-5">
             <div className="text-center mb-5">
                <Badge color="info" pill className="mb-3 px-4 py-2" style={{ fontWeight: 800 }}>ROLE-BASED ACCESS</Badge>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff' }}>Centralized Operation Portals</h2>
                <p className="fs-5" style={{ color: '#94a3b8' }}>Secure access nodes for verified humanitarian personnel.</p>
             </div>
             <Row className="g-4 justify-content-center">
                 {[
                     { role: "Authority", desc: "For government and state officials managing regional distress signals.", icon: <ShieldCheck size={40} color="#3b82f6" /> },
                     { role: "NGO", desc: "For verified non-profits managing supply chains and rescue ops.", icon: <Layers size={40} color="#22c55e" /> },
                     { role: "Volunteer", desc: "For on-the-ground volunteers executing active relief tasks.", icon: <HeartHandshake size={40} color="#f59e0b" /> }
                 ].map((portal, index) => (
                    <Col lg={4} md={6} key={index}>
                        <div className="p-5 text-center h-100" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div className="mb-4 d-inline-flex justify-content-center align-items-center" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                               {portal.icon}
                            </div>
                            <h4 className="fw-bold text-white mb-3">{portal.role} Portal</h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{portal.desc}</p>
                            <Button outline color="light" className="mt-3 rounded-pill px-4 fw-bold" tag={Link} to="/login" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>ACCESS NODE</Button>
                        </div>
                    </Col>
                 ))}
             </Row>
          </Container>
      </section>

      {/* Safety Protocol Section */}
      <section className="py-5 bg-dark" id="safety" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Container className="py-5">
              <Row className="align-items-center">
                  <Col lg={5}>
                      <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>Safety <span className="text-warning">First</span></h2>
                      <p className="mt-4 fs-5" style={{ color: '#cbd5e1' }}>Adhere to our global standard operating procedures to ensure maximum safety during active disaster events.</p>
                      <Button
                        color="warning"
                        className="text-dark fw-bold px-4 py-3 rounded-pill mt-4"
                        tag="a"
                        href="/RESQAI_Safety_Protocol.pdf"
                        download="RESQAI_Safety_Protocol.pdf"
                      >
                        DOWNLOAD SAFETY GUIDE
                      </Button>
                  </Col>
                  <Col lg={7}>
                      <div className="d-flex flex-column gap-3 mt-4 mt-lg-0">
                          {[
                              "Do not enter active flood zones without a certified extraction team.",
                              "Secure your data mesh credentials; never share your personnel access key.",
                              "Broadcast SOS signals only for immediate, life-threatening scenarios.",
                              "Follow perimeter guidelines established by local NGO hubs."
                          ].map((rule, idx) => (
                             <div key={idx} className="d-flex align-items-center gap-3 p-3 rounded-4" style={{ background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.2)' }}>
                                 <AlertTriangle size={24} className="text-warning" />
                                 <span className="text-white fw-bold">{rule}</span>
                             </div>
                          ))}
                      </div>
                  </Col>
              </Row>
          </Container>
      </section>

      {/* Popular Causes Redesigned with Unique Content */}
      <section className="py-5" id="causes" style={{ backgroundColor: '#0f172a', borderRadius: '100px 100px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Container className="py-5">
             <div className="text-center mb-5">
                <Badge color="success" pill className="mb-3 px-4 py-2" style={{ fontWeight: 800 }}>LIVE MISSIONS</Badge>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff' }}>Global Priority Sectors</h2>
             </div>
             <Row className="g-4">
               {causes.map((c, i) => (
                 <Col lg={4} md={6} key={i}>
                    <motion.div whileHover={{ y: -10 }}>
                      <div className="overflow-hidden h-100 glass-card" style={{ borderRadius: '40px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ position: 'relative' }}>
                            <CardImg top width="100%" src={c.img} alt={c.title} style={{ height: '280px', objectFit: 'cover' }} />
                            <div className="position-absolute bottom-0 start-0 p-3 w-100" style={{ background: 'linear-gradient(transparent, rgba(15,23,42,0.8))' }}>
                                <Badge pill className="px-3 py-2 d-flex align-items-center gap-2" style={{ width: 'fit-content', background: 'rgba(34,197,94,0.3)', color: '#86efac', border: '1px solid rgba(34,197,94,0.4)', fontWeight: 800 }}>
                                    {c.icon} {c.progress}% FUNDED
                                </Badge>
                            </div>
                        </div>
                        <div className="p-4">
                          <div className="d-flex justify-content-between mb-4 small fw-bold">
                             <span style={{ color: '#94a3b8' }}>TARGET: ${c.raised.toLocaleString()}</span>
                             <span className="text-success">SIGNAL ACTIVE</span>
                          </div>
                          <h4 style={{ fontWeight: 800, marginBottom: '20px', color: '#fff' }}>{c.title}</h4>
                          <p className="mb-5" style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#94a3b8' }}>
                            {c.desc}
                          </p>
                          <Button block className="rounded-pill fw-bold border-0 shadow-sm py-3" style={{ backgroundColor: '#22c55e', fontSize: '0.9rem', color: '#fff' }}>DEPLOY SUPPORT</Button>
                        </div>
                      </div>
                    </motion.div>
                 </Col>
               ))}
             </Row>
          </Container>
      </section>

      {/* User Specific Sections - Only visible when logged in as User */}
      {auth && auth.role === 'User' && (
        <>
          {/* Live Map & Weather Section */}
          <section id="live-map" className="py-5" style={{ backgroundColor: '#0f172a' }}>
            <Container className="py-5">
              <Row className="g-4">
                <Col lg={8}>
                   <div className="mb-4">
                     <Badge color="danger" pill className="mb-3 px-4 py-2" style={{ letterSpacing: '1px', fontWeight: 800 }}>SECURE GRID MONITOR</Badge>
                     <h2 className="fw-bold mb-4" style={{ color: '#f1f5f9' }}>Strategic Command Visualizer</h2>
                     <LiveDisasterMap navigationTarget={navigationTarget} setNavigationTarget={setNavigationTarget} />
                   </div>
                </Col>
                <Col lg={4} id="weather-alerts">
                   <div className="mb-4">
                     <Badge
                       pill
                       className="mb-3 px-4 py-2"
                       style={{
                         background: 'rgba(56,189,248,0.20)',
                         border: '1px solid rgba(56,189,248,0.40)',
                         color: '#7dd3fc',
                         fontWeight: 800,
                         letterSpacing: '1px'
                       }}
                     >ATMOSPHERIC TELEMETRY</Badge>
                     <h2 className="fw-bold mb-4" style={{ color: '#f1f5f9' }}>Weather Awareness</h2>
                     <WeatherWidget />

                     {/* Active Alert Card - glassmorphism */}
                     <div
                       className="mt-4"
                       style={{
                         borderRadius: '22px',
                         background: 'linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(15,23,42,0.85) 100%)',
                         backdropFilter: 'blur(20px)',
                         WebkitBackdropFilter: 'blur(20px)',
                         border: '1px solid rgba(239,68,68,0.35)',
                         boxShadow: '0 8px 32px rgba(239,68,68,0.20), inset 0 1px 0 rgba(255,255,255,0.08)',
                         padding: '20px 22px',
                         position: 'relative',
                         overflow: 'hidden'
                       }}
                     >
                       {/* Pulsing glow dot */}
                       <div style={{
                         position: 'absolute', top: '20px', right: '20px',
                         width: '10px', height: '10px', borderRadius: '50%',
                         background: '#ef4444',
                         boxShadow: '0 0 0 0 rgba(239,68,68,0.5)',
                         animation: 'pulse-red 1.5s infinite'
                       }} />
                       <style>{`
                         @keyframes pulse-red {
                           0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
                           70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
                           100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
                         }
                       `}</style>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                         <div style={{ background: 'rgba(239,68,68,0.25)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                           <AlertTriangle size={18} color="#fca5a5" strokeWidth={2.5} />
                         </div>
                         <span style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '1.5px', color: '#fca5a5', textTransform: 'uppercase' }}>ACTIVE ALERT</span>
                       </div>
                       <p style={{ margin: 0, fontSize: '0.88rem', color: '#fecdd3', lineHeight: 1.6 }}>
                         Severe weather patterns detected in sector 4. Evacuation routes finalized.
                       </p>
                     </div>
                   </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* AI Prediction Section */}
          <section id="ai-prediction" className="py-5" style={{ backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Container className="py-5">
               <UserAIPrediction />
            </Container>
          </section>

          {/* Nearby Relief Nodes */}
          <section id="nearby-shelters" className="py-5" style={{ backgroundColor: '#0f172a' }}>
            <Container className="py-5">
              <div className="text-center mb-5">
                <Badge color="success" pill className="mb-3 px-4 py-2" style={{ fontWeight: 800 }}>INFRASTRUCTURE GRID</Badge>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff' }}>Nearby Relief Infrastructure</h2>
                <p className="fs-5" style={{ color: '#94a3b8' }}>Localized extraction points and medical stabilization nodes.</p>
              </div>
              
              <div className="mb-5" id="nearby-shelters-list">
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2 text-white"><Tent className="text-success" /> Active Shelters</h3>
                <NearbyLocator type="shelter" setNavigationTarget={setNavigationTarget} />
              </div>

              <div id="nearby-hospitals" className="mt-5">
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2 text-white"><Hospital className="text-danger" /> Emergency Medical Centers</h3>
                <NearbyLocator type="hospital" setNavigationTarget={setNavigationTarget} />
              </div>
            </Container>
          </section>

          {/* Disaster Reporting Section */}
          <section id="disaster-reporting" className="py-5" style={{ backgroundColor: '#0f172a' }}>
            <Container className="py-5">
              <div className="text-center mb-5">
                <Badge color="danger" pill className="mb-3 px-4 py-2" style={{ fontWeight: 800 }}>PRIORITY ALPHA</Badge>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff' }}>Disaster Reporting Mesh</h2>
                <p className="fs-5" style={{ color: '#94a3b8' }}>Submit critical field data to the AI triage network.</p>
              </div>
              <Row className="justify-content-center">
                <Col lg={10}>
                  <div 
                    className="p-lg-5 p-4 vibrant-glass" 
                    style={{ 
                        borderRadius: '40px', 
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Form onSubmit={handleReportSubmit}>
                      <Row className="g-4">
                        <Col md={6}>
                          <FormGroup>
                            <Label className="small fw-bold text-uppercase opacity-75 mb-3 text-white">Disaster Classification</Label>
                            <Input 
                              type="select" 
                              value={reportingData.type}
                              onChange={(e) => setReportingData({...reportingData, type: e.target.value})}
                              style={{ 
                                  background: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  borderRadius: '16px',
                                  padding: '12px 20px'
                              }}
                            >
                              <option value="Flood" style={{ background: '#1e293b', color: '#fff' }}>Flood</option>
                              <option value="Fire" style={{ background: '#1e293b', color: '#fff' }}>Fire</option>
                              <option value="Earthquake" style={{ background: '#1e293b', color: '#fff' }}>Earthquake</option>
                              <option value="Cyclone" style={{ background: '#1e293b', color: '#fff' }}>Cyclone</option>
                              <option value="Landslide" style={{ background: '#1e293b', color: '#fff' }}>Landslide</option>
                              <option value="Other" style={{ background: '#1e293b', color: '#fff' }}>Other</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label className="small fw-bold text-uppercase opacity-75 mb-3 text-white">Severity Calibration</Label>
                            <Input 
                              type="select" 
                              value={reportingData.severity}
                              onChange={(e) => setReportingData({...reportingData, severity: e.target.value})}
                              style={{ 
                                  background: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  borderRadius: '16px',
                                  padding: '12px 20px'
                              }}
                            >
                              <option value="Low" style={{ background: '#1e293b', color: '#fff' }}>Low</option>
                              <option value="Medium" style={{ background: '#1e293b', color: '#fff' }}>Medium</option>
                              <option value="High" style={{ background: '#1e293b', color: '#fff' }}>High</option>
                              <option value="Critical" style={{ background: '#1e293b', color: '#fff' }}>Critical</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={12}>
                          <FormGroup>
                            <Label className="small fw-bold text-uppercase opacity-75 mb-3 text-white">Signal Location (Address/Grid)</Label>
                            <Input 
                              placeholder="Enter localized coordinates or street address"
                              value={reportingData.address}
                              onChange={(e) => setReportingData({...reportingData, address: e.target.value})}
                              style={{ 
                                  background: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  borderRadius: '16px',
                                  padding: '15px 20px'
                              }}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={12}>
                          <FormGroup>
                            <Label className="small fw-bold text-uppercase opacity-75 mb-3 text-white">Field Observations (Description)</Label>
                            <Input 
                              type="textarea" 
                              placeholder="Provide critical data points for AI assessment..."
                              rows={4}
                              value={reportingData.description}
                              onChange={(e) => setReportingData({...reportingData, description: e.target.value})}
                              style={{ 
                                  background: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  borderRadius: '16px',
                                  padding: '15px 20px'
                              }}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={12} className="text-center mt-5">
                          <Button 
                            color="success" 
                            className="rounded-pill px-5 py-3 fw-bold border-0 shadow-lg" 
                            disabled={isSubmitting}
                            style={{ 
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)'
                            }}
                          >
                            {isSubmitting ? <Spinner size="sm" /> : <><ShieldCheck size={20} className="me-2" /> BROADCAST INCIDENT SIGNAL</>}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* Request Emergency Section */}
          <section id="request-emergency" className="py-5" style={{ backgroundColor: '#0f172a' }}>
            <Container className="py-5">
              <div className="text-center mb-5">
                <Badge color="warning" pill className="mb-3 px-4 py-2 text-dark" style={{ fontWeight: 800 }}>LIFELINE ACTIVE</Badge>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff' }}>Request Rescue Extraction</h2>
                <p className="fs-5" style={{ color: '#94a3b8' }}>Immediate coordinate lock for high-risk extraction protocols.</p>
              </div>
              <Row className="g-4">
                {[
                  { title: 'Medical Extraction', desc: 'Critical injuries requiring rapid transport.', color: '#ef4444', type: 'Rescue' },
                  { title: 'Supply Drop', desc: 'Resource depletion in isolated sectors.', color: '#3b82f6', type: 'Food/Water' },
                  { title: 'Safe Zone Route', desc: 'Assistance in navigating to perimeter nodes.', color: '#22c55e', type: 'Navigation' }
                ].map((item, i) => (
                  <Col md={4} key={i}>
                    <div 
                        className="h-100 p-4 text-center glass-card" 
                        style={{ 
                            borderRadius: '30px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                    >
                        <div style={{ width: '70px', height: '70px', borderRadius: '22px', backgroundColor: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', border: `1px solid ${item.color}40` }}>
                          <ShieldCheck size={32} color={item.color} strokeWidth={2.5} />
                        </div>
                        <h4 className="fw-bold mb-3 text-white">{item.title}</h4>
                        <p className="small mb-4 px-2" style={{ color: '#94a3b8' }}>{item.desc}</p>
                        <div className="mt-auto w-100">
                            <Button 
                                outline 
                                className="rounded-pill px-4 py-2 fw-bold w-100" 
                                style={{ 
                                    fontSize: '0.85rem', 
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: '#fff'
                                }}
                                onClick={() => handleEmergencyRequest(item.type, item.title)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = item.color;
                                    e.currentTarget.style.borderColor = item.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                }}
                            >
                                LOCK SIGNAL
                            </Button>
                        </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>

          {/* View Disaster Updates Section */}
          <section id="view-disaster-updates" className="py-5" style={{ backgroundColor: '#1e293b', color: '#fff' }}>
            <Container className="py-5">
              <Row className="align-items-center">
                <Col lg={6}>
                   <Badge color="success" pill className="mb-4 px-4 py-2">NETWORK FEED</Badge>
                   <h2 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1 }}>Live Intelligence <br /><span style={{ color: '#22c55e' }}>Global Grid Status</span></h2>
                   <div className="mt-5">
                      {[
                        { time: 'T-Minus 2m', msg: 'Sector 4: Relief convoy reached node 7', status: 'Success' },
                        { time: 'T-Minus 15m', msg: 'Sector 9: Rainfall intensity mesh updated', status: 'Alert' },
                        { time: 'T-Minus 45m', msg: 'Global: 4.2k nodes synchronized', status: 'Optimal' }
                      ].map((log, i) => (
                        <div key={i} className="mb-4 p-3 rounded-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderLeft: `4px solid ${log.status === 'Success' ? '#22c55e' : log.status === 'Alert' ? '#ef4444' : '#3b82f6'}` }}>
                           <div className="d-flex justify-content-between mb-1">
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.5 }}>{log.time}</span>
                              <Badge color="dark" className="small border border-secondary">{log.status}</Badge>
                           </div>
                           <p className="m-0 fw-bold" style={{ fontSize: '0.9rem' }}>{log.msg}</p>
                        </div>
                      ))}
                   </div>
                </Col>
                <Col lg={6} className="text-center ps-lg-5">
                   <div className="p-5 rounded-circle d-inline-block shadow-lg" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Globe size={300} color="#22c55e" strokeWidth={0.5} style={{ opacity: 0.8 }} />
                   </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* Report & Relief History Section */}
          <section id="history" className="py-5" style={{ backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Container className="py-5">
              <div className="text-center mb-5">
                <Badge color="success" pill className="mb-3 px-4 py-2" style={{ fontWeight: 800 }}>MY SECURE HISTORY</Badge>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff' }}>Report & Rescue Incident Log</h2>
                <p className="fs-5" style={{ color: '#94a3b8' }}>Review incidents declared by you and track real-time resource/volunteer dispatch statuses.</p>
              </div>

              <Row className="g-5">
                {/* Left side: Incident Reports (Disaster reported by user) */}
                <Col lg={6}>
                  <div className="h-100 p-4 rounded-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 className="fw-bold mb-4 d-flex align-items-center gap-2 text-white" style={{ fontSize: '1.4rem' }}>
                      <AlertTriangle className="text-warning" size={20} />
                      Declared Incidents
                    </h3>

                    {historyData.disasters && historyData.disasters.length > 0 ? (
                      <div className="d-flex flex-column gap-3" style={{ maxHeight: '550px', overflowY: 'auto', paddingRight: '5px' }}>
                        {historyData.disasters.map((dis, idx) => (
                          <div key={dis._id || idx} className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-bold text-white" style={{ fontSize: '1.05rem' }}>{dis.type} Detection</span>
                              <Badge color={dis.severity === 'Critical' ? 'danger' : dis.severity === 'High' ? 'danger' : dis.severity === 'Medium' ? 'warning' : 'info'} pill>
                                {dis.severity} Severity
                              </Badge>
                            </div>
                            <p className="small text-white-50 mb-2">{dis.description}</p>
                            <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.75rem' }}>
                              <span>📍 {dis.address || 'Coord Verified'}</span>
                              <span>{new Date(dis.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-white-50 small">No active reports filed by you. Check sections above to declare incident signals.</div>
                    )}
                  </div>
                </Col>

                {/* Right side: Emergency SOS Requests & Dispatch Details */}
                <Col lg={6}>
                  <div className="h-100 p-4 rounded-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 className="fw-bold mb-4 d-flex align-items-center gap-2 text-white" style={{ fontSize: '1.4rem' }}>
                      <History className="text-success" size={20} />
                      Emergency Extractions & Relief
                    </h3>

                    {historyData.requests && historyData.requests.length > 0 ? (
                      <div className="d-flex flex-column gap-3" style={{ maxHeight: '550px', overflowY: 'auto', paddingRight: '5px' }}>
                        {historyData.requests.map((req, idx) => {
                          const matchedTask = historyData.tasks?.find(t => String(t.requestId) === String(req._id));
                          return (
                            <div key={req._id || idx} className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold text-white" style={{ fontSize: '1.05rem' }}>SOS Axis: {req.helpType}</span>
                                <Badge color={req.status === 'Completed' || req.status === 'Rescued' ? 'success' : req.status === 'In Progress' ? 'primary' : 'warning'} pill>
                                  {req.status === 'Rescued' ? 'RESCUED / RESOLVING' : req.status}
                                </Badge>
                              </div>
                              <p className="small text-white-50 mb-3">{req.description}</p>

                              {/* Task details (Dispatched telemetry/volunteers/resources) */}
                              {matchedTask ? (
                                <div className="p-3 rounded-3 mb-2" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                  <div className="small fw-bold text-success mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                    ⚡ Dispatch Alert Telemetry
                                  </div>
                                  
                                  {/* Volunteer Info */}
                                  <div className="text-white-50 mb-2" style={{ fontSize: '0.8rem' }}>
                                    Assigned Unit: <span className="text-white fw-bold">{matchedTask.volunteerId?.name || "Assigning Unit..."}</span>
                                    {matchedTask.volunteerId?.contact && (
                                      <span className="text-success ms-2">({matchedTask.volunteerId.contact})</span>
                                    )}
                                  </div>

                                  {/* Resources Info */}
                                  {matchedTask.resources && matchedTask.resources.length > 0 && (
                                    <div className="mb-2" style={{ fontSize: '0.8rem' }}>
                                      <span className="text-white-50 font-weight-bold">Resources Received: </span>
                                      {matchedTask.resources.map((res, rIdx) => (
                                        <Badge key={res._id || rIdx} color="dark" className="me-1 border border-secondary text-white-50">
                                          {res.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* View Verification Details button if completed */}
                                  {(matchedTask.status === 'Completed' || matchedTask.status === 'Resolved' || matchedTask.status === 'Pending Verification' || matchedTask.verificationPhoto) && (
                                    <Button 
                                      color="success" 
                                      outline 
                                      size="sm" 
                                      className="rounded-pill mt-2 px-3" 
                                      style={{ fontSize: '0.7rem' }}
                                      onClick={() => {
                                        setSelectedTask(matchedTask);
                                        setModalOpen(true);
                                      }}
                                    >
                                      <Eye size={12} className="me-1" /> View Verification Details
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="p-2 text-center text-muted small border border-dashed rounded-3" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' }}>
                                  Awaiting NGO Dispatch Assignment...
                                </div>
                              )}

                              <div className="text-end text-muted mt-2" style={{ fontSize: '0.7rem' }}>
                                {new Date(req.createdAt).toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-white-50 small">No active SOS signals locked. Use options above if immediate assistance is required.</div>
                    )}
                  </div>
                </Col>
              </Row>
            </Container>
          </section>

          {/* Audit Verification Details Modal */}
          {selectedTask && (
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered size="md" style={{ contentStyle: { borderRadius: '24px', overflow: 'hidden' } }}>
              <ModalHeader 
                toggle={() => setModalOpen(!modalOpen)}
                style={{ backgroundColor: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                className="fw-bold"
              >
                Verification: {selectedTask.title}
              </ModalHeader>
              <ModalBody style={{ backgroundColor: '#0f172a', color: '#f1f5f9', padding: '1.8rem' }}>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <span className="small text-uppercase text-success fw-bold d-block mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Volunteer Summary Logs</span>
                    <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }} className="m-0">
                      {selectedTask.completionDetails || "No remarks submitted by field unit."}
                    </p>
                  </div>

                  <div>
                    <span className="small text-uppercase text-success fw-bold d-block mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Validation Timestamp</span>
                    <div className="text-white-50 small">
                      Dispatched Area: {selectedTask.assignedDate ? new Date(selectedTask.assignedDate).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  {selectedTask.verificationPhoto && (
                    <div>
                      <span className="small text-uppercase text-success fw-bold d-block mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Audit Photo Proof (Click to expand)</span>
                      <div 
                        onClick={() => setLightboxOpen(true)}
                        style={{ cursor: 'pointer', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', height: '220px' }}
                      >
                        <img 
                          src={selectedTask.verificationPhoto} 
                          alt="Rescue Verification"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
            </Modal>
          )}

          {/* Full-screen Lightbox photo modal */}
          {selectedTask && selectedTask.verificationPhoto && (
            <Modal isOpen={lightboxOpen} toggle={() => setLightboxOpen(false)} size="xl" centered style={{ contentStyle: { background: 'transparent', border: 'none', boxShadow: 'none' } }}>
              <ModalBody style={{ background: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '24px', overflow: 'hidden', padding: 0 }} className="position-relative">
                <button 
                  onClick={() => setLightboxOpen(false)}
                  style={{
                    position: 'absolute', top: '20px', right: '20px',
                    border: 'none', background: 'rgba(255,255,255,0.1)',
                    width: '40px', height: '40px', borderRadius: '50%',
                    color: '#fff', fontSize: '1.2rem', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  &times;
                </button>
                <div className="d-flex align-items-center justify-content-center" style={{ height: '80vh', padding: '20px' }}>
                  <img 
                    src={selectedTask.verificationPhoto} 
                    alt="High resolution verification proof"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px' }}
                  />
                </div>
              </ModalBody>
            </Modal>
          )}
        </>
      )}

      <footer className="py-5 bg-dark text-white text-center" id="footer">
        <Container className="py-5">
           <div className="d-flex justify-content-center align-items-center gap-3 mb-4">
               <ShieldCheck size={40} color="#22c55e" />
               <h2 className="m-0" style={{ fontWeight: 900, fontSize: '2.5rem' }}>RESQAI</h2>
           </div>
           <p className="opacity-75 mb-5">Contact the relief network for project support or emergency guidance.</p>
           <Row className="g-4 justify-content-center mb-5 text-start">
              {[
                {
                  icon: <Phone size={22} color="#facc15" />,
                  title: 'Emergency Helpline',
                  value: '112',
                  detail: 'India emergency response number',
                  href: 'tel:112'
                },
                {
                  icon: <Mail size={22} color="#22c55e" />,
                  title: 'Project Support',
                  value: 'temp.disaster.relief@gmail.com',
                  detail: 'Technical and platform assistance',
                  href: 'mailto:temp.disaster.relief@gmail.com'
                },
                {
                  icon: <MapPin size={22} color="#38bdf8" />,
                  title: 'Coordination Center',
                  value: 'Kerala Relief Network',
                  detail: 'Local NGO and volunteer coordination',
                  href: '#footer'
                }
              ].map((contact, index) => (
                <Col md={4} key={index}>
                  <a href={contact.href} className="text-decoration-none">
                    <div className="h-100 p-4 rounded-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="mb-3">{contact.icon}</div>
                      <div className="small fw-bold text-uppercase mb-2" style={{ color: '#94a3b8', letterSpacing: '1px' }}>{contact.title}</div>
                      <div className="text-white fw-bold mb-1" style={{ wordBreak: 'break-word' }}>{contact.value}</div>
                      <div className="small" style={{ color: '#64748b' }}>{contact.detail}</div>
                    </div>
                  </a>
                </Col>
              ))}
           </Row>
           <p className="opacity-50 small mb-0">ENCRYPTED DATA MESH V2.4 || KERALA RELIEF NETWORK || DISASTER READY</p>
        </Container>
      </footer>
    </div>
  );
};

export default Home;
