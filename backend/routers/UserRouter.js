const express = require('express');
const Router = express.Router();
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/UserModel');
const rateLimit = require('express-rate-limit');
const loginValidator = require('./validators/loginValidator');
const registerValidator = require('./validators/registerValidator');
const CheckLogin = require('../auth/CheckLogin');
const Order = require('../models/OrderModel');
const authMiddleware = require('../auth/authMiddleware');

Router.use(authMiddleware);

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
Router.get('/login', (req, res) => {
    res.render('login');
});

Router.post('/login', loginValidator, (req, res) => {
    let result = validationResult(req);

    if (result.errors.length === 0) {
        let { email, password } = req.body;

        User.findOne({ email: email.toLowerCase() })
            .then((user) => {
                if (!user) {
                    return res.render('login', {
                        errorMessage: 'Email không tồn tại',
                    });
                }

                return bcryptjs
                    .compare(password, user.password)
                    .then((passwordMatch) => {
                        if (!passwordMatch) {
                            return res.render('login', {
                                errorMessage:
                                    'Đăng nhập thất bại, mật khẩu không chính xác',
                            });
                        }

                        const { JWT_SECRET } = process.env;
                        jwt.sign(
                            {
                                id: user._id,
                                email: user.email,
                                role: user.role,
                            },
                            JWT_SECRET,
                            { expiresIn: '1h' },
                            (err, token) => {
                                if (err) throw err;

                                res.cookie('userDataLogin', token, {
                                    httpOnly: true,
                                    secure: false,
                                });
                                res.cookie('userRole', user.role, {
                                    httpOnly: true,
                                    secure: false,
                                });

                                if (user.role === 'ADMIN') {
                                    return res.redirect('/admin/dashboard');
                                } else {
                                    return res.redirect('/');
                                }
                            },
                        );
                    });
            })
            .catch((e) => {
                return res.render('login', {
                    errorMessage: `Đăng nhập thất bại: ${e.message}`,
                });
            });
    } else {
        let message = Object.values(result.mapped())[0].msg;
        return res.render('login', { errorMessage: message });
    }
});

Router.get('/register', (req, res) => {
    res.render('register', { errorMessage: '' });
});

Router.post('/register', registerValidator, (req, res) => {
    let result = validationResult(req);
    if (result.errors.length === 0) {
        let { name, email, password, role, addresses, social_auth, points } =
            req.body;

        if (role === 'ADMIN') {
            return res.status(403).render('register', {
                errorMessage: 'Bạn không có quyền tạo tài khoản ADMIN.',
            });
        }

        User.findOne({
            $or: [{ email: email.toLowerCase() }, { name: name.toLowerCase() }],
        })
            .then((user) => {
                if (user) {
                    throw new Error(
                        'Tên người dùng hoặc email đã được sử dụng.',
                    );
                }
                return bcryptjs.hash(password, 10);
            })
            .then((hashed) => {
                let newUser = new User({
                    name: name.toLowerCase(),
                    email: email.toLowerCase(),
                    password: hashed,
                    role: role || 'CUSTOMER', // Default is  CUSTOMER
                    addresses: addresses || [],
                    social_auth: social_auth || {},
                    points: points || 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                return newUser.save();
            })
            .then(() => {
                return res.redirect('/users/login');
            })
            .catch((e) => {
                return res.render('register', {
                    errorMessage: `Đăng ký tài khoản thất bại: ${e.message}`,
                });
            });
    } else {
        let message = Object.values(result.mapped())[0].msg;
        return res.render('register', { errorMessage: message });
    }
});

Router.get('/orders', CheckLogin, allOrderLimiter, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Phân trang với mặc định 10 đơn/trang

        const orders = await Order.find()
            .sort({ created_at: -1 }) // Sắp xếp giảm dần theo ngày
            .skip((page - 1) * limit) // Bỏ qua các đơn ở trang trước
            .limit(parseInt(limit)); // Lấy số đơn hàng theo `limit`

        const totalOrders = await Order.countDocuments(); // Tổng số đơn hàng
        const totalPages = Math.ceil(totalOrders / limit); // Tổng số trang

        res.render('layouts/user/main', {
            title: 'Order History',
            body: 'orderHistory',
            style: 'orderHistory-style',
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
});

Router.get(
    '/orders/detail/:id',
    CheckLogin,
    detailOrderLimiter,
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res
                    .status(400)
                    .json({ error: 'ID đơn hàng không hợp lệ.' });
            }

            const order = await Order.findById(id).populate(
                'products.product_id',
            );

            if (!order) {
                return res
                    .status(404)
                    .json({ error: 'Không tìm thấy đơn hàng.' });
            }

            res.render('layouts/user/main', {
                title: 'Chi tiết đơn hàng',
                body: 'order-detail',
                style: 'order-detail-style',
                order,
                user: req.user || null,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Đã xảy ra lỗi khi lấy thông tin đơn hàng.',
            });
        }
    },
);

Router.get('/logout', (req, res) => {
    res.clearCookie('userDataLogin');
    res.clearCookie('userRole');
    res.redirect('/');
});

module.exports = Router;
