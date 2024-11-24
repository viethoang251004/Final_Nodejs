const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['sales', 'users', 'products'], // Giới hạn giá trị loại coupon
  },
  data: {
    type: Map, // Map cho phép lưu dữ liệu key-value tùy biến
    of: mongoose.Schema.Types.Mixed, // Mixed cho phép bất kỳ kiểu dữ liệu nào
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Coupon', CouponSchema);