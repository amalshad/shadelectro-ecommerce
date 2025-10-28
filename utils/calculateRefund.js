
function calculateRefund(order, items) {
    if (!order || !items || items.length === 0) return 0;

    const totalAmount = order.totalPrice || 0;
    const discount = order.discount || 0;
    const discountRatio = totalAmount > 0 ? discount / totalAmount : 0;

    let refundAmount = 0;

    for (const item of items) {
        const itemBase = (item.price || 0) * (item.quantity || 0)
        const itemDiscount = itemBase * discountRatio;
        const refundablePrice = itemBase - itemDiscount;
        refundAmount += refundablePrice;
    }

    return Math.round(refundAmount)
}

export default calculateRefund;