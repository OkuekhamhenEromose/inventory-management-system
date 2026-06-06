const productRepository = require('../repositories/product.repository');
const stockRepository = require('../repositories/stock.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const httpStatus = require('http-status');

class ProductService {
  /**
   * Create a new product
   */
  async createProduct(productData) {
    try {
      // Check if SKU already exists
      if (productData.sku) {
        const existingProduct = await productRepository.findBySku(productData.sku);
        if (existingProduct) {
          throw new ApiError(httpStatus.CONFLICT, `Product with SKU ${productData.sku} already exists`);
        }
      }

      // Validate variants
      if (productData.variants && productData.variants.length > 0) {
        await this.validateVariants(productData.variants);
      }

      const product = await productRepository.create(productData);
      logger.info(`Product created: ${product._id}`);
      return product;
    } catch (error) {
      logger.error('ProductService.createProduct error:', error);
      throw error;
    }
  }

  /**
   * Get product by ID with stock information
   */
  async getProductById(id) {
    try {
      const product = await productRepository.findById(id, {
        populate: ['category', 'supplier'],
      });

      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
      }

      // Get stock levels for this product
      const stockLevels = await stockRepository.getStockByProduct(id);
      product._totalStock = stockLevels.reduce((sum, sl) => sum + sl.availableQuantity, 0);

      return { product, stockLevels };
    } catch (error) {
      logger.error('ProductService.getProductById error:', error);
      throw error;
    }
  }

  /**
   * Get all products with filters
   */
  async getProducts(filters, options) {
    try {
      return await productRepository.findAll(filters, options);
    } catch (error) {
      logger.error('ProductService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(id, updateData) {
    try {
      const product = await productRepository.findById(id);
      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
      }

      // Check SKU uniqueness if being updated
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await productRepository.findBySku(updateData.sku);
        if (existingProduct) {
          throw new ApiError(httpStatus.CONFLICT, 'SKU already in use');
        }
      }

      const updatedProduct = await productRepository.update(id, updateData);
      logger.info(`Product updated: ${id}`);
      return updatedProduct;
    } catch (error) {
      logger.error('ProductService.updateProduct error:', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id, deletedBy) {
    try {
      const product = await productRepository.findById(id);
      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
      }

      // Check if product has stock before deleting
      const stockLevels = await stockRepository.getStockByProduct(id);
      const totalStock = stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
      
      if (totalStock > 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cannot delete product with existing stock. Please clear stock first.'
        );
      }

      await productRepository.delete(id, deletedBy);
      logger.info(`Product deleted: ${id}`);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      logger.error('ProductService.deleteProduct error:', error);
      throw error;
    }
  }

  /**
   * Bulk import products
   */
  async bulkImport(products) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const product of products) {
        try {
          await this.createProduct(product);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            product: product.name || product.sku,
            error: error.message,
          });
        }
      }

      logger.info(`Bulk import completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error('ProductService.bulkImport error:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(searchTerm, options) {
    try {
      return await productRepository.search(searchTerm, options);
    } catch (error) {
      logger.error('ProductService.searchProducts error:', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    try {
      const [categoryStats, totalProducts, activeProducts] = await Promise.all([
        productRepository.countByCategory(),
        Product.countDocuments(),
        Product.countDocuments({ isActive: true }),
      ]);

      return {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        categoryStats,
      };
    } catch (error) {
      logger.error('ProductService.getProductStats error:', error);
      throw error;
    }
  }

  /**
   * Validate product variants
   */
  async validateVariants(variants) {
    const barcodes = variants.filter(v => v.barcode).map(v => v.barcode);
    if (barcodes.length > 0) {
      const existingProducts = await Product.find({
        'variants.barcode': { $in: barcodes },
      });
      
      if (existingProducts.length > 0) {
        const existingBarcodes = existingProducts.reduce((acc, product) => {
          product.variants.forEach(v => {
            if (barcodes.includes(v.barcode)) acc.push(v.barcode);
          });
          return acc;
        }, []);
        
        throw new ApiError(
          httpStatus.CONFLICT,
          `Barcodes already exist: ${existingBarcodes.join(', ')}`
        );
      }
    }
  }
}

module.exports = new ProductService();