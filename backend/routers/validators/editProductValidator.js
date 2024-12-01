const { check } = require('express-validator');

module.exports = [
    check('name')
        .exists()
        .withMessage('Vui lòng cung cấp tên sản phẩm.')
        .notEmpty()
        .withMessage('Tên sản phẩm không được để trống.')
        .trim(),

    check('description').optional().trim(),

    check('price')
        .exists()
        .withMessage('Vui lòng cung cấp giá sản phẩm.')
        .notEmpty()
        .withMessage('Giá sản phẩm không được để trống.')
        .isNumeric()
        .withMessage('Giá phải là kiểu số.')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Giá không thể âm.');
            }
            return true;
        }),

    check('images')
        .optional()
        .custom((images) => {
            // Nếu `images` không phải array, chuyển thành array
            if (!Array.isArray(images)) {
                images = [images];
            }

            // Kiểm tra tất cả URL là chuỗi
            if (!images.every((url) => typeof url === 'string')) {
                throw new Error('Tất cả URL hình ảnh phải là chuỗi.');
            }
            return true;
        })
        .withMessage('Hình ảnh phải là một danh sách URL.'),

    check('category')
        .exists()
        .withMessage('Vui lòng cung cấp danh mục sản phẩm.')
        .notEmpty()
        .withMessage('Danh mục sản phẩm không được để trống.')
        .trim(),

    check('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là một danh sách.')
        .custom((tags) => {
            if (!tags.every((tag) => typeof tag === 'string')) {
                throw new Error('Tất cả các tags phải là chuỗi.');
            }
            return true;
        }),

    check('variants')
        .optional()
        .isArray()
        .withMessage('Các biến thể phải là một danh sách.')
        .custom((variants) => {
            if (
                !variants.every(
                    (variant) =>
                        variant.size &&
                        typeof variant.size === 'string' &&
                        variant.color &&
                        typeof variant.color === 'string' &&
                        !isNaN(variant.stock) &&
                        parseInt(variant.stock) >= 0,
                )
            ) {
                throw new Error('Các trường biến thể không hợp lệ.');
            }
            return true;
        }),

    check('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Xếp hạng phải từ 0 đến 5.'),

    check('reviews_count')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số lượng đánh giá phải là số nguyên không âm.'),

    check('created_at')
        .optional()
        .isISO8601()
        .withMessage('Ngày tạo không hợp lệ.'),

    check('updated_at')
        .optional()
        .isISO8601()
        .withMessage('Ngày cập nhật không hợp lệ.'),
];
