import api from './api'

export const analyticsService = {
  get: () => api.get('/analytics'),
}
