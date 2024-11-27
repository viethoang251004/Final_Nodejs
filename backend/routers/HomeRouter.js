const express = require('express');
const router = express.Router();
const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const authMiddleware = require('../auth/authMiddleware');

router.use(authMiddleware);

// Trang chủ
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sort = 'name', category = '' } = req.query;

        const query = {};

        // Tìm kiếm theo tên sản phẩm
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Lọc theo danh mục
        if (category) {
            const categoryData = await CategoryModel.findOne({ slug: category });
            if (categoryData) {
                query.category = categoryData.slug;
            }
        }

        // Sắp xếp
        const sortQuery = {};
        if (sort === 'price') sortQuery.price = 1; // Sắp xếp theo giá tăng dần
        else if (sort === 'date') sortQuery.created_at = -1; // Sắp xếp theo thời gian mới nhất
        else sortQuery.name = 1; // Mặc định sắp xếp theo tên

        const categories = await CategoryModel.find();
        const products = await ProductModel.find(query)
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const totalProducts = await ProductModel.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('home', {
            categories,
            products,
            totalPages,
            currentPage: parseInt(page),
            search,
            sort,
            category,
            user: req.user || null,
        });
    } catch (error) {
        console.error('Error loading home:', error.message);
        res.status(500).send('Có lỗi xảy ra khi tải trang.');
    }
});

// Xem chi tiết sản phẩm (bao gồm các biến thể)
router.get('/products/:id', async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id).populate('variants');

        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại.');
        }

        res.render('product-detail', { product, user: req.user || null });
    } catch (error) {
        console.error('Error loading product details:', error.message);
        res.status(500).send('Có lỗi xảy ra khi tải chi tiết sản phẩm.');
    }
});

// Xem sản phẩm theo danh mục (có phân trang)
router.get('/category/:slug', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;

        const category = await CategoryModel.findOne({ slug: req.params.slug });

        if (!category) {
            return res.status(404).send('Danh mục không tồn tại.');
        }

        const sortQuery = {};
        if (sort === 'price') sortQuery.price = 1; // Sắp xếp theo giá
        else if (sort === 'date') sortQuery.created_at = -1; // Sắp xếp theo ngày
        else sortQuery.name = 1; // Sắp xếp theo tên

        const products = await ProductModel.find({ category: category.slug })
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const totalProducts = await ProductModel.countDocuments({ category: category.slug });
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('category', {
            category,
            products,
            totalPages,
            currentPage: parseInt(page),
            sort,
            user: req.user || null,
        });
    } catch (error) {
        console.error('Error loading category:', error.message);
        res.status(500).send('Có lỗi xảy ra khi tải danh mục.');
    }
});

// Route để xử lý đăng xuất
router.get('/users/logout', (req, res) => {
    res.clearCookie('userDataLogin'); // Xóa cookie chứa token
    res.clearCookie('userRole'); // Xóa cookie vai trò người dùng (nếu có)
    res.redirect('/'); // Chuyển hướng về trang chủ
});

module.exports = router;
