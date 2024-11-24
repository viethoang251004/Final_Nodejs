const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: new mongoose.Types.ObjectId()
    },
    size: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0 // Inventory quantity cannot be negative
    }
});

// Define the main schema for Product
const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0 // Price cannot be negative
    },
    images: {
        type: [String], // List of image URLs
        default: []
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String], // List of cards
        default: []
    },
    variants: {
        type: [VariantSchema], // List of product variations
        default: []
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5 // Average score ranked from 0 to 5
    },
    reviews_count: {
        type: Number,
        default: 0,
        min: 0 // Number of non-negative reviews
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware to automatically update `updated_at` before saving
ProductSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('Product', ProductSchema);
