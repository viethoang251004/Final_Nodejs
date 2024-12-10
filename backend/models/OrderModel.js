const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderProductSchema = new Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        variant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Variant',
            required: false,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1, // Quantity must be at least 1
        },
        price: {
            type: Number,
            required: true,
            min: 0, // Price must be non-negative
        },
    },
    { _id: false },
);

// Define the main schema for Order
const OrderSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        default: null, // Null if the user is a guest
    },
    customer_info: {
        full_name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
    },
    products: {
        type: [OrderProductSchema], // List of products in the order
        required: true,
        validate: [
            (array) => array.length > 0,
            'Order must have at least one product',
        ], // Validate that the order contains at least one product
    },
    total_price: {
        type: Number,
        required: true,
        min: 0, // Total price must be non-negative
    },
    status: {
        type: String,
        required: true,
        enum: ['đang chờ',
            'đã xác nhận',
            'đang vận chuyển',
            'đã giao',
            'đã hủy'], // Valid order statuses
        default: 'đang chờ',
    },
    discount_code: {
        type: String,
        default: null,
        trim: true,
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

// Middleware to automatically update `updated_at` before saving
OrderSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

// Middleware to automatically update `updated_at` when an order is updated
OrderSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: Date.now() });
    next();
});

module.exports = mongoose.model('Order', OrderSchema);
