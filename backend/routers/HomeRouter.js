const express = require('express');
const router = express.Router();
const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const authMiddleware = require('../auth/authMiddleware');
const rateLimit = require('express-rate-limit');

const allProductLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 5,
    message: 'Không thể gửi quá 5 request trong 10s khi đọc danh sách sản phẩm',
});

const detailProductLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 2,
    message: 'Không thể gửi quá 2 request trong 10s khi đọc chi tiết sản phẩm',
});

router.use(authMiddleware);

router.get('/', allProductLimiter, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sort = 'name',
            category = '',
        } = req.query;

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (category) {
            const categoryData = await CategoryModel.findOne({
                slug: category,
            });
            if (categoryData) {
                query.category = categoryData.slug;
            }
        }

        const sortQuery = {};
        if (sort === 'price') sortQuery.price = 1;
        else if (sort === 'date') sortQuery.created_at = -1;
        else sortQuery.name = 1;

        const categories = await CategoryModel.find();
        const products = await ProductModel.find(query)
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const totalProducts = await ProductModel.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        const pagination = {
            totalPages,
            currentPage: parseInt(page),
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
        };

        res.render('layouts/user/main', {
            title: 'Trang chủ',
            body: 'home',
            style: 'home-style',
            categories: categories || [],
            products: products || [],
            pagination,
            search: search || '',
            sort: sort || 'name',
            category: category || '',
            user: req.user || {},
        });
    } catch (error) {
        console.error('Error loading home:', error.message);
        res.status(500).send('Có lỗi xảy ra khi tải trang.');
    }
});

router.get('/products/:id', detailProductLimiter, async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id).populate(
            'variants',
        );

        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại.');
        }

        res.render('layouts/admin/main', {
            title: 'Chi tiết sản phẩm',
            body: 'product-detail',
            product, user: req.user || null
        });
    } catch (error) {
        console.error('Error loading product details:', error.message);
        res.status(500).send('Có lỗi xảy ra khi tải chi tiết sản phẩm.');
    }
});

router.get('/category/:slug', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name' } = req.query;

        const category = await CategoryModel.findOne({ slug: req.params.slug });

        if (!category) {
            return res.status(404).send('Danh mục không tồn tại.');
        }

        const sortQuery = {};
        if (sort === 'price') sortQuery.price = 1;
        else if (sort === 'date') sortQuery.created_at = -1;
        else sortQuery.name = 1;

        const products = await ProductModel.find({ category: category.slug })
            .sort(sortQuery)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const totalProducts = await ProductModel.countDocuments({
            category: category.slug,
        });
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

module.exports = router;
