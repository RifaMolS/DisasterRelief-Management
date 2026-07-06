import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';
import { Spinner, Badge, Button } from 'reactstrap';
import { MapPin, AlertTriangle, Navigation } from 'lucide-react';



const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '480px'
};



const libraries = ["places"];

const MapComponent = ({ apiKey, disasters, setSelectedDisaster, selectedDisaster, navigationTarget, setNavigationTarget }) => {
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
    const [mapInstance, setMapInstance] = useState(null);
    const [directions, setDirections] = useState(null);
    const [userLoc, setUserLoc] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        libraries
    });

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLoc(newPos);
                    setMapCenter(newPos);
                    if (mapInstance) mapInstance.panTo(newPos);
                },
                () => console.error("Location access denied.")
            );
        }
    };

    useEffect(() => {
        handleLocateMe();
        const interval = setInterval(handleLocateMe, 30000); // Update user location every 30s
        return () => clearInterval(interval);
    }, []);

    const directionsCallback = (response) => {
        if (response !== null) {
            if (response.status === 'OK') {
                setDirections(response);
            } else {
                console.error('Directions request failed:', response.status);
            }
        }
    };

    useEffect(() => {
        if (mapInstance && disasters.length > 0 && !navigationTarget) {
            const bounds = new window.google.maps.LatLngBounds();
            let validPoints = 0;
            disasters.forEach(d => {
                const lat = d.location?.coordinates?.[1];
                const lng = d.location?.coordinates?.[0];
                if (lat && lng && lat !== 0 && lng !== 0) {
                    bounds.extend({ lat, lng });
                    validPoints++;
                }
            });
            if (validPoints > 0) {
                mapInstance.fitBounds(bounds);
                if (validPoints === 1) {
                    mapInstance.setZoom(15);
                }
            }
        }
    }, [mapInstance, disasters, navigationTarget]);

    useEffect(() => {
        if (navigationTarget && mapInstance) {
            setMapCenter({ lat: navigationTarget.lat, lng: navigationTarget.lng });
            mapInstance.setZoom(15);
        }
    }, [navigationTarget, mapInstance]);

    if (!isLoaded) return (
        <div style={{ height: '480px', borderRadius: '28px', background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Spinner style={{ color: '#22c55e', width: '2.5rem', height: '2.5rem' }} />
        </div>
    );

    return (
        <div className="shadow-lg position-relative" style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)', minHeight: '480px', height: '480px' }}>
            {/* Locate Me Overlay Button */}
            <button 
                onClick={handleLocateMe}
                style={{
                    position: 'absolute', top: '20px', right: '60px', zIndex: 10,
                    backgroundColor: '#fff', border: 'none', padding: '10px', borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)', cursor: 'pointer'
                }}
                title="Center on My Location"
            >
                <MapPin size={20} className="text-success" />
            </button>

            {/* Navigation Overlay */}
            {navigationTarget && (
                <div 
                    style={{
                        position: 'absolute', top: '20px', left: '20px', zIndex: 10,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '15px', borderRadius: '16px',
                        border: '1px solid #22c55e', color: '#fff', maxWidth: '300px',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <Navigation size={18} className="text-success" />
                        <span className="fw-bold small">NAVIGATING TO NODE</span>
                    </div>
                    <div className="small opacity-75 mb-3">{navigationTarget.name}</div>
                    <Button 
                        color="danger" 
                        size="sm" 
                        block 
                        className="fw-bold rounded-pill"
                        onClick={() => {
                            setNavigationTarget(null);
                            setDirections(null);
                        }}
                    >
                        STOP TRACKING
                    </Button>
                </div>
            )}

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={5}
                onLoad={map => {
                    setMapInstance(map);
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
                }}
                options={{
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }, { weight: 2 }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
                        {
                            featureType: "administrative.locality",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#22c55e" }, { scale: 1.2 }],
                        },
                        {
                            featureType: "poi",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#94a3b8" }],
                        },
                        {
                            featureType: "poi.park",
                            elementType: "geometry",
                            stylers: [{ color: "#1e293b" }],
                        },
                        {
                            featureType: "poi.park",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#4ade80" }],
                        },
                        {
                            featureType: "road",
                            elementType: "geometry",
                            stylers: [{ color: "#334155" }, { visibility: "on" }],
                        },
                        {
                            featureType: "road",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#475569" }, { weight: 1 }],
                        },
                        {
                            featureType: "road",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#f8fafc" }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "geometry",
                            stylers: [{ color: "#64748b" }, { visibility: "on" }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#1e293b" }, { weight: 2 }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#ffffff" }],
                        },
                        {
                            featureType: "transit",
                            elementType: "geometry",
                            stylers: [{ color: "#1e293b" }],
                        },
                        {
                            featureType: "transit.station",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#22c55e" }],
                        },
                        {
                            featureType: "water",
                            elementType: "geometry",
                            stylers: [{ color: "#020617" }],
                        },
                        {
                            featureType: "water",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#334155" }],
                        }
                    ],
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    backgroundColor: '#0f172a'
                }}
            >
                {navigationTarget && userLoc && (
                    <DirectionsService
                        options={{
                            destination: { lat: navigationTarget.lat, lng: navigationTarget.lng },
                            origin: userLoc,
                            travelMode: 'DRIVING'
                        }}
                        callback={directionsCallback}
                    />
                )}

                {directions && (
                    <DirectionsRenderer
                        options={{
                            directions: directions,
                            polylineOptions: {
                                strokeColor: '#22c55e',
                                strokeOpacity: 0.8,
                                strokeWeight: 6
                            }
                        }}
                    />
                )}

                {!directions && disasters.map((disaster) => {
                    const lat = disaster.location?.coordinates?.[1];
                    const lng = disaster.location?.coordinates?.[0];
                    if (!lat || !lng || lat === 0 || lng === 0) return null;

                    return (
                        <Marker
                            key={disaster._id}
                            position={{ lat, lng }}
                            onClick={() => {
                                const overlapping = disasters.filter(d => 
                                    d.location?.coordinates?.[1] === lat && 
                                    d.location?.coordinates?.[0] === lng
                                );
                                setSelectedDisaster(overlapping);
                            }}
                            icon={{
                                url: (disaster.status === 'Resolved' || disaster.status === 'Rescued') ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' :
                                     disaster.severity === 'Critical' ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 
                                     disaster.severity === 'High' ? 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png' :
                                     'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                            }}
                        />
                    );
                })}

                {selectedDisaster && selectedDisaster.length > 0 && (
                    <InfoWindow
                        position={{
                            lat: selectedDisaster[0].location?.coordinates?.[1],
                            lng: selectedDisaster[0].location?.coordinates?.[0]
                        }}
                        onCloseClick={() => setSelectedDisaster(null)}
                    >
                        <div style={{ padding: '15px', maxWidth: '300px', maxHeight: '300px', overflowY: 'auto', background: '#0f172a', borderRadius: '12px', color: '#fff' }}>
                            <h6 className="fw-bold mb-3 border-bottom pb-2 text-success" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                {selectedDisaster.length} Incident{selectedDisaster.length > 1 ? 's' : ''} at this location
                            </h6>
                            {selectedDisaster.map((d, index) => (
                                <div key={d._id} style={{ marginBottom: index !== selectedDisaster.length - 1 ? '15px' : '0', borderBottom: index !== selectedDisaster.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingBottom: index !== selectedDisaster.length - 1 ? '15px' : '0' }}>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <AlertTriangle size={18} className="text-warning" />
                                        <h6 className="fw-bold m-0 text-white">{d.type}</h6>
                                    </div>
                                    <p className="small mb-3 text-white-50" style={{ lineHeight: 1.4 }}>
                                        {d.address && d.address !== "GPS Coordinates Verified" 
                                            ? d.address 
                                            : `Coordinates: ${d.location?.coordinates[1].toFixed(4)}, ${d.location?.coordinates[0].toFixed(4)}`}
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <Badge color={d.severity === 'Critical' ? 'danger' : 'warning'} pill className="px-3">
                                                {d.severity}
                                            </Badge>
                                            <Badge color={d.status === 'Resolved' || d.status === 'Rescued' ? 'success' : 'info'} pill className="px-3 ms-2">
                                                {d.status || 'Active'}
                                            </Badge>
                                        </div>
                                        <span className="small opacity-50 fw-bold text-white-50">{d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : ''}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
};

const LiveDisasterMap = ({ navigationTarget, setNavigationTarget }) => {
    const [apiKey, setApiKey] = useState(null);
    const [disasters, setDisasters] = useState([]);
    const [selectedDisaster, setSelectedDisaster] = useState(null);

    useEffect(() => {
        const fetchApiKey = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/config/get-google-map-key`);
                setApiKey(res.data.key);
            } catch (err) {
                console.error("Map key fetch error:", err);
            }
        };
        fetchApiKey();

        const fetchDisasters = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                let url = `http://localhost:5000/disaster`;
                if (user) {
                    url += `?userId=${user.id}&role=${user.role}`;
                }
                const res = await axios.get(url);
                let mapDisasters = res.data;
                if (!user || (user.role !== 'User' && user.role !== 'Admin')) {
                    // Filter out resolved/rescued for Volunteer/NGO
                    mapDisasters = res.data.filter(d => d.status !== 'Resolved' && d.status !== 'Rescued');
                }
                setDisasters(mapDisasters);
            } catch (err) {
                console.error("Map fetch error:", err);
            }
        };

        fetchDisasters();
        const interval = setInterval(fetchDisasters, 10000); // Sync grid every 10 seconds
        return () => clearInterval(interval);
    }, []);

    // Only render the component that calls useJsApiLoader once we have the apiKey
    if (!apiKey) return <div className="text-center p-5"><Spinner color="success" /></div>;

    return (
        <MapComponent 
            apiKey={apiKey} 
            disasters={disasters} 
            setSelectedDisaster={setSelectedDisaster} 
            selectedDisaster={selectedDisaster} 
            navigationTarget={navigationTarget}
            setNavigationTarget={setNavigationTarget}
        />
    );
};

export default React.memo(LiveDisasterMap);
