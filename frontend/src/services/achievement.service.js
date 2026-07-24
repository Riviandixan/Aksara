import api from './api';

export const achievementService = {
  getAll: () => api.get('/achievements'),
};