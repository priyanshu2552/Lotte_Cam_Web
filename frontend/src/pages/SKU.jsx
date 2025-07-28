import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, faTrash, faPlus, faTimes,
  faSave, faCamera, faBarcode, faBoxes
} from '@fortawesome/free-solid-svg-icons';
import '../styles/SKUManagement.css';
import Sidebar from '../components/Sidebar';

const SKUManagement = () => {
    const [units, setUnits] = useState([]);
    const [belts, setBelts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('units');
    const navigate = useNavigate();

    // Modal states
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [showBeltModal, setShowBeltModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    // Form states
    const [unitForm, setUnitForm] = useState({ name: '' });
    const [beltForm, setBeltForm] = useState({ 
        name: '', 
        CameraCount: '', 
        CameraBarcode: '', 
        Unit: units.length > 0 ? units[0].name : '' 
    });
    const [productForm, setProductForm] = useState({ 
        name: '', 
        code: '', 
        pieces: 0 
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const userResponse = await axios.get('http://localhost:3000/api/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setIsAdmin(userResponse.data.role === 'admin');
                
                await Promise.all([
                    fetchUnits(token),
                    fetchBelts(token),
                    fetchProducts(token)
                ]);
                
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again.');
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const fetchUnits = async (token) => {
        const response = await axios.get('http://localhost:3000/api/users/getallunits', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUnits(response.data.data || []);
    };

    const fetchBelts = async (token) => {
        const response = await axios.get('http://localhost:3000/api/users/getallbelts', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setBelts(response.data || []);
    };

    const fetchProducts = async (token) => {
        const response = await axios.get('http://localhost:3000/api/users/getallproducts', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(response.data || []);
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            let endpoint = '';
            
            switch (type) {
                case 'unit':
                    endpoint = `delete-unit/${id}`;
                    break;
                case 'belt':
                    endpoint = `delete-belt/${id}`;
                    break;
                case 'product':
                    endpoint = `delete-product/${id}`;
                    break;
                default:
                    return;
            }
            
            await axios.delete(`http://localhost:3000/api/users/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Refresh data
            if (type === 'unit') await fetchUnits(token);
            if (type === 'belt') await fetchBelts(token);
            if (type === 'product') await fetchProducts(token);
            
        } catch (err) {
            console.error(`Error deleting ${type}:`, err);
            setError(`Failed to delete ${type}`);
        }
    };

    const handleEdit = (type, item) => {
        setCurrentItem(item);
        switch (type) {
            case 'unit':
                setUnitForm({ name: item.name });
                setShowUnitModal(true);
                break;
            case 'belt':
                setBeltForm({
                    name: item.name,
                    CameraCount: item.CameraCount,
                    CameraBarcode: item.CameraBarcode,
                    Unit: item.Unit
                });
                setShowBeltModal(true);
                break;
            case 'product':
                setProductForm({
                    name: item.name,
                    code: item.code,
                    pieces: item.pieces
                });
                setShowProductModal(true);
                break;
            default:
                break;
        }
    };

    const handleAddNew = () => {
        switch (activeTab) {
            case 'units':
                setUnitForm({ name: '' });
                setCurrentItem(null);
                setShowUnitModal(true);
                break;
            case 'belts':
                setBeltForm({ 
                    name: '', 
                    CameraCount: '', 
                    CameraBarcode: '', 
                    Unit: units.length > 0 ? units[0].name : '' 
                });
                setCurrentItem(null);
                setShowBeltModal(true);
                break;
            case 'products':
                setProductForm({ name: '', code: '', pieces: 0 });
                setCurrentItem(null);
                setShowProductModal(true);
                break;
            default:
                break;
        }
    };

    const handleUnitSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (currentItem) {
                // Update existing unit
                await axios.put(
                    `http://localhost:3000/api/users/update-unit/${currentItem.id}`,
                    { name: unitForm.name },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Create new unit
                await axios.post(
                    'http://localhost:3000/api/users/create-unit',
                    { name: unitForm.name },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            await fetchUnits(token);
            setShowUnitModal(false);
        } catch (err) {
            console.error('Error saving unit:', err);
            setError('Failed to save unit');
        }
    };

    const handleBeltSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (currentItem) {
                // Update existing belt
                await axios.put(
                    `http://localhost:3000/api/users/update-belt/${currentItem.id}`,
                    beltForm,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Create new belt
                await axios.post(
                    'http://localhost:3000/api/users/create-belt',
                    beltForm,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            await fetchBelts(token);
            setShowBeltModal(false);
        } catch (err) {
            console.error('Error saving belt:', err);
            setError('Failed to save belt');
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (currentItem) {
                // Update existing product
                await axios.put(
                    `http://localhost:3000/api/users/update-product/${currentItem.id}`,
                    productForm,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Create new product
                await axios.post(
                    'http://localhost:3000/api/users/create-product',
                    productForm,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            await fetchProducts(token);
            setShowProductModal(false);
        } catch (err) {
            console.error('Error saving product:', err);
            setError('Failed to save product');
        }
    };

    if (loading) {
        return (
            <div className="sku-container">
                <Sidebar />
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading SKU data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sku-container">
            <Sidebar />
            <div className="sku-content">
                <h1>SKU Management</h1>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'units' ? 'active' : ''}`}
                        onClick={() => setActiveTab('units')}
                    >
                        Units
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'belts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('belts')}
                    >
                        Belts
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                </div>
                
                {isAdmin && (
                    <button className="add-new-btn" onClick={handleAddNew}>
                        <FontAwesomeIcon icon={faPlus} /> Add New
                    </button>
                )}
                
                <div className="data-table">
                    {activeTab === 'units' && (
                        <UnitsTable 
                            units={units} 
                            isAdmin={isAdmin} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete} 
                        />
                    )}
                    
                    {activeTab === 'belts' && (
                        <BeltsTable 
                            belts={belts} 
                            isAdmin={isAdmin} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete} 
                        />
                    )}
                    
                    {activeTab === 'products' && (
                        <ProductsTable 
                            products={products} 
                            isAdmin={isAdmin} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete} 
                        />
                    )}
                </div>

                {/* Unit Modal */}
                {showUnitModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>{currentItem ? 'Edit Unit' : 'Add New Unit'}</h2>
                                <button onClick={() => setShowUnitModal(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <form onSubmit={handleUnitSubmit}>
                                <div className="form-group">
                                    <label>Unit Name</label>
                                    <input
                                        type="text"
                                        value={unitForm.name}
                                        onChange={(e) => setUnitForm({...unitForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowUnitModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn">
                                        <FontAwesomeIcon icon={faSave} /> Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Belt Modal */}
                {showBeltModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>{currentItem ? 'Edit Belt' : 'Add New Belt'}</h2>
                                <button onClick={() => setShowBeltModal(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <form onSubmit={handleBeltSubmit}>
                                <div className="form-group">
                                    <label>Belt Name</label>
                                    <input
                                        type="text"
                                        value={beltForm.name}
                                        onChange={(e) => setBeltForm({...beltForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faCamera} /> Camera Count
                                    </label>
                                    <input
                                        type="text"
                                        value={beltForm.CameraCount}
                                        onChange={(e) => setBeltForm({...beltForm, CameraCount: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faBarcode} /> Camera Barcode
                                    </label>
                                    <input
                                        type="text"
                                        value={beltForm.CameraBarcode}
                                        onChange={(e) => setBeltForm({...beltForm, CameraBarcode: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select
                                        value={beltForm.Unit}
                                        onChange={(e) => setBeltForm({...beltForm, Unit: e.target.value})}
                                        required
                                    >
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.name}>
                                                {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowBeltModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn">
                                        <FontAwesomeIcon icon={faSave} /> Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Product Modal */}
                {showProductModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>{currentItem ? 'Edit Product' : 'Add New Product'}</h2>
                                <button onClick={() => setShowProductModal(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <form onSubmit={handleProductSubmit}>
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input
                                        type="text"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Product Code</label>
                                    <input
                                        type="text"
                                        value={productForm.code}
                                        onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faBoxes} /> Pieces
                                    </label>
                                    <input
                                        type="number"
                                        value={productForm.pieces}
                                        onChange={(e) => setProductForm({...productForm, pieces: parseInt(e.target.value) || 0})}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowProductModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn">
                                        <FontAwesomeIcon icon={faSave} /> Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Component for Units Table
const UnitsTable = ({ units, isAdmin, onEdit, onDelete }) => (
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                {isAdmin && <th>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {units.map(unit => (
                <tr key={unit.id}>
                    <td>{unit.id}</td>
                    <td>{unit.name}</td>
                    {isAdmin && (
                        <td className="actions">
                            <button onClick={() => onEdit('unit', unit)}>
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button onClick={() => onDelete('unit', unit.id)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
);

// Component for Belts Table
const BeltsTable = ({ belts, isAdmin, onEdit, onDelete }) => (
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Camera Count</th>
                <th>Camera Barcode</th>
                <th>Unit</th>
                {isAdmin && <th>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {belts.map(belt => (
                <tr key={belt.id}>
                    <td>{belt.id}</td>
                    <td>{belt.name}</td>
                    <td>{belt.CameraCount}</td>
                    <td>{belt.CameraBarcode}</td>
                    <td>{belt.Unit}</td>
                    {isAdmin && (
                        <td className="actions">
                            <button onClick={() => onEdit('belt', belt)}>
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button onClick={() => onDelete('belt', belt.id)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
);

// Component for Products Table
const ProductsTable = ({ products, isAdmin, onEdit, onDelete }) => (
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Code</th>
                <th>Pieces</th>
                {isAdmin && <th>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {products.map(product => (
                <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.code}</td>
                    <td>{product.pieces}</td>
                    {isAdmin && (
                        <td className="actions">
                            <button onClick={() => onEdit('product', product)}>
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button onClick={() => onDelete('product', product.id)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
);

export default SKUManagement;