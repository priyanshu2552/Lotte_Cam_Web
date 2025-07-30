import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrash, faPlus, faTimes,
    faSave, faCamera, faBarcode, faBoxes,
    faExpand, faCompress
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
    const [showROIModal, setShowROIModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [currentCamera, setCurrentCamera] = useState(null); // 'count' or 'barcode'
    const [currentPoints, setCurrentPoints] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Form states
    const [unitForm, setUnitForm] = useState({ name: '' });
    const [beltForm, setBeltForm] = useState({
        name: '',
        CameraCount: '',
        CameraBarcode: '',
        Unit: '',
        ROI_Count: null,
        ROI_Barcode: null
    });

    const [productForm, setProductForm] = useState({
        name: '',
        code: '',
        pieces: 0
    });

    // Refs
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const playerRef = useRef(null);

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
        // Set default unit if none is selected
        if (response.data.data?.length > 0 && !beltForm.Unit) {
            setBeltForm(prev => ({ ...prev, Unit: response.data.data[0].name }));
        }
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
    const handleCancelROI = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setCurrentPoints([]);
        setShowROIModal(false);

        // Stop video playback
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = '';
        }
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
                    Unit: item.Unit,
                    ROI_Count: item.ROI_Count,
                    ROI_Barcode: item.ROI_Barcode
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
                    Unit: units.length > 0 ? units[0].name : '',
                    ROI_Count: null,
                    ROI_Barcode: null
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

    const handleOpenROIModal = (cameraType) => {
        setCurrentCamera(cameraType);
        setCurrentPoints([]);
        setShowROIModal(true);

        // Initialize player when modal opens
        setTimeout(() => {
            initPlayer(cameraType === 'count' ? beltForm.CameraCount : beltForm.CameraBarcode);
        }, 100);
    };

    const initPlayer = (rtspUrl) => {
        // In a real app, you would use a proper RTSP player here
        // This is just a placeholder - you'll need to implement actual RTSP streaming
        console.log("Initializing player for RTSP URL:", rtspUrl);

        // For demo purposes, we'll just show a placeholder
        if (videoRef.current) {
            videoRef.current.src = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";
            videoRef.current.load();
        }
    };

    const handleCanvasClick = (e) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Calculate scale factors in case the canvas is scaled
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setCurrentPoints(prev => {
            const newPoints = [...prev, { x, y }];

            // Draw on canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw all points
            ctx.fillStyle = 'red';
            newPoints.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Draw connecting lines
            if (newPoints.length > 1) {
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(newPoints[0].x, newPoints[0].y);

                for (let i = 1; i < newPoints.length; i++) {
                    ctx.lineTo(newPoints[i].x, newPoints[i].y);
                }

                // Close the polygon if we have 4 points
                if (newPoints.length === 4) {
                    ctx.lineTo(newPoints[0].x, newPoints[0].y);
                }

                ctx.stroke();
            }

            return newPoints;
        });
    };

    const handleSaveROI = () => {
        if (currentPoints.length !== 4) {
            alert('Please select exactly 4 points to define the ROI');
            return;
        }

        if (currentCamera === 'count') {
            setBeltForm(prev => ({
                ...prev,
                ROI_Count: currentPoints
            }));
        } else {
            setBeltForm(prev => ({
                ...prev,
                ROI_Barcode: currentPoints
            }));
        }

        setShowROIModal(false);
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setCurrentPoints([]);
        }
    };

    const toggleFullscreen = () => {
        const elem = document.querySelector('.roi-modal .video-wrapper');

        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
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
                            onSetROI={(type, belt) => {
                                setCurrentItem(belt);
                                setBeltForm({
                                    name: belt.name,
                                    CameraCount: belt.CameraCount,
                                    CameraBarcode: belt.CameraBarcode,
                                    Unit: belt.Unit,
                                    ROI_Count: belt.ROI_Count,
                                    ROI_Barcode: belt.ROI_Barcode
                                });
                                handleOpenROIModal(type);
                            }}
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
                                        onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
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
                                        onChange={(e) => setBeltForm({ ...beltForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faCamera} /> Count Camera RTSP URL
                                    </label>
                                    <input
                                        type="text"
                                        value={beltForm.CameraCount}
                                        onChange={(e) => setBeltForm({ ...beltForm, CameraCount: e.target.value })}
                                        placeholder="rtsp://..."
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="set-roi-btn"
                                        onClick={() => handleOpenROIModal('count')}
                                        disabled={!beltForm.CameraCount}
                                    >
                                        Set ROI
                                    </button>
                                    {beltForm.ROI_Count && (
                                        <div className="roi-status">
                                            ROI Set ({beltForm.ROI_Count.length} points)
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>
                                        <FontAwesomeIcon icon={faBarcode} /> Barcode Camera RTSP URL
                                    </label>
                                    <input
                                        type="text"
                                        value={beltForm.CameraBarcode}
                                        onChange={(e) => setBeltForm({ ...beltForm, CameraBarcode: e.target.value })}
                                        placeholder="rtsp://..."
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="set-roi-btn"
                                        onClick={() => handleOpenROIModal('barcode')}
                                        disabled={!beltForm.CameraBarcode}
                                    >
                                        Set ROI
                                    </button>
                                    {beltForm.ROI_Barcode && (
                                        <div className="roi-status">
                                            ROI Set ({beltForm.ROI_Barcode.length} points)
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select
                                        value={beltForm.Unit}
                                        onChange={(e) => setBeltForm({ ...beltForm, Unit: e.target.value })}
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
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Product Code</label>
                                    <input
                                        type="text"
                                        value={productForm.code}
                                        onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
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
                                        onChange={(e) => setProductForm({ ...productForm, pieces: parseInt(e.target.value) || 0 })}
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

                {/* ROI Modal */}
                {showROIModal && (
                    <div className="modal-overlay roi-modal">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>Set ROI for {currentCamera === 'count' ? 'Count Camera' : 'Barcode Camera'}</h2>
                                <button onClick={handleCancelROI}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <div className="roi-content">
                                <div className="video-wrapper">
                                    <video
                                        ref={videoRef}
                                        controls
                                        autoPlay
                                        playsInline
                                        style={{ width: '100%' }}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        width="640"
                                        height="480"
                                        onClick={handleCanvasClick}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            cursor: 'crosshair',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                    <button
                                        className="fullscreen-btn"
                                        onClick={toggleFullscreen}
                                        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                    >
                                        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                                    </button>
                                </div>
                                <div className="instructions">
                                    <p>Click on the video to mark the 4 corners of your ROI in clockwise order.</p>
                                    <p>Points selected: {currentPoints.length}/4</p>
                                    {currentPoints.length > 0 && (
                                        <div className="points-list">
                                            {currentPoints.map((point, index) => (
                                                <div key={index}>Point {index + 1}: ({Math.round(point.x)}, {Math.round(point.y)})</div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="clear-btn"
                                        onClick={() => {
                                            if (canvasRef.current) {
                                                const ctx = canvasRef.current.getContext('2d');
                                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                                            }
                                            setCurrentPoints([]);
                                        }}
                                    >
                                        Clear Points
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={handleCancelROI}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="save-btn"
                                    onClick={handleSaveROI}
                                    disabled={currentPoints.length !== 4}
                                >
                                    <FontAwesomeIcon icon={faSave} /> Save ROI
                                </button>
                            </div>
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
const BeltsTable = ({ belts, isAdmin, onEdit, onDelete, onSetROI }) => (
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Count Camera</th>
                <th>Barcode Camera</th>
                <th>Unit</th>
                <th>Count ROI</th>
                <th>Barcode ROI</th>
                {isAdmin && <th>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {belts.map(belt => (
                <tr key={belt.id}>
                    <td>{belt.id}</td>
                    <td>{belt.name}</td>
                    <td>
                        <div className="camera-cell">
                            <div className="camera-url">{belt.CameraCount}</div>
                            {isAdmin && (
                                <button
                                    onClick={() => onSetROI('count', belt)}
                                    className="small-btn"
                                >
                                    Set ROI
                                </button>
                            )}
                        </div>
                    </td>
                    <td>
                        <div className="camera-cell">
                            <div className="camera-url">{belt.CameraBarcode}</div>
                            {isAdmin && (
                                <button
                                    onClick={() => onSetROI('barcode', belt)}
                                    className="small-btn"
                                >
                                    Set ROI
                                </button>
                            )}
                        </div>
                    </td>
                    <td>{belt.Unit}</td>
                    <td>{belt.ROI_Count ? '✔' : '✖'}</td>
                    <td>{belt.ROI_Barcode ? '✔' : '✖'}</td>
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