// Sửa CouponModel.js
const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    discount: {
        type: Number,
        required: true,
        min: 1, // Giảm ít nhất 1%
        max: 100, // Không giảm quá 100%
    },
    expires_at: {
        type: Date,
        required: true,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Coupon', CouponSchema);
