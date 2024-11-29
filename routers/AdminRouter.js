const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const CouponModel = require('../models/CouponModel');
const AnalyticsModel = require('../models/AnalyticsModel');

const CheckAdminAccess = require('../auth/CheckAdminAccess');
//xóa đỡ chekcadminaccess

router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalOrders = await OrderModel.countDocuments();
        const totalRevenue = await OrderModel.aggregate([
            { $group: { _id: null, total: { $sum: '$total_price' } } },
        ]);

        res.render('dashboard', {
            totalUsers,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        res.status(500).send('Lỗi khi tải bảng điều khiển.');
    }
});
//xóa đỡ chekcadminaccess
router.get('/products',  async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    try {
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
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
//xóa đỡ chekcadminaccess
router.get('/orders', async (req, res) => {
    try {
        const orders = await OrderModel.find().populate('user_id');

        res.render('orderManagement', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).send('Lỗi khi tải danh sách đơn hàng.');
    }
});
//xóa đỡ chekcadminaccess
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await CouponModel.find().sort({ created_at: -1 });
        res.render('couponManagement', { coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error.message);
        res.status(500).send('Lỗi khi tải danh sách mã giảm giá.');
    }
});
//xóa đỡ chekcadminaccess
router.post('/coupons', async (req, res) => {
    const { code, discount, expires_at } = req.body;
    try {
        const coupon = new CouponModel({ code, discount, expires_at });
        await coupon.save();
        res.status(201).json({ message: 'Mã giảm giá được tạo thành công!' });
    } catch (error) {
        console.error('Error creating coupon:', error.message);
        res.status(500).send('Lỗi khi tạo mã giảm giá.');
    }
});
//xóa đỡ chekcadminaccess
router.post('/coupons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await CouponModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Mã giảm giá đã được xóa thành công!' });
    } catch (error) {
        console.error('Error deleting coupon:', error.message);
        res.status(500).send('Lỗi khi xóa mã giảm giá.');
    }
});

module.exports = router;
