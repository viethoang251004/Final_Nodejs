const express = require('express');
const Router = express.Router();
const { validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs'); // Sử dụng bcryptjs
const jwt = require('jsonwebtoken');

const User = require('../models/UserModel');

const loginValidator = require('./validators/loginValidator');
const registerValidator = require('./validators/registerValidator');

Router.get('/login', (req, res) => {
    res.render('login');
});

Router.post('/login', loginValidator, (req, res) => {
    let result = validationResult(req);
    if (result.errors.length === 0) {
        let { email, password } = req.body;

        User.findOne({ email: email.toLowerCase() }) // Tìm kiếm bằng email (chuyển thành chữ thường)
            .then((user) => {
                if (!user) {
                    throw new Error('Email không tồn tại');
                }
                return bcryptjs.compare(password, user.password) 
                    .then((passwordMatch) => {
                        if (!passwordMatch) {
                            return res.status(401).json({
                                code: 3,
                                message: 'Đăng nhập thất bại, mật khẩu không chính xác',
                            });
                        }

                        const { JWT_SECRET } = process.env;
                        jwt.sign(
                            {
                                id: user._id,
                                email: user.email,
                                role: user.role
                            },
                            JWT_SECRET,
                            { expiresIn: '1h' },
                            (err, token) => {
                                if (err) throw err;

                                res.cookie('userDataLogin', token, { httpOnly: true, secure: false });
                                res.cookie('userRole', user.role, { httpOnly: true, secure: false });

                                return res.redirect('/products');
                            }
                        );
                    });
            })
            .catch((e) => {
                return res.status(401).json({ code: 2, message: 'Đăng nhập thất bại: ' + e.message });
            });
    } else {
        let messages = result.mapped();
        let message = '';
        for (let m in messages) {
            message = messages[m].msg;
            break;
        }

        return res.status(400).json({ code: 1, message: message });
    }
});


Router.get('/register', (req, res) => {
    res.render('register', { errorMessage: '' });
});

Router.post('/register', registerValidator, (req, res) => {
    let result = validationResult(req);
    if (result.errors.length === 0) {
        let { name, email, password, role, addresses, social_auth, points } = req.body;

        User.findOne({
            $or: [{ email: email.toLowerCase() }, { name: name.toLowerCase() }]
        })
            .then((user) => {
                if (user) {
                    throw new Error('Tên người dùng hoặc email đã được sử dụng.');
                }
                return bcryptjs.hash(password, 10);
            })
            .then((hashed) => {
                let newUser = new User({
                    name: name.toLowerCase(),
                    email: email.toLowerCase(),
                    password: hashed,
                    role,
                    addresses: addresses || [],
                    social_auth: social_auth || {},
                    points: points || 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                return newUser.save();
            })
            .then(() => {
                return res.redirect('/users/login'); // Chuyển đến trang login
            })
            .catch((e) => {
                return res.render('register', {
                    errorMessage: `Đăng ký tài khoản thất bại: ${e.message}`
                });
            });
    } else {
        let message = Object.values(result.mapped())[0].msg;
        return res.render('register', { errorMessage: message });
    }
});

module.exports = Router;
