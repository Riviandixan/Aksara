const languageService = require('../services/language.service');
const { ok }          = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const languages = await languageService.getAllLanguages();
    ok(res, languages);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll };
