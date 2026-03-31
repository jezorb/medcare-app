export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value found. Please use a different phone, email, or unique field.',
      ...(error.keyValue ? { details: error.keyValue } : {}),
    });
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    console.error('Unhandled error:', error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {}),
  });
};
