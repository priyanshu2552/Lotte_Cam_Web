import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';
import Sidebar from '../components/Sidebar';
import { useWebSocket } from '../context/WebSocketContext';
import CameraStream from '../components/CameraStream';
const Dashboard = () => {
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [belts, setBelts] = useState([]);
    const [loading, setLoading] = useState({
        units: true,
        belts: false
    });
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const beltsPerPage = 4; // Show 4 belts per page (2 rows of 2)
    const navigate = useNavigate();
    const socket = useWebSocket();

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                setLoading(prev => ({ ...prev, units: true }));
                const response = await axios.get('http://localhost:3000/api/users/getallunits', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const unitsData = response.data.success ? response.data.data : [];
                setUnits(unitsData);

                if (unitsData.length > 0) {
                    setSelectedUnit(unitsData[0].name);
                }

            } catch (err) {
                console.error('Error fetching units:', err);
                setError('Failed to load units');
            } finally {
                setLoading(prev => ({ ...prev, units: false }));
            }
        };

        fetchUnits();
    }, []);

    useEffect(() => {
        if (!selectedUnit || !socket) return;

        const fetchData = async () => {
            console.log("🔄 Fetching dashboard data...");
            try {
                const response = await axios.get('http://localhost:3000/api/users/dashboard-data', {
                    params: { unitName: selectedUnit },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                console.log("📊 Data received:", response.data);
                setBelts(response.data.belts || []);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load belt data');
            }
        };

        // Initial fetch
        fetchData();

        // Setup socket listener with debounce
        const debounceTimer = setTimeout(fetchData, 500);
        socket.on('dataChanged', () => {
            clearTimeout(debounceTimer);
            setTimeout(fetchData, 500);
        });

        return () => {
            socket.off('dataChanged');
            clearTimeout(debounceTimer);
        };
    }, [selectedUnit, socket]);
    const indexOfLastBelt = currentPage * beltsPerPage;
    const indexOfFirstBelt = indexOfLastBelt - beltsPerPage;
    const currentBelts = belts.slice(indexOfFirstBelt, indexOfLastBelt);
    const totalPages = Math.ceil(belts.length / beltsPerPage);

    const handleUnitChange = (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        setSelectedUnit(selectedOption.text);
        setCurrentPage(1);
    };

    if (loading.units) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading units...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Production Dashboard</h1>
                    <div className="unit-selector">
                        <div className="select-wrapper">
                            <select
                                id="unit-select"
                                value={units.find(u => u.name === selectedUnit)?.id || ''}
                                onChange={handleUnitChange}
                                disabled={loading.belts || units.length === 0}
                            >
                                {units.length === 0 ? (
                                    <option value="">No units available</option>
                                ) : (
                                    units.map(unit => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <div className="select-arrow"></div>
                        </div>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                {loading.belts ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading belt data...</p>
                    </div>
                ) : (
                    <>
                        <div className="belts-grid">
                            {currentBelts.length > 0 ? (
                                currentBelts.map(belt => (
                                    <div key={belt.id} className="belt-card">
                                        <div className="belt-header">
                                            <h2>{belt.name}</h2>
                                            <div className="belt-status active">Active</div>
                                        </div>

                                        <div className="belt-content">
                                            {/* Single Camera Feed */}
                                           // Replace the existing video iframe with:
                                            <CameraStream
                                                rtspUrl={belt.CameraCount}
                                                showCanvas={false}
                                            />

                                            <div className="production-data">
                                                <h3>Today's Production</h3>
                                                {belt.production && belt.production.length > 0 ? (
                                                    <div className="production-cards">
                                                        {belt.production.map((prod, idx) => (
                                                            <div key={idx} className="product-card">
                                                                <div className="product-header">
                                                                    <h4>{prod.product_name}</h4>
                                                                    <span className="product-code">{prod.product_code}</span>
                                                                </div>
                                                                <div className="product-stats">
                                                                    <div className="stat-box">
                                                                        <div className="stat-value">{prod.total_boxes}</div>
                                                                        <div className="stat-label">Boxes</div>
                                                                    </div>
                                                                    <div className="stat-box">
                                                                        <div className="stat-value">{prod.total_pieces}</div>
                                                                        <div className="stat-label">Pieces</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="no-production">
                                                        <p>No production recorded today</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-belts-message">
                                    {selectedUnit !== null ? 'No belts found for this unit' : 'Please select a unit'}
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="pagination-button"
                                >
                                    &larr; Previous
                                </button>
                                <div className="page-indicator">
                                    Page <span className="current-page">{currentPage}</span> of <span className="total-pages">{totalPages}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="pagination-button"
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;