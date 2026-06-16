import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Not authorized: No token provided',
      code: 401
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret_key_12345');
    
    // Find user and attach to request object
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Not authorized: User no longer exists',
        code: 401
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      error: true,
      message: 'Not authorized: Token expired or invalid',
      code: 401
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      error: true,
      message: 'Access denied: Administrator privileges required',
      code: 403
    });
  }
};
