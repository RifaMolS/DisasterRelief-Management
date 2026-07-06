import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Badge, Spinner } from 'reactstrap';
import { Cpu, Activity, AlertTriangle, ShieldCheck, Zap, MapPin } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const UserAIPrediction = () => {
    const [loading, setLoading] = useState(true);
    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState(null);
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const fetchLivePrediction = async () => {
        try {
            // Attempt to get user location or default to HQ
            let lat = 9.9312;
            let lon = 76.2673;
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        lat = pos.coords.latitude;
                        lon = pos.coords.longitude;
                        await runPrediction(lat, lon);
                    },
                    async () => {
                        await runPrediction(lat, lon);
                    }
                );
            } else {
                await runPrediction(lat, lon);
            }
        } catch (err) {
            setError("Live AI telemetry unreachable.");
            setLoading(false);
        }
    };

    const runPrediction = async (lat, lon) => {
        try {
            // Get base weather to feed into the AI
            const weatherRes = await axios.get(`http://localhost:5000/api/config/weather?lat=${lat}&lon=${lon}`);
            const w = weatherRes.data;
            
            // Assess if it's currently raining based on live weather data
            const isRaining = w.weather && w.weather[0] && w.weather[0].main === 'Rain';
            const liveRainfall = w.rain ? (w.rain['1h'] || w.rain['3h'] || 120) : (isRaining ? 150 : 0);
            
            // Construct telemetry for the ML Model (Port 8005)
            // Use real data where possible and logically scale IoT missing data based on current conditions
            const telemetry = {
                rainfall: liveRainfall,
                temperature: w.main.temp,
                humidity: w.main.humidity,
                wind_speed: w.wind.speed,
                water_level: isRaining ? (liveRainfall > 50 ? 5.5 : 3.0) : 1.0, // Water rises if it's raining heavily
                soil_moisture: isRaining ? 85.0 : 45.0, // Soil gets soaked in rain
                seismic_activity: 0.0, // Baseline normal. Doesn't jump to Earthquake unless explicitly simulated.
                vegetation_index: 0.6
            };

            const res = await axios.post(`http://localhost:8005/predict`, telemetry);
            setPrediction(res.data.prediction);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("AI Prediction Engine Offline (Port 8005).");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLivePrediction();
        const interval = setInterval(fetchLivePrediction, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const getSeverityDetails = (risk) => {
        switch (risk) {
            case 'Extreme': return { color: '#ef4444', label: 'EXTREME ALERT', bg: 'rgba(239, 68, 68, 0.15)', icon: <AlertTriangle color="#ef4444" /> };
            case 'High': return { color: '#f59e0b', label: 'HIGH RISK', bg: 'rgba(245, 158, 11, 0.15)', icon: <Activity color="#f59e0b" /> };
            case 'Medium': return { color: '#3b82f6', label: 'ELEVATED RISK', bg: 'rgba(59, 130, 246, 0.15)', icon: <Activity color="#3b82f6" /> };
            default: return { color: '#22c55e', label: 'OPTIMAL / SAFE', bg: 'rgba(34, 197, 94, 0.15)', icon: <ShieldCheck color="#22c55e" /> };
        }
    };

    if (loading) {
        return (
            <div className="py-5 text-center d-flex flex-column align-items-center">
                <Spinner color="success" style={{ width: '3rem', height: '3rem', marginBottom: '1rem' }} />
                <h5 className="text-white fw-bold">Synchronizing Regional Telemetry...</h5>
                <p className="text-muted small">Feeding environmental signals into live prediction mesh.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-5 text-center text-white h-100 d-flex flex-column align-items-center justify-content-center">
                <AlertTriangle size={64} className="mb-4 text-danger opacity-50" />
                <h4 className="fw-bold">{error}</h4>
                <p className="small opacity-75">Ensure your Flask ML server is running on Port 8005.</p>
            </div>
        );
    }

    const { disaster_type, risk_level, confidence, reasoning } = prediction;
    const severity = getSeverityDetails(risk_level);

    return (
        <div>
            <div className="text-center mb-5">
                <Badge color="success" pill className="mb-3 px-4 py-2" style={{ fontWeight: 800, letterSpacing: '1px' }}>LIVE PREDICTION ACTIVE</Badge>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff' }}>Neural Disaster Prediction</h2>
                <p className="fs-5" style={{ color: '#94a3b8' }}>Real-time regional risk assessment generated by our trained AI Model.</p>
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-0 shadow-lg mx-auto" style={{ maxWidth: '800px', borderRadius: '32px', background: 'rgba(15, 23, 42, 0.65)', border: `1px solid ${severity.color}50`, backdropFilter: 'blur(20px)' }}>
                        <CardBody className="p-5 text-white position-relative overflow-hidden">
                            {/* Decorative background glow based on risk */}
                            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: severity.color, opacity: 0.1, filter: 'blur(40px)', zIndex: 0 }}></div>
                            
                            <div className="position-relative" style={{ zIndex: 1 }}>
                                <div className="d-flex flex-wrap justify-content-between align-items-start mb-4">
                                    <div>
                                        <Badge pill className="px-3 py-2 mb-3 fw-bold d-inline-flex align-items-center gap-2" style={{ backgroundColor: severity.bg, color: severity.color, border: `1px solid ${severity.color}40` }}>
                                            {severity.icon} {severity.label}
                                        </Badge>
                                        <h3 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{disaster_type}</h3>
                                        <p className="opacity-75 mb-0 d-flex align-items-center gap-2"><MapPin size={16} /> Auto-Targeted Coordinate Sector</p>
                                    </div>
                                    
                                    <div className="text-end mt-3 mt-sm-0">
                                        <p className="small text-uppercase fw-bold opacity-75 mb-1 text-end">AI Confidence</p>
                                        <h2 style={{ fontWeight: 900, color: severity.color }}>{confidence}%</h2>
                                    </div>
                                </div>

                                <div className="p-4 rounded-4 my-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h6 className="fw-bold mb-2 d-flex align-items-center gap-2 text-info"><Cpu size={18} /> Neural Reasoning:</h6>
                                    <p className="mb-0 text-white-50" style={{ lineHeight: 1.6 }}>{reasoning}</p>
                                </div>

                                <div className="d-flex flex-column gap-2 mt-4">
                                    <div className="d-flex justify-content-between small fw-bold text-uppercase opacity-50">
                                        <span>Safe Level</span>
                                        <span>Current Risk Velocity</span>
                                        <span>Critical Mass</span>
                                    </div>
                                    <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${confidence}%`, height: '100%', background: `linear-gradient(90deg, #22c55e, ${severity.color})`, borderRadius: '4px', transition: 'width 1s ease' }}></div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
export default UserAIPrediction;
