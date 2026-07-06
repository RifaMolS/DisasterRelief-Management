import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Row, Col, Card, CardBody, Badge, Spinner } from 'reactstrap';
import { Bar, Pie } from 'react-chartjs-2';
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
import { Activity, ShieldAlert, Package, Users, PieChart, BarChart3 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const ReportsAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:5000/analytics/global');
                setData(res.data);
            } catch (err) {
                console.error("Analytics failure:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <AdminLayout title="Historical Analytics"><div className="text-center py-5"><Spinner color="success" /></div></AdminLayout>;

    // 1. Historical Disaster Records (Pie Chart)
    const disasterLabels = data?.disasters?.map(d => d._id) || [];
    const disasterValues = data?.disasters?.map(d => d.count) || [];
    const disasterPie = {
        labels: disasterLabels,
        datasets: [{
            data: disasterValues,
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'],
            borderWidth: 0
        }]
    };

    // 2. Volunteer & Personnel Activity (Pie Chart)
    const userLabels = data?.users?.map(u => u._id) || [];
    const userValues = data?.users?.map(u => u.count) || [];
    const userPie = {
        labels: userLabels,
        datasets: [{
            data: userValues,
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderWidth: 0
        }]
    };

    // 3. Past Emergency Requests (Bar Chart)
    const requestLabels = data?.requests?.map(r => r._id) || [];
    const requestValues = data?.requests?.map(r => r.count) || [];
    const requestBar = {
        labels: requestLabels,
        datasets: [{
            label: 'Emergency Requests',
            data: requestValues,
            backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#3b82f6'],
            borderRadius: 8
        }]
    };

    // 4. Resource Distribution History (Bar Chart)
    const resourceLabels = data?.resources?.map(r => r._id) || [];
    const resourceValues = data?.resources?.map(r => r.totalQuantity) || [];
    const resourceBar = {
        labels: resourceLabels,
        datasets: [{
            label: 'Resource Quantity (Units)',
            data: resourceValues,
            backgroundColor: '#38bdf8',
            borderRadius: 8
        }]
    };

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#e2e8f0', font: { weight: '600' }, padding: 20 } }
        }
    };

    const barOptions = {
        maintainAspectRatio: false,
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
            x: { grid: { display: false }, ticks: { color: '#fff' } }
        },
        plugins: { legend: { display: false } }
    };

    return (
        <AdminLayout title="Historical Data Analysis" subtitle="Visualize and analyze historical disaster records, resources, and personnel activity.">
            {/* TOP STATS ROW */}
            <Row className="g-4 mb-4">
                {[
                    { title: 'Total Disasters Recorded', value: data?.counts?.disasters || 0, icon: <ShieldAlert size={24} />, color: 'danger' },
                    { title: 'Total Emergency Requests', value: data?.counts?.requests || 0, icon: <Activity size={24} />, color: 'warning' },
                    { title: 'Total Resources Tracked', value: data?.counts?.resources || 0, icon: <Package size={24} />, color: 'info' },
                    { title: 'Total Personnel & Users', value: data?.counts?.users || 0, icon: <Users size={24} />, color: 'success' }
                ].map((stat, i) => (
                    <Col md={3} key={i}>
                         <Card style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <CardBody className="p-4 d-flex align-items-center gap-3">
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '15px' }}>
                                    {React.cloneElement(stat.icon, { className: `text-${stat.color}`, strokeWidth: 2.5 })}
                                </div>
                                <div>
                                    <div className="small fw-bold text-uppercase mb-1" style={{ color: '#94a3b8', letterSpacing: '0.5px' }}>{stat.title}</div>
                                    <h3 className="fw-black text-white m-0" style={{ letterSpacing: '-0.5px' }}>{stat.value}</h3>
                                </div>
                            </CardBody>
                         </Card>
                    </Col>
                ))}
            </Row>

            {/* CHARTS ROW 1 */}
            <Row className="g-4 mb-4">
                <Col lg={6}>
                    <Card style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-4">
                            <h5 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                <PieChart size={20} className="text-danger" /> Historical Disaster Records
                            </h5>
                            <div style={{ height: '300px' }} className="d-flex align-items-center justify-content-center">
                                {disasterLabels.length > 0 ? (
                                    <Pie data={disasterPie} options={chartOptions} />
                                ) : (
                                    <div className="text-muted small">No disaster records available.</div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-4">
                            <h5 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                <BarChart3 size={20} className="text-warning" /> Past Emergency Requests
                            </h5>
                            <div style={{ height: '300px' }}>
                                {requestLabels.length > 0 ? (
                                    <Bar data={requestBar} options={barOptions} />
                                ) : (
                                    <div className="text-muted small h-100 d-flex align-items-center justify-content-center">No requests logged.</div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* CHARTS ROW 2 */}
            <Row className="g-4">
                <Col lg={6}>
                    <Card style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-4">
                            <h5 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                <BarChart3 size={20} className="text-info" /> Resource Distribution History
                            </h5>
                            <div style={{ height: '300px' }}>
                                {resourceLabels.length > 0 ? (
                                    <Bar data={resourceBar} options={barOptions} />
                                ) : (
                                    <div className="text-muted small h-100 d-flex align-items-center justify-content-center">No resource data available.</div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardBody className="p-4">
                            <h5 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                <PieChart size={20} className="text-success" /> Volunteer & Personnel Activity
                            </h5>
                            <div style={{ height: '300px' }} className="d-flex align-items-center justify-content-center">
                                {userLabels.length > 0 ? (
                                    <Pie data={userPie} options={chartOptions} />
                                ) : (
                                    <div className="text-muted small">No personnel records available.</div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
};

export default ReportsAnalytics;
