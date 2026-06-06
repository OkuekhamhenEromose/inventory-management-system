const productService = require('../services/product.service');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../middleware/asyncHandler.middleware');

class ProductController {
  /**
   * Create product
   */
  createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);
    
    return ApiResponse.created(res, {
      message: 'Product created successfully',
      data: product,
    });
  });

  /**
   * Get product by ID
   */
  getProduct = asyncHandler(async (req, res) => {
    const result = await productService.getProductById(req.params.id);
    
    return ApiResponse.success(res, {
      data: result,
    });
  });

  /**
   * Get all products
   */
  getProducts = asyncHandler(async (req, res) => {
    const filters = {
      category: req.query.category,
      supplier: req.query.supplier,
      isActive: req.query.isActive,
      search: req.query.search,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      tags: req.query.tags,
    };

    const options = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      populate: req.query.populate || ['category', 'supplier'],
    };

    const result = await productService.getProducts(filters, options);
    
    return ApiResponse.success(res, {
      data: result.docs,
      pagination: result.pagination,
    });
  });

  /**
   * Update product
   */
  updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    
    return ApiResponse.success(res, {
      message: 'Product updated successfully',
      data: product,
    });
  });

  /**
   * Delete product
   */
  deleteProduct = asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(
      req.params.id,
      req.user?.id || 'system'
    );
    
    return ApiResponse.success(res, result);
  });

  /**
   * Bulk import products
   */
  bulkImport = asyncHandler(async (req, res) => {
    // Assuming CSV parsing middleware has processed the file
    const products = req.parsedData;
    const result = await productService.bulkImport(products);
    
    return ApiResponse.success(res, {
      message: 'Bulk import completed',
      data: result,
    });
  });

  /**
   * Search products
   */
  searchProducts = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const options = {
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await productService.searchProducts(q, options);
    
    return ApiResponse.success(res, {
      data: result.docs,
      pagination: result.pagination,
    });
  });

  /**
   * Get product statistics
   */
  getProductStats = asyncHandler(async (req, res) => {
    const stats = await productService.getProductStats();
    
    return ApiResponse.success(res, {
      data: stats,
    });
  });
}

module.exports = new ProductController();