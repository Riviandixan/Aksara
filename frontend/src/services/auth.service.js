import api from './api'

export const authService = {
  register: (data)        => api.post('/auth/register', data),
  login:    (data)        => api.post('/auth/login', data),
  me:       ()            => api.get('/auth/me'),
  updateAvatar: (avatarUrl) => api.patch('/auth/avatar', { avatar_url: avatarUrl }),
}
