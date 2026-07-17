import api from './api'

export const packageService = {
  list: () => api.get('/quiz-packages'),
}

export const leaderboardService = {
  get: () => api.get('/leaderboard'),
}

export const quizService = {
  getQuizzes: (levelId)                  => api.get(`/quizzes/${levelId}`),
  question:   (levelId, orderIndex)      => api.get(`/quizzes/${levelId}/question`, { params: { order_index: orderIndex } }),
  check:      (levelId, quizId, answer)  => api.post(`/quizzes/${levelId}/check`, { quiz_id: quizId, answer }),
  submit:     (levelId, answers)         => api.post(`/quizzes/${levelId}/submit`, { answers }),
}

export const examService = {
  generate: (languageId) => api.get('/exam/generate', { params: { language_id: languageId } }),
  question: (attemptId, orderIndex) => api.get('/exam/question', { params: { attempt_id: attemptId, order_index: orderIndex } }),
  submit:   (payload)    => api.post('/exam/submit', payload),
}
