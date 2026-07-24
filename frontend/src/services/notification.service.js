import api from './api'

export const notificationService = {
  getAll:       ()   => api.get('/notifications'),
  getUnread:    ()   => api.get('/notifications/unread-count'),
  markRead:     (id) => api.patch(`/notifications/${id}/read`),
  markAllRead:  ()   => api.patch('/notifications/read-all'),
  remove:       (id) => api.delete(`/notifications/${id}`),
}
