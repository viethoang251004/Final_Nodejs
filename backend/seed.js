const mongoose = require('mongoose');
require('dotenv').config();
const bcryptjs = require('bcryptjs');

const CONNECTION_STRING = process.env.CONNECTION_STRING;

async function connectWithRetry() {
    try {
        console.log('Trying to connect to MongoDB...');
        await mongoose.connect(CONNECTION_STRING);
        console.log('MongoDB connected!');
    } catch (error) {
        console.error('MongoDB connection failed, retrying in 5 seconds...', error.message);
        setTimeout(connectWithRetry, 5000); // Retry sau 5 giây
    }
}

connectWithRetry();

const Category = require('./models/CategoryModel');
const Product = require('./models/ProductModel');
const User = require('./models/UserModel');

const categories = [
    { name: 'Điện thoại', slug: 'dien-thoai', description: 'Các sản phẩm điện thoại thông minh' },
    { name: 'Laptop', slug: 'laptop', description: 'Các sản phẩm laptop cao cấp' },
    { name: 'Phụ kiện', slug: 'phu-kien', description: 'Các loại phụ kiện' },
];

const sizes = Array.from({ length: 6 }, (_, i) => (4.0 + i * 0.5).toFixed(2));
const colors = [
    'Red', 'Blue', 'Green', 'Yellow', 'Black', 'White',
    'Pink', 'Purple', 'Brown', 'Orange', 'Cyan', 'Magenta',
    'Grey', 'Teal', 'Lime', 'Maroon',
];

async function seedDatabase() {
    try {
        console.log('Clearing old data...');
        await Category.deleteMany({});
        await Product.deleteMany({});
        await User.deleteMany({}); // Xóa tất cả dữ liệu cũ trong bảng User

        console.log('Seeding categories...');
        await Category.insertMany(categories);

        console.log('Seeding products...');
        const products = [
            {
                name: 'Product A',
                description: 'Description for Product A',
                price: 10000,
                images: ['./public/uploads/product_a.jpg'],
                category: 'category-slug',
                tags: ['tag1', 'tag2'],
                variants: sizes.flatMap(size =>
                    colors.map(color => ({
                        size,
                        color,
                        stock: Math.floor(Math.random() * 50) + 1,
                    }))
                ),
            },
        ];
        await Product.insertMany(products);

        console.log('Seeding admin account...');
        const hashedPassword = await bcryptjs.hash('admin@123', 10); // Hash mật khẩu
        const adminUser = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'ADMIN', // Gán role là ADMIN
            addresses: [],
            social_auth: {},
            points: 0,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await adminUser.save();
        console.log('Admin account created successfully.');

        console.log('Seeding completed.');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding data:', error.message);
        mongoose.disconnect();
    }
}

seedDatabase();
