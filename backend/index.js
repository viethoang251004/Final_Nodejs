require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const UserRouter = require('./routers/UserRouter');
const HomeRouter = require('./routers/HomeRouter');
const CartRouter = require('./routers/CartRouter');
const AdminRouter = require('./routers/AdminRouter');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(
    session({
        secret: '54ada8d8279d350e8bdbba6e5a498daa',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    }),
);

// Serve static files from the "public" directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', HomeRouter);
app.use('/users', UserRouter);
app.use('/cart', CartRouter);
app.use('/admin', AdminRouter);

const port = process.env.PORT || 8080;
const CONNECTION_STRING = process.env.CONNECTION_STRING;

if (!CONNECTION_STRING) {
    console.error(
        'Error: CONNECTION_STRING is not defined in the environment variables.',
    );
    process.exit(1);
}

const connect = async () => {
    try {
        console.log(
            'Connecting to MongoDB with connection string:',
            CONNECTION_STRING,
        );
        await mongoose.connect(CONNECTION_STRING, {
            dbName: 'ePhoneShop',
        });
        console.log('Connected to MongoDB.');

        app.listen(port, () =>
            console.log('Server is running at http://localhost:' + port),
        );
    } catch (error) {
        console.log('Không thể kết nối tới db server: ' + error.message);
    }
};

connect();
