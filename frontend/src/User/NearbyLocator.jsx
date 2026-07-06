import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Badge, Button, Spinner } from 'reactstrap';
import { MapPin, Phone, Hospital, Tent, Navigation } from 'lucide-react';

const NearbyLocator = ({ type = 'shelter', setNavigationTarget }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleNavigate = (item) => {
        // Set the internal map target
        if (setNavigationTarget && item.location) {
            setNavigationTarget({
                lat: item.location.lat,
                lng: item.location.lng,
                name: item.name
            });
        }

        // Scroll to map section
        const mapSection = document.getElementById('live-map');
        if (mapSection) {
            mapSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        const fetchData = async (userLat, userLon) => {
            try {
                setLoading(true);
                // Fetch internal data directly as requested by user
                const res = await axios.get(`http://localhost:5000/${type}`);
                
                // Map and calculate distance if user location is available
                const formatted = res.data.map(node => {
                    let distance = null;
                    // Fix: The model uses { lat, lng } structure, not GeoJSON coordinates
                    const lat = node.location?.lat;
                    const lng = node.location?.lng;

                    if (lat !== undefined && lng !== undefined && userLat && userLon) {
                        distance = getDistance(userLat, userLon, lat, lng);
                    }
                    
                    return {
                        ...node,
                        location: (lat !== undefined && lng !== undefined) ? { lat, lng } : null,
                        distance: distance
                    };
                });

                // Sort by distance if user location is available, but show ALL items
                if (userLat && userLon) {
                    formatted.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
                }
                
                setItems(formatted);
            } catch (err) {
                console.error(`Failed to fetch ${type}s:`, err);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        // Try to get user location for better ordering/distance display, 
        // but always fetch data even if location is denied.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchData(pos.coords.latitude, pos.coords.longitude),
                () => fetchData(null, null) 
            );
        } else {
            fetchData(null, null);
        }
    }, [type]);

    if (loading) return (
        <div className="text-center p-5">
            <Spinner color={type === 'shelter' ? 'success' : 'danger'} />
            <p className="mt-2 fw-bold small" style={{ color: '#94a3b8', letterSpacing: '1px' }}>LOCATING NEARBY RESOURCES...</p>
        </div>
    );

    const getIcon = () => type === 'shelter' ? <Tent size={22} color="#4ade80" /> : <Hospital size={22} color="#f87171" />;

    return (
        <Row className="g-4">
            {items.length > 0 ? items.map((item, i) => (
                <Col md={6} lg={4} key={i}>
                    <div 
                        style={{ 
                            borderRadius: '28px', 
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                    >
                        {/* Decorative glow */}
                        <div style={{
                            position: 'absolute', top: '-40px', right: '-40px',
                            width: '120px', height: '120px',
                            borderRadius: '50%',
                            background: type === 'shelter' ? 'radial-gradient(circle, rgba(34,197,94,0.1), transparent 70%)' : 'radial-gradient(circle, rgba(239,68,68,0.1), transparent 70%)',
                            pointerEvents: 'none'
                        }} />

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div style={{ backgroundColor: type === 'shelter' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '16px', border: type === 'shelter' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                                {getIcon()}
                            </div>
                            <Badge 
                                pill 
                                style={{ 
                                    padding: '8px 16px', 
                                    background: type === 'shelter' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: type === 'shelter' ? '#86efac' : '#fca5a5',
                                    border: type === 'shelter' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                    letterSpacing: '1px'
                                }}
                            >
                                {type === 'shelter' ? (item.status || 'OPEN') : 'NEAR EMERGENCY'}
                            </Badge>
                        </div>
                        
                        <h5 className="fw-bold mb-3" style={{ color: '#f1f5f9', fontSize: '1.1rem' }}>{item.name}</h5>
                        
                        <div className="d-flex align-items-start gap-2 mb-3">
                            <MapPin size={16} className="mt-1" style={{ color: '#94a3b8', flexShrink: 0 }} /> 
                            <span style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>{item.address}</span>
                        </div>
                        
                        {item.contact && (
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <Phone size={16} style={{ color: '#94a3b8' }} /> 
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{item.contact}</span>
                            </div>
                        )}

                        {item.distance && (
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <Navigation size={16} style={{ color: '#22c55e' }} /> 
                                <span style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.distance.toFixed(1)} km away</span>
                            </div>
                        )}
                        <div className="mt-auto d-flex gap-2">
                            <Button 
                                className="flex-grow-1"
                                style={{ 
                                    borderRadius: '16px',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                                onClick={() => handleNavigate(item)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,1)';
                                    e.currentTarget.style.color = '#000';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.color = '#fff';
                                }}
                            >
                                <Navigation size={16} /> NAVIGATE
                            </Button>
                            
                            {item.location && (
                                <Button 
                                    style={{ 
                                        borderRadius: '16px',
                                        width: '48px',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.2)',
                                        color: '#4ade80',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${item.location.lat},${item.location.lng}`, '_blank')}
                                    title="Open in External Google Maps"
                                >
                                    <MapPin size={18} />
                                </Button>
                            )}
                        </div>
                    </div>
                </Col>
            )) : (
                <Col className="text-center py-5">
                        <p className="m-0 fw-bold small" style={{ color: '#94a3b8' }}>No {type}s have been registered in the system yet.</p>
                </Col>
            )}
        </Row>
    );
};

export default NearbyLocator;
