

// FILE 5: src/models/plugins/softDelete.plugin.js
// 1. Purpose of the File
// Why This File Exists:
// In production systems, you almost never want to permanently delete data. Soft deletion marks records as "deleted" without actually removing them from the database. This plugin adds soft delete functionality to any Mongoose schema.

// Business Reasons for Soft Delete:

// Accidental Deletion Recovery: Users can restore accidentally deleted data

// Audit Trail: Maintain complete history of all data

// Legal Compliance: Some regulations require data retention

// Referential Integrity: Related documents remain valid

// Analytics: Historical data remains available for reporting

// 2. Key Concepts Used
// Mongoose Concepts:

// Pre Hooks:

// javascript
// schema.pre('find', excludeDeletedDocs);
// Intercepts queries before execution to add filters. This is middleware that runs before the actual database operation.

// Schema.add():

// javascript
// schema.add({
//   isDeleted: { type: Boolean, default: false, select: false },
// });
// Dynamically adds fields to an existing schema. The select: false means these fields are hidden by default.

// MongoDB Concepts:

// Aggregation Pipeline Modification:

// javascript
// this.pipeline().unshift({ $match: { isDeleted: false } });
// Manipulates the aggregation pipeline to exclude soft-deleted documents.

// 3. Detailed Code Walkthrough
// javascript
// schema.add({
//   isDeleted: {
//     type: Boolean,
//     default: false,
//     select: false,  // Hidden from query results by default
//   },
//   deletedAt: {
//     type: Date,
//     default: null,
//     select: false,
//   },
//   deletedBy: {
//     type: String,
//     default: null,
//     select: false,
//   },
// });
// Why select: false?

// javascript
// // Without select: false
// const product = await Product.findById(id);
// console.log(product);
// // {
// //   name: "Widget",
// //   isDeleted: false,  ← Exposed to client!
// //   deletedAt: null,    ← Exposed to client!
// //   deletedBy: null     ← Exposed to client!
// // }

// // With select: false
// const product = await Product.findById(id);
// console.log(product);
// // {
// //   name: "Widget"
// //   // Soft delete fields are hidden
// // }

// // Can still explicitly request them:
// const product = await Product.findById(id).select('+isDeleted');
// javascript
// schema.statics.softDelete = async function (id, deletedBy = 'system') {
//   return this.findByIdAndUpdate(
//     id,
//     {
//       isDeleted: true,
//       deletedAt: new Date(),
//       deletedBy,
//     },
//     { new: true }
//   );
// };
// Soft Delete Operation:

// javascript
// // Instead of: await Product.findByIdAndDelete(id);
// await Product.softDelete(id, 'user-123');

// // Database state:
// // {
// //   name: "Widget",
// //   isDeleted: true,
// //   deletedAt: 2024-01-15T10:30:00Z,
// //   deletedBy: "user-123"
// // }
// javascript
// schema.pre('find', excludeDeletedDocs);
// schema.pre('findOne', excludeDeletedDocs);
// schema.pre('findOneAndUpdate', excludeDeletedDocs);
// schema.pre('countDocuments', excludeDeletedDocs);
// Pre-Hook Registration:
// These hooks ensure that ALL standard queries automatically exclude soft-deleted documents:

// javascript
// // Without plugin:
// const products = await Product.find({});
// // Returns ALL products including "deleted" ones

// // With plugin:
// const products = await Product.find({});
// // Returns only non-deleted products (isDeleted: false)

// // To explicitly include deleted:
// const products = await Product.find({ isDeleted: true });
// javascript
// const excludeDeletedDocs = function () {
//   if (!this.getFilter().isDeleted) {
//     this.where({ isDeleted: false });
//   }
// };
// Conditional Filter Logic:

// javascript
// // Case 1: Normal query
// Product.find({ category: 'electronics' })
// // Executes: { category: 'electronics', isDeleted: false }

// // Case 2: Explicit deleted query
// Product.find({ isDeleted: true })
// // Executes: { isDeleted: true } (no automatic filter added)

// // Case 3: Explicit all query
// Product.find({ isDeleted: { $in: [true, false] } })
// // Executes: { isDeleted: { $in: [true, false] } }
// 4. Data Flow for Soft Delete
// text
// Client Request: DELETE /api/products/123
//   ↓
// Controller: productController.deleteProduct(req, res)
//   ↓
// Service: productService.deleteProduct('123', 'user-456')
//   ↓
// Repository: productRepository.delete('123', 'user-456')
//   ↓
// Model: Product.softDelete('123', 'user-456')
//   ↓
// Mongoose: findByIdAndUpdate('123', { isDeleted: true, ... })
//   ↓
// MongoDB: Updates document, doesn't delete it
//   ↓
// Response: { message: "Product deleted successfully" }
//   ↓
// Subsequent GET requests automatically filter out this product
// 5. Interview Knowledge
// Q: "Why implement soft delete instead of hard delete?"

// javascript
// "Soft delete provides:
// 1. Recovery: Restore accidentally deleted data
// 2. Audit: Complete data history for compliance
// 3. Integrity: Referencing documents remain valid
// 4. Analytics: Historical reporting on deleted items
// 5. User trust: 'Undo' functionality

// Trade-off: Increased storage (but storage is cheap)

// In financial systems, healthcare, and enterprise apps,
// soft delete is mandatory for compliance."
// Q: "How does select: false work in Mongoose?"

// javascript
// "select: false in schema means the field is excluded
// from query results by default:

// // Schema definition:
// password: { type: String, select: false }

// // Query without select:
// const user = await User.findOne({ email });
// // user.password is undefined

// // Query with explicit select:
// const user = await User.findOne({ email }).select('+password');
// // user.password is available

// // Use case: Prevent accidentally sending sensitive
// // data to clients"
// 6. Learning Notes
// What You Should Learn:

// Soft delete is essential in production systems

// Mongoose hooks intercept database operations

// select: false protects sensitive fields

// Plugin architecture enables reusable functionality

// Common Mistakes Beginners Make:

// Permanent deletion without confirmation

// Forgetting to add soft delete to new collections

// Not providing restore functionality

// Querying deleted records accidentally

// Not indexing isDeleted field for performance


/**
 * Mongoose Soft Delete Plugin
 * Adds soft delete functionality instead of permanent deletion
 */
const softDeletePlugin = (schema) => {
  // Add deleted fields
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
    deletedBy: {
      type: String,
      default: null,
      select: false,
    },
  });

  // Add soft delete static method
  schema.statics.softDelete = async function (id, deletedBy = 'system') {
    return this.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      },
      { new: true }
    );
  };

  // Add restore static method
  schema.statics.restore = async function (id) {
    return this.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      { new: true }
    );
  };

  // Override find methods to exclude soft-deleted documents
  const excludeDeletedDocs = function () {
    // Only exclude if not explicitly querying for deleted
    if (!this.getFilter().isDeleted) {
      this.where({ isDeleted: false });
    }
  };

  schema.pre('find', excludeDeletedDocs);
  schema.pre('findOne', excludeDeletedDocs);
  schema.pre('findOneAndUpdate', excludeDeletedDocs);
  schema.pre('countDocuments', excludeDeletedDocs);
  schema.pre('aggregate', function () {
    // Add $match stage at the beginning if not already present
    if (!this.pipeline().some(stage => stage.$match?.isDeleted !== undefined)) {
      this.pipeline().unshift({ $match: { isDeleted: false } });
    }
  });
};

module.exports = softDeletePlugin;