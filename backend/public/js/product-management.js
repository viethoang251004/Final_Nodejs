// Quản lý modal chỉnh sửa sản phẩm
function openEditModal(productId) {
    fetch('/products/edit/' + productId)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch product data');
            }
            return response.json();
        })
        .then(data => {
            const { product, categories, colors } = data;

            if (!product) {
                alert('Product not found!');
                return;
            }

            // Điền thông tin sản phẩm cơ bản
            $('#editName').val(product.name);
            $('#editPrice').val(product.price);
            $('#editCategory').val(product.category);
            $('#editDescription').val(product.description);

            // Hiển thị biến thể (variants)
            const $variantContainer = $('#editVariantContainer');
            $variantContainer.empty();

            product.variants.forEach((variant, index) => {
                const sizeOptions = generateSizeOptions(variant.size);
                const colorOptions = generateColorOptions(colors, variant.color);

                const variantHTML = `
                    <div class="form-row mb-3">
                        <div class="col-md-4">
                            <label for="size">Size</label>
                            <select class="form-control" name="variants[${index}][size]" required>
                                <option value="">Chọn size</option>
                                ${sizeOptions}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="color">Màu</label>
                            <select class="form-control" name="variants[${index}][color]" required>
                                <option value="">Chọn màu</option>
                                ${colorOptions}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="stock">Tồn kho</label>
                            <input type="number" class="form-control" name="variants[${index}][stock]" value="${variant.stock}" required>
                        </div>
                    </div>`;
                $variantContainer.append(variantHTML);
            });

            // Cập nhật URL của form
            $('#editProductForm').attr('action', '/products/edit/' + product._id);

            // Hiển thị modal
            $('#editProductModal').modal('show');
        })
        .catch(error => {
            console.error('Error loading product:', error);
            alert('Có lỗi xảy ra khi tải sản phẩm!');
        });
}

// Thêm danh mục
function handleAddCategory() {
    $('#addCategoryBtn').on('click', () => {
        $('#addCategoryModal').modal('show');
    });

    $('#addCategoryForm').on('submit', async (event) => {
        event.preventDefault();

        const $form = $(event.target);
        const data = {
            name: $form.find('input[name="name"]').val(),
            slug: $form.find('input[name="slug"]').val(),
            description: $form.find('textarea[name="description"]').val()
        };

        try {
            const response = await fetch('/products/categories/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newCategory = await response.json();

                // Cập nhật dropdown danh mục
                const $categorySelect = $('#category');
                const $newOption = $('<option>')
                    .val(newCategory.slug)
                    .text(newCategory.name);
                $categorySelect.append($newOption);

                // Reset form và đóng modal
                $form[0].reset();
                $('#addCategoryModal').modal('hide');
            } else {
                console.error('Failed to add category:', await response.text());
                alert('Không thể thêm danh mục!');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Có lỗi xảy ra khi thêm danh mục!');
        }
    });
}

// Tạo các tùy chọn size
function generateSizeOptions(selectedSize) {
    let options = '';
    for (let i = 4.0; i <= 6.81; i += 0.1) {
        const size = i.toFixed(2);
        options += `<option value="${size}" ${selectedSize === size ? 'selected' : ''}>${size}</option>`;
    }
    return options;
}

// Tạo các tùy chọn màu
function generateColorOptions(colors, selectedColor) {
    return colors.map(color =>
        `<option value="${color}" ${color === selectedColor ? 'selected' : ''}>${color}</option>`
    ).join('');
}

// Khởi tạo sự kiện
$(document).ready(() => {
    handleAddCategory();
});

// Thêm biến thể mới
$('#addVariantBtn').on('click', () => {
    const $variantContainer = $('#variantContainer');
    const variantIndex = $variantContainer.children().length; // Tự động tăng chỉ số biến thể

    // Danh sách các option size
    let sizeOptions = '';
    for (let i = 4.0; i <= 6.81; i += 0.1) {
        const size = i.toFixed(2);
        sizeOptions += `<option value="${size}">${size}</option>`;
    }

    // Danh sách các option màu (dựa vào danh sách colors từ server)
    const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Brown', 'Orange']; // Dữ liệu có thể đến từ server nếu cần
    const colorOptions = colors.map(color => `<option value="${color}">${color}</option>`).join('');

    // HTML của một dòng biến thể
    const variantHTML = `
        <div class="form-row mb-3">
            <div class="col-md-4">
                <label class="form-label">Size</label>
                <select class="form-control" name="variants[${variantIndex}][size]" required>
                    <option value="">Chọn size</option>
                    ${sizeOptions}
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label">Màu</label>
                <select class="form-control" name="variants[${variantIndex}][color]" required>
                    <option value="">Chọn màu</option>
                    ${colorOptions}
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label">Tồn kho</label>
                <input type="number" class="form-control" name="variants[${variantIndex}][stock]" min="0" required>
            </div>
        </div>
    `;

    // Thêm dòng biến thể vào container
    $variantContainer.append(variantHTML);
});

// Hiển thị modal xác nhận xóa sản phẩm
let productIdToDelete = null;

function confirmDelete(productId) {
    productIdToDelete = productId;

    // Hiển thị modal Bootstrap xác nhận xóa
    $('#deleteProductModal').modal('show');
}

// Xử lý khi xác nhận xóa
$('#confirmDeleteButton').on('click', async () => {
    if (productIdToDelete) {
        try {
            const response = await fetch(`/products/delete/${productIdToDelete}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                // Đóng modal xác nhận xóa
                $('#deleteProductModal').modal('hide');

                // Hiển thị thông báo thành công trong modal thông báo
                showNotification('Thông báo', result.message);

                // Tùy chọn: làm mới trang hoặc cập nhật giao diện động
                setTimeout(() => {
                    location.reload(); // Tải lại trang để cập nhật thay đổi
                }, 1500);
            } else {
                // Nếu có lỗi, hiển thị thông báo lỗi trong modal
                showNotification('Lỗi', result.message);
            }
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
            showNotification('Lỗi', 'Lỗi khi xóa sản phẩm');
        }
    }
});

// Hiển thị thông báo thành công (toast)
function showNotification(title, message) {
    $('#notificationModalLabel').text(title);
    $('#notificationModalBody').text(message);
    $('#notificationModal').modal('show');
}

// Xử lý thêm sản phẩm
$('form[action="/products/add"]').on('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Thành công', result.message);
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification('Lỗi', result.message);
        }
    } catch (error) {
        showNotification('Lỗi', 'Không thể thêm sản phẩm');
    }
});

// Xử lý chỉnh sửa sản phẩm
$('form[action^="/products/edit/"]').on('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Success', result.message);
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification('Error', result.message);
        }
    } catch (error) {
        showNotification('Error', 'Failed to edit product');
    }
});

// Xử lý thêm danh mục
$('#addCategoryForm').on('submit', async (event) => {
    event.preventDefault();
    const form = event.target;

    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        slug: formData.get('slug'),
        description: formData.get('description'),
    };

    try {
        const response = await fetch('/products/categories/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Success', 'Category added successfully');
            setTimeout(() => location.reload(), 1500); // Reload to reflect changes
        } else {
            showNotification('Error', result.message); // Show specific error from the backend
        }
    } catch (error) {
        showNotification('Error', 'Failed to add category');
    }
});
