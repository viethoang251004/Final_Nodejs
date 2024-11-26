const express = require('express');
const router = express.Router();
const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const CouponModel = require('../models/CouponModel');

const authMiddleware = require('../auth/authMiddleware'); // Thêm middleware

router.use(authMiddleware); // Áp dụng middleware trên toàn bộ router


const createSampleProducts = () => {
    const sampleProducts = [];
    for (let i = 1; i <= 50; i++) {
        sampleProducts.push({
            _id: i.toString(),
            name: `Sản phẩm ${i}`,
            price: Math.floor(Math.random() * 5000000 + 1000000), // Giá từ 1.000.000 đến 6.000.000 VND
            images: ["https://via.placeholder.com/200"],
            rating: (Math.random() * 5).toFixed(1),
        });
    }
    return sampleProducts;
};


const getCategoriesWithProducts = async () => {
    try {
        const categories = await CategoryModel.find();

        return categories.map((category) => ({
            name: category.name,
            slug: category.slug,
            description: category.description,
            products: createSampleProducts().slice(0, 10), // Hiển thị 10 sản phẩm mẫu
        }));
    } catch (error) {
        console.error('Error fetching categories and products:', error.message);
        throw error;
    }
};


/**
 * Lấy danh sách danh mục cùng các sản phẩm nổi bật từ database
 */
/*
const getCategoriesWithProducts = async () => {
    try {
        // Lấy tất cả danh mục từ database
        const categories = await CategoryModel.find();

        // Với mỗi danh mục, lấy danh sách các sản phẩm tương ứng
        const categoriesWithProducts = await Promise.all(
            categories.map(async (category) => {
                const products = await ProductModel.find({ category: category.name })
                    .limit(4) // Hiển thị tối đa 4 sản phẩm/danh mục
                    .select('name price images rating'); // Chỉ lấy các trường cần thiết
                return {
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    products
                };
            })
        );

        return categoriesWithProducts;
    } catch (error) {
        console.error('Error fetching categories and products:', error.message);
        throw error;
    }
};
*/


/**
 * Lấy các thông báo mẫu
 */
const getNotifications = () => {
    return [
        { message: "Khuyến mãi lên đến 50% trong tuần lễ Black Friday!" },
        { message: "Miễn phí vận chuyển cho đơn hàng trên 500.000 VND." },
        { message: "Nhập mã NEWUSER để nhận giảm giá 10% cho đơn hàng đầu tiên." }
    ];
};

/**
 * Lấy mã giảm giá đang hoạt động
 */
const getActiveCoupon = async () => {
    try {
        const coupon = await CouponModel.findOne({ is_active: true }).sort({ expires_at: 1 });
        return coupon || null; // Nếu không có mã giảm giá, trả về null
    } catch (error) {
        console.error('Error fetching active coupon:', error.message);
        return null;
    }
};

router.get('/', async (req, res) => {
    try {
        const categoriesWithProducts = await getCategoriesWithProducts();
        const notifications = getNotifications();
        const coupon = await getActiveCoupon();

        res.render('home', {
            categories: categoriesWithProducts,
            notifications,
            coupon,
            user: req.user || null // Truyền thông tin người dùng nếu đăng nhập
        });
    } catch (error) {
        console.error('Error loading home page:', error.message);
        res.status(500).send('Lỗi khi tải trang chủ.');
    }
});

// Route để xử lý đăng xuất
router.get('/users/logout', (req, res) => {
    res.clearCookie('userDataLogin'); // Xóa cookie chứa token
    res.clearCookie('userRole'); // Xóa cookie vai trò người dùng (nếu có)
    res.redirect('/'); // Chuyển hướng về trang chủ
});



module.exports = router;
