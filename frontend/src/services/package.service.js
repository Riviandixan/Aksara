import api from './api'

export const packageService = {
  list:      (params)     => api.get('/quiz-packages', { params }),
  get:       (id)         => api.get(`/quiz-packages/${id}`),
  create:    (data)       => api.post('/quiz-packages', data),
  update:    (id, data)   => api.patch(`/quiz-packages/${id}`, data),
  remove:    (id)         => api.delete(`/quiz-packages/${id}`),
  getQuestions: (id)      => api.get(`/quiz-packages/${id}/questions`),
  submit:    (id, body)   => api.post(`/quiz-packages/${id}/submit`, body),
}

export const bankService = {
  list:   (params) => api.get('/quiz-packages/bank/questions', { params }),
  create: (data)   => api.post('/quiz-packages/bank/questions', data),
  remove: (id)     => api.delete(`/quiz-packages/bank/questions/${id}`),
}
