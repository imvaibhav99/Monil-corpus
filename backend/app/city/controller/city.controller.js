import httpStatus from 'http-status';
import { catchAsync } from '../../../helpers/catchAsync.js';
import * as cityService from '../service/city.service.js';

export const listCities = catchAsync(async (req, res) => {
  const data = await cityService.listCities(req.query);
  res.send({ data });
});

export const getCity = catchAsync(async (req, res) => {
  const data = await cityService.getCityBySlug(req.params.slug);
  res.send({ data });
});

export const createCity = catchAsync(async (req, res) => {
  const data = await cityService.createCity(req.body);
  res.status(httpStatus.CREATED).send({ data });
});

export const updateCity = catchAsync(async (req, res) => {
  const data = await cityService.updateCity(req.params.cityId, req.body);
  res.send({ data });
});
