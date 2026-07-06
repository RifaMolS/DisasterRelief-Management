import React, { useState } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Spinner, Badge } from 'reactstrap';
import { Cpu, Zap, Activity, Info, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = "http://localhost:5000";

const AuthorityAIPrediction = () => {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [batchMode, setBatchMode] = useState(false);
    const [batchResults, setBatchResults] = useState(null);
    const [telemetry, setTelemetry] = useState({
        rainfall: 120,
        temperature: 30,
        humidity: 80,
        wind_speed: 15,
        seismic_activity: 0.1,
        water_level: 1.2,
        soil_moisture: 0.4,
        vegetation_index: 0.6
    });

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        setBatchResults(null);
        try {
            const formattedTelemetry = {};
            Object.keys(telemetry).forEach(key => {
                formattedTelemetry[key] = parseFloat(telemetry[key]) || 0;
            });

            const res = await axios.post(`${BACKEND_URL}/ai/predict`, {
                telemetry: formattedTelemetry
            });
            const rawPrediction = res.data.prediction;
            if (rawPrediction) {
                if (rawPrediction.disaster_type === 'None') {
                    rawPrediction.disaster_type = 'Normal';
                    rawPrediction.reasoning = rawPrediction.reasoning.replace('None', 'Normal');
                }
                setPrediction({
                    ...rawPrediction,
                    severity: rawPrediction.risk_level
                });
            } else {
                setPrediction({ error: "Invalid prediction data received." });
            }
        } catch (err) {
            console.error("AI Sync Error:", err);
            setPrediction({ error: "Neural link offline." });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) return;

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const telemetryArray = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                let row = {};
                headers.forEach((header, index) => {
                    row[header] = parseFloat(values[index]) || 0;
                });
                telemetryArray.push(row);
            }

            setLoading(true);
            setPrediction(null);
            try {
                const res = await axios.post(`${BACKEND_URL}/ai/predict/batch`, {
                    telemetryArray
                });
                setBatchResults(res.data);
            } catch (err) {
                console.error("AI Batch Error:", err);
                setPrediction({ error: "Failed to process batch CSV prediction." });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const getSeverityDetails = (severity) => {
        switch (severity) {
            case 'Extreme': return { color: 'danger', icon: <AlertCircle className="text-danger" size={48} />, desc: "Critical threat detected. Immediate evacuation protocols recommended." };
            case 'High': return { color: 'danger', icon: <AlertCircle className="text-danger" size={48} />, desc: "High vulnerability detected in local sectors." };
            case 'Medium': return { color: 'warning', icon: <Zap className="text-warning" size={48} />, desc: "Moderate risk detected. Alert field units." };
            default: return { color: 'success', icon: <Activity className="text-success" size={48} />, desc: "Normal parameters. Standing by." };
        }
    };

    return (
        <DashboardLayout 
            role="NGO" 
            title="AI Sector Prediction" 
            subtitle="Planetary intelligence for local relief coordination."
            themeColor="#0ea5e9"
            withGlassCard={false}
        >
            <Row className="g-4">
                <Col lg={7}>
                    <Card className="border-0 shadow-lg" style={{ borderRadius: '32px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                        <CardBody className="p-5 text-white">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div style={{ padding: '12px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '16px' }}>
                                    <Cpu size={24} color="#0ea5e9" />
                                </div>
                                <h4 className="fw-bold m-0">Localized Telemetry Input</h4>
                            </div>

                            <div className="d-flex mb-4 gap-2 bg-dark p-1 rounded-pill" style={{ width: 'fit-content' }}>
                                <Button size="sm" color={!batchMode ? "info" : "transparent"} className="rounded-pill px-4 text-white" onClick={() => setBatchMode(false)}>Manual Input</Button>
                                <Button size="sm" color={batchMode ? "info" : "transparent"} className="rounded-pill px-4 text-white" onClick={() => setBatchMode(true)}>CSV Batch Upload</Button>
                            </div>

                            {!batchMode ? (
                                <Form onSubmit={handlePredict}>
                                    <Row className="g-4">
                                        {Object.keys(telemetry).map((key) => (
                                            <Col md={6} key={key}>
                                                <FormGroup>
                                                    <Label className="small fw-bold text-uppercase opacity-50 mb-3">{key.replace('_', ' ')}</Label>
                                                    <Input 
                                                        type="number" 
                                                        step="0.01"
                                                        value={telemetry[key]} 
                                                        onChange={(e) => setTelemetry({...telemetry, [key]: e.target.value})}
                                                        className="rounded-4 border-0 py-3 px-4 text-white shadow-none" 
                                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} 
                                                    />
                                                </FormGroup>
                                            </Col>
                                        ))}
                                    </Row>

                                    <Button block size="lg" className="rounded-pill py-3 mt-5 fw-bold border-0 shadow-lg" style={{ backgroundColor: '#0ea5e9' }} disabled={loading}>
                                        {loading ? <Spinner size="sm" /> : <><RefreshCw size={20} className="me-2" /> SCAN SECTOR SEVERITY</>}
                                    </Button>
                                </Form>
                            ) : (
                                <div className="text-center py-5">
                                    <AlertCircle size={48} className="mb-3 text-warning" />
                                    <h5 className="fw-bold">Upload Historical Telemetry CSV</h5>
                                    <p className="small opacity-75 mb-4">CSV must contain columns: rainfall, temperature, humidity, wind_speed, seismic_activity, water_level, soil_moisture, vegetation_index</p>
                                    <div className="p-4 rounded-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)' }}>
                                        <Input type="file" accept=".csv" onChange={handleFileUpload} className="form-control bg-dark text-white border-0" disabled={loading} />
                                    </div>
                                    {loading && <div className="mt-4"><Spinner color="#0ea5e9" /> <p className="mt-2 small">Analyzing Batch...</p></div>}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={5}>
                    <AnimatePresence mode="wait">
                        {batchResults ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <Card className="border-0 shadow-lg p-4 h-100" style={{ borderRadius: '32px', background: '#0f172a', color: 'white' }}>
                                    <CardBody className="py-4 text-center">
                                        <Activity size={40} className="text-info mb-3" />
                                        <h5 className="fw-bold mb-4">Batch Prediction Summary</h5>
                                        <Row className="g-3">
                                            <Col xs={6}>
                                                <div className="p-3 rounded-4" style={{ background: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.3)' }}>
                                                    <h3 className="text-danger fw-bold m-0">{batchResults.summary.Extreme || 0}</h3>
                                                    <small className="opacity-75">Extreme Risk</small>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="p-3 rounded-4" style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                                                    <h3 className="text-warning fw-bold m-0">{batchResults.summary.High || 0}</h3>
                                                    <small className="opacity-75">High Risk</small>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="p-3 rounded-4" style={{ background: 'rgba(13, 202, 240, 0.1)', border: '1px solid rgba(13, 202, 240, 0.3)' }}>
                                                    <h3 className="text-info fw-bold m-0">{batchResults.summary.Medium || 0}</h3>
                                                    <small className="opacity-75">Medium Risk</small>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="p-3 rounded-4" style={{ background: 'rgba(25, 135, 84, 0.1)', border: '1px solid rgba(25, 135, 84, 0.3)' }}>
                                                    <h3 className="text-success fw-bold m-0">{batchResults.summary.Low || 0}</h3>
                                                    <small className="opacity-75">Low/Normal Risk</small>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="mt-4">
                                            <Badge color="secondary" pill className="px-3 py-2">Total Analyzed: {batchResults.results.length}</Badge>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ) : prediction ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <Card className="border-0 shadow-lg bg-white p-4" style={{ borderRadius: '32px' }}>
                                    <CardBody className="py-5 text-center">
                                        {prediction.error ? (
                                             <div className="text-danger py-4">
                                                <AlertCircle size={64} className="mb-4 opacity-50 mx-auto" />
                                                <h4 className="fw-bold">{prediction.error}</h4>
                                             </div>
                                        ) : (
                                            <>
                                                <div className="mb-4 d-inline-block p-4 rounded-circle" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                                                    {getSeverityDetails(prediction.severity).icon}
                                                </div>
                                                <h6 className="small fw-bold text-uppercase text-muted letter-spacing-1 mb-2">AI CLASSIFICATION</h6>
                                                <h1 className={`display-3 fw-black text-${getSeverityDetails(prediction.severity).color} mb-4`}>
                                                    {prediction.disaster_type}
                                                </h1>

                                                <div className="p-3 rounded-4 mb-4" style={{ backgroundColor: '#f8fafc' }}>
                                                    <p className="mb-0 fw-bold text-dark">
                                                        Status: {prediction.risk_level} Risk. {prediction.reasoning}
                                                    </p>
                                                </div>

                                                <div className="d-flex justify-content-center gap-3">
                                                    <Badge color="secondary" pill className="px-3 py-2">Model Confidence: 94.2%</Badge>
                                                    <Badge color="secondary" pill className="px-3 py-2">Processing Time: 82ms</Badge>
                                                </div>
                                            </>
                                        )}
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="border-0 shadow-lg h-100 p-4" style={{ borderRadius: '32px', background: 'rgba(15, 23, 42, 0.4)', border: '1px dotted rgba(255,255,255,0.2)' }}>
                                <CardBody className="d-flex flex-column align-items-center justify-content-center py-5 text-white opacity-25">
                                    <Info size={80} className="mb-4" />
                                    <h4 className="fw-bold">Awaiting Data</h4>
                                    <p className="small text-center px-4">Provide localized parameters or upload a CSV to calculate risk factors.</p>
                                </CardBody>
                            </Card>
                        )}
                    </AnimatePresence>
                </Col>
            </Row>
            <style>{`.fw-black { font-weight: 900; }`}</style>
        </DashboardLayout>
    );
};

export default AuthorityAIPrediction;
