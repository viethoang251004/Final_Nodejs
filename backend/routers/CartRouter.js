const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const UserModel = require('../models/UserModel');
const CartModel = require('../models/CartModel');
const CouponModel = require('../models/CouponModel');

router.post('/add/:id', async (req, res) => {
    const productId = req.params.id;
    const { color, size, quantity } = req.body;

    try {
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại.');
        }

        const selectedVariant = product.variants.find(
            (variant) => variant.color === color && variant.size === size,
        );

        if (!selectedVariant) {
            return res.status(400).send('Biến thể không tồn tại.');
        }

        const requestedQuantity = parseInt(quantity, 10);
        if (selectedVariant.stock < requestedQuantity) {
            return res.status(400).send('Không đủ hàng trong kho.');
        }

        if (req.user) {
            let userCart = await CartModel.findOne({ user_id: req.user._id });
            if (!userCart) {
                userCart = new CartModel({ user_id: req.user._id, items: [] });
            }

            const existingItem = userCart.items.find(
                (item) =>
                    item.product_id.toString() === productId &&
                    item.variant_id === selectedVariant._id.toString(),
            );

            if (existingItem) {
                existingItem.quantity += requestedQuantity;
            } else {
                userCart.items.push({
                    product_id: productId,
                    variant_id: selectedVariant._id.toString(),
                    quantity: requestedQuantity,
                    price: selectedVariant.price || product.price,
                });
            }

            await userCart.save();
        } else {
            if (!req.session.cart) {
                req.session.cart = [];
            }

            const existingItem = req.session.cart.find(
                (item) =>
                    item.product_id === productId &&
                    item.variant_id === selectedVariant._id.toString(),
            );

            if (existingItem) {
                existingItem.quantity += requestedQuantity;
            } else {
                req.session.cart.push({
                    product_id: productId,
                    variant_id: selectedVariant._id.toString(),
                    quantity: requestedQuantity,
                    price: selectedVariant.price || product.price,
                });
            }
        }

        res.redirect('/cart');
    } catch (error) {
        console.error('Error adding to cart:', error.message);
        res.status(500).send('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
    }
});

router.get('/', async (req, res) => {
    let cartItems = [];
    let total = 0;

    try {
        if (req.user) {
            const userCart = await CartModel.findOne({
                user_id: req.user._id,
            }).populate('items.product_id');

            if (userCart) {
                cartItems = userCart.items.map((item) => {
                    const variant = item.product_id.variants.id(
                        item.variant_id,
                    );
                    return {
                        ...item._doc,
                        product: item.product_id,
                        variant: variant || null,
                    };
                });
            }
        } else if (req.session.cart) {
            cartItems = await Promise.all(
                req.session.cart.map(async (item) => {
                    const product = await ProductModel.findById(
                        item.product_id,
                    );
                    const variant = product.variants.id(item.variant_id);
                    return { ...item, product, variant: variant || null };
                }),
            );
        }

        total = cartItems.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
        );

        res.render('layouts/user/main', {
            title: 'Giỏ hàng - PhoneShop',
            body: 'cart',
            style: 'cart-style',
            cartItems,
            total,
            user: req.user || null
        });
    } catch (error) {
        console.error('Error displaying cart:', error.message);
        res.status(500).send('Có lỗi xảy ra khi tải giỏ hàng.');
    }
});

router.post('/remove/:id', async (req, res) => {
    const productId = req.params.id;
    const { color, size } = req.body;

    try {
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại.');
        }

        const selectedVariant = product.variants.find(
            (variant) => variant.color === color && variant.size === size
        );

        if (!selectedVariant) {
            return res.status(400).send('Biến thể không tồn tại.');
        }

        if (req.user) {
            let userCart = await CartModel.findOne({ user_id: req.user._id });
            if (!userCart) {
                return res.status(404).send('Giỏ hàng không tồn tại.');
            }

            console.log('User Cart before removal:', userCart.items);

            userCart.items = userCart.items.filter(
                (item) =>
                    item.product_id.toString() !== productId ||
                    item.variant_id.toString() !== selectedVariant._id.toString()
            );

            console.log('User Cart after removal:', userCart.items);

            await userCart.save();
        } else {
            if (req.session.cart) {
                console.log('Current session cart:', req.session.cart);
                req.session.cart = req.session.cart.filter(
                    (item) =>
                        item.product_id !== productId ||
                        item.variant_id !== selectedVariant._id.toString()
                );
                console.log('Updated session cart:', req.session.cart);
            }
        }

        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing from cart:', error.message);
        res.status(500).send('Có lỗi xảy ra khi xoá sản phẩm khỏi giỏ hàng.');
    }
});

