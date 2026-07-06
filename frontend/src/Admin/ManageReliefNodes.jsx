import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Row, Col, Card, CardBody, Table, Badge, Spinner, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';
import { Tent, Hospital, Plus, Trash2, MapPin } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const mapContainerStyle = {
    width: '100%',
    height: '350px',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.1)'
};

const defaultCenter = { lat: 8.5241, lng: 76.9366 }; // Trivandrum Center

const libraries = ["places"];

const MapPicker = ({ apiKey, formData, setFormData, handleMapClick, defaultCenter }) => {
    const [searchBox, setSearchBox] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        libraries
    });

    const onSearchLoad = (ref) => setSearchBox(ref);
    const onPlacesChanged = () => {
        const place = searchBox.getPlaces()[0];
        if (place && place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setFormData(prev => ({
                ...prev,
                lat: lat.toFixed(6),
                lng: lng.toFixed(6),
                address: place.formatted_address || prev.address
            }));
        }
    };

    if (!isLoaded) return (
        <div style={{ height: '350px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
        </div>
    );

    return (
        <div className="position-relative">
            <StandaloneSearchBox onLoad={onSearchLoad} onPlacesChanged={onPlacesChanged}>
                <input
                    type="text"
                    placeholder="Search place..."
                    className="form-control"
                    style={{
                        position: 'absolute',
                        left: '10px',
                        top: '10px',
                        width: 'calc(100% - 20px)',
                        zIndex: 10,
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '10px'
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                />
            </StandaloneSearchBox>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={formData.lat ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) } : defaultCenter}
                zoom={formData.lat ? 16 : 12}
                onClick={handleMapClick}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
                        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
                    ]
                }}
            >
                {formData.lat && <Marker position={{ lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }} />}
            </GoogleMap>
        </div>
    );
};

