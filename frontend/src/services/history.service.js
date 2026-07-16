import api from './api'

export const historyService = {
  list:   (params) => api.get('/history', { params }),
  stats:  ()       => api.get('/history/stats'),
  detail: (id)     => api.get(`/history/${id}`),
}
