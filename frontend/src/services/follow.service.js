import api from './api'

export const followService = {
  getStatus:  (username) => api.get(`/social/${username}/status`),
  follow:     (username) => api.post(`/social/${username}/follow`),
  unfollow:   (username) => api.delete(`/social/${username}/unfollow`),
  getFeed:    ()         => api.get('/social/feed'),
}
