const Joi = require('joi');

const submitAnswers = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        quiz_id: Joi.number().integer().positive().required(),
        answer:  Joi.string().trim().required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { submitAnswers };
