

// FILE 6: src/models/product.model.js
// 1. Purpose of the File
// Why This File Exists:
// This is the Product domain model - the heart of the inventory management system. It defines how product data is structured, validated, and stored in MongoDB. Every product in the system follows this schema.

// What Responsibility It Has:

// Define product data structure (schema)

// Validate product data integrity

// Manage product relationships (category, supplier)

// Provide product-specific business logic

// Enable efficient querying through indexes

// Support product variants and specifications

// 2. MongoDB Data Modeling Analysis
// Collection: products

// Document Structure:

// javascript
// {
//   // Basic Information
//   _id: ObjectId("507f1f77bcf86cd799439011"),
//   sku: "ELEC-001",                    // Unique identifier
//   name: "Wireless Keyboard",          // Display name
//   description: "Ergonomic wireless...", // Product details
//   unit: "piece",                      // Unit of measurement
  
//   // Relationships (Referenced)
//   category: ObjectId("..."),          // References categories collection
//   supplier: ObjectId("..."),          // References suppliers collection
  
//   // Pricing
//   unitPrice: 79.99,                   // Selling price
//   costPrice: 45.00,                   // Purchase cost
  
//   // Inventory Management
//   reorderPoint: 20,                   // Min stock before reorder
//   reorderQuantity: 100,               // Default reorder amount
  
//   // Embedded Arrays
//   variants: [                         // Product variations
//     {
//       size: null,
//       color: "Black",
//       material: null,
//       barcode: "KB001-BLK",
//       weight: null,
//       dimensions: { length: null, width: null, height: null }
//     },
//     {
//       size: null,
//       color: "White",
//       material: null,
//       barcode: "KB001-WHT",
//       weight: null,
//       dimensions: { length: null, width: null, height: null }
//     }
//   ],
  
//   tags: ["electronics", "computer", "accessories"],
  
//   images: [
//     {
//       url: "https://...",
//       caption: "Front view",
//       isPrimary: true,
//       uploadedAt: ISODate("2024-01-15")
//     }
//   ],
  
//   // Flexible Schema
//   specifications: {
//     "Brand": "LogiTech",
//     "Connectivity": "Bluetooth 5.0",
//     "Battery Life": "12 months"
//   },
  
//   // Status Flags
//   isActive: true,
//   isDiscontinued: false,
  
//   // Automatic Timestamps
//   createdAt: ISODate("2024-01-15T10:00:00Z"),
//   updatedAt: ISODate("2024-01-15T10:00:00Z")
// }
// 3. Detailed Code Walkthrough
// javascript
// const productSchema = new mongoose.Schema(
//   {
//     sku: {
//       type: String,
//       required: [true, 'SKU is required'],
//       unique: true,
//       uppercase: true,
//       trim: true,
//       index: true,
//     },
// SKU Field Analysis:

// type: String: Standard string type

// required: [true, 'SKU is required']: Array format provides custom error message

// unique: true: MongoDB creates a unique index automatically

// uppercase: true: Always stored in uppercase

// trim: true: Removes leading/trailing whitespace

// index: true: Creates a single-field index for fast lookups

// Why Separate unique and index?

// javascript
// // unique: true creates an index automatically, BUT
// // explicit index: true allows configuration:
// productSchema.index({ sku: 1 }, { 
//   unique: true, 
//   sparse: true,  // Only index documents with this field
//   background: true  // Build index in background
// });

// // Without explicit index, you can't configure these options
// javascript
//     variants: [
//       {
//         size: String,
//         color: String,
//         material: String,
//         barcode: {
//           type: String,
//           unique: true,
//           sparse: true,  // Allows null/undefined values
//         },
// Why sparse: true for barcode?

// javascript
// // Without sparse: true
// // Products without barcodes would all have null
// // MongoDB would reject second product with null barcode
// // Error: "E11000 duplicate key error: barcode: null"

// // With sparse: true
// // Index only includes documents where barcode exists
// // Multiple products can have null/undefined barcode
// // But barcode values must be unique when present
// javascript
//     specifications: {
//       type: Map,
//       of: String,
//     },
// Map Type Analysis:

