require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const ProductRouter = require('./routers/ProductRouter');
const TransactionDetailRouter = require('./routers/TransactionDetailRouter');
const TransactionRouter = require('./routers/TransactionRouter');
const UserRouter = require('./routers/UserRouter');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/products', ProductRouter);
app.use('/transactions', TransactionRouter);
app.use('/users', UserRouter);
app.use('/transactionDetails', TransactionDetailRouter);

const port = process.env.PORT || 8080;
const CONNECTION_STRING = process.env.CONNECTION_STRING;

// Kiểm tra biến môi trường
if (!CONNECTION_STRING) {
    console.error("Error: CONNECTION_STRING is not defined in the environment variables.");
    process.exit(1);
}

const connect = async () => {
    try {
        console.log("Connecting to MongoDB with connection string:", CONNECTION_STRING);
        await mongoose.connect(CONNECTION_STRING, {
            dbName: 'ePhoneShop',
        });
        console.log("Connected to MongoDB.");
        // Chỉ khởi chạy server sau khi kết nối thành công
        app.listen(port, () => console.log('Server is running at http://localhost:' + port));
    } catch (error) {
        console.log('Không thể kết nối tới db server: ' + error.message);
    }
};


connect();
