$('.btn-add-to-cart').each(function () {
    $(this).on('click', function (event) {
        const productId = $(this).data('product-id');
        const modal = $(`#addToCartModal${productId}`);
    });
});

$('.modal').each(function () {
    const modal = $(this);
    const colorSelect = modal.find('.form-select[name="color"]');
    const sizeSelect = modal.find('.form-select[name="size"]');
    const variants = JSON.parse(modal.data('variants'));

    colorSelect.on('change', function () {
        const selectedColor = colorSelect.val();

        const availableSizes = variants
            .filter((variant) => variant.color === selectedColor)
            .map((variant) => variant.size);

        sizeSelect.empty(); // Clear existing options
        availableSizes.forEach((size) => {
            sizeSelect.append(`<option value="${size}">${size}</option>`);
        });
    });
});