// javascript
// // This creates a flexible key-value store:
// specifications: {
//   "Brand": "LogiTech",
//   "Connectivity": "Bluetooth 5.0",
//   "Battery Life": "12 months",
//   // Any number of specifications can be added
// }

// // MongoDB stores this as:
// {
//   specifications: {
//     Brand: "LogiTech",
//     Connectivity: "Bluetooth 5.0",
//     "Battery Life": "12 months"
//   }
// }

// // Query example:
// Product.find({ "specifications.Brand": "LogiTech" })
// Why Map instead of Array of Objects?

// javascript
// // Array approach:
// specifications: [
//   { key: "Brand", value: "LogiTech" },
//   { key: "Color", value: "Black" }
// ]
// // Query: Product.find({ 
// //   specifications: { 
// //     $elemMatch: { key: "Brand", value: "LogiTech" } 
// //   } 
// // })

// // Map approach (better):
// specifications: Map of String
// // Query: Product.find({ "specifications.Brand": "LogiTech" })
// // Much simpler query syntax!
// 4. Index Strategy Analysis
// javascript
// // 1. Single-field index
// productSchema.index({ sku: 1 });
// // Use case: Product.find({ sku: 'ELEC-001' })
// // Performance: O(log n) instead of O(n)

// // 2. Text index for search
// productSchema.index({ name: 'text', description: 'text', tags: 'text' });
// // Use case: Product.find({ $text: { $search: 'wireless keyboard' } })
// // Performance: Full-text search with relevance scoring

// // 3. Compound index for filtered listing
// productSchema.index({ category: 1, isActive: 1 });
// // Use case: Product.find({ category: catId, isActive: true })
// // Performance: Index covers both fields

// // 4. Compound index with supplier
// productSchema.index({ supplier: 1, isActive: 1 });
// // Use case: Product.find({ supplier: suppId, isActive: true })

// // 5. Multikey index on variant barcodes
// productSchema.index({ 'variants.barcode': 1 });
// // Use case: Product.find({ 'variants.barcode': 'KB001-BLK' })
// // Performance: Indexes into array elements
// Index Selection Strategy:

// text
// ESR Rule (Equality, Sort, Range):
// 1. Equality fields first (category, isActive)
// 2. Sort fields next (createdAt)
// 3. Range fields last (price)
// 5. Mongoose Features Analysis
// Virtual Fields:

// javascript
// productSchema.virtual('totalStock').get(function () {
//   return this._totalStock || 0;
// });
// Why Virtual Instead of Stored Field?

// javascript
// // Virtual: Calculated on the fly, not stored in MongoDB
// // Pros: Always up-to-date, no storage cost
// // Cons: Requires population, can't query by virtual

// // Stored: Saved in MongoDB
// // Pros: Queryable, faster read
// // Cons: Requires updates, data can be stale

// // Our choice: Virtual because stock data is in separate collection
// // and we want real-time accuracy
// Pre-save Hook:

// javascript
// productSchema.pre('save', async function (next) {
//   if (this.isNew && !this.sku) {
//     const count = await this.constructor.countDocuments();
//     this.sku = `SKU-${String(count + 1).padStart(6, '0')}`;
//   }
//   next();
// });
// Hook Execution Flow:

// text
// product.save()
//   ↓
// pre('save') hook fires
//   ↓
// Check if new document and no SKU
//   ↓
// Count existing documents
//   ↓
// Generate SKU: "SKU-000127"
//   ↓
// next() - continue with save
//   ↓
// Mongoose validation
//   ↓
// Write to MongoDB
//   ↓
// post('save') hook fires (if defined)
// Instance Methods:

// javascript
// productSchema.methods.needsReorder = function (currentStock) {
//   return currentStock <= this.reorderPoint;
// };

// // Usage:
// const product = await Product.findById(id);
// if (product.needsReorder(15)) {
//   // Current stock is 15, reorder point is 20
//   // Alert: needs reorder!
// }
// 6. Embedded vs Referenced Decisions
// Why Category is Referenced:

// javascript
// category: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'Category',
// }
// Decision Matrix:

