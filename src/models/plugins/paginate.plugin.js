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