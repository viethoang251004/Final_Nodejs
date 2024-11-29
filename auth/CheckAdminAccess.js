module.exports = (req, res, next) => {
    try {
        const userRole = req.cookies.userRole;
        if (!userRole || userRole !== 'ADMIN') {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập.' });
        }
        next();
    } catch (error) {
        console.error('Error in CheckAdminAccess middleware:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi kiểm tra quyền truy cập.' });
    }
}
module.exports = async (req, res, next) => {
    try {
        // const userDataLogin = req.cookies.userDataLogin;
        const isAdmin = req.cookies.userRole
        console.log(req.cookies);
        // console.log('userData retrieved from cookie:', userDataLogin);

        // if (!userDataLogin) {
        //     return res.status(401).json({ code: 401, message: 'Token không tìm thấy' });
        // }

        // console.log(isAdmin)

        // Check user permissions
        if (isAdmin.localeCompare('ADMIN') === 0) {
            next(); // If admin, continue processing the request
        } else {
            res.status(403).json({ code: 403, message: 'Không có quyền truy cập.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: 'Lỗi máy chủ nội bộ.' });

    }
};
