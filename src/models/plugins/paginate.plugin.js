
// FILE 4: src/models/plugins/paginate.plugin.js
// 1. Purpose of the File
// Why This File Exists:
// Pagination is required in virtually every list endpoint in a REST API. Without pagination, returning all records at once would:

// Overwhelm the database with large queries

// Consume excessive memory in the application

// Send massive responses to clients

// Make the API unusable with large datasets

// This plugin adds reusable pagination to any Mongoose schema.

// What Responsibility It Has:

// Add paginate() static method to schemas

// Calculate skip/limit for efficient queries

// Return paginated results with metadata

// Support sorting, filtering, population, and field selection

// Prevent abuse with maximum limit enforcement

// 2. Key Concepts Used
// Mongoose Concepts:

// Plugins:

// javascript
// schema.statics.paginate = async function (...) { ... }
// A plugin is a function that receives a schema and adds functionality. This follows the Open/Closed Principle - schemas are open for extension but closed for modification.

// Static Methods:
// statics are methods on the Model itself (like Model.find()), not on instances (like document.save()).

// MongoDB Concepts:

// Skip and Limit:

// javascript
// const skip = (pageNum - 1) * limitNum;
// MongoDB's skip() and limit() enable efficient pagination by only returning the requested page.

// Performance Consideration:

// javascript
// // Page 1: skip(0).limit(10) - Fast
// // Page 2: skip(10).limit(10) - Slightly slower
// // Page 1000: skip(9990).limit(10) - SLOW!

// // MongoDB must scan through all skipped documents.
// // This is why cursor-based pagination is better for large datasets.
// 3. Detailed Code Walkthrough
// javascript
// schema.statics.paginate = async function (filter = {}, options = {}) {
// Method Signature:

// filter: MongoDB query object (e.g., { category: 'electronics' })

// options: Pagination configuration

// Returns: { docs, pagination }

// javascript
// const {
//   page = 1,
//   limit = 10,
//   sortBy = 'createdAt',
//   sortOrder = 'desc',
//   populate,
//   select,
// } = options;
// Destructuring with Defaults:

// If no options provided, defaults to page 1, 10 items, newest first

// This makes the API intuitive - /api/products returns first 10 by default

// javascript
// const pageNum = Math.max(1, parseInt(page, 10));
// const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
// Input Sanitization:

// javascript
// // Examples:
// // page = -5  → Math.max(1, -5) = 1 (minimum page is 1)
// // page = "3" → parseInt("3", 10) = 3
// // limit = 500 → Math.min(100, 500) = 100 (cap at 100)
// // limit = 0   → Math.max(1, 0) = 1 (minimum limit is 1)
// This prevents:

// Negative page numbers

// Excessive limit values (DoS protection)

// Non-numeric inputs

// javascript
// const skip = (pageNum - 1) * limitNum;
// Skip Calculation:

// text
// Page 1: skip = (1-1) * 10 = 0  → Get first 10
// Page 2: skip = (2-1) * 10 = 10 → Get next 10
// Page 3: skip = (3-1) * 10 = 20 → Get next 10
// javascript
// const [docs, totalDocs] = await Promise.all([
//   query.exec(),
//   this.countDocuments(filter),
// ]);
// Parallel Execution:

// javascript
// // Sequential (slow)
// const docs = await query.exec();        // Wait 200ms
// const count = await this.countDocuments(); // Wait 100ms
// // Total: 300ms

// // Parallel (fast)
// const [docs, count] = await Promise.all([
//   query.exec(),                         // 200ms simultaneously
//   this.countDocuments(),                // 100ms simultaneously
// ]);
// // Total: 200ms (faster!)
// This uses Promise.all() to execute both queries concurrently, reducing total wait time.

// javascript
// const totalPages = Math.ceil(totalDocs / limitNum);
// const hasNextPage = pageNum < totalPages;
// const hasPrevPage = pageNum > 1;
// Pagination Metadata Calculation:

// javascript
// // Example: 95 documents, 10 per page
// totalPages = Math.ceil(95 / 10) = 10

// // If on page 5:
// hasNextPage = 5 < 10 = true  (more pages ahead)
// hasPrevPage = 5 > 1 = true   (can go back)

