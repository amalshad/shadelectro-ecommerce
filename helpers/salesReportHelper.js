import Order from "../models/orderSchema.js";


function getDateRange(period, startDate, endDate, customRange) {
    const now = new Date();
    let matchCondition = {};

    switch (period) {
        case 'daily':
            matchCondition = {
                createdOn: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                }
            };
            break;

        case 'weekly':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            matchCondition = {
                createdOn: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            };
            break;

        case 'monthly':
            matchCondition = {
                createdOn: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                }
            };
            break;

        case 'yearly':
            matchCondition = {
                createdOn: {
                    $gte: new Date(now.getFullYear(), 0, 1),
                    $lte: new Date(now.getFullYear(), 11, 31)
                }
            };
            break;

        case 'custom':
            if (startDate && endDate) {
                matchCondition = {
                    createdOn: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                };
            }
            break;
    }

    return matchCondition;
}


async function getSalesData(matchCondition) {
    return await Order.aggregate([
        { $match: matchCondition },
        { $unwind: "$orderedItems" },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "customer"
            }
        },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: "$_id",
                orderDate: { $first: "$createdOn" },
                customerName: { $first: "$customer.name" },
                customerEmail: { $first: "$customer.email" },
                totalAmount: { $first: "$totalPrice" },
                discount: { $first: { $ifNull: ["$discount", 0] } },
                couponCode: { $first: "$couponApplied" },
                shippingPrice: { $first: { $ifNull: ["$shippingPrice", 0] } },
                paymentMethod: { $first: "$paymentMethod" },
                paymentStatus: { $first: "$paymentStatus" },
                status: { $first: "$status" },

                finalAmount: {
                    $sum: {
                        $cond: [
                            { $not: [{ $in: ["$orderedItems.status", ["Cancelled", "Returned", "Return Accepted"]] }] },
                            { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] },
                            0
                        ]
                    }
                },
                cancelledAmount: {
                    $sum: {
                        $cond: [
                            { $eq: ["$orderedItems.status", "Cancelled"] },
                            { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] },
                            0
                        ]
                    }
                },
                returnedAmount: {
                    $sum: {
                        $cond: [
                            { $in: ["$orderedItems.status", ["Returned", "Return Accepted"]] },
                            { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] },
                            0
                        ]
                    }
                },
                itemsCount: { $sum: "$orderedItems.quantity" }
            }
        },
        { $sort: { orderDate: -1 } }
    ]);
}




async function getChartData(matchCondition, period) {
    let groupBy = {};

    switch (period) {
        case 'daily':
            groupBy = { $hour: "$createdOn" };
            break;
        case 'weekly':
            groupBy = { $dayOfWeek: "$createdOn" };
            break;
        case 'monthly':
            groupBy = { $dayOfMonth: "$createdOn" };
            break;
        case 'yearly':
            groupBy = { $month: "$createdOn" };
            break;
        default:
            groupBy = { $dayOfMonth: "$createdOn" };
    }

    const chartData = await Order.aggregate([
        {
            $match: {
                ...matchCondition,
                orderStatus: { $nin: ["Cancelled", "Returned", "Return Accepted"] }
            }
        },
        {
            $group: {
                _id: groupBy,
                totalSales: { $sum: "$finalAmount" },
                totalOrders: { $sum: 1 },
                totalDiscount: { $sum: { $ifNull: ["$discount", 0] } }
            }
        },
        { $sort: { "_id": 1 } }
    ]);


    return chartData;
}


async function getTopProducts(matchCondition) {
    return await Order.aggregate([
        { $match: matchCondition },

        { $unwind: "$orderedItems" },
        {
            $match: {
                "orderedItems.status": {
                    $nin: ["Cancelled", "Returned", "Return Accepted"]
                }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "orderedItems.product",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: "$productDetails" },
        {
            $group: {
                _id: "$orderedItems.product",
                productName: { $first: "$productDetails.productName" },
                totalQuantity: { $sum: "$orderedItems.quantity" },
                totalRevenue: {
                    $sum: {
                        $multiply: ["$orderedItems.quantity", "$orderedItems.price"]
                    }
                }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);
}



function calculateOverallMetrics(salesData) {
    const totalOrders = salesData.length;
    const totalRevenue = salesData.reduce((sum, order) => sum + order.finalAmount, 0);
    const totalDiscount = salesData.reduce((sum, order) => sum + order.discount, 0);
    const totalShipping = salesData.reduce((sum, order) => sum + order.shippingPrice, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const couponUsage = salesData.filter(order => order.couponCode).length;
    const couponUsageRate = totalOrders > 0 ? (couponUsage / totalOrders * 100).toFixed(2) : 0;

    return {
        totalOrders,
        totalRevenue,
        totalDiscount,
        totalShipping,
        averageOrderValue,
        couponUsage,
        couponUsageRate,
        netRevenue: totalRevenue
    };
}


export { getDateRange, getSalesData, calculateOverallMetrics, getTopProducts, getChartData }