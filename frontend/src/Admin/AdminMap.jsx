import React from 'react';
import AdminLayout from './AdminLayout';
import LiveDisasterMap from '../Volunteer/LiveDisasterMap';
import { Row, Col, Card, CardBody, Badge } from 'reactstrap';
import { Globe, MapPin } from 'lucide-react';
import WeatherWidget from '../User/WeatherWidget';

const AdminMap = () => {
    return (
        <AdminLayout 
            title="Strategic Command Map" 
            subtitle="Global synchronization board for real-time disaster monitoring."
            withGlassCard={false}
        >
            <Row className="g-4">
                <Col lg={9}>
                    <Card style={{ borderRadius: '32px', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }} className="shadow-lg">
                        <CardBody className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="text-white fw-bold d-flex align-items-center gap-2 mb-0">
                                    <Globe size={24} className="text-success" /> Global Operational Grid
                                </h4>
                                <Badge color="success" pill className="px-3 py-2 text-dark">COMMAND FEED ACTIVE</Badge>
                            </div>
                            <LiveDisasterMap />
                        </CardBody>
                    </Card>
                </Col>
                <Col lg={3}>
                    <div className="mb-4">
                        <h5 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                             <MapPin size={20} className="text-success" /> HQ Environmental Data
                        </h5>
                        <WeatherWidget />
                    </div>
                    <Card style={{ borderRadius: '24px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <CardBody className="p-4 text-white">
                            <h6 className="fw-bold mb-3" style={{ color: '#22c55e' }}>Admin Protocol</h6>
                            <p className="small opacity-75 mb-0">You are viewing the global mesh. Markers indicate verified disasters. Click on any marker to view triage details and telemetry data.</p>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
};

export default AdminMap;
