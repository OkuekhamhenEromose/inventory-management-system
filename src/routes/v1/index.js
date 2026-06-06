const express = require('express');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const supplierRoutes = require('./supplier.routes');
const stockRoutes = require('./stock.routes');
const authRoutes = require('./auth.routes');

const router = express.Router();

// API version prefix
const API_VERSION = '/api/v1';

// Mount routes
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/categories`, categoryRoutes);
router.use(`${API_VERSION}/suppliers`, supplierRoutes);
router.use(`${API_VERSION}/stock`, stockRoutes);
router.use(`${API_VERSION}/auth`, authRoutes);

// Health check endpoint
router.get(`${API_VERSION}/health`, (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;