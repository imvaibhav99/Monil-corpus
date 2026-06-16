import httpStatus from 'http-status';
import { catchAsync } from '../../../helpers/catchAsync.js';
import * as categoryService from '../service/category.service.js';

export const listCategories = catchAsync(async (req, res) => {
  const data = await categoryService.listCategories(req.query);
  res.send({ data });
});

export const getCategory = catchAsync(async (req, res) => {
  const data = await categoryService.getCategoryBySlug(req.params.slug);
  res.send({ data });
});

export const createCategory = catchAsync(async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  res.status(httpStatus.CREATED).send({ data });
});

export const updateCategory = catchAsync(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.categoryId, req.body);
  res.send({ data });
});