// Factor	Embedded	Referenced	Choice
// Relationship Cardinality	One-to-Few	One-to-Many	One-to-Many (many products per category)
// Update Frequency	Rarely	Sometimes	Category name changes affect all products
// Access Pattern	Always together	Independently	Categories used separately for filtering
// Data Size	Small (name, desc)	Small	Either would work
// Query Performance	Faster (one query)	Slower (populate needed)	Referenced for consistency
// Why Variants are Embedded:

// javascript
// variants: [{ size: String, color: String, ... }]
// Factor	Embedded	Referenced	Choice
// Relationship	One-to-Few	One-to-Many	Product has few variants
// Access Pattern	Always with product	Seldom alone	Variants meaningless without product
// Updates	Rarely	-	Variants rarely change independently
// Atomicity	Same document	Separate documents	Variants must stay with product
// 7. Interview Knowledge
// Q: "When would you embed documents vs reference them?"

// javascript
// "Embed when:
// 1. Data is accessed together 90%+ of the time
// 2. One-to-few relationship (1 product → 3-5 variants)
// 3. Data doesn't change independently
// 4. Document size < 16MB (MongoDB limit)
// 5. Atomic operations needed on the entire entity

// Reference when:
// 1. Data is shared across documents
// 2. One-to-many or many-to-many relationships
// 3. Data changes independently
// 4. Document would exceed 16MB
// 5. Need to query the sub-documents independently"
// Q: "How do you design indexes for a product catalog?"

// javascript
// "Follow ESR rule and analyze query patterns:

// 1. Most common query: Find by category
//    → Index: { category: 1, isActive: 1, createdAt: -1 }

// 2. Search by text:
//    → Index: { name: 'text', description: 'text' }

// 3. Find by SKU (unique lookup):
//    → Index: { sku: 1 } (already created by unique: true)

// 4. Filter by price range:
//    → Index: { unitPrice: 1, isActive: 1 }

// 5. Find by tag:
//    → Index: { tags: 1 }

// Always verify with explain():
// db.products.find({ category: catId }).explain('executionStats')
// // Look for: IXSCAN (good) vs COLLSCAN (bad)"
// 8. Learning Notes
// What You Should Learn:

// Schema design impacts everything (query performance, data integrity, scalability)

// Embedded vs referenced is a critical decision

// Indexes should be based on actual query patterns

// Virtuals provide computed properties without storage cost

// Hooks enable business logic at the data layer

// Common Mistakes Beginners Make:

// Embedding everything (leads to massive documents)

// Referencing everything (leads to too many joins/populates)

// Not creating indexes (slow queries)

// Creating indexes on fields never queried (wasted storage)

// Not using sparse: true for optional unique fields


const mongoose = require('mongoose');
const { paginatePlugin, softDeletePlugin } = require('./plugins');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
    },
    reorderPoint: {
      type: Number,
      default: 10,
      min: [0, 'Reorder point cannot be negative'],
    },
    reorderQuantity: {
      type: Number,
      default: 50,
      min: [0, 'Reorder quantity cannot be negative'],
    },
    unit: {
      type: String,
      enum: ['piece', 'kg', 'liter', 'meter', 'box', 'pack', 'carton'],
      default: 'piece',
    },
    variants: [
      {
        size: String,
        color: String,
        material: String,
        barcode: {
          type: String,
          unique: true,
          sparse: true,
        },
        weight: Number,
        dimensions: {
          length: Number,
          width: Number,
          height: Number,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        url: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDiscontinued: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ supplier: 1, isActive: 1 });
productSchema.index({ 'variants.barcode': 1 });

// Virtual for total stock across all locations
productSchema.virtual('totalStock').get(function () {
  // This will be populated in service layer
  return this._totalStock || 0;
});

// Pre-save hook to generate SKU if not provided
productSchema.pre('save', async function (next) {
  if (this.isNew && !this.sku) {
    const count = await this.constructor.countDocuments();
    this.sku = `SKU-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Instance method to check if reorder is needed
productSchema.methods.needsReorder = function (currentStock) {
  return currentStock <= this.reorderPoint;
};

// Static method to find low stock products
productSchema.statics.findLowStock = async function (threshold) {
  // This requires aggregation with stockLevels collection
  // Will be implemented in repository layer
};

// Plugins
productSchema.plugin(paginatePlugin);
productSchema.plugin(softDeletePlugin);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;