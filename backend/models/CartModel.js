const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Tham chiếu tới ProductModel
        required: true,
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Nếu sản phẩm có biến thể
    },
    quantity: {
        type: Number,
        required: true,
        min: 1, // Không thể đặt số lượng nhỏ hơn 1
    },
    price: {
        type: Number,
        required: true, // Lưu giá của sản phẩm tại thời điểm thêm vào giỏ hàng
    },
});

const CartSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu tới UserModel
        required: true,
    },
    items: {
        type: [CartItemSchema],
        default: [], // Danh sách các sản phẩm trong giỏ hàng
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

CartSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('Cart', CartSchema);
