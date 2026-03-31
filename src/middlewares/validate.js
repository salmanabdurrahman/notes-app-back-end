function validate(schema) {
  return function (req, res, next) {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      return next(error);
    }

    req.validated = value;
    req.validate = value;
    return next();
  };
}

export default validate;
