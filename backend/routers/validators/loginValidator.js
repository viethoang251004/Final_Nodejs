const { check } = require('express-validator');

module.exports = [
    check('email')
        .isEmail()
        .exists()
        .withMessage('Vui lòng cung cấp email người dùng.')
        .notEmpty()
        .withMessage('Email người dùng không được để trống.')
        .trim(),

    check('password')
        .exists()
        .withMessage('Vui lòng cung cấp mật khẩu.')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống.')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có tối thiểu từ 6 ký tự.'),
];
