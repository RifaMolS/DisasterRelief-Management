import React from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import LiveDisasterMap from './LiveDisasterMap';
import { Row, Col, Card, CardBody, Badge } from 'reactstrap';
import { Globe, MapPin } from 'lucide-react';
import WeatherWidget from '../User/WeatherWidget';

const VolunteerMap = () => {
    return (
        <DashboardLayout 
            role="Volunteer" 
            themeColor="#f59e0b" 
            title="Tactical Map Interface" 
            subtitle="Real-time coordinate monitoring and field deployment grid."
            withGlassCard={false}
        >
            <Row className="g-4">
                <Col lg={9}>
                    <Card style={{ borderRadius: '32px', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }} className="shadow-lg">
                        <CardBody className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="text-white fw-bold d-flex align-items-center gap-2 mb-0">
                                    <Globe size={24} className="text-warning" /> Live Operational Grid
                                </h4>
                                <Badge color="warning" pill className="px-3 py-2 text-dark">LIVE INTEL</Badge>
                            </div>
                            <LiveDisasterMap />
                        </CardBody>
                    </Card>
                </Col>
                <Col lg={3}>
                    <div className="mb-4">
                        <h5 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                             <MapPin size={20} className="text-warning" /> Regional Weather
                        </h5>
                        <WeatherWidget />
                    </div>
                    <Card style={{ borderRadius: '24px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <CardBody className="p-4 text-white">
                            <h6 className="fw-bold mb-3" style={{ color: '#f59e0b' }}>Field Notice</h6>
                            <p className="small opacity-75 mb-0">Map data is synchronized with central command every 30 seconds. Use the locate pin to center on your current position.</p>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default VolunteerMap;
