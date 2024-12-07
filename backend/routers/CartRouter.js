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
        // Tìm sản phẩm
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại.');
        }

        // Tìm biến thể (variant) dựa trên màu sắc và kích thước
        const selectedVariant = product.variants.find(
            (variant) => variant.color === color && variant.size === size,
        );

        if (!selectedVariant) {
            return res.status(400).send('Biến thể không tồn tại.');
        }

        // Kiểm tra tồn kho
        const requestedQuantity = parseInt(quantity, 10);
        if (selectedVariant.stock < requestedQuantity) {
            return res.status(400).send('Không đủ hàng trong kho.');
        }

        // Nếu user đã đăng nhập
        if (req.user) {
            let userCart = await CartModel.findOne({ user_id: req.user._id });
            if (!userCart) {
                userCart = new CartModel({ user_id: req.user._id, items: [] });
            }

            // Kiểm tra nếu sản phẩm và biến thể đã có trong giỏ hàng
            const existingItem = userCart.items.find(
                (item) =>
                    item.product_id.toString() === productId &&
                    item.variant_id === selectedVariant._id.toString(),
            );

            if (existingItem) {
                existingItem.quantity += requestedQuantity;
            } else {
                // Thêm mới sản phẩm vào giỏ hàng
                userCart.items.push({
                    product_id: productId,
                    variant_id: selectedVariant._id.toString(),
                    quantity: requestedQuantity,
                    price: selectedVariant.price || product.price, // Sử dụng giá biến thể nếu có
                });
            }

            await userCart.save();
        } else {
            // Nếu user chưa đăng nhập, sử dụng session
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
            // Lấy giỏ hàng từ cơ sở dữ liệu
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
        // Tìm sản phẩm trong CSDL
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại.');
        }

        // Tìm biến thể (variant) dựa trên màu sắc và kích thước
        const selectedVariant = product.variants.find(
            (variant) => variant.color === color && variant.size === size
        );

        if (!selectedVariant) {
            return res.status(400).send('Biến thể không tồn tại.');
        }

        // Nếu người dùng đã đăng nhập, xóa sản phẩm trong giỏ hàng của họ
        if (req.user) {
            let userCart = await CartModel.findOne({ user_id: req.user._id });
            if (!userCart) {
                return res.status(404).send('Giỏ hàng không tồn tại.');
            }

            // Kiểm tra và log dữ liệu trước khi xóa
            console.log('User Cart before removal:', userCart.items);

            // Tìm và xoá sản phẩm khỏi giỏ hàng của người dùng
            userCart.items = userCart.items.filter(
                (item) =>
                    item.product_id.toString() !== productId ||
                    item.variant_id.toString() !== selectedVariant._id.toString()
            );

            console.log('User Cart after removal:', userCart.items);  // Log lại giỏ hàng sau khi xóa

            await userCart.save();
        } else {
            // Nếu người dùng chưa đăng nhập, xóa sản phẩm trong giỏ hàng session
            if (req.session.cart) {
                // Log giỏ hàng trong session trước khi thao tác
                console.log('Current session cart:', req.session.cart);
                req.session.cart = req.session.cart.filter(
                    (item) =>
                        item.product_id !== productId ||
                        item.variant_id !== selectedVariant._id.toString()
                );
                console.log('Updated session cart:', req.session.cart);  // Log lại giỏ hàng sau khi xóa
            }
        }

        res.redirect('/cart'); // Quay lại trang giỏ hàng
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
            // Lấy thông tin người dùng
            const user = await UserModel.findById(req.user._id).select('name addresses');
            if (!user) {
                return res.status(404).send('User not found');
            }

            // Lấy giỏ hàng từ DB
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
                    address: '', // Trường hợp không có địa chỉ
                };
            }

        } else if (req.session.cart) {
            // Xử lý giỏ hàng cho khách không đăng nhập
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
            discountAmount = 0; // Reset giảm giá về 0
        }
        req.session.shippingCost = shippingCost;
        const subtotal = total + shippingCost;
        // Xử lý mã giảm giá
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
        // Render trang checkout
        res.render('checkout', {
            cartItems,
            total,
            user: req.user || null,
            discountCode,
            discountAmount,
            shippingCost,
            finalTotal,
            customerInfo, // Truyền thông tin người dùng
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
        full_name: req.body.full_name || '', // Lấy từ form nhập
        phone: req.body.phone || '',
        address: req.body.address || '',
        bankName: req.body.bankName || '',
        accountNumber: req.body.accountNumber || '',
        accountName: req.body.accountName || '',
    };
    let discountCode = req.session.discountCode || ''; // Mã giảm giá từ session
    let paymentMethod = req.body.paymentMethod || '';
    const shippingCost = parseInt(shippingMethod); // Cập nhật shipping cost vào session
    req.session.shippingCost = shippingCost;
    try {
        // Kiểm tra giỏ hàng từ session hoặc cơ sở dữ liệu
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
            // Xử lý giỏ hàng cho khách chưa đăng nhập
            cartItems = await Promise.all(req.session.cart.map(async (item) => {
                const product = await ProductModel.findById(item.product_id);
                const variant = product.variants.id(item.variant_id);
                return { ...item, product, variant: variant || null };
            }));
        }

        // Nếu không có sản phẩm trong giỏ hàng, hiển thị lỗi
        if (cartItems.length === 0) {
            return res.status(400).send('Giỏ hàng của bạn hiện tại đang trống.');
        }

        // Tính tổng giá trị giỏ hàng
        total = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

        // Kiểm tra mã giảm giá nếu có
        if (discountCode) {
            const coupon = await CouponModel.findOne({ code: discountCode });
            if (coupon && new Date(coupon.expires_at) >= new Date()) {
                discountAmount = Math.min((total * coupon.discount) / 100, total);
            }
        }
        let subtotal = total - discountAmount;
        // Tính toán tổng sau giảm giá
        const finalTotal = subtotal + shippingCost;

        // Xử lý logic cho phần vận chuyển thành công
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

        // Tính giá trị giảm giá
        discountAmount = (total * coupon.discount) / 100;

        // Cập nhật session
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

    // Xóa giỏ hàng sau khi hoàn thành đơn hàng
    req.session.cart = [];
    req.session.total = 0;

    res.redirect('/cart');
});



module.exports = router;
