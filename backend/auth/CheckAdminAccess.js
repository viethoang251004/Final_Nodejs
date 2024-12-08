module.exports = async (req, res, next) => {
    try {
        // const userDataLogin = req.cookies.userDataLogin;
        const isAdmin = req.cookies.userRole;

        // Check user permissions
        if (isAdmin.localeCompare('ADMIN') === 0) {
            next(); // If admin, continue processing the request
        } else {
            res.status(403).json({
                code: 403,
                message: 'Không có quyền truy cập.',
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: 'Lỗi máy chủ nội bộ.' });
    }
};
