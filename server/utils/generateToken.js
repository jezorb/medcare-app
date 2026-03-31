import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (payload, res) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15d',
  });

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'strict',
    secure: isProduction,
  });

  return token;
};

export default generateTokenAndSetCookie;
