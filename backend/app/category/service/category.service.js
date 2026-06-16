import httpStatus from 'http-status';
import { Category } from '../model/category.model.js';
import { ApiError } from '../../../helpers/ApiError.js';

export const listCategories = async ({ parentId } = {}) => {
  const query = { isActive: true };
  if (parentId !== undefined) query.parentId = parentId || null;
  return Category.find(query).sort({ sortOrder: 1 });
};

export const getCategoryBySlug = async (slug) => {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  return category;
};

export const createCategory = async (body) => {
  if (await Category.findOne({ slug: body.slug })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already taken');
  }
  return Category.create(body);
};

export const updateCategory = async (categoryId, body) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  if (body.slug && body.slug !== category.slug) {
    if (await Category.findOne({ slug: body.slug })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already taken');
    }
  }
  Object.assign(category, body);
  await category.save();
  return category;
};
