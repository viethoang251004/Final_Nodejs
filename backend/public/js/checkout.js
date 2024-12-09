$(document).ready(function () {
    // Khi thay đổi phương thức thanh toán
    $('input[name="paymentMethod"]').change(function () {
        if ($(this).val() === 'creditCard') {
            $('#creditCardInfo').slideDown(); // Hiển thị form chi tiết thẻ tín dụng
            $('#bankName, #accountNumber, #accountName').prop('required', true); // Thêm thuộc tính required
        } else {
            $('#creditCardInfo').slideUp(); // Ẩn form chi tiết thẻ tín dụng
            $('#bankName, #accountNumber, #accountName').prop('required', false); // Bỏ thuộc tính required
        }
    });
});
$(document).ready(function () {
    $('input[name="shippingMethod"]').change(function () {
        const shippingCost = parseInt($(this).val());
        $('#shippingCost').text(`${shippingCost.toLocaleString()} VND`);

        const totalAmount = parseInt($('#totalAmount').text().replace(/[^0-9]/g, ''));
        const discountAmount = parseInt($('#discountAmount').text().replace(/[^0-9]/g, '')) || 0;
        const finalAmount = totalAmount + shippingCost - discountAmount;

        $('#finalAmount').text(`${finalAmount.toLocaleString()} VND`);

    });
    // Kiểm tra nếu không có mã giảm giá
    const couponCode = $('#couponCode').val();
    if (!couponCode) {
        // Reset giá trị giảm giá trên frontend
        $('#discountAmount').text('- 0 VND');
        $('#finalAmount').text($('#totalAmount').text());
    }

    $('#applyCouponButton').click(function () {
        const couponCode = $('#couponCode').val();
        if (!couponCode) {
            $('#discountFeedback').html('<p class="text-danger">Vui lòng nhập mã giảm giá!</p>');
            return;
        }

        $.ajax({
            url: '/cart/checkout/apply-coupon',
            method: 'POST',
            data: { code: couponCode },
            success: function (response) {
                const shippingCost = parseInt($('#shippingCost').text().replace(/[^0-9]/g, '')) || 0;
                const totalAmount = response.totalAmount;
                const discountAmount = response.discountAmount;
                const finalAmount = totalAmount + shippingCost - discountAmount;
                $('#discountFeedback').html(`<p class="text-success">${response.message}</p>`);
                $('#totalAmount').text(`${response.totalAmount.toLocaleString()} VND`);
                $('#discountAmount').text(`- ${response.discountAmount.toLocaleString()} VND`);
                $('#finalAmount').text(`${response.finalAmount.toLocaleString()} VND`);
            },
            error: function (xhr) {
                $('#discountFeedback').html(`<p class="text-danger">${xhr.responseText}</p>`);
            }
        });
    });
});