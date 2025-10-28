import Order from "../../models/orderSchema.js"
import Product from "../../models/productSchema.js"
import User from "../../models/userSchema.js";
import { generateCSV, generateExcel, generatePDF } from '../../helpers/dashboardHelper.js'


const loadDashboard = async (req, res) => {
    try {

        const orders = await Order.find()
        const products = await Product.find()
        const users = await User.find();

        const totalRevenue = orders.reduce((sum, order) => {
            const itemSum = order.orderedItems.reduce((subSum, item) => {
                if (!["Cancelled", "Returned", "Return Accepted"].includes(item.status)) {
                    subSum += item.price * item.quantity;
                }
                return subSum;
            }, 0);

            const discount = order.discount || 0;
            return sum + (itemSum - discount);
        }, 0);


        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalUsers = users.length;



        const topProducts = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $match: {
                    "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
                }
            },
            {
                $group: {
                    _id: "$orderedItems.product",
                    totalQuantitySold: { $sum: "$orderedItems.quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: ["$orderedItems.quantity", "$orderedItems.price"]
                        }
                    }
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    _id: 1,
                    totalQuantitySold: 1,
                    totalRevenue: 1,
                    productName: "$productDetails.productName",
                    category: "$productDetails.category",
                    variants: "$productDetails.variants"
                }
            }
        ]);


        const topCategories = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $match: {
                    "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
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
                $lookup: {
                    from: "categories",
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: "$categoryDetails._id",
                    categoryName: { $first: "$categoryDetails.name" },
                    totalQuantitySold: { $sum: "$orderedItems.quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: ["$orderedItems.quantity", "$orderedItems.price"]
                        }
                    }
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 10 }
        ]);

        const currentYear = new Date().getFullYear();

        const monthlySalesData = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31)
                    }
                }
            },
            { $unwind: "$orderedItems" },
            {
                $match: {
                    "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdOn" },
                    totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);


        const currentMonth = new Date().getMonth();
        const dailySalesData = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lte: new Date(currentYear, currentMonth + 1, 0)
                    }
                }
            },
            { $unwind: "$orderedItems" },
            {
                $match: {
                    "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: "$createdOn" },
                    totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);


        const yearlySalesData = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: new Date(currentYear - 4, 0, 1)
                    }
                }
            },
            { $unwind: "$orderedItems" },
            {
                $match: {
                    "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
                }
            },
            {
                $group: {
                    _id: { $year: "$createdOn" },
                    totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);


        const recentOrders = await Order.find().populate('userId', 'name email').sort({ createdOn: -1 }).limit(5);

        const lastMonthOrders = await Order.find({
            createdOn: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lte: new Date(currentYear, currentMonth, 0)
            }
        });

        const thisMonthOrders = await Order.find({ createdOn: { $gte: new Date(currentYear, currentMonth, 1) } });


        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => {
            const validItemsTotal = order.orderedItems
                .filter(item => !["Cancelled", "Returned", "Return Accepted"].includes(item.status))
                .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
            return sum + validItemsTotal;
        }, 0);

        const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => {
            const validItemsTotal = order.orderedItems
                .filter(item => !["Cancelled", "Returned", "Return Accepted"].includes(item.status))
                .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
            return sum + validItemsTotal;
        }, 0);


        const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2) : 0;

        const orderGrowth = lastMonthOrders.length > 0 ?
            ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100).toFixed(2) : 0;


        const chartData = {

            monthly: Array.from({ length: 12 }, (_, i) => {
                const monthData = monthlySalesData.find(item => item._id === i + 1);
                return monthData ? monthData.totalSales : 0;

            }),

            daily: Array.from({ length: 31 }, (_, i) => {
                const dayData = dailySalesData.find(item => item._id === i + 1);
                return dayData ? dayData.totalSales : 0;

            }),

            yearly: yearlySalesData.map(item => item.totalSales)

        };


        res.render("dashboard", {
            totalRevenue,
            totalOrders,
            totalProducts,
            totalUsers,
            revenueGrowth,
            orderGrowth,
            topProducts,
            topCategories,
            chartData,
            recentOrders,
            orders
        });




    } catch (error) {
        console.error("Error at load Dasboard", error);
        res.redirect("/admin/404")
    }

}


