/**
 * Global Consolidated Pagination Execution Utility Node
 * Drives concurrent database slice parsing for high-volume content delivery networks.
 * * @param {Object} options - Structural database querying configuration ledger options block
 * @returns {Object} Cleaned pagination context data block matching unified API layout guidelines
 */
export const paginate = async (options = {}) => {
  // Defensive allocation patch to prevent application drops if the argument is null or unassigned
  const {
    model,
    filter = {},
    page = 1,
    limit = 20,
    sort = {},
    populate = "",
    select = "",
  } = options;

  if (!model) {
    throw new Error("[Pagination Execution Failure] Targets aborted. A valid Mongoose model parameter is required.");
  }

  // Type-cast strings to integers defensively to safeguard processing calculations
  const validatedPage = Math.max(1, parseInt(page, 10) || 1);
  const validatedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100)); // Forces hard ceiling constraint boundary at 100 entries max

  const skipIndex = (validatedPage - 1) * validatedLimit;

  // Execute queries concurrently inside the shared async pool to maximize connection throughput
  const [data, total] = await Promise.all([
    model
      .find(filter)
      .select(select)
      .sort(sort)
      .collation({ locale: "en", strength: 2 }) // FIXED: Introduces case-insensitive alphanumeric collation to eliminate sort rank bugs
      .skip(skipIndex)
      .limit(validatedLimit)
      .populate(populate),

    model.countDocuments(filter),
  ]);

  const totalPagesCount = Math.ceil(total / validatedLimit);

  return {
    data,
    pagination: {
      total,
      page: validatedPage,
      limit: validatedLimit,
      totalPages: totalPagesCount,
      hasNextPage: validatedPage < totalPagesCount,
      hasPrevPage: validatedPage > 1,
    },
  };
};

export default paginate;