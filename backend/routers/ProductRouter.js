const express = require('express');
const Router = express.Router();
const { validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const CheckLogin = require('../auth/CheckLogin');
const CheckRole = require('../auth/CheckAdminAccess');
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const multer = require('multer');
const path = require('path');

// Validator for adding products
const addProductValidator = require('./validators/addProductValidator');
const editProductValidator = require('./validators/editProductValidator');

const allProductLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 5,
    message: 'Không thể gửi quá 5 request trong 10s khi đọc danh sách sản phẩm',
});

const detailProductLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 2,
    message: 'Không thể gửi quá 2 request trong 10s khi đọc chi tiết sản phẩm',
});

Router.use(CheckLogin, CheckRole);

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

Router.get('/', CheckRole, allProductLimiter, async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find();
        const colors = [
            'Red',
            'Blue',
            'Green',
            'Yellow',
            'Black',
            'White',
            'Pink',
            'Purple',
            'Brown',
            'Orange',
            'Cyan',
            'Magenta',
            'Grey',
            'Teal',
            'Lime',
            'Maroon',
        ];

        res.render('layouts/main', {
            title: 'Product Management',
            body: 'productManagement',
            style: 'productManagement-style',
            products,
            categories: categories || [],
            colors,
            errors: null,
            formData: {},
            editProduct: null,
            variant: {},
        });
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send('Error loading product list');
    }
});

Router.post(
    '/add',
    CheckLogin,
    CheckRole,
    upload.array('images', 5),
    addProductValidator,
    async (req, res) => {
        try {
            const errors = validationResult(req);

            const categories = await Category.find();

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Xác thực không thành công',
                    errors: errors.array(),
                });
            }

            let imagePaths = [];
            if (req.files && req.files.length > 0) {
                imagePaths = req.files.map(
                    (file) => `/uploads/${file.filename}`,
                );
            }

            const variants = req.body.variants.map((variant) => ({
                size: variant.size,
                color: variant.color,
                stock: parseInt(variant.stock),
            }));

            const newProduct = new Product({
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                images: imagePaths,
                category: req.body.category,
                tags: req.body.tags
                    ? req.body.tags.split(',').map((tag) => tag.trim())
                    : [],
                variants: variants,
            });

            await newProduct.save();

            return res.status(201).json({
                success: true,
                message: 'Sản phẩm đã được thêm thành công',
            });
        } catch (error) {
            console.error('Error adding product:', error.message);
            return res
                .status(500)
                .json({ success: false, message: 'Lỗi khi thêm sản phẩm' });
        }
    },
);

Router.get('/edit/:id', CheckLogin, CheckRole, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        const categories = await Category.find();
        const colors = [
            'Red',
            'Blue',
            'Green',
            'Yellow',
            'Black',
            'White',
            'Pink',
            'Purple',
            'Brown',
            'Orange',
            'Cyan',
            'Magenta',
            'Grey',
            'Teal',
            'Lime',
            'Maroon',
        ];

        if (!product) return res.status(404).send('Không tìm thấy sản phẩm');

        res.json({ product, categories, colors });
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error.message);
        res.status(500).send('Lỗi khi tải sản phẩm');
    }
});

Router.post(
    '/edit/:id',
    CheckLogin,
    CheckRole,
    upload.array('images', 5),
    editProductValidator,
    async (req, res) => {
        try {
            const { id } = req.params;
            const errors = validationResult(req);

            if (!id) {
                return res
                    .status(400)
                    .json({ success: false, message: 'ID sản phẩm bị thiếu' });
            }

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Xác thực không thành công',
                    errors: errors.array(),
                });
            }

            const updateData = { ...req.body };

            if (req.files && req.files.length > 0) {
                updateData.images = req.files.map(
                    (file) => `/uploads/${file.filename}`,
                );
            }

            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                updateData,
                { new: true },
            );
            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Sản phẩm đã được cập nhật thành công',
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error.message);
            return res
                .status(500)
                .json({ success: false, message: 'Lỗi khi cập nhật sản phẩm' });
        }
    },
);

Router.post('/delete/:id', CheckLogin, CheckRole, async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res
                .status(400)
                .json({ message: 'Không có thông tin mã sản phẩm' });
        }

        const product = await Product.findByIdAndDelete(id);

        if (product) {
            return res
                .status(200)
                .json({ message: 'Đã xóa sản phẩm thành công' });
        } else {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        if (error.message.includes('Cast to ObjectId failed')) {
            return res
                .status(400)
                .json({ message: 'Đây không phải là một id hợp lệ' });
        }
        return res
            .status(500)
            .json({ message: 'Lỗi máy chủ: ' + error.message });
    }
});

Router.post('/categories/add', CheckLogin, CheckRole, async (req, res) => {
    try {
        const { name, slug, description } = req.body;

        if (!name || !slug) {
            return res
                .status(400)
                .json({ success: false, message: 'Tên và Slug là bắt buộc' });
        }

        const newCategory = new Category({
            name,
            slug,
            description,
        });

        await newCategory.save();
        return res
            .status(201)
            .json({ success: true, message: 'Category added successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: `Category with name "${req.body.name}" already exists`,
            });
        }

        console.error('Error adding category:', error.message);
        return res
            .status(500)
            .json({ success: false, message: 'Error adding category' });
    }
});

module.exports = Router;
