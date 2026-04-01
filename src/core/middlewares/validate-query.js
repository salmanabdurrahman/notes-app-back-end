function validateQuery(schema) {
  return function (req, res, next) {
    void res;

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      return next(error);
    }

    req.validated = value;
    return next();
  };
}

export default validateQuery;