router.get('/checkout', async (req, res) => {
    let cartItems = [];
    let total = 0;
    let discountCode = req.session.discountCode || ''; 
    let discountAmount = req.session.discountAmount || 0; 
    let shippingCost = req.session.shippingCost || 20000;
    let customerInfo = {
        full_name: '',
        phone: '',
        address: '',
        bankName: '',
        accountNumber: '',
        accountName: ''
    };

    try {
        if (req.user) {
            const user = await UserModel.findById(req.user._id).select('name addresses');
            if (!user) {
                return res.status(404).send('User not found');
            }

            const userCart = await CartModel.findOne({ user_id: req.user._id }).populate('items.product_id');
            if (userCart) {
                cartItems = userCart.items.map((item) => {
                    const variant = item.product_id.variants.id(item.variant_id);
                    return {
                        ...item._doc,
                        product: item.product_id,
                        variant: variant || null,
                    };
                });
            }
            const defaultAddress = user.addresses.find(address => address.is_default) || user.addresses[0];

            if (defaultAddress) {
                customerInfo = {
                    full_name: defaultAddress.full_name || user.name,
                    phone: defaultAddress.phone || '',
                    address: defaultAddress.address || '',
                };
            } else {
                customerInfo = {
                    full_name: user.name || '',
                    phone: '',
                    address: '',
                };
            }

        } else if (req.session.cart) {
            cartItems = await Promise.all(
                req.session.cart.map(async (item) => {
                    const product = await ProductModel.findById(item.product_id);
                    const variant = product.variants.id(item.variant_id);
                    return { ...item, product, variant: variant || null };
                }),
            );
        }

        total = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

        if (!discountCode || discountCode.trim() === '' || !discountAmount) {
            req.session.discountCode = '';
            req.session.discountAmount = 0;
            discountAmount = 0;
        }
        req.session.shippingCost = shippingCost;
        const subtotal = total + shippingCost;

        if (discountCode) {
            const coupon = await CouponModel.findOne({ code: discountCode });
            if (coupon && new Date(coupon.expires_at) >= new Date()) {
                discountAmount = Math.min((total * coupon.discount) / 100, total);
            } else {
                req.session.discountCode = '';
                req.session.discountAmount = 0;
                discountAmount = 0;
            }
        }
        const finalTotal = subtotal - discountAmount;
        res.render('checkout', {
            cartItems,
            total,
            user: req.user || null,
            discountCode,
            discountAmount,
            shippingCost,
            finalTotal,
            customerInfo,
        });
    } catch (error) {
        console.error('Error rendering checkout page:', error);
        res.status(500).send('Có lỗi xảy ra khi tải trang thanh toán.');
    }
});


router.post('/checkout/confirm', async (req, res) => {
    const { shippingMethod } = req.body;
    let cartItems = [];
    let total = 0;
    let discountAmount = 0;
    let customerInfo = {
        full_name: req.body.full_name || '',
        phone: req.body.phone || '',
        address: req.body.address || '',
        bankName: req.body.bankName || '',
        accountNumber: req.body.accountNumber || '',
        accountName: req.body.accountName || '',
    };
    let discountCode = req.session.discountCode || '';
    let paymentMethod = req.body.paymentMethod || '';
    const shippingCost = parseInt(shippingMethod);
    req.session.shippingCost = shippingCost;
    try {
        if (req.user) {
            const userCart = await CartModel.findOne({ user_id: req.user._id }).populate('items.product_id');

            if (userCart && userCart.items.length > 0) {
                cartItems = userCart.items.map(item => {
                    const variant = item.product_id.variants.id(item.variant_id);
                    return {
                        ...item._doc,
                        product: item.product_id,
                        variant: variant || null
                    };
                });
            }
        } else if (req.session.cart && req.session.cart.length > 0) {
            cartItems = await Promise.all(req.session.cart.map(async (item) => {
                const product = await ProductModel.findById(item.product_id);
                const variant = product.variants.id(item.variant_id);
                return { ...item, product, variant: variant || null };
            }));
        }

        if (cartItems.length === 0) {
            return res.status(400).send('Giỏ hàng của bạn hiện tại đang trống.');
        }

        total = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

        if (discountCode) {
            const coupon = await CouponModel.findOne({ code: discountCode });
            if (coupon && new Date(coupon.expires_at) >= new Date()) {
                discountAmount = Math.min((total * coupon.discount) / 100, total);
            }
        }
        let subtotal = total - discountAmount;
        const finalTotal = subtotal + shippingCost;

        return res.render('checkout_confirm', {
            cartItems,
            total,
            discountAmount,
            finalTotal,
            discountCode,
            customerInfo,
            paymentMethod,
            shippingCost,
            user: req.user || null
        });
    } catch (error) {
        console.error('Error rendering checkout confirm page:', error);
        res.status(500).send('Có lỗi xảy ra khi tải trang xác nhận.');
    }
});

router.post('/checkout/apply-coupon', async (req, res) => {
    const { code } = req.body; 
    let discountAmount = 0; 
    let total = 0; 
    let shippingCost = req.session.shippingCost || 20000;
    try {
        let cartItems = [];
        if (req.user) {
            const userCart = await CartModel.findOne({ user_id: req.user._id }).populate('items.product_id');
            if (userCart) {
                cartItems = userCart.items.map(item => ({
                    ...item._doc,
                    product: item.product_id,
                }));
            }
        } else if (req.session.cart) {
            cartItems = await Promise.all(
                req.session.cart.map(async item => {
                    const product = await ProductModel.findById(item.product_id);
                    return { ...item, product };
                })
            );
        }

        total = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

        if (!code || code.trim() === '') {
            return res.status(400).send('Vui lòng nhập mã giảm giá.');
        }

        const coupon = await CouponModel.findOne({ code });
        if (!coupon) {
            return res.status(404).send('Mã giảm giá không tồn tại.');
        }

        if (!coupon.is_active) {
            return res.status(400).send('Mã giảm giá này không còn hoạt động.');
        }

        if (new Date(coupon.expires_at) < new Date()) {
            return res.status(400).send('Mã giảm giá đã hết hạn.');
        }

        discountAmount = (total * coupon.discount) / 100;

        req.session.discountCode = code;
        req.session.discountAmount = discountAmount;

        res.json({
            message: 'Mã giảm giá đã được áp dụng.',
            totalAmount: total,
            discountAmount,
            finalAmount: total - discountAmount + shippingCost,
        });
    } catch (error) {
        console.error('Error applying coupon:', error); 
        res.status(500).send('Có lỗi xảy ra khi áp dụng mã giảm giá.');
    }
});

router.post('/checkout/complete', (req, res) => {
    const { full_name, phone, address, paymentMethod, cartItems, shippingCost } = req.body;

    req.session.cart = [];
    req.session.total = 0;

    res.redirect('/cart');
});

module.exports = router;
