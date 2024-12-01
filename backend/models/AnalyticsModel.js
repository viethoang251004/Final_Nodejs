const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['sales', 'users', 'products'], // Giới hạn các giá trị hợp lệ cho "type"
    },
    data: {
        type: Map, // Dùng Map để lưu trữ dữ liệu key-value tùy chỉnh
        of: mongoose.Schema.Types.Mixed, // Mixed cho phép lưu mọi kiểu dữ liệu (string, number, object, etc.)
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now, // Lưu thời gian tạo, mặc định là thời gian hiện tại
    },
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
