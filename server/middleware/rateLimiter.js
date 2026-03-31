const stores = new Map();

const pruneBucket = (bucket, windowMs) => {
  const now = Date.now();
  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < windowMs);
};

export const createRateLimiter = ({ windowMs, maxRequests, keyPrefix = 'global' }) => (req, res, next) => {
  const key = `${keyPrefix}:${req.ip}`;
  const bucket = stores.get(key) || { hits: [] };
  pruneBucket(bucket, windowMs);

  if (bucket.hits.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  }

  bucket.hits.push(Date.now());
  stores.set(key, bucket);
  next();
};
