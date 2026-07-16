const jwt      = require('jsonwebtoken');
const { fail } = require('../utils/response');

// Reusable middleware factory — terima schema Joi, validasi req.body
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return fail(res, messages, 422);
    }
    next();
  };
}

// Verifikasi JWT dari header Authorization: Bearer <token>
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return fail(res, 'Unauthorized', 401);

  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    fail(res, 'Invalid or expired token', 401);
  }
}

module.exports = { validate, authenticate };
