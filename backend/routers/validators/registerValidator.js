const { check } = require('express-validator');

module.exports = [
    check('name')
        .exists()
        .withMessage('Vui lòng cung cấp tên người dùng.')
        .notEmpty()
        .withMessage('Tên người dùng không được để trống.')
        .isLength({ min: 3 })
        .withMessage('Tên người dùng phải có ít nhất 3 ký tự.')
        .trim(),

    check('email')
        .exists()
        .withMessage('Vui lòng cung cấp địa chỉ email.')
        .notEmpty()
        .withMessage('Địa chỉ email không được để trống.')
        .isEmail()
        .withMessage('Địa chỉ email không hợp lệ.')
        .normalizeEmail(),

    check('password')
        .exists()
        .withMessage('Vui lòng cung cấp mật khẩu.')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống.')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),

    check('role')
        .exists()
        .withMessage('Vui lòng cung cấp vai trò người dùng.')
        .notEmpty()
        .withMessage('Vai trò người dùng không được để trống.')
        .isIn(['CUSTOMER', 'ADMIN'])
        .withMessage('Vai trò người dùng không hợp lệ.'),

    check('addresses')
        .optional()
        .isArray()
        .withMessage('Địa chỉ phải là một danh sách.')
        .custom((addresses) => {
            if (
                !addresses.every(
                    (address) =>
                        address.full_name &&
                        typeof address.full_name === 'string' &&
                        address.phone &&
                        typeof address.phone === 'string' &&
                        address.address &&
                        typeof address.address === 'string' &&
                        typeof address.is_default === 'boolean',
                )
            ) {
                throw new Error('Các trường địa chỉ không hợp lệ.');
            }
            return true;
        }),

    check('social_auth')
        .optional()
        .isObject()
        .withMessage('Xác thực xã hội phải là một đối tượng.')
        .custom((auth) => {
            if (
                auth.provider &&
                !['google', 'facebook'].includes(auth.provider)
            ) {
                throw new Error('Nhà cung cấp xác thực xã hội không hợp lệ.');
            }
            if (auth.id && typeof auth.id !== 'string') {
                throw new Error('ID xác thực xã hội không hợp lệ.');
            }
            return true;
        }),

    check('points')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Điểm thưởng phải là một số nguyên không âm.'),

    check('created_at')
        .optional()
        .isISO8601()
        .withMessage('Ngày tạo không hợp lệ.'),

    check('updated_at')
        .optional()
        .isISO8601()
        .withMessage('Ngày cập nhật không hợp lệ.'),
];
