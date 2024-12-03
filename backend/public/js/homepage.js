document.querySelectorAll('.btn-add-to-cart').forEach(button => {
    button.addEventListener('click', (event) => {
        const productId = event.target.dataset.productId;
        const modal = document.getElementById(`addToCartModal${productId}`);
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    const colorSelect = modal.querySelector('.form-select[name="color"]');
    const sizeSelect = modal.querySelector('.form-select[name="size"]');
    const variants = JSON.parse(modal.dataset.variants);

    colorSelect.addEventListener('change', () => {
        const selectedColor = colorSelect.value;

        const availableSizes = variants
            .filter(variant => variant.color === selectedColor)
            .map(variant => variant.size);

        sizeSelect.innerHTML = availableSizes
            .map(size => `<option value="${size}">${size}</option>`)
            .join('');
    });
});