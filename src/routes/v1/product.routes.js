const express = require('express');
const productController = require('../../controllers/product.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate, validateQuery } = require('../../middleware/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} = require('../../validators/product.validator');

const router = express.Router();

// Public routes
router.get('/', validateQuery(productQuerySchema), productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/stats', productController.getProductStats);
router.get('/:id', productController.getProduct);

// Protected routes
router.use(authenticate);

// Admin and Manager routes
router.post(
  '/',
  authorize('admin', 'manager'),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authorize('admin', 'manager'),
  validate(updateProductSchema),
  productController.updateProduct
);

// Admin only routes
router.delete(
  '/:id',
  authorize('admin'),
  productController.deleteProduct
);

router.post(
  '/bulk-import',
  authorize('admin'),
  productController.bulkImport
);

module.exports = router;