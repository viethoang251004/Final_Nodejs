const mongoose = require('mongoose');
require('dotenv').config();
const bcryptjs = require('bcryptjs');

const CONNECTION_STRING =
    process.env.CONNECTION_STRING || 'mongodb://database:27017/ePhoneShop';

async function connectDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(CONNECTION_STRING, {
            dbName: 'ePhoneShop',
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully!');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); // Thoát chương trình với mã lỗi
    }
}

const User = require('./models/UserModel');

async function seedAdminAccount() {
    try {
        console.log('Seeding admin account...');

        // Kiểm tra nếu tài khoản admin đã tồn tại
        const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
        if (existingAdmin) {
            console.log('Admin account already exists. Skipping seeding.');
            return;
        }

        const hashedPassword = await bcryptjs.hash('admin@123', 10);

        const adminUser = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'ADMIN',
            addresses: [],
            social_auth: {},
            points: 0,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await adminUser.save();
        console.log('Admin account created successfully!');
    } catch (error) {
        console.error('Error seeding admin account:', error.message);
        process.exit(1); // Thoát chương trình nếu seed thất bại
    }
}

async function main() {
    await connectDatabase();
    await seedAdminAccount();
    mongoose.disconnect();
    console.log('Seeding process completed.');
    process.exit(0);
}

main();
