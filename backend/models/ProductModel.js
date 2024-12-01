const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho biến thể sản phẩm
const VariantSchema = new Schema({
    size: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0, // Số lượng tồn kho không thể âm
    },
});

// Schema chính cho sản phẩm
const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0, // Giá không thể âm
    },
    images: {
        type: [String], // Danh sách URL hình ảnh
        default: [],
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    tags: {
        type: [String], // Danh sách thẻ sản phẩm
        default: [],
    },
    variants: {
        type: [VariantSchema], // Danh sách biến thể sản phẩm
        default: [],
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5, // Điểm trung bình từ 0 đến 5
    },
    reviews_count: {
        type: Number,
        default: 0,
        min: 0, // Số lượng đánh giá không âm
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

// Middleware để tự động cập nhật `updated_at` trước khi lưu
ProductSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('Product', ProductSchema);
