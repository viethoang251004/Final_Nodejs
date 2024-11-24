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
};
