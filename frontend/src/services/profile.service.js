import api from './api'

export const profileService = {
  getPublicProfile: (username) => api.get(`/profile/${username}`),
}
