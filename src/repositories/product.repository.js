const Product = require('../models/product.model');
const logger = require('../config/logger');

class ProductRepository {
  /**
   * Create a new product
   */
  async create(productData) {
    try {
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      logger.error('ProductRepository.create error:', error);
      throw error;
    }
  }

  /**
   * Find product by ID
   */
  async findById(id, options = {}) {
    try {
      let query = Product.findById(id);
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      return await query.exec();
    } catch (error) {
      logger.error('ProductRepository.findById error:', error);
      throw error;
    }
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku) {
    try {
      return await Product.findOne({ sku }).exec();
    } catch (error) {
      logger.error('ProductRepository.findBySku error:', error);
      throw error;
    }
  }

  /**
   * Find all products with filters and pagination
   */
  async findAll(filters = {}, options = {}) {
    try {
      const query = {};

      // Build filter conditions
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.supplier) {
        query.supplier = filters.supplier;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      
      if (filters.minPrice || filters.maxPrice) {
        query.unitPrice = {};
        if (filters.minPrice) query.unitPrice.$gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) query.unitPrice.$lte = parseFloat(filters.maxPrice);
      }
      
      if (filters.tags) {
        query.tags = { $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
      }

      return await Product.paginate(query, options);
    } catch (error) {
      logger.error('ProductRepository.findAll error:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async update(id, updateData) {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return product;
    } catch (error) {
      logger.error('ProductRepository.update error:', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  async delete(id, deletedBy) {
    try {
      return await Product.softDelete(id, deletedBy);
    } catch (error) {
      logger.error('ProductRepository.delete error:', error);
      throw error;
    }
  }

  /**
   * Bulk create products
   */
  async bulkCreate(products) {
    try {
      return await Product.insertMany(products, { ordered: false });
    } catch (error) {
      logger.error('ProductRepository.bulkCreate error:', error);
      throw error;
    }
  }

  /**
   * Search products with text index
   */
  async search(searchTerm, options = {}) {
    try {
      const query = { $text: { $search: searchTerm } };
      
      // Add additional filters
      if (options.category) query.category = options.category;
      if (options.isActive !== undefined) query.isActive = options.isActive;
      
      return await Product.paginate(query, options);
    } catch (error) {
      logger.error('ProductRepository.search error:', error);
      throw error;
    }
  }

  /**
   * Get product count by category
   */
  async countByCategory() {
    try {
      return await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalValue: { $sum: '$unitPrice' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            categoryName: '$category.name',
            productCount: '$count',
            totalValue: '$totalValue',
            averagePrice: { $divide: ['$totalValue', '$count'] },
          },
        },
      ]);
    } catch (error) {
      logger.error('ProductRepository.countByCategory error:', error);
      throw error;
    }
  }
}

module.exports = new ProductRepository();