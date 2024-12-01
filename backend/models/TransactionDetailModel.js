const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionDetailSchema = new Schema({
    transaction: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('TransactionDetail', TransactionDetailSchema);
