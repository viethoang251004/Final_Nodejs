const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ cookie
        const token = req.cookies.userDataLogin;

        // Nếu token tồn tại, kiểm tra tính hợp lệ và giải mã nó
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm thông tin người dùng trong cơ sở dữ liệu dựa trên ID từ token
            // Chỉ lấy các trường 'name' và 'email'
            req.user = await UserModel.findById(decoded.id).select(
                'name email',
            );
        }
    } catch (error) {
        // Nếu có lỗi, đặt giá trị `req.user` thành null
        req.user = null;
    }

    // Chuyển sang middleware hoặc route handler tiếp theo
    next();
};

module.exports = authMiddleware;
