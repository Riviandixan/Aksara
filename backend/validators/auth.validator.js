const Joi = require('joi');

const register = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const login = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { register, login };
