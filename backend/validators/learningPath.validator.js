const Joi = require('joi');

const selectLanguage = Joi.object({
  language_id: Joi.number().integer().positive().required(),
  base_level:  Joi.string().valid('beginner', 'intermediate').required(),
});

module.exports = { selectLanguage };
