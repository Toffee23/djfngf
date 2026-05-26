const paginate = async ({
  model,
  filter = {},
  page = 1,
  limit = 20,
  sort = {},
  populate = "",
  select = "",
}) => {
  page = Number(page) || 1;
  limit = Math.min(Number(limit) || 20, 100);

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate),

    model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

export default paginate;
