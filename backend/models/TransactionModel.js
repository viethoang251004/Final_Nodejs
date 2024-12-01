const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
