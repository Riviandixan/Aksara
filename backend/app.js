require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const app = express();

// --- Global Middlewares ---
app.use(cors({ origin: '*' }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

// --- Routes ---
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/languages',      require('./routes/language.routes'));
app.use('/api/learning-paths', require('./routes/learningPath.routes'));
app.use('/api/quizzes',        require('./routes/quiz.routes'));
app.use('/api/quiz-packages',  require('./routes/quizPackage.routes'));
app.use('/api/leaderboard',    require('./routes/leaderboard.routes'));
app.use('/api/history',        require('./routes/history.routes'));
app.use('/api/analytics',      require('./routes/analytics.routes'));
app.use('/api/exam',           require('./routes/exam.routes'));
app.use('/api/battle',         require('./routes/battle.routes'));
app.use('/api/notifications',  require('./routes/notification.routes'));
app.use('/api/achievements',   require('./routes/achievement.routes'));
app.use('/api/profile',        require('./routes/profile.routes'));
app.use('/api/social',         require('./routes/follow.routes'));

// --- 404 Handler ---
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// --- Global Error Handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
