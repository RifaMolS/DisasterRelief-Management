import React, { useState, useEffect } from 'react';
import DashboardLayout from '../Common/DashboardLayout';
import { Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Table, Badge, Spinner } from 'reactstrap';
import { Package, Plus, Trash2, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SearchableDropdown from '../Common/SearchableDropdown';

export const FOOD_OPTIONS = [
    'Canned Goods',
    'MRE (Meals Ready-to-Eat)',
    'Biscuits',
    'Energy Bars',
    'Dry Rations (Rice, Beans, Lentils)',
    'Fresh Produce',
    'Infant Formula',
    'Oatmeal/Cereals',
    'Instant Noodles',
    'Dehydrated Meals',
    'Powdered Milk',
    'Non-Perishable Snacks',
    'Dietary/Allergy-Specific'
];

const ResourceAllocation = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        type: 'Food',
        customType: '',
        foodCategory: 'Canned Goods',
        quantity: '',
        location: '',
        expiryDate: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});

    const fetchResources = async () => {
        try {
            const res = await axios.get('http://localhost:5000/resource');
            // Filter resources belonging to this NGO
            setResources(res.data.filter(r => r.ngoId?._id === user.id));
        } catch (err) {
            toast.error("Failed to fetch resources.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    const handleAdd = async (e) => {
        e.preventDefault();
        const errors = {};
        if (formData.type === 'Other' && (!formData.customType || !formData.customType.trim())) errors.customType = 'Specific supply type is required';
        if (!formData.quantity || formData.quantity <= 0) errors.quantity = 'Positive quantity is required';
        if (!formData.location.trim()) errors.location = 'Storage location is required';
        
        const isFood = formData.type.toLowerCase().includes('food') || (formData.type === 'Other' && formData.customType.toLowerCase().includes('food'));
        if (isFood && !formData.expiryDate) errors.expiryDate = 'Food expiry date is required';
        if (isFood && !formData.foodCategory) errors.foodCategory = 'Food category is required';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});
        try {
            let finalType = formData.type === 'Other' ? formData.customType : formData.type;
            if (isFood) {
                finalType = `${finalType} (${formData.foodCategory})`;
            }
            
            await axios.post('http://localhost:5000/resource', {
                ...formData,
                type: finalType,
                ngoId: user.id
            });
            toast.success("Resource added to mesh.");
            setFormData({ type: 'Food', customType: '', foodCategory: 'Canned Goods', quantity: '', location: '', expiryDate: '' });
            fetchResources();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add resource.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/resource/${id}`);
            toast.success("Resource record purged.");
            fetchResources();
        } catch (err) {
            toast.error("Failed to delete record.");
        }
    };

    return (
        <DashboardLayout role="NGO" title="Resource Inventory Node" subtitle="Maintain secure accountability of relief logistics and stockpiles." themeColor="#0ea5e9">
            <Row>
                <Col lg={4}>
                    <Card className="border-0 shadow-lg mb-4" style={{ borderRadius: '24px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <CardBody className="p-4">
                            <h5 className="fw-bold text-white mb-4 d-flex align-items-center gap-2">
                                <Plus size={20} className="text-info" /> Register New Supply
                            </h5>
                            <Form onSubmit={handleAdd}>
                                <FormGroup className="mb-3">
                                    <Label className="small fw-bold text-uppercase text-white opacity-75">Supply Type</Label>
                                    <Input 
                                        type="select" 
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none"
                                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <option className="bg-dark">Food</option>
                                        <option className="bg-dark">Water</option>
                                        <option className="bg-dark">Medicine</option>
                                        <option className="bg-dark">Shelter/Tents</option>
                                        <option className="bg-dark">Clothing</option>
                                        <option className="bg-dark">Equipment</option>
                                        <option className="bg-dark">Other</option>
                                    </Input>
                                </FormGroup>
                                {formData.type === 'Other' && (
                                    <FormGroup className="mb-3">
                                        <Label className="small fw-bold text-uppercase text-white opacity-75">Specify Supply Type</Label>
                                        <Input 
                                            placeholder="e.g. Generators"
                                            value={formData.customType}
                                            onChange={(e) => setFormData({...formData, customType: e.target.value})}
                                            className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none ${fieldErrors.customType ? 'is-invalid' : ''}`}
                                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                        {fieldErrors.customType && <div className="text-danger small mt-1">{fieldErrors.customType}</div>}
                                    </FormGroup>
                                )}
                                {(formData.type.toLowerCase().includes('food') || (formData.type === 'Other' && (formData.customType || '').toLowerCase().includes('food'))) && (
                                    <FormGroup className="mb-3">
                                        <Label className="small fw-bold text-uppercase text-white opacity-75">Food Category</Label>
                                        <SearchableDropdown 
                                            options={FOOD_OPTIONS}
                                            value={formData.foodCategory}
                                            onChange={(val) => setFormData({...formData, foodCategory: val})}
                                            placeholder="Select Food Category..."
                                            error={!!fieldErrors.foodCategory}
                                        />
                                        {fieldErrors.foodCategory && <div className="text-danger small mt-1">{fieldErrors.foodCategory}</div>}
                                    </FormGroup>
                                )}
                                <FormGroup className="mb-3">
                                    <Label className="small fw-bold text-uppercase text-white opacity-75">Quantity Units</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="e.g. 500"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                        className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none ${fieldErrors.quantity ? 'is-invalid' : ''}`}
                                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    {fieldErrors.quantity && <div className="text-danger small mt-1">{fieldErrors.quantity}</div>}
                                </FormGroup>
                                <FormGroup className="mb-4">
                                    <Label className="small fw-bold text-uppercase text-white opacity-75">Storage Sector</Label>
                                    <Input 
                                        placeholder="e.g. Warehouse 7"
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none ${fieldErrors.location ? 'is-invalid' : ''}`}
                                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    {fieldErrors.location && <div className="text-danger small mt-1">{fieldErrors.location}</div>}
                                </FormGroup>
                                {(formData.type.toLowerCase().includes('food') || formData.type === 'Other') && (
                                    <FormGroup className="mb-4">
                                        <Label className="small fw-bold text-uppercase text-white opacity-75">
                                            Expiry Date {formData.type === 'Other' && !(formData.customType || '').toLowerCase().includes('food') ? '(Optional)' : ''}
                                        </Label>
                                        <Input
                                            type="date"
                                            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                            className={`rounded-3 border-0 bg-secondary bg-opacity-25 text-white shadow-none ${fieldErrors.expiryDate ? 'is-invalid' : ''}`}
                                        />
                                        {fieldErrors.expiryDate && <div className="text-danger small mt-1">{fieldErrors.expiryDate}</div>}
                                    </FormGroup>
                                )}
                                <Button color="info" block className="rounded-pill py-2 fw-bold border-0 shadow-lg">
                                    INITIALIZE STOCK
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={8}>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="info" />
                        </div>
                    ) : (
                        <>
                            {[
                                { status: 'In Stock', title: 'In Stock (Available Stockpile)', color: 'rgba(34, 197, 94, 0.05)', bgOpacity: '0.02' },
                                { status: 'Allocated', title: 'Allocated (Pending Dispatch)', color: 'rgba(59, 130, 246, 0.05)', bgOpacity: '0.02' },
                                { status: 'Used', title: 'Used (Deployed & Consumed)', color: 'rgba(255,255,255,0.05)', bgOpacity: '0.01' },
                                { status: 'Collected', title: 'Collected (Returned/Recovered)', color: 'rgba(255,255,255,0.05)', bgOpacity: '0.01' },
                                { status: 'Expired', title: 'Expired (Unusable)', color: 'rgba(239, 68, 68, 0.05)', bgOpacity: '0.01' }
                            ].map(({ status, title, color, bgOpacity }) => {
                                const statusResources = resources.filter(r => r.status === status);
                                if (statusResources.length === 0) return null;

                                return (
                                    <div key={status} className="mb-5">
                                        <h5 className="text-white mt-2 mb-3 fw-bold">{title}</h5>
                                        <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '24px', background: `rgba(255,255,255,${bgOpacity})`, backdropFilter: 'blur(10px)' }}>
                                            <CardBody className="p-0">
                                                <div className="table-responsive">
                                                    <Table hover borderless className="m-0 text-white align-middle">
                                                        <thead style={{ backgroundColor: color }}>
                                                            <tr className="text-uppercase small fw-bold text-muted">
                                                                <th className="px-4 py-3">Resource</th>
                                                                <th className="py-3">Quantity</th>
                                                                <th className="py-3">Location</th>
                                                                <th className="py-3">Expiry</th>
                                                                <th className="py-3">Status</th>
                                                                {(status === 'In Stock' || status === 'Allocated') && <th className="py-3 text-end px-4">Action</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {statusResources.map((resource) => (
                                                                <tr key={resource._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <td className="px-4 py-4">
                                                                        <div className="d-flex align-items-center gap-3">
                                                                            <Package size={18} className="text-info" />
                                                                            <span className="fw-bold">{resource.type}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td>{resource.quantity}</td>
                                                                    <td>
                                                                        <div className="d-flex align-items-center gap-1 opacity-75">
                                                                            <MapPin size={14} /> {resource.location}
                                                                        </div>
                                                                    </td>
                                                                    <td className={resource.status === 'Expired' ? 'text-danger fw-bold' : ''}>{resource.expiryDate ? new Date(resource.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                                                    <td>
                                                                        <Badge color={resource.status === 'Expired' ? 'danger' : (resource.status === 'In Stock' ? 'success' : (resource.status === 'Allocated' ? 'info' : 'secondary'))} pill className="px-3">{resource.status}</Badge>
                                                                    </td>
                                                                    {(status === 'In Stock' || status === 'Allocated') && (
                                                                        <td className="text-end px-4">
                                                                            <Button onClick={() => handleDelete(resource._id)} color="danger" size="sm" className="rounded-circle p-2 border-0 opacity-75 shadow-sm hover-grow">
                                                                                <Trash2 size={14} />
                                                                            </Button>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                );
                            })}
                            {resources.length === 0 && (
                                <div className="text-center py-5 text-muted">
                                    No inventory recorded for this node.
                                </div>
                            )}
                        </>
                    )}
                </Col>
            </Row>
        </DashboardLayout>
    );
};

export default ResourceAllocation;
