document.getElementById('checkoutForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Ngừng gửi form để có thể hiển thị modal

    // Hiển thị modal
    document.getElementById('thankYouModal').style.display = 'flex';

    // Sau khi hiển thị xong, gửi form và chuyển hướng
    setTimeout(() => {
        // Gửi form
        this.submit(); // Gửi form để thực hiện post request
    }, 2000); // Sau 2 giây sẽ gửi form để chuyển hướng về cart
});

// Đóng modal
document.getElementById('closeModal').addEventListener('click', function () {
    document.getElementById('thankYouModal').style.display = 'none';
});

$('input[name="shippingMethod"]').change(function () {
    const shippingCost = parseFloat($(this).val());
    $('#shippingCostInput').val(shippingCost); // Cập nhật hidden input
});

$(document).ready(function () {
    // Hiển thị hoặc ẩn thông tin ngân hàng
    $('input[name="paymentMethod"]').change(function () {
        if ($(this).val() === 'creditCard') {
            $('#bank-transfer-info').slideDown();
        } else {
            $('#bank-transfer-info').slideUp();
        }
    });
});