import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Select, Button, Card, Statistic, Row, Col, message, Layout } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/Record.css'; 
const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ProductionRecords = () => {
    const [loading, setLoading] = useState(false);
    const [belts, setBelts] = useState([]);
    const [data, setData] = useState(null);
    const [units, setUnits] = useState([]);
    const [products, setProducts] = useState([]);
    const [total_b, setTotal_b] = useState(0);
    const [total_p, setTotal_p] = useState(0);

    const [filters, setFilters] = useState({
        unitName: null,  
        beltId: null,
        productId: null,
        dateRange: [moment().subtract(10, 'days'), moment()]
    });
    const api = axios.create({
        baseURL: 'http://localhost:3000/api/users',
        timeout: 10000,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    useEffect(() => {
        fetchUnits();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (filters.unitName) {
            fetchBeltsByUnit(filters.unitName);

        } else {
            setBelts([]);
            setFilters(prev => ({ ...prev, beltId: null }));
        }
    }, [filters.unitName]);

    const fetchUnits = async () => {
        try {
            const response = await api.get('/getallunits');
            setUnits(Array.isArray(response.data.data) ? response.data.data : []);
            console.log(response.data.data);
        } catch (error) {
            console.error('Error fetching units:', error);
            message.error('Failed to fetch units');
            setUnits([]);
        }
    };

    const fetchBeltsByUnit = async (unitName) => {
        try {
            const response = await api.get(`/getbeltsbyunit/${unitName}`);
     
            const beltsData = Array.isArray(response.data) ? response.data : [];
            setBelts(beltsData);
            console.log('Fetched belts:', beltsData);
        } catch (error) {
            console.error('Error fetching belts:', error);
            message.error('Failed to fetch belts');
            setBelts([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/getallproducts');
            setProducts(response.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            message.error('Failed to fetch products');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                unitName: filters.unitName,  
                beltId: filters.beltId,
                productId: filters.productId,
                startDate: filters.dateRange[0]?.add(1, 'day').format('YYYY-MM-DD'),
                endDate: filters.dateRange[1]?.add(1, 'day').format('YYYY-MM-DD')
            };
               
            const response = await api.get('/production/records', { params });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching production records:', error);
            message.error('Failed to fetch production records');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = {
                unitId: filters.unitId,
                beltId: filters.beltId,
                productId: filters.productId,
                startDate: filters.dateRange[0]?.format('YYYY-MM-DD'),
                endDate: filters.dateRange[1]?.format('YYYY-MM-DD')
            };

            const response = await api.get('/production/records/export', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'production_records.csv');
            document.body.appendChild(link);
            link.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            message.success('Export started successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            message.error('Failed to export data');
        }
    };

    const handleFilterChange = (name, value) => {
        const newFilters = { ...filters, [name]: value };

        if (name === 'unitName') { 
            newFilters.beltId = null;
            newFilters.productId = null;
        } else if (name === 'beltId') {
            newFilters.productId = null;
        }

        setFilters(newFilters);
    };

    const handleDateChange = (dates) => {
        setFilters(prev => ({ ...prev, dateRange: dates }));
    };



    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => new Date(a.date) - new Date(b.date),
            sortDirections: ['descend', 'ascend']
        },
        {
            title: 'Belt',
            dataIndex: 'belt_name',
            key: 'belt_name',
            sorter: (a, b) => a.belt_name.localeCompare(b.belt_name),
            sortDirections: ['descend', 'ascend']
        },
        {
            title: 'Product',
            dataIndex: 'product_name',
            key: 'product_name',
            render: (text, record) => (
                <div>
                    <div>{text}</div>
                    <div className="text-muted">{record.product_code}</div>
                </div>
            ),
            sorter: (a, b) => a.product_name.localeCompare(b.product_name),
            sortDirections: ['descend', 'ascend']
        },
        {
            title: 'Boxes',
            dataIndex: 'total_boxes',
            key: 'total_boxes',
            align: 'right',
            render: (text) => text.toLocaleString(),
            sorter: (a, b) => a.total_boxes - b.total_boxes,
            sortDirections: ['descend', 'ascend']
        },
        {
            title: 'Pieces',
            dataIndex: 'total_pieces',
            key: 'total_pieces',
            align: 'right',
            render: (text) => text.toLocaleString(),
            sorter: (a, b) => a.total_pieces - b.total_pieces,
            sortDirections: ['descend', 'ascend']
        },
        {
            title: 'Entries',
            dataIndex: 'entries_count',
            key: 'entries_count',
            align: 'right',
            render: (text) => text.toLocaleString(),
            sorter: (a, b) => a.entries_count - b.entries_count,
            sortDirections: ['descend', 'ascend']
        }
    ];


    const tableData = data ? Object.values(data.daily_records).flatMap(day =>
        Object.values(day.belts).flatMap(belt =>
            belt.products.map(product => ({
                key: `${day.date}-${belt.belt_id}-${product.product_id}`,
                date: day.date,
                belt_name: belt.belt_name,
                product_name: product.product_name,
                product_code: product.product_code,
                total_boxes: product.total_boxes,
                total_pieces: product.total_pieces,
                entries_count: product.entries_count
            }))
        )
    ) : [];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar />

            <Layout className="site-layout" style={{ marginLeft: 280 }}>
                <Content style={{ margin: '20px', overflow: 'initial' }}>
                    <div className="production-records" style={{ padding: '20px' }}>
                        <div className="filters mb-4">
                            <Card title="Filters">
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Select
                                            placeholder="Select Unit"
                                            style={{ width: '100%' }}
                                            onChange={(value) => handleFilterChange('unitName', value)}
                                            allowClear
                                            value={filters.unitName}
                                        >
                                            {units.map(unit => (
                                                <Option key={unit.name} value={unit.name}>
                                                    {unit.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>

                                    <Col span={6}>
                                        <Select
                                            placeholder="Select Belt"
                                            style={{ width: '100%' }}
                                            onChange={(value) => handleFilterChange('beltId', value)}
                                            allowClear
                                            disabled={!filters.unitName}
                                            value={filters.beltId}
                                        >
                                            {belts.map(belt => (
                                                <Option key={belt.id} value={belt.id}>
                                                    {belt.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>

                                    <Col span={6}>
                                        <Select
                                            placeholder="Select Product"
                                            style={{ width: '100%' }}
                                            onChange={(value) => handleFilterChange('productId', value)}
                                            allowClear
                                            value={filters.productId}
                                        >
                                            {products.map(product => (
                                                <Option key={product.id} value={product.id}>
                                                    {product.name} ({product.code})
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>

                                    <Col span={6}>
                                        <RangePicker
                                            style={{ width: '100%' }}
                                            value={filters.dateRange}
                                            onChange={handleDateChange}
                                            disabledDate={(current) => current && current > moment().endOf('day')}
                                        />
                                    </Col>
                                </Row>

                                <Row gutter={16} className="mt-3">
                                    <Col span={24} style={{ textAlign: 'right' }}>
                                        <Button
                                            type="primary"
                                            onClick={fetchData}
                                            loading={loading}
                                            style={{ marginRight: 8 }}
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            icon={<DownloadOutlined />}
                                            onClick={handleExport}
                                            disabled={!data}
                                        >
                                            Export to CSV
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>
                        </div>

                        {data && (
                            <div className="summary mb-4">
                                <Card title="Summary">
                                    <Row gutter={16}>
                                        <Col span={6}>
                                            <Statistic
                                                title="Days"
                                                value={data.summary.days_count}
                                            />
                                        </Col>
                                        <Col span={6}>
                                            <Statistic
                                                title="Total Boxes"
                                                value={tableData.reduce((sum, record) => sum + record.total_boxes, 0).toLocaleString()}
                                            />
                                        </Col>
                                        <Col span={6}>
                                            <Statistic
                                                title="Total Pieces"
                                                value={tableData.reduce((sum, record) => sum + record.total_pieces, 0).toLocaleString()}
                                            />
                                        </Col>
                                        <Col span={6}>
                                            <Statistic
                                                title="Total Entries"
                                                value={data.summary.total_entries}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </div>
                        )}
                        <Card title="Production Records">
                            <Table
                                columns={columns}
                                dataSource={tableData}
                                loading={loading}
                                pagination={{
                                    pageSize: 20,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['10', '20', '50', '100']
                                }}
                                scroll={{ x: true }}
                                expandable={{
                                    expandedRowRender: record => (
                                        <div style={{ margin: 0 }}>
                                            <p><strong>Date:</strong> {record.date}</p>
                                            <p><strong>Belt:</strong> {record.belt_name}</p>
                                            <p><strong>Product:</strong> {record.product_name} ({record.product_code})</p>
                                            <p><strong>Total Boxes:</strong> {record.total_boxes}</p>
                                            <p><strong>Total Pieces:</strong> {record.total_pieces}</p>
                                            <p><strong>Total Entries:</strong> {record.entries_count}</p>
                                        </div>
                                    ),
                                    rowExpandable: record => true
                                }}
                            />
                        </Card>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default ProductionRecords;