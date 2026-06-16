import httpStatus from 'http-status';
import { City } from '../model/city.model.js';
import { ApiError } from '../../../helpers/ApiError.js';

export const listCities = async ({ state } = {}) => {
  const query = { isActive: true };
  if (state) query.state = state;
  return City.find(query).sort({ name: 1 });
};

export const getCityBySlug = async (slug) => {
  const city = await City.findOne({ slug, isActive: true });
  if (!city) throw new ApiError(httpStatus.NOT_FOUND, 'City not found');
  return city;
};

export const createCity = async (body) => {
  if (await City.findOne({ slug: body.slug })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already taken');
  }
  return City.create(body);
};

export const updateCity = async (cityId, body) => {
  const city = await City.findById(cityId);
  if (!city) throw new ApiError(httpStatus.NOT_FOUND, 'City not found');
  if (body.slug && body.slug !== city.slug) {
    if (await City.findOne({ slug: body.slug })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already taken');
    }
  }
  Object.assign(city, body);
  await city.save();
  return city;
};
