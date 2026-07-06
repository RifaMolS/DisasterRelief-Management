import React, { useState } from 'react';
import { 
  Row, Col, Card, 
  Form, FormGroup, Label, Input, Button, 
  Alert, Spinner, InputGroup, InputGroupText
} from 'reactstrap';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Mail, Lock, Eye, EyeOff, 
  Shield, Users, AlertCircle, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const errs = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) errs.email = 'Email is required.';
        else if (!emailRegex.test(email)) errs.email = 'Enter a valid email address.';
        if (!password) errs.password = 'Password is required.';
        else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setLoading(true);
        try {
            const res = await axios.post(`http://localhost:5000/auth/login`, { email, password });
            localStorage.setItem('user', JSON.stringify(res.data.user));
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'CRITICAL: Authentication protocol failure.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundImage: 'url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px',
            position: 'relative'
        }}>
            {/* Dark Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 0 }}></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '1000px', zIndex: 1, position: 'relative' }}
            >
                <Card className="border-0 shadow-2xl overflow-hidden" style={{ 
                    borderRadius: '28px', 
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    border: '1px solid rgba(255, 255, 255, 0.18)'
                }}>
                    <Row className="g-0">
                        {/* Left Side: Branding */}
                        <Col lg={5} className="d-none d-lg-flex flex-column justify-content-center align-items-center text-center p-5 position-relative" style={{ borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                            <Button 
                                tag={Link} 
                                to="/" 
                                color="light" 
                                className="position-absolute border-0 shadow-sm rounded-circle p-2" 
                                style={{ top: '30px', left: '30px', backgroundColor: 'rgba(255,255,255,0.9)' }}
                            >
                                <ArrowLeft size={20} />
                            </Button>
                            
                            <div className="mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '25px', borderRadius: '24px' }}>
                                <ShieldCheck size={60} color="#22c55e" strokeWidth={2.5} />
                            </div>
                            
                            <h2 className="fw-bold mb-3" style={{ fontSize: '2.5rem', color: '#1e293b', letterSpacing: '-1px' }}>
                                RESQ<span style={{ color: '#22c55e' }}>AI</span> Hub
                            </h2>
                            <p className="text-muted fs-6 px-4">Initialize secure connection to the global disaster relief mesh.</p>
                        </Col>

                        <Col lg={7} className="p-5">
                            <div className="mb-5">
                                <h5 className="fw-bold mb-4" style={{ color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Mesh Login</h5>
                                <p className="text-muted small">Enter your credentials. The system will automatically detect your clearance level and route you appropriately.</p>
                            </div>

                            {error && <Alert color="danger" className="border-0 rounded-4 mb-4 small fw-bold" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>{error}</Alert>}

                            <Form onSubmit={handleLogin} noValidate>
                                <FormGroup className="mb-1">
                                    <Label className="fw-bold text-muted small mb-2 ms-2">PROTOCOL IDENTIFIER (EMAIL)</Label>
                                    <InputGroup className={`bg-white rounded-4 border-0 shadow-sm ${fieldErrors.email ? 'border border-danger' : ''}`} style={{ padding: '4px' }}>
                                        <InputGroupText className="bg-transparent border-0 pe-0 ps-3">
                                            <Mail size={18} className="text-muted" />
                                        </InputGroupText>
                                        <Input 
                                            type="email" 
                                            placeholder="identity@resqai.org" 
                                            className="bg-transparent border-0 py-3 ps-3 shadow-none fw-bold" 
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ''})); }}
                                        />
                                    </InputGroup>
                                    {fieldErrors.email && <div className="text-danger small fw-bold mt-1 ms-2">⚠ {fieldErrors.email}</div>}
                                </FormGroup>

                                <FormGroup className="mb-4 mt-3">
                                    <Label className="fw-bold text-muted small mb-2 ms-2">ACCESS FREQUENCY (PASSWORD)</Label>
                                    <InputGroup className={`bg-white rounded-4 border-0 shadow-sm ${fieldErrors.password ? 'border border-danger' : ''}`} style={{ padding: '4px' }}>
                                        <InputGroupText className="bg-transparent border-0 pe-0 ps-3">
                                            <Lock size={18} className="text-muted" />
                                        </InputGroupText>
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="••••••••" 
                                            className="bg-transparent border-0 py-3 ps-3 shadow-none fw-bold" 
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ''})); }}
                                        />
                                        <InputGroupText className="bg-transparent border-0 pe-3 ps-0 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
                                        </InputGroupText>
                                    </InputGroup>
                                    {fieldErrors.password && <div className="text-danger small fw-bold mt-1 ms-2">⚠ {fieldErrors.password}</div>}
                                </FormGroup>

                                <div className="mb-5"></div>

                                <Button color="success" size="lg" className="w-100 rounded-4 py-3 fw-bold border-0 shadow-lg text-white" style={{ backgroundColor: '#22c55e' }} disabled={loading}>
                                    {loading ? <Spinner size="sm" /> : <>AUTHORIZE CONNECTION</>}
                                </Button>

                                <div className="text-center mt-5">
                                    <p className="text-muted small">New to the mesh? <Link to="/register" className="text-decoration-none fw-bold" style={{ color: '#22c55e' }}>Initialize Signal</Link></p>
                                </div>
                            </Form>
                        </Col>
                    </Row>
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
