import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Badge, Spinner } from 'reactstrap';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const DisasterReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await axios.get('http://localhost:5000/disaster');
                setReports(res.data);
            } catch (err) {
                console.error("Report sync failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    return (
        <DashboardLayout role="Volunteer" title="Disaster Intel Feed" subtitle="Unified stream of global disaster signals and ground situation reports." themeColor="#f59e0b">
            <Row className="g-4">
                {loading ? <Col className="text-center py-5"><Spinner color="warning" /></Col> : (
                    reports.length === 0 ? <Col className="text-center py-5 text-muted">No tactical signals detected in current frequency.</Col> : (
                        reports.map((report, i) => (
                            <Col lg={4} md={6} key={i}>
                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <Card className="border-0 shadow-lg h-100" style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <CardBody className="p-4 text-white">
                                            <div className="d-flex justify-content-between mb-3">
                                                <Badge color={report.severity === 'Critical' ? 'danger' : 'warning'} pill className="px-3 py-1">
                                                    {report.severity.toUpperCase()}
                                                </Badge>
                                                <div className="small opacity-50 d-flex align-items-center gap-1">
                                                    <Clock size={12} /> {new Date(report.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                                <AlertTriangle size={18} className="text-warning" />
                                                {report.type}
                                            </h5>
                                            <p className="small opacity-75 mb-4" style={{ lineHeight: 1.6 }}>{report.description}</p>
                                            <div className="mt-auto pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <div className="d-flex align-items-center gap-2 small fw-bold text-success">
                                                    <MapPin size={14} />
                                                    {report.address}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))
                    )
                )}
            </Row>
        </DashboardLayout>
    );
};

export default DisasterReports;
