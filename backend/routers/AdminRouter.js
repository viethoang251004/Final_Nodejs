const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const CouponModel = require('../models/CouponModel');
const AnalyticsModel = require('../models/AnalyticsModel');

const CheckAdminAccess = require('../auth/CheckAdminAccess');
const CheckLogin = require('../auth/CheckLogin');

router.get('/', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalOrders = await OrderModel.countDocuments();
        const totalRevenue = await OrderModel.aggregate([
            { $group: { _id: null, total: { $sum: '$total_price' } } },
        ]);

        res.render('layouts/main', {
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

router.get('/products', CheckLogin, CheckAdminAccess, async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    try {
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        const products = await ProductModel.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await ProductModel.countDocuments(query);

        res.render('productManagement', {
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Lỗi khi tải danh sách sản phẩm.');
    }
});

router.get('/orders', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const orders = await OrderModel.find().populate('user_id');

        res.render('layouts/main', {
            title: 'Order Management',
            body: 'orderManagement',
            orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).send('Lỗi khi tải danh sách đơn hàng.');
    }
});

router.get('/coupons', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const coupons = await CouponModel.find().sort({ created_at: -1 });
        res.render('couponManagement', {
            message: '',
            coupons
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
            return res.render('couponManagement', {
                message: 'Mã giảm giá đã tồn tại!',
                coupons: await CouponModel.find().sort({ created_at: -1 })
            });
        }

        const coupon = new CouponModel({ code, discount, expires_at });
        await coupon.save();
        res.render('couponManagement', {
            message: 'Mã giảm giá được tạo thành công!',
            coupons: await CouponModel.find().sort({ created_at: -1 })
        });
    } catch (error) {
        console.error('Error creating coupon:', error.message);
        res.render('couponManagement', {
            message: 'Lỗi khi tạo mã giảm giá!',
            coupons: await CouponModel.find().sort({ created_at: -1 })
        });
    }
});

router.post('/coupons/:id', CheckLogin, CheckAdminAccess, async (req, res) => {
    try {
        const { id } = req.params;
        await CouponModel.findByIdAndDelete(id);
        res.render('couponManagement', {
            message: 'Mã giảm giá đã được xóa thành công!',
            coupons: await CouponModel.find().sort({ created_at: -1 })
        });
    } catch (error) {
        console.error('Error deleting coupon:', error.message);
        res.render('couponManagement', {
            message: 'Lỗi khi xóa mã giảm giá!',
            coupons: await CouponModel.find().sort({ created_at: -1 })
        });
    }
});
module.exports = router;