// // If on page 10:
// hasNextPage = 10 < 10 = false (last page)
// hasPrevPage = 10 > 1 = true

// // If on page 1:
// hasNextPage = 1 < 10 = true
// hasPrevPage = 1 > 1 = false   (first page)
// 4. How Controllers Use This Plugin
// javascript
// // In product.controller.js
// const result = await Product.paginate(
//   { category: categoryId }, // filter
//   { page: 2, limit: 20 }    // options
// );

// // Result structure:
// {
//   docs: [
//     { _id: '...', name: 'Product 21', ... },
//     { _id: '...', name: 'Product 22', ... },
//     // ... 20 products
//   ],
//   pagination: {
//     page: 2,
//     limit: 20,
//     totalDocs: 150,
//     totalPages: 8,
//     hasNextPage: true,
//     hasPrevPage: true,
//     nextPage: 3,
//     prevPage: 1,
//   }
// }
// 5. API Response Format
// json
// {
//   "success": true,
//   "data": [
//     { "product data" }
//   ],
//   "pagination": {
//     "page": 2,
//     "limit": 20,
//     "totalDocs": 150,
//     "totalPages": 8,
//     "hasNextPage": true,
//     "hasPrevPage": true,
//     "nextPage": 3,
//     "prevPage": 1
//   }
// }
// Why Include Pagination Metadata?
// Clients can build pagination UI without additional API calls:

// javascript
// // Frontend can directly use:
// if (response.pagination.hasNextPage) {
//   showNextButton();
// }
// 6. Interview Knowledge
// Q: "What's the difference between offset and cursor-based pagination?"

// javascript
// // Offset Pagination (Our Implementation)
// GET /api/products?page=2&limit=10
// // Pros: Simple, works with any UI
// // Cons: Slow for deep pages, inconsistent during inserts

// // Cursor-Based Pagination (Better for large datasets)
// GET /api/products?cursor=abc123&limit=10
// // Pros: Fast regardless of page depth, consistent
// // Cons: Complex UI, no total count easily available

// // When to use each:
// // Offset: Admin panels, small datasets (< 1000 records)
// // Cursor: Infinite scroll, real-time feeds, large datasets
// Q: "How do you prevent performance issues with deep pagination?"

// javascript
// // Problem: Page 1000 with offset
// db.products.find().skip(9990).limit(10)
// // MongoDB must scan through 9990 documents!

// // Solution 1: Cursor-based pagination
// db.products.find({ _id: { $gt: lastId } }).limit(10)

// // Solution 2: Limit maximum page
// const pageNum = Math.min(100, Math.max(1, page));

// // Solution 3: Disable total count for deep pages
// if (pageNum > 10) {
//   // Don't count total documents
//   totalDocs = null;
// }
// 7. Learning Notes
// What You Should Learn:

// Pagination is essential for any list endpoint

// Plugins enable code reuse across schemas

// Input sanitization prevents abuse

// Promise.all() for parallel database queries

// Metadata helps clients build better UIs

// Common Mistakes Beginners Make:

// Not implementing pagination at all

// Not enforcing maximum limit (DoS vulnerability)

// Counting total documents on every request (expensive)

// Using offset pagination for real-time data

// Not providing pagination metadata to clients


/**
 * Mongoose Pagination Plugin
 * Adds pagination functionality to any schema
 */
const paginatePlugin = (schema) => {
  /**
   * @param {Object} filter - MongoDB filter query
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Items per page
   * @param {string} options.sortBy - Field to sort by
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {string|Object|Array} options.populate - Fields to populate
   * @param {string|Object} options.select - Fields to select
   * @returns {Promise<Object>} Paginated results
   */
  schema.statics.paginate = async function (filter = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      populate,
      select,
    } = options;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Build query
    let query = this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    if (populate) {
      query = query.populate(populate);
    }

    if (select) {
      query = query.select(select);
    }

    // Execute queries in parallel
    const [docs, totalDocs] = await Promise.all([
      query.exec(),
      this.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocs / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return {
      docs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
    };
  };
};

module.exports = paginatePlugin;