import React, { useState } from 'react';
import { 
  Row, Col, Card, CardBody, 
  Form, FormGroup, Label, Input, Button, 
  Alert, Spinner, Badge
} from 'reactstrap';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, User, Phone, MapPin, 
  Eye, EyeOff, ArrowLeft, AlertCircle,
  Users
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

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

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('User');
    const [contact, setContact] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedPlace, setSelectedPlace] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [skills, setSkills] = useState('');
    const [experience, setExperience] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setErrors({});

        const newErrors = {};

        if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters long.';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email address.';

        if (!/^\d{10}$/.test(contact)) newErrors.contact = 'Phone number must be exactly 10 digits.';

        if (!selectedDistrict) newErrors.district = 'District is required.';
        if (!selectedPlace) newErrors.place = 'Place is required.';
        
        if (password.length < 6) newErrors.password = 'Password must be at least 6 characters long.';

        if (role === 'Volunteer') {
            if (!age || Number(age) < 18) newErrors.age = 'Volunteer must be at least 18 years old.';
            if (!gender) newErrors.gender = 'Please select a gender option.';
            if (!skills.trim()) newErrors.skills = 'Enter at least one response skill.';
            if (!/^\d{10}$/.test(emergencyContact)) newErrors.emergencyContact = 'Emergency contact must be exactly 10 digits.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const formattedLocation = `${selectedPlace}, ${selectedDistrict}`;
            
            await axios.post(`http://localhost:5000/auth/register`, {
                name, email, password, role, contact, location: formattedLocation,
                ...(role === 'Volunteer' ? {
                    age: Number(age),
                    gender,
                    skills: skills.split(',').map(skill => skill.trim()).filter(Boolean),
                    experience,
                    emergencyContact
                } : {})
            });
            alert('REGISTRATION SUCCESSFUL: Access protocol initialized.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Identification protocol rejected.');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { id: 'User', label: 'Victim', desc: 'Request rescue & aid', icon: <AlertCircle size={24} /> },
        { id: 'Volunteer', label: 'Volunteer', desc: 'Provide on-ground support', icon: <Users size={24} /> }
    ];

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundImage: 'url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px 20px',
            position: 'relative',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)', zIndex: 0 }}></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', maxWidth: '750px', zIndex: 1, position: 'relative' }}
            >
                <Card className="border-0 shadow-2xl" style={{ 
                    borderRadius: '24px', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    overflow: 'hidden'
                 }}>
                    <CardBody className="p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <Button tag={Link} to="/" color="link" className="text-decoration-none p-0 text-dark d-flex align-items-center gap-2">
                                <ArrowLeft size={18} /> <span className="small fw-bold text-uppercase">Back</span>
                            </Button>
                            <Badge color="success" pill className="px-3 py-2 text-uppercase letter-spacing-1">Secure Protocol</Badge>
                        </div>

                        <div className="text-center mb-5">
                            <h2 className="fw-black mb-1" style={{ letterSpacing: '-1px' }}>INITIALIZE NODE</h2>
                            <p className="text-muted small">Synchronize your identity with the relief mesh.</p>
                        </div>

                        <div className="mb-4">
                            <Row className="g-3">
                                {roles.map((r) => (
                                    <Col key={r.id}>
                                        <div 
                                            onClick={() => setRole(r.id)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '15px 10px',
                                                borderRadius: '16px',
                                                border: '2px solid',
                                                borderColor: role === r.id ? '#22c55e' : 'rgba(0,0,0,0.05)',
                                                backgroundColor: role === r.id ? '#f0fdf4' : '#fff',
                                                color: role === r.id ? '#166534' : '#64748b',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div className="fw-bold small text-uppercase">{r.label}</div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>

                        {error && <Alert color="danger" className="border-0 rounded-3 mb-4 py-2 small fw-bold text-center">{error}</Alert>}

                        <Form onSubmit={handleRegister} noValidate>
                            <Row className="g-4">
                                <Col md={6}>
                                    <FormGroup className="mb-0">
                                        <Label className="small fw-black text-uppercase opacity-75 mb-2">Full Name</Label>
                                        <div className="position-relative">
                                            <Input 
                                                type="text" 
                                                placeholder="e.g. John Doe" 
                                                className={`rounded-3 py-2 ps-4 bg-light border-0 shadow-none ${errors.name ? 'is-invalid' : ''}`}
                                                value={name}
                                                onChange={(e) => { 
                                                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                                    setName(val);
                                                    if (val.trim().length < 3) {
                                                        setErrors(p => ({...p, name: 'Minimum 3 characters required'}));
                                                    } else {
                                                        setErrors(p => ({...p, name: ''}));
                                                    }
                                                }}
                                            />
                                            <User size={14} className="position-absolute text-muted" style={{ top: '14px', left: '12px' }} />
                                        </div>
                                        {errors.name && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.name}</div>}
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup className="mb-0">
                                        <Label className="small fw-black text-uppercase opacity-75 mb-2">Contact Frequency</Label>
                                        <div className="position-relative">
                                            <Input 
                                                type="text" 
                                                placeholder="10-digit number" 
                                                maxLength={10}
                                                className={`rounded-3 py-2 ps-4 bg-light border-0 shadow-none ${errors.contact ? 'is-invalid' : ''}`}
                                                value={contact}
                                                onChange={(e) => { 
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                    setContact(val);
                                                    if (val.length !== 10) {
                                                        setErrors(p => ({...p, contact: 'Exactly 10 digits required'}));
                                                    } else {
                                                        setErrors(p => ({...p, contact: ''}));
                                                    }
                                                }}
                                            />
                                            <Phone size={14} className="position-absolute text-muted" style={{ top: '14px', left: '12px' }} />
                                        </div>
                                        {errors.contact && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.contact}</div>}
                                    </FormGroup>
                                </Col>
                                <Col md={12}>
                                    <FormGroup className="mb-0">
                                        <Label className="small fw-black text-uppercase opacity-75 mb-2">Protocol ID (Email)</Label>
                                        <div className="position-relative">
                                            <Input 
                                                type="email" 
                                                placeholder="name@relay.org" 
                                                className={`rounded-3 py-2 ps-4 bg-light border-0 shadow-none ${errors.email ? 'is-invalid' : ''}`}
                                                value={email}
                                                onChange={(e) => { 
                                                    setEmail(e.target.value);
                                                    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                    if (!regex.test(e.target.value)) {
                                                        setErrors(p => ({...p, email: 'Invalid protocol identifier format'}));
                                                    } else {
                                                        setErrors(p => ({...p, email: ''}));
                                                    }
                                                }}
                                            />
                                            <Mail size={14} className="position-absolute text-muted" style={{ top: '14px', left: '12px' }} />
                                        </div>
                                        {errors.email && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.email}</div>}
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup className="mb-0">
                                        <Label className="small fw-black text-uppercase opacity-75 mb-2">Access Key (Password)</Label>
                                        <div className="position-relative">
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="Min 8 chars" 
                                                className={`rounded-3 py-2 ps-4 bg-light border-0 shadow-none ${errors.password ? 'is-invalid' : ''}`}
                                                value={password}
                                                onChange={(e) => { 
                                                    setPassword(e.target.value);
                                                    if (e.target.value.length < 8) {
                                                        setErrors(p => ({...p, password: 'Minimum 8 characters for security'}));
                                                    } else {
                                                        setErrors(p => ({...p, password: ''}));
                                                    }
                                                }}
                                            />
                                            <Lock size={14} className="position-absolute text-muted" style={{ top: '14px', left: '12px' }} />
                                            <div onClick={() => setShowPassword(!showPassword)} className="position-absolute cursor-pointer text-muted" style={{ top: '12px', right: '12px' }}>
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </div>
                                        </div>
                                        {errors.password && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.password}</div>}
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup className="mb-0">
                                        <Label className="small fw-black text-uppercase opacity-75 mb-2">District</Label>
                                        <div className="position-relative">
                                            <Input 
                                                type="select" 
                                                className={`rounded-3 py-2 ps-4 bg-light border-0 shadow-none ${errors.district ? 'is-invalid' : ''}`}
                                                value={selectedDistrict}
                                                onChange={(e) => { 
                                                    setSelectedDistrict(e.target.value);
                                                    setSelectedPlace(''); // Reset place when district changes
                                                    if (!e.target.value) {
                                                        setErrors(p => ({...p, district: 'District required'}));
                                                    } else {
                                                        setErrors(p => ({...p, district: ''}));
                                                    }
                                                }}
                                            >
                                                <option value="">Select District</option>
                                                {Object.keys(keralaDistricts).map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </Input>
                                            <MapPin size={14} className="position-absolute text-muted" style={{ top: '14px', left: '12px' }} />
                                        </div>
                                        {errors.district && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.district}</div>}
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup className="mb-0">
                                        <Label className="small fw-black text-uppercase opacity-75 mb-2">Place / City</Label>
                                        <div className="position-relative">
                                            <Input 
                                                type="select" 
                                                className={`rounded-3 py-2 ps-4 bg-light border-0 shadow-none ${errors.place ? 'is-invalid' : ''}`}
                                                value={selectedPlace}
                                                disabled={!selectedDistrict}
                                                onChange={(e) => { 
                                                    setSelectedPlace(e.target.value);
                                                    if (!e.target.value) {
                                                        setErrors(p => ({...p, place: 'Place required'}));
                                                    } else {
                                                        setErrors(p => ({...p, place: ''}));
                                                    }
                                                }}
                                            >
                                                <option value="">Select Place</option>
                                                {selectedDistrict && keralaDistricts[selectedDistrict].map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </Input>
                                            <MapPin size={14} className="position-absolute text-muted" style={{ top: '14px', left: '12px' }} />
                                        </div>
                                        {errors.place && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.place}</div>}
                                    </FormGroup>
                                </Col>
                                {role === 'Volunteer' && (
                                    <>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-black text-uppercase opacity-75 mb-2">Age</Label>
                                                <Input
                                                    type="number"
                                                    min="18"
                                                    placeholder="18 or above"
                                                    value={age}
                                                    onChange={(e) => setAge(e.target.value)}
                                                    className={`rounded-3 py-2 bg-light border-0 shadow-none ${errors.age ? 'is-invalid' : ''}`}
                                                />
                                                {errors.age && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.age}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-black text-uppercase opacity-75 mb-2">Gender</Label>
                                                <Input
                                                    type="select"
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value)}
                                                    className={`rounded-3 py-2 bg-light border-0 shadow-none ${errors.gender ? 'is-invalid' : ''}`}
                                                >
                                                    <option value="">Select</option>
                                                    <option>Male</option>
                                                    <option>Female</option>
                                                    <option>Other</option>
                                                    <option>Prefer not to say</option>
                                                </Input>
                                                {errors.gender && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.gender}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={12}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-black text-uppercase opacity-75 mb-2">Response Skills</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="First aid, driving, swimming"
                                                    value={skills}
                                                    onChange={(e) => setSkills(e.target.value)}
                                                    className={`rounded-3 py-2 bg-light border-0 shadow-none ${errors.skills ? 'is-invalid' : ''}`}
                                                />
                                                <div className="text-muted x-small mt-1">Separate multiple skills with commas.</div>
                                                {errors.skills && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.skills}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-black text-uppercase opacity-75 mb-2">Prior Experience</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. 2 years first aid"
                                                    value={experience}
                                                    onChange={(e) => setExperience(e.target.value)}
                                                    className="rounded-3 py-2 bg-light border-0 shadow-none"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="small fw-black text-uppercase opacity-75 mb-2">Emergency Contact</Label>
                                                <Input
                                                    type="text"
                                                    maxLength={10}
                                                    placeholder="10-digit number"
                                                    value={emergencyContact}
                                                    onChange={(e) => setEmergencyContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    className={`rounded-3 py-2 bg-light border-0 shadow-none ${errors.emergencyContact ? 'is-invalid' : ''}`}
                                                />
                                                {errors.emergencyContact && <div className="text-danger x-small mt-1 fw-bold"><AlertCircle size={12} className="me-1" />{errors.emergencyContact}</div>}
                                            </FormGroup>
                                        </Col>
                                    </>
                                )}
                            </Row>

                            <Button color="success" size="lg" className="w-100 rounded-3 py-2 fw-black text-uppercase letter-spacing-1 border-0 shadow-lg mt-5 shadow-success" style={{ backgroundColor: '#22c55e' }} disabled={loading}>
                                {loading ? <Spinner size="sm" /> : "Initiate Connection"}
                            </Button>

                            <div className="text-center mt-4">
                                <p className="text-muted x-small mb-0">ALREADY PART OF THE MESH? <Link to="/login" className="text-decoration-none fw-black" style={{ color: '#22c55e' }}>AUTHORIZE</Link></p>
                            </div>
                        </Form>
                    </CardBody>
                </Card>
            </motion.div>
            <style>{`
                .x-small { font-size: 11px; }
                .fw-black { font-weight: 900; }
                .letter-spacing-1 { letter-spacing: 1px; }
                .shadow-success { box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.4); }
                .is-invalid { border: 1px solid #ef4444 !important; background-color: #fef2f2 !important; }
            `}</style>
        </div>
    );
};

export default Register;
