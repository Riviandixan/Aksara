import api from './api'

export const languageService = {
  getAll: () => api.get('/languages'),
}

export const learningPathService = {
  generate: (data)  => api.post('/learning-paths', data),
  getAll:   ()      => api.get('/learning-paths'),
  getOne:   (id)    => api.get(`/learning-paths/${id}`),
}
