// Validates req[source] against a Zod schema and replaces it with the parsed
// (trimmed / coerced) value. Validation errors reach errorHandler as ZodError -> 400.
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;