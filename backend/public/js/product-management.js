function openEditModal(productId) {
    fetch('/admin/products/edit/' + productId)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to fetch product data');
            }
            return response.json();
        })
        .then((data) => {
            const { product, categories, colors } = data;

            if (!product) {
                alert('Product not found!');
                return;
            }

            $('#editName').val(product.name);
            $('#editPrice').val(product.price);
            $('#editCategory').val(product.category);
            $('#editDescription').val(product.description);

            const $variantContainer = $('#editVariantContainer');
            $variantContainer.empty();

            product.variants.forEach((variant, index) => {
                const sizeOptions = generateSizeOptions(variant.size);
                const colorOptions = generateColorOptions(
                    colors,
                    variant.color,
                );

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

            $('#editProductForm').attr(
                'action',
                '/admin/products/edit/' + product._id,
            );

            $('#editProductModal').modal('show');
        })
        .catch((error) => {
            console.error('Error loading product:', error);
            alert('Có lỗi xảy ra khi tải sản phẩm!');
        });
}

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
            description: $form.find('textarea[name="description"]').val(),
        };

        try {
            const response = await fetch('/admin/products/categories/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newCategory = await response.json();

                const $categorySelect = $('#category');
                const $newOption = $('<option>')
                    .val(newCategory.slug)
                    .text(newCategory.name);
                $categorySelect.append($newOption);

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

function generateSizeOptions(selectedSize) {
    let options = '';
    for (let i = 4.0; i <= 6.81; i += 0.1) {
        const size = i.toFixed(2);
        options += `<option value="${size}" ${selectedSize === size ? 'selected' : ''}>${size}</option>`;
    }
    return options;
}

function generateColorOptions(colors, selectedColor) {
    return colors
        .map(
            (color) =>
                `<option value="${color}" ${color === selectedColor ? 'selected' : ''}>${color}</option>`,
        )
        .join('');
}

$(document).ready(() => {
    handleAddCategory();
});

$('#addVariantBtn').on('click', () => {
    const $variantContainer = $('#variantContainer');
    const variantIndex = $variantContainer.children().length; // Tự động tăng chỉ số biến thể

    let sizeOptions = '';
    for (let i = 4.0; i <= 6.81; i += 0.1) {
        const size = i.toFixed(2);
        sizeOptions += `<option value="${size}">${size}</option>`;
    }

    const colors = [
        'Red',
        'Blue',
        'Green',
        'Yellow',
        'Black',
        'White',
        'Pink',
        'Purple',
        'Brown',
        'Orange',
    ];
    const colorOptions = colors
        .map((color) => `<option value="${color}">${color}</option>`)
        .join('');

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

    $variantContainer.append(variantHTML);
});

let productIdToDelete = null;

function confirmDelete(productId) {
    productIdToDelete = productId;

    $('#deleteProductModal').modal('show');
}

$('#confirmDeleteButton').on('click', async () => {
    if (productIdToDelete) {
        try {
            const response = await fetch(
                `/admin/products/delete/${productIdToDelete}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            const result = await response.json();

            if (response.ok) {
                $('#deleteProductModal').modal('hide');

                showNotification('Thông báo', result.message);

                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showNotification('Lỗi', result.message);
            }
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
            showNotification('Lỗi', 'Lỗi khi xóa sản phẩm');
        }
    }
});

function showNotification(title, message) {
    $('#notificationModalLabel').text(title);
    $('#notificationModalBody').text(message);
    $('#notificationModal').modal('show');
}

$('form[action="/admin/products/add"]').on('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
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

$('form[action^="/admin/products/edit/"]').on('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
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
        const response = await fetch('/admin/products/categories/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Success', 'Category added successfully');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification('Error', result.message);
        }
    } catch (error) {
        showNotification('Error', 'Failed to add category');
    }
});
