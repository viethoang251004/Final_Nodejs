const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.userDataLogin;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await UserModel.findById(decoded.id).select(
                'name email',
            );
        }
    } catch (error) {
        req.user = null; // Nếu không có user, gán là null
    }
    next();
};

module.exports = authMiddleware;
