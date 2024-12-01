const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
    address_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: new mongoose.Types.ObjectId(),
    },
    full_name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    is_default: {
        type: Boolean,
        default: false,
    },
});

const SocialAuthSchema = new Schema({
    provider: {
        type: String,
        enum: ['google', 'facebook'],
        required: false,
    },
    id: {
        type: String,
        required: false,
    },
});

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['CUSTOMER', 'ADMIN'],
        required: true,
    },
    addresses: {
        type: [AddressSchema], // Danh sách địa chỉ
        default: [],
    },
    social_auth: {
        type: SocialAuthSchema, // Đối tượng xác thực xã hội
        default: {},
    },
    points: {
        type: Number,
        default: 0,
        min: 0, // Điểm thưởng không âm
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

// Middleware tự động cập nhật `updated_at` trước khi lưu
UserSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('User', UserSchema);
