const learningPathService = require('../services/learningPath.service');
const { ok, fail }        = require('../utils/response');

// POST /api/learning-paths  — generate path baru via AI
async function generate(req, res, next) {
  try {
    const { language_id, base_level } = req.body;
    const data = await learningPathService.generateLearningPath(req.user.id, language_id, base_level);
    ok(res, data, 'Learning path generated', 201);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

// GET /api/learning-paths  — semua path milik user
async function getAll(req, res, next) {
  try {
    const data = await learningPathService.getUserLearningPaths(req.user.id);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

// GET /api/learning-paths/:id  — detail path + levels
async function getOne(req, res, next) {
  try {
    const data = await learningPathService.getLearningPath(req.user.id, req.params.id);
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

module.exports = { generate, getAll, getOne };