const generateLedger = async (req, res) => {
    try {

        const { period, format, fromDate, toDate } = req.body;

        let matchCondition = {};
        const currentDate = new Date();
        let periodLabel = '';


        switch (period) {
            case 'monthly':
                matchCondition = {
                    createdOn: {
                        $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                        $lte: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
                    }
                };
                periodLabel = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
                break;
            case 'quarterly':
                const quarter = Math.floor(currentDate.getMonth() / 3);
                matchCondition = {
                    createdOn: {
                        $gte: new Date(currentDate.getFullYear(), quarter * 3, 1),
                        $lte: new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0)
                    }
                };

                periodLabel = `Q${quarter + 1} ${currentDate.getFullYear()}`;
                break;
            case 'yearly':
                matchCondition = {
                    createdOn: {
                        $gte: new Date(currentDate.getFullYear(), 0, 1),
                        $lte: new Date(currentDate.getFullYear(), 11, 31)
                    }
                };
                periodLabel = `${currentDate.getFullYear()}`;
                break;
            case 'custom':
                matchCondition = {
                    createdOn: {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate)
                    }
                };
                periodLabel = `${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`;
                break;
        }

        // Get detailed order data for ledger
        const ledgerData = await Order.find(matchCondition)
            .populate('userId', 'name email phone')
            .populate('orderedItems.product', 'productName')
            .sort({ createdOn: -1 });

    


        // Calculate summary
        const summary = {
            totalOrders: ledgerData.length,
            totalRevenue: ledgerData.reduce((sum, order) => {
                const itemSum = order.orderedItems.reduce((subSum, item) => {
                    if (!["Cancelled", "Returned", "Return Accepted"].includes(item.status)) {
                        subSum += item.quantity * item.price;
                    }
                    return subSum
                }, 0)
                const discount = order.discount || 0;
                return sum + (itemSum - discount);
            }, 0),
            totalDiscount: ledgerData.reduce((sum, order) => sum + (order.discount || 0), 0),
            totalShipping: ledgerData.reduce((sum, order) => sum + (Number(order.shippingPrice) || 0), 0),
            period: periodLabel,
            generatedOn: new Date().toLocaleDateString('en-IN')
        };


        // Format ledger data for export
        const formattedData = ledgerData.map(order => {

            const validItems = order.orderedItems.filter(
                item => !["Cancelled", "Returned", "Return Accepted"].includes(item.status));

            const validItemTotal = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            return {
                orderId: order._id.toString().slice(-8).toUpperCase(),
                customerName: order.userId?.name || 'Guest User',
                customerEmail: order.userId?.email || 'N/A',
                customerPhone: order.userId?.phone || 'N/A',
                orderDate: order.createdOn.toLocaleDateString('en-IN'),
                orderTime: order.createdOn.toLocaleTimeString('en-IN'),
                paymentMethod: order.paymentMethod || 'COD',
                paymentStatus: order.paymentStatus || 'Pending',
                orderStatus: order.status || 'Processing',
                subtotal: validItemTotal,
                discount: order.discount || 0,
                shipping: order.shippingPrice || 0,
                finalAmount: validItemTotal + Math.floor((order.shippingPrice || 0)),
                itemsCount: validItems.length,
                items: validItems
                    .map(item => `${item.product?.productName || 'Unknown'} (Qty: ${item.quantity})`)
                    .join('; ')
            };
        });
        const fileName = `ledger-${period}-${Date.now()}`;

        // Generate based on format
        switch (format) {
            case 'pdf':
                await generatePDF(res, formattedData, summary, fileName);
                break;
            case 'excel':
                await generateExcel(res, formattedData, summary, fileName);
                break;
            case 'csv':
                await generateCSV(res, formattedData, summary, fileName);
                break;
            case 'json':
                res.json({
                    success: true,
                    data: formattedData,
                    summary: summary
                });
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid format specified' });
        }

    } catch (error) {
        console.error("Error generating ledger:", error);
        res.status(500).json({ success: false, message: "Failed to generate ledger" });
    }
};


const getChartData = async (req, res) => {
    try {
        const { period } = req.query;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        let matchCondition, groupBy, chartLabels, chartData;

        switch (period) {
            case 'day':
                // Get data for current month, grouped by day
                matchCondition = {
                    createdOn: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lte: new Date(currentYear, currentMonth + 1, 0)
                    }
                };
                groupBy = { $dayOfMonth: "$createdOn" };

                const dailyData = await Order.aggregate([
                    { $match: matchCondition },
                    { $unwind: "$orderedItems" },
                    {
                        $match: {
                            "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
                        }
                    },
                    {
                        $group: {
                            _id: groupBy,
                            totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                            orderCount: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);


                chartData = Array.from({ length: 31 }, (_, i) => {
                    const dayData = dailyData.find(item => item._id === i + 1);
                    return dayData ? dayData.totalSales : 0;
                });
                break;

            case 'month':
                // Get data for current year, grouped by month
                matchCondition = {
                    createdOn: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31)
                    }
                };
                groupBy = { $month: "$createdOn" };

                const monthlyData = await Order.aggregate([
                    { $match: matchCondition },
                    { $unwind: "$orderedItems" },
                    {
                        $match: {
                            "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
                        }
                    },
                    {
                        $group: {
                            _id: groupBy,
                            totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                            orderCount: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);


                chartData = Array.from({ length: 12 }, (_, i) => {
                    const monthData = monthlyData.find(item => item._id === i + 1);
                    return monthData ? monthData.totalSales : 0;
                });
                break;

            case 'year':
                // Get data for last 5 years, grouped by year
                matchCondition = {
                    createdOn: {
                        $gte: new Date(currentYear - 4, 0, 1)
                    }
                };
                groupBy = { $year: "$createdOn" };

                const yearlyData = await Order.aggregate([
                    { $match: matchCondition },
                    { $unwind: "$orderedItems" },
                    {
                        $match: {
                            "orderedItems.status": { $nin: ["Cancelled", "Returned", "Return Accepted"] }
                        }
                    },
                    {
                        $group: {
                            _id: groupBy,
                            totalSales: { $sum: { $multiply: ["$orderedItems.quantity", "$orderedItems.price"] } },
                            orderCount: { $sum: 1 } // counts items; for unique orders, see note below
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);


                chartData = yearlyData.map(item => item.totalSales);
                break;

            default:
                chartData = [];
        }

        // Also get updated stats for the selected period
        const totalRevenue = chartData.reduce((sum, value) => sum + value, 0);
        const orders = await Order.find(matchCondition);
        const totalOrders = orders.length;

        res.json({
            success: true,
            chartData,
            stats: {
                totalRevenue,
                totalOrders,
                totalProducts: await Product.countDocuments(),
                totalUsers: await User.countDocuments()
            }
        });

    } catch (error) {
        console.error("Error fetching chart data:", error);
        res.status(500).json({ success: false, message: "Failed to fetch chart data" });
    }
};


export default { loadDashboard, generateLedger, getChartData }