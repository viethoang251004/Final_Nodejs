const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const userToken = req.cookies.userDataLogin;

    // let authorization = req.header('Authorization')
    // if (!authorization) {
    //     return res.status(401)
    //     .json({code: 101, message: 'Vui lòng cung cấp jwt token qua header'})
    // }

    // console.log(userToken)

    if (!userToken) {
        return res
            .status(401)
            .json({ code: 101, message: 'Vui lòng đăng nhập để có token' });
    }

    // let token = authorization.split(' ')[1];
    // let token = userToken.split(' ')[1];
    // console.log('Check token after: ', token)
    if (!userToken) {
        return res
            .status(401)
            .json({ code: 101, message: 'Vui lòng cung cấp jwt token hợp lệ' });
    }

    // const {token} = req.body
    const { JWT_SECRET } = process.env;

    jwt.verify(userToken, JWT_SECRET, (err, data) => {
        if (err) {
            return res.status(401).json({
                code: 101,
                message: 'Token không hợp lệ hoặc đã hết hạn',
            });
        }
        // Nếu kiểm tra thành công, thêm token vào header
        req.headers.authorization = `Bearer ${userToken}`;
        req.user = data;
        next(); // quan trọng
    });
};
