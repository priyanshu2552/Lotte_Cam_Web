import express from 'express';
import authController from '../controllers/authController.js';
import profileController from '../controllers/profileController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import UserController from '../controllers/userController.js';
import UnitController from '../controllers/unitController.js';
import ProductController from '../controllers/productController.js';
import BeltController from '../controllers/beltController.js';
import ProductionController from '../controllers/productionController.js';
const router = express.Router();

// Authentication routes
router.post('/login', authController.Login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Profile routes (protected)
router.get('/profile', authenticate, profileController.getProfile);
router.put('/profile', authenticate, profileController.updateProfile);
router.post('/change-password', authenticate, profileController.ChangePassword);

//User-Creation or Deletion  Routes
router.post('/create-user', authenticate, authorize(['admin']), UserController.createUser);
router.get('/getallusers', authenticate, authorize(['admin']), UserController.getAllUsers);
router.delete('/delete-user/:id', authenticate, authorize(['admin']), UserController.deleteUser);
router.put('/update-user/:id', authenticate, authorize(['admin']), UserController.updateUser);

//unit-routes:
router.post('/create-unit', authenticate, authorize(['admin']), UnitController.createUnit);
router.get('/getallunits', authenticate, UnitController.getAllUnits);
router.delete('/delete-unit/:id', authenticate, authorize(['admin']), UnitController.deleteUnit);

//product routes
router.post('/create-product', authenticate, authorize(['admin']), ProductController.createProduct);
router.get('/getallproducts', authenticate, ProductController.getAllProducts);
router.delete('/delete-product/:id', authenticate, authorize(['admin']), ProductController.deleteProduct);
router.put('/update-product/:id', authenticate, authorize(['admin']), ProductController.updateProduct);

//Belt Routes
router.post('/create-belt', authenticate, authorize(['admin']), BeltController.createBelts);
router.get('/getallbelts', authenticate, BeltController.getAllBelts);
router.delete('/delete-belt/:id', authenticate, authorize(['admin']), BeltController.deleteBelt);
router.put('/update-belt/:id', authenticate, authorize(['admin']), BeltController.updateBelt);

// Production Routes

// Today's production report
router.get('/production/today', authenticate, ProductionController.getTodayProduction);

// Dashboard data
router.get('/dashboard-data', authenticate, ProductionController.getDashboardData);

// Historical production report with filters
// router.get('/production/history', authenticate, ProductionController.getHistoricalProduction);

// Production records for the production records page
router.get('/production/records', authenticate, ProductionController.getProductionRecords);

// Export production records to CSV
router.get('/production/records/export', authenticate, ProductionController.exportProductionRecords);

// Get belts for filter dropdown
router.get('/getbeltsbyunit/:unitName', authenticate, ProductionController.getBeltsByUnit);

// Get products for filter dropdown
// router.get('/production/products', authenticate, ProductionController.getProducts);

export default router;
