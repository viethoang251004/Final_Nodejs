const express = require('express');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/UserModel');
const loginValidator = require('./validators/loginValidator');
const registerValidator = require('./validators/registerValidator');
const CheckAdminAccess = require('../auth/CheckAdminAccess');  // Kiểm tra quyền truy cập admin

const router = express.Router();

// Route đăng nhập
router.get('/login', (req, res) => {
    res.render('admin/login'); 
});

// Route trang admin, yêu cầu người dùng phải là admin
router.get('/', CheckAdminAccess, (req, res) => {
    res.render('admin/dashboard');
});

// Xử lý đăng nhập
router.post('/login', loginValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        // Lưu thông tin vào cookie
        res.cookie('userRole', user.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        res.cookie('userId', user._id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

        // Chuyển hướng dựa trên vai trò
        if (user.role === 'ADMIN') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi.' });
    }
});

// Xử lý đăng ký
router.post('/register', registerValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, addresses, social_auth, points } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'USER',  // Vai trò mặc định là USER nếu không có role
            addresses,
            social_auth,
            points
        });

        await newUser.save();
        res.status(201).json({ message: 'Đăng ký thành công.', user: newUser });
    } catch (error) {
        const isDevelopment = process.env.NODE_ENV !== 'production';
        res.status(500).json({ 
            message: 'Đã xảy ra lỗi khi đăng ký.', 
            error: isDevelopment ? error.message : undefined 
        });
    }
});

// Route lấy danh sách người dùng
router.get('/users', CheckAdminAccess, async (req, res) => {
    try {
        const users = await User.find();
        res.render('admin', { users });  // Truyền danh sách người dùng vào view admin.ejs
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách người dùng.' });
    }
});

// AdminRouter.js

// Route xóa người dùng
router.delete('/user/:id', CheckAdminAccess, async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa người dùng.' });
    }
});

module.exports = router;
