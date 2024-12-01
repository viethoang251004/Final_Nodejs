const express = require('express');
const Router = express.Router();
const { validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const CheckLogin = require('../auth/CheckLogin');
const CheckRole = require('../auth/CheckAdminAccess');
const Order = require('../models/OrderModel');

// const addOrderValidator = require('./validators/addOrderValidator');
// const editOrderValidator = require('./validators/editOrderValidator');

const allOrderLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 5,
    message: "Không thể gửi quá 5 request trong 10s khi đọc danh sách order"
});

const detailOrderLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 2,
    message: "Không thể gửi quá 2 request trong 10s khi đọc chi tiết order"
});

// Middleware to check ADMIN access
Router.use(CheckLogin, CheckRole);

// Tạo đơn hàng (sau khi thanh toán thành công)
Router.post('/create', CheckLogin, CheckRole, async (req, res) => {
    try {
        const { customer_info, products, total_price, shipping_option } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'Cần ít nhất một sản phẩm trong đơn hàng.' });
        }

        const order = new Order({
            user_id: req.user._id, // Liên kết với tài khoản người dùng
            customer_info,
            products,
            total_price,
            status: 'pending', // Trạng thái mặc định là "pending"
            discount_code: req.body.discount_code || null,
        });

        await order.save();

        res.status(201).json({ message: 'Tạo đơn hàng thành công!', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo đơn hàng.' });
    }
});

// Xem và chỉnh sửa trạng thái đơn hàng
Router.get('/detail/:id', CheckLogin, CheckRole, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('products.product_id');

        if (!order) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
        }

        res.render('order-detail', { order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin đơn hàng.' });
    }
});

Router.post('/detail/:id', CheckLogin, CheckRole, async (req, res) => {
    try {
        const { status } = req.body; // Nhận trạng thái từ form
        const validStatuses = ['đang chờ', 'đã xác nhận', 'đang vận chuyển', 'đã giao', 'đã hủy'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true } // Trả về bản ghi sau khi cập nhật
        );

        if (!order) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
        }

        res.redirect(`/orders/detail/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng.' });
    }
});

// Lấy danh sách đơn hàng với phân trang
Router.get('/', CheckLogin, CheckRole, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Phân trang với mặc định 10 đơn/trang

        const orders = await Order.find()
            .sort({ created_at: -1 }) // Sắp xếp giảm dần theo ngày
            .skip((page - 1) * limit) // Bỏ qua các đơn ở trang trước
            .limit(parseInt(limit)); // Lấy số đơn hàng theo `limit`

        const totalOrders = await Order.countDocuments(); // Tổng số đơn hàng
        const totalPages = Math.ceil(totalOrders / limit); // Tổng số trang

        res.render('order-history', {
            orders,
            currentPage: parseInt(page),
            totalPages,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng.' });
    }
});


module.exports = Router;