const ManageReliefNodes = () => {
    const [shelters, setShelters] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('shelters');
    const [modal, setModal] = useState(false);
    const [apiKey, setApiKey] = useState(null);
    const [formData, setFormData] = useState({
        name: '', address: '', lat: '', lng: '', contact: '',
        capacity: '', occupied: '',
        specialization: '', availableBeds: ''
    });
    const [formErrors, setFormErrors] = useState({});

    const toggle = () => {
        setModal(!modal);
        setFormErrors({});
    };

    const fetchData = async () => {
        try {
            const [sRes, hRes] = await Promise.all([
                axios.get('http://localhost:5000/shelter'),
                axios.get('http://localhost:5000/hospital')
            ]);
            setShelters(sRes.data);
            setHospitals(hRes.data);
        } catch (err) {
            toast.error("Failed to fetch relief nodes.");
        } finally {
            setLoading(false);
        }
    };

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
        fetchData();
    }, []);

    const handleMapClick = async (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setFormData(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
        
        // Reverse Geocoding to automatically fill address
        try {
            const res = await axios.get(`http://localhost:5000/api/config/geocode?lat=${lat}&lon=${lng}`);
            if (res.data.results && res.data.results.length > 0) {
                setFormData(prev => ({ ...prev, address: res.data.results[0].formatted_address }));
            }
        } catch (err) {
            console.error("Geocoding failed");
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm(`Delete this ${type}?`)) return;
        try {
            await axios.delete(`http://localhost:5000/${type}/${id}`);
            toast.success("Node deleted successfully");
            fetchData();
        } catch (err) {
            toast.error("Deletion failed");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.address.trim()) errors.address = 'Address is required';
        if (!formData.lat) errors.lat = 'Latitude is required';
        if (!formData.lng) errors.lng = 'Longitude is required';
        
        // Contact validation: Must be exactly 10 digits
        const phoneRegex = /^[0-9]{10}$/;
        if (!formData.contact.trim()) {
            errors.contact = 'Contact is required';
        } else if (!phoneRegex.test(formData.contact.trim())) {
            errors.contact = 'Enter a valid 10-digit number';
        }

        if (activeTab === 'shelters') {
            if (!formData.capacity) errors.capacity = 'Capacity is required';
        } else {
            if (!formData.availableBeds) errors.availableBeds = 'Beds required';
            if (!formData.specialization.trim()) errors.specialization = 'Required';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});
        try {
            const payload = {
                name: formData.name,
                address: formData.address,
                location: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) },
                contact: formData.contact
            };
            if (activeTab === 'shelters') {
                payload.capacity = parseInt(formData.capacity) || 0;
                payload.occupied = parseInt(formData.occupied) || 0;
                await axios.post('http://localhost:5000/shelter', payload);
            } else {
                payload.availableBeds = parseInt(formData.availableBeds) || 0;
                payload.specialization = formData.specialization.split(',').map(s => s.trim());
                await axios.post('http://localhost:5000/hospital', payload);
            }
            toast.success("Node created successfully!");
            toggle();
            fetchData();
            setFormData({ name: '', address: '', lat: '', lng: '', contact: '', capacity: '', occupied: '', specialization: '', availableBeds: '' });
        } catch (err) {
            toast.error("Failed to create node");
        }
    };

    return (
        <AdminLayout title="Fallback Relief Nodes" subtitle="Manage static shelters and hospitals for offline protocol.">
            <div className="d-flex gap-2 mb-4">
                <Button 
                    onClick={() => setActiveTab('shelters')}
                    className={`rounded-pill px-4 py-2 border-0 shadow-sm fw-bold ${activeTab === 'shelters' ? 'bg-success text-white' : 'bg-secondary bg-opacity-25 text-white opacity-50'}`}
                >
                    <Tent size={16} className="me-2" /> SHELTERS
                </Button>
                <Button 
                    onClick={() => setActiveTab('hospitals')}
                    className={`rounded-pill px-4 py-2 border-0 shadow-sm fw-bold ${activeTab === 'hospitals' ? 'bg-danger text-white' : 'bg-secondary bg-opacity-25 text-white opacity-50'}`}
                >
                    <Hospital size={16} className="me-2" /> HOSPITALS
                </Button>
                <Button color="primary" className="ms-auto rounded-pill px-4 py-2 border-0 shadow-sm fw-bold" onClick={toggle}>
                    <Plus size={16} /> ADD NODE
                </Button>
            </div>

            <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                <CardBody className="p-0">
                    <Table hover borderless className="m-0 text-white align-middle">
                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th className="px-4 py-3">Node Name</th>
                                <th className="py-3">Address</th>
                                <th className="py-3">Contact</th>
                                <th className="py-3">{activeTab === 'shelters' ? 'Capacity' : 'Beds'}</th>
                                <th className="py-3 text-end px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeTab === 'shelters' ? shelters : hospitals).map(item => (
                                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td className="px-4 py-4 fw-bold">{item.name}</td>
                                    <td className="small text-muted">{item.address}</td>
                                    <td>{item.contact || 'N/A'}</td>
                                    <td>
                                        {activeTab === 'shelters' ? (
                                            <Badge color="info">{item.occupied} / {item.capacity} Full</Badge>
                                        ) : (
                                            <Badge color="success">{item.availableBeds} Avail.</Badge>
                                        )}
                                    </td>
                                    <td className="text-end px-4">
                                        <Button color="link" className="text-danger p-0" onClick={() => handleDelete(item._id, activeTab === 'shelters' ? 'shelter' : 'hospital')}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            <Modal isOpen={modal} toggle={toggle} className="modal-dialog-centered" size="lg">
                <div style={{ background: '#1e293b', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <ModalHeader toggle={toggle} className="border-secondary text-white">Add New {activeTab === 'shelters' ? 'Shelter' : 'Hospital'}</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col lg={6}>
                                <div className="mb-3">
                                    <Label className="small fw-bold text-uppercase opacity-50">Pick Location from Map</Label>
                                    {apiKey ? (
                                        <MapPicker 
                                            apiKey={apiKey} 
                                            formData={formData} 
                                            setFormData={setFormData}
                                            handleMapClick={handleMapClick} 
                                            defaultCenter={defaultCenter} 
                                        />
                                    ) : (
                                        <div style={{ height: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Spinner />
                                        </div>
                                    )}
                                </div>
                            </Col>
                            <Col lg={6}>
                                <Form>
                                    <FormGroup>
                                        <Label>Name</Label>
                                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.name ? 'is-invalid' : ''}`} />
                                        {formErrors.name && <div className="text-danger small">{formErrors.name}</div>}
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Address</Label>
                                        <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.address ? 'is-invalid' : ''}`} />
                                        {formErrors.address && <div className="text-danger small">{formErrors.address}</div>}
                                    </FormGroup>
                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Latitude</Label>
                                                <Input type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.lat ? 'is-invalid' : ''}`} />
                                                {formErrors.lat && <div className="text-danger small">{formErrors.lat}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Longitude</Label>
                                                <Input type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.lng ? 'is-invalid' : ''}`} />
                                                {formErrors.lng && <div className="text-danger small">{formErrors.lng}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <FormGroup>
                                        <Label>Contact</Label>
                                        <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.contact ? 'is-invalid' : ''}`} />
                                        {formErrors.contact && <div className="text-danger small">{formErrors.contact}</div>}
                                    </FormGroup>
                                    {activeTab === 'shelters' ? (
                                        <Row>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Total Capacity</Label>
                                                    <Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.capacity ? 'is-invalid' : ''}`} />
                                                    {formErrors.capacity && <div className="text-danger small">{formErrors.capacity}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Currently Occupied</Label>
                                                    <Input type="number" value={formData.occupied} onChange={e => setFormData({...formData, occupied: e.target.value})} className="bg-dark text-white border-secondary" />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <Row>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Available Beds</Label>
                                                    <Input type="number" value={formData.availableBeds} onChange={e => setFormData({...formData, availableBeds: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.availableBeds ? 'is-invalid' : ''}`} />
                                                    {formErrors.availableBeds && <div className="text-danger small">{formErrors.availableBeds}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label>Specialization (comma sep)</Label>
                                                    <Input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className={`bg-dark text-white border-secondary ${formErrors.specialization ? 'is-invalid' : ''}`} />
                                                    {formErrors.specialization && <div className="text-danger small">{formErrors.specialization}</div>}
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    )}
                                </Form>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter className="border-secondary">
                        <Button color="secondary" onClick={toggle}>Cancel</Button>
                        <Button color="success" onClick={handleSubmit}>Save Node</Button>
                    </ModalFooter>
                </div>
            </Modal>
        </AdminLayout>
    );
};

export default ManageReliefNodes;
