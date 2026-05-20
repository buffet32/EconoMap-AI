import axios from 'axios';
import { apiUrl } from '../config/api';

const client = axios.create({ baseURL: apiUrl('/api') });

export const fetchCities = () => client.get('/cities/').then((r) => r.data.cities);
export const fetchSectors = (city) =>
  client.get('/sectors/', { params: { city } }).then((r) => r.data.sectors);
export const fetchZones = (params = {}) =>
  client.get('/zones/', { params }).then((r) => r.data);
export const fetchZonesSummary = (params = {}) =>
  client.get('/zones/summary/', { params }).then((r) => r.data);
export const fetchMapViewport = (params = {}) =>
  client.get('/map/viewport/', { params }).then((r) => r.data);
export const fetchZoneDetail = (id) => client.get(`/zones/${id}/`).then((r) => r.data);
export const fetchZoneCompanies = (id, page = 1) =>
  client.get(`/zones/${id}/companies/`, { params: { page, page_size: 150 } }).then((r) => r.data);
export const fetchZoneEnterprises = (id, params = {}) =>
  client.get(`/zones/${id}/enterprises/`, { params }).then((r) => r.data);
export const fetchDashboard = (paramsOrCity) => {
  const params =
    typeof paramsOrCity === 'string' ? { city: paramsOrCity } : paramsOrCity || {};
  return client.get('/dashboard/', { params }).then((r) => r.data);
};
export const fetchHeatmap = (city) =>
  client.get('/heatmap/', { params: { city } }).then((r) => r.data);
export const fetchPredict = (params) =>
  client.get('/predict/', { params }).then((r) => r.data);
export const fetchRecommendations = (params) =>
  client.get('/recommendations/', { params }).then((r) => r.data.recommendations);
export const fetchInsights = (id) => client.get(`/insights/${id}/`).then((r) => r.data);
