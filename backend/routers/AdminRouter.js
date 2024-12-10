const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const CouponModel = require('../models/CouponModel');
const AnalyticsModel = require('../models/AnalyticsModel');
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

const { validationResult } = require('express-validator');

const CheckAdminAccess = require('../auth/CheckAdminAccess');
const CheckLogin = require('../auth/CheckLogin');

const addProductValidator = require('./validators/addProductValidator');
const editProductValidator = require('./validators/editProductValidator');
const Order = require('../models/OrderModel');
const mongoose = require("mongoose");

const allProductLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 5,
    message: 'Không thể gửi quá 5 request trong 10s khi đọc danh sách sản phẩm',
});

const allOrderLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 5,
    message: 'Không thể gửi quá 5 request trong 10s khi đọc danh sách order',
});

const detailOrderLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 2,
    message: 'Không thể gửi quá 2 request trong 10s khi đọc chi tiết order',
});

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

router.get('/dashboard', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalOrders = await OrderModel.countDocuments();
        const totalRevenue = await OrderModel.aggregate([
            { $group: { _id: null, total: { $sum: '$total_price' } } },
        ]);

        res.render('layouts/admin/main', {
            title: 'Admin Dashboard',
            body: 'dashboard',
            style: 'dashboard-style',
            totalUsers,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        res.status(500).send('Lỗi khi tải bảng điều khiển.');
    }
});

router.get('/products', CheckLogin, CheckAdminAccess, allProductLimiter, async (req, res) => {
    const { page = 1, limit = 10, search = '', details = false } = req.query;

    try {
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        const products = await ProductModel.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await ProductModel.countDocuments(query);
        const categories = await Category.find(); // Ensure this is fetched properly
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Brown', 'Orange', 'Cyan', 'Magenta', 'Grey', 'Teal', 'Lime', 'Maroon'];

        return res.render('layouts/admin/main', {
            title: 'Quản lí sản phẩm',
            body: 'productManagement',
            style: 'productManagement-style',
            products,
            categories,
            colors,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            errors: null,
            formData: {},
            editProduct: null,
            variant: {},
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Lỗi khi tải danh sách sản phẩm.');
    }
});

router.get('/coupons', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const coupons = await CouponModel.find().sort({ created_at: -1 });
        res.render('layouts/admin/main', {
            title: 'Quản lí giảm giá',
            body: 'couponManagement',
            style: 'couponManagement-style',
            message: req.query.message || '',
            coupons,
        });
    } catch (error) {
        console.error('Error fetching coupons:', error.message);
        res.status(500).send('Lỗi khi tải danh sách mã giảm giá.');
    }
});

router.post('/coupons', CheckLogin, CheckAdminAccess, async (req, res) => {
    const { code, discount, expires_at } = req.body;
    try {
        const existingCoupon = await CouponModel.findOne({ code });
        if (existingCoupon) {
            return res.render('layouts/admin/main', {
                title: 'Quản lí giảm giá',
                body: 'couponManagement',
                style: 'couponManagement-style',
                message: 'Mã giảm giá đã tồn tại!',
                coupons: await CouponModel.find().sort({ created_at: -1 }),
            });
        }

        const coupon = new CouponModel({ code, discount, expires_at });
        await coupon.save();
        res.render('layouts/admin/main', {
            title: 'Quản lí giảm giá',
            body: 'couponManagement',
            style: 'couponManagement-style',
            message: 'Mã giảm giá được tạo thành công!',
            coupons: await CouponModel.find().sort({ created_at: -1 }),
        });
    } catch (error) {
        console.error('Error creating coupon:', error.message);
        res.render('layouts/admin/main', {
            title: 'Quản lí giảm giá',
            body: 'couponManagement',
            style: 'couponManagement-style',
            message: 'Lỗi khi tạo mã giảm giá!',
            coupons: await CouponModel.find().sort({ created_at: -1 }),
        });
    }
});

router.post('/coupons/:id', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const { id } = req.params;
        await CouponModel.findByIdAndDelete(id);
        res.render('layouts/admin/main', {
            title: 'Quản lí giảm giá',
            body: 'couponManagement',
            style: 'couponManagement-style',
            message: 'Mã giảm giá đã được xóa thành công!',
            coupons: await CouponModel.find().sort({ created_at: -1 }),
        });
    } catch (error) {
        console.error('Error deleting coupon:', error.message);
        res.render('layouts/admin/main', {
            title: 'Quản lí giảm giá',
            body: 'couponManagement',
            style: 'couponManagement-style',
            message: 'Lỗi khi xóa mã giảm giá!',
            coupons: await CouponModel.find().sort({ created_at: -1 }),
        });
    }
});

