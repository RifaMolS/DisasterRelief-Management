import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { Row, Col, Card, CardBody, Input, Badge, Spinner, Button } from 'reactstrap';
import { Cpu, Activity, Info, AlertCircle, UploadCloud } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const BACKEND_URL = "http://localhost:5000";

const AIPrediction = () => {
    const [loading, setLoading] = useState(false);
    const [batchResults, setBatchResults] = useState(null);
    const [fileName, setFileName] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);

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
            try {
                const res = await axios.post(`${BACKEND_URL}/ai/predict/batch`, {
                    telemetryArray
                });
                setBatchResults(res.data);
            } catch (err) {
                console.error("AI Batch Error:", err);
                setBatchResults({ error: "Failed to process batch CSV prediction." });
            } finally {
                setLoading(false);
                // Reset value to allow uploading the same file again
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const clearResults = () => {
        setBatchResults(null);
        setFileName(null);
    };

    const getSeverityDetails = (risk) => {
        switch (risk) {
            case 'Extreme': return { color: 'danger' };
            case 'High': return { color: 'warning' };
            case 'Medium': return { color: 'info' };
            default: return { color: 'success' };
        }
    };

    let barChartData = null;
    let doughnutChartData = null;

    if (batchResults && !batchResults.error && batchResults.summary) {
        barChartData = {
            labels: ['Extreme', 'High', 'Medium', 'Low'],
            datasets: [
                {
                    label: 'Count',
                    data: [
                        batchResults.summary.Extreme || 0,
                        batchResults.summary.High || 0,
                        batchResults.summary.Medium || 0,
                        batchResults.summary.Low || 0
                    ],
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.85)',
                        'rgba(255, 193, 7, 0.85)',
                        'rgba(13, 202, 240, 0.85)',
                        'rgba(25, 135, 84, 0.85)'
                    ],
                    borderRadius: 6
                }
            ]
        };

        const typeCounts = {};
        batchResults.results.forEach(res => {
            if (!res.error) {
                typeCounts[res.disaster_type] = (typeCounts[res.disaster_type] || 0) + 1;
            }
        });

        doughnutChartData = {
            labels: Object.keys(typeCounts),
            datasets: [
                {
                    data: Object.values(typeCounts),
                    backgroundColor: [
                        '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#ef4444'
                    ],
                    borderWidth: 0
                }
            ]
        };
    }

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const val = context.raw;
                        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                        return `Count: ${val} (${percentage}%)`;
                    }
                }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { position: 'right', labels: { color: 'white', padding: 20 } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const val = context.raw;
                        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                        return `${label}: ${val} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <AdminLayout 
            title={<span>AI Neural Engine <Badge color="success" pill style={{ fontSize: '0.6rem', verticalAlign: 'middle' }}>V2.4</Badge></span>} 
            subtitle="Predictive Environmental Analysis via CSV Batch Input."
        >
            <Row className="g-4">
                <Col lg={4}>
                    <Card className="border-0 shadow-lg h-100" style={{ borderRadius: '32px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                        <CardBody className="p-5 text-white text-center d-flex flex-column justify-content-center">
                            <div className="mx-auto mb-4" style={{ padding: '20px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', width: 'fit-content' }}>
                                <UploadCloud size={48} className="text-success" />
                            </div>
                            <h4 className="fw-bold mb-3">Upload Telemetry Data</h4>
                            <p className="small opacity-75 mb-5">Upload a CSV file to trigger batch predictions. Required columns: rainfall, temperature, humidity, wind_speed, seismic_activity, water_level, soil_moisture, vegetation_index</p>
                            
                            <div className="p-4 rounded-4 position-relative" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                                <Input 
                                    type="file" 
                                    accept=".csv" 
                                    onChange={handleFileUpload} 
                                    className="position-absolute w-100 h-100" 
                                    style={{ top: 0, left: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                                    disabled={loading} 
                                />
                                <span className="fw-bold text-success">{fileName ? fileName : "Select CSV File"}</span>
                            </div>
                            
                            {fileName && !loading && (
                                <Button 
                                    color="danger" 
                                    outline 
                                    className="rounded-pill mt-3 fw-bold w-100" 
                                    style={{ zIndex: 3, position: 'relative' }} 
                                    onClick={clearResults}
                                >
                                    CLEAR & RESET
                                </Button>
                            )}

                            {loading && <div className="mt-4"><Spinner color="success" /> <p className="mt-2 small fw-bold">Analyzing Neural Patterns...</p></div>}
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={8}>
                    <AnimatePresence mode="wait">
                        {batchResults && !batchResults.error ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <Row className="g-4 mb-4">
                                    <Col md={6}>
                                        <Card className="border-0 shadow-lg h-100" style={{ borderRadius: '24px', background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <CardBody className="p-4">
                                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Activity size={18} className="text-success"/> Risk Distribution</h6>
                                                <div style={{ height: '220px' }}>
                                                    <Bar data={barChartData} options={barOptions} />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="border-0 shadow-lg h-100" style={{ borderRadius: '24px', background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <CardBody className="p-4">
                                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Cpu size={18} className="text-primary"/> Predicted Disasters</h6>
                                                <div style={{ height: '220px', display: 'flex', justifyContent: 'center' }}>
                                                    <Doughnut data={doughnutChartData} options={doughnutOptions} />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                <Card className="border-0 shadow-lg" style={{ borderRadius: '24px', background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <CardBody className="p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0">Detailed Prediction Matrix</h6>
                                            <Badge color="secondary" pill>Total Analyzed: {batchResults.results.length}</Badge>
                                        </div>
                                        <div className="table-responsive text-start border rounded-4" style={{ maxHeight: '300px', overflowY: 'auto', borderColor: 'rgba(255,255,255,0.1)' }}>
                                            <table className="table table-dark table-hover table-borderless align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
                                                    <tr>
                                                        <th className="px-4 py-3 text-muted">ID</th>
                                                        <th className="px-4 py-3 text-muted">PREDICTED EVENT</th>
                                                        <th className="px-4 py-3 text-muted">RISK LEVEL</th>
                                                        <th className="px-4 py-3 text-muted">CONFIDENCE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchResults.results.map((res, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td className="px-4 py-3 opacity-50 fw-bold">#{idx + 1}</td>
                                                            {res.error ? (
                                                                <td colSpan="3" className="px-4 py-3 text-danger">Prediction Failed - Verify connection to Port 8000/8005</td>
                                                            ) : (
                                                                <>
                                                                    <td className="px-4 py-3 fw-bold">{res.disaster_type}</td>
                                                                    <td className="px-4 py-3">
                                                                        <Badge color={getSeverityDetails(res.risk_level).color} pill className="px-3">
                                                                            {res.risk_level}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <span className="opacity-75" style={{ minWidth: '40px' }}>{res.confidence}%</span>
                                                                            <div style={{ flexGrow: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                                                                <div style={{ width: `${res.confidence}%`, height: '100%', background: res.confidence > 80 ? '#22c55e' : res.confidence > 50 ? '#eab308' : '#ef4444', borderRadius: '2px', transition: 'width 1s ease-out' }}></div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ) : batchResults?.error ? (
                            <Card className="border-0 shadow-lg bg-danger text-white p-5 h-100 d-flex flex-column align-items-center justify-content-center" style={{ borderRadius: '32px' }}>
                                <AlertCircle size={64} className="mb-4 opacity-50" />
                                <h4 className="fw-bold">{batchResults.error}</h4>
                                <p className="small opacity-75 text-center">Neural link severed. Ensure your Flask server is running on Port 8005.</p>
                            </Card>
                        ) : (
                            <Card className="border-0 shadow-lg h-100 p-4" style={{ borderRadius: '32px', background: 'rgba(15, 23, 42, 0.4)', border: '1px dotted rgba(255,255,255,0.2)' }}>
                                <CardBody className="d-flex flex-column align-items-center justify-content-center py-5 text-white opacity-25">
                                    <Info size={80} className="mb-4" />
                                    <h4 className="fw-bold">Awaiting Batch Data</h4>
                                    <p className="small text-center px-4">Upload a dataset to generate visual predictive charts and detailed risk mappings.</p>
                                </CardBody>
                            </Card>
                        )}
                    </AnimatePresence>
                </Col>
            </Row>
        </AdminLayout>
    );
};

export default AIPrediction;
