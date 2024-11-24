module.exports = async (req, res, next) => {
    try {
        // const userDataLogin = req.cookies.userDataLogin;
        const isAdmin = req.cookies.userRole
        // console.log('userData retrieved from cookie:', userDataLogin);

        // if (!userDataLogin) {
        //     return res.status(401).json({ code: 401, message: 'Token không tìm thấy' });
        // }

        // console.log(isAdmin)

        // Kiểm tra quyền hạn của người dùng
        if (isAdmin.localeCompare('Admin') === 0) {
            next(); // Nếu là admin, tiếp tục xử lý request
        } else {
            res.status(403).json({ code: 403, message: 'Không có quyền truy cập.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: 'Lỗi máy chủ nội bộ.' });
    }
};