router.post(
    '/products/add',
    CheckLogin,
    CheckAdminAccess,
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

router.get(
    '/products/edit/:id',
    CheckLogin,
    CheckAdminAccess,
    async (req, res) => {
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

            if (!product)
                return res.status(404).send('Không tìm thấy sản phẩm');

            res.json({ product, categories, colors });
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error.message);
            res.status(500).send('Lỗi khi tải sản phẩm');
        }
    },
);

router.post(
    '/products/edit/:id',
    CheckLogin,
    CheckAdminAccess,
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

router.post(
    '/products/delete/:id',
    CheckLogin,
    CheckAdminAccess,
    async (req, res) => {
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
                return res
                    .status(404)
                    .json({ message: 'Không tìm thấy sản phẩm' });
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
    },
);

router.post(
    '/products/categories/add',
    CheckLogin,
    CheckAdminAccess,
    async (req, res) => {
        try {
            const { name, slug, description } = req.body;

            if (!name || !slug) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: 'Tên và Slug là bắt buộc',
                    });
            }

            const newCategory = new Category({
                name,
                slug,
                description,
            });

            await newCategory.save();
            return res
                .status(201)
                .json({
                    success: true,
                    message: 'Category added successfully',
                });
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
    },
);

router.get('/orders', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Phân trang với mặc định 10 đơn/trang

        const orders = await Order.find()
            .sort({ created_at: -1 }) // Sắp xếp giảm dần theo ngày
            .skip((page - 1) * limit) // Bỏ qua các đơn ở trang trước
            .limit(parseInt(limit)); // Lấy số đơn hàng theo `limit`

        const totalOrders = await Order.countDocuments(); // Tổng số đơn hàng
        const totalPages = Math.ceil(totalOrders / limit); // Tổng số trang

        res.render('layouts/admin/main', {
            title: 'Quản lý đơn hàng',
            body: 'orderManagement',
            style: 'orderManagement-style',
            orders,
            currentPage: parseInt(page),
            totalPages,
            user: req.user || null,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng.',
        });
    }
})

router.post('/orders/update/:id', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const { status } = req.body;
        console.log('Received status:', status);  // Debug log

        const validStatuses = [
            'đang chờ',
            'đã xác nhận',
            'đang vận chuyển',
            'đã giao',
            'đã hủy',
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true },
        );

        if (!order) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
        }

        console.log('Order updated:', order);  // Debug log

        res.redirect(`/admin/orders/detail/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng.',
        });
    }
});


router.post('/orders/create', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const { customer_info, products, total_price } = req.body;

        if (!customer_info || !customer_info.full_name || !customer_info.phone || !customer_info.address) {
            return res.status(400).json({ error: 'Thông tin khách hàng chưa đầy đủ' });
        }

        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'Đơn hàng phải có ít nhất một sản phẩm' });
        }

        if (total_price === undefined || total_price < 0) {
            return res.status(400).json({ error: 'Tổng giá là bắt buộc và phải không âm' });
        }

        // Tạo đơn hàng
        const order = new Order({
            customer_info,
            products,
            total_price,
            status: 'đang chờ', // Set default status
        });

        await order.save();
        res.status(201).json({ message: 'Tạo đơn hàng thành công!', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo đơn hàng.' });
    }

});

router.get(
    '/orders/detail/:id',
    CheckLogin,
    CheckAdminAccess,
    detailOrderLimiter,
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if the ID is valid
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'ID đơn hàng không hợp lệ.' });
            }

            // Fetch the order and populate product details
            const order = await Order.findById(id).populate({
                path: 'products.product_id', // This will populate the product details
                select: 'name price' // Select only the necessary fields
            });

            // If the order doesn't exist
            if (!order) {
                return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
            }

            // Render the order details page
            res.render('layouts/user/main', {
                title: 'Chi tiết đơn hàng',
                body: 'order-detail-management',
                style: 'order-detail-management-style',
                order,
                user: req.user || null,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Đã xảy ra lỗi khi lấy thông tin đơn hàng.',
            });
        }
    }
);

router.post('/orders/detail/:id', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = [
            'đang chờ',
            'đã xác nhận',
            'đang vận chuyển',
            'đã giao',
            'đã hủy',
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true },
        );

        if (!order) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
        }

        res.redirect(`admin/orders/detail/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng.',
        });
    }
});

module.exports = router;
