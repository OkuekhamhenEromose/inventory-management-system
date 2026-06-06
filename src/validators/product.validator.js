const Joi = require('joi');

const createProductSchema = Joi.object({
  sku: Joi.string().uppercase().trim().max(50).optional(),
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  supplier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  unitPrice: Joi.number().min(0).required(),
  costPrice: Joi.number().min(0).optional(),
  reorderPoint: Joi.number().integer().min(0).optional(),
  reorderQuantity: Joi.number().integer().min(0).optional(),
  unit: Joi.string().valid('piece', 'kg', 'liter', 'meter', 'box', 'pack', 'carton').optional(),
  variants: Joi.array().items(
    Joi.object({
      size: Joi.string().optional(),
      color: Joi.string().optional(),
      material: Joi.string().optional(),
      barcode: Joi.string().optional(),
      weight: Joi.number().min(0).optional(),
      dimensions: Joi.object({
        length: Joi.number().min(0),
        width: Joi.number().min(0),
        height: Joi.number().min(0),
      }).optional(),
    })
  ).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  specifications: Joi.object().pattern(
    Joi.string(),
    Joi.string()
  ).optional(),
  isActive: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  sku: Joi.string().uppercase().trim().max(50).optional(),
  name: Joi.string().trim().max(200).optional(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  supplier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  unitPrice: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional(),
  reorderPoint: Joi.number().integer().min(0).optional(),
  reorderQuantity: Joi.number().integer().min(0).optional(),
  unit: Joi.string().valid('piece', 'kg', 'liter', 'meter', 'box', 'pack', 'carton').optional(),
  variants: Joi.array().items(
    Joi.object({
      size: Joi.string().optional(),
      color: Joi.string().optional(),
      material: Joi.string().optional(),
      barcode: Joi.string().optional(),
      weight: Joi.number().min(0).optional(),
      dimensions: Joi.object({
        length: Joi.number().min(0),
        width: Joi.number().min(0),
        height: Joi.number().min(0),
      }).optional(),
    })
  ).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  specifications: Joi.object().pattern(
    Joi.string(),
    Joi.string()
  ).optional(),
  isActive: Joi.boolean().optional(),
  isDiscontinued: Joi.boolean().optional(),
}).min(1); // At least one field must be provided

const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  supplier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  search: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
};