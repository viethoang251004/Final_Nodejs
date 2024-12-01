const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const UserModel = require('../models/UserModel');
const CartModel = require('../models/CartModel');

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
            (variant) => variant.color === color && variant.size === size
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
                    item.variant_id === selectedVariant._id.toString()
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
                    item.variant_id === selectedVariant._id.toString()
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
            const userCart = await CartModel.findOne({ user_id: req.user._id }).populate('items.product_id');

            if (userCart) {
                cartItems = userCart.items.map((item) => {
                    const variant = item.product_id.variants.id(item.variant_id); // Tìm variant theo ID
                    return {
                        ...item._doc,
                        product: item.product_id,
                        variant: variant || null, // Đảm bảo variant không null
                    };
                });
            }
        } else if (req.session.cart) {
            // Nếu sử dụng session-based cart
            cartItems = await Promise.all(
                req.session.cart.map(async (item) => {
                    const product = await ProductModel.findById(item.product_id);
                    const variant = product.variants.id(item.variant_id);
                    return { ...item, product, variant: variant || null };
                })
            );
        }

        // Tính tổng giá
        total = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

        res.render('cart', { cartItems, total, user: req.user || null });
    } catch (error) {
        console.error('Error displaying cart:', error.message);
        res.status(500).send('Có lỗi xảy ra khi tải giỏ hàng.');
    }
});

module.exports = router;