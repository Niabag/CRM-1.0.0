const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token d\'accès requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    req.user = { userId: user._id, role: user.role };
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = auth;