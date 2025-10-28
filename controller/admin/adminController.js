import User from "../../models/userSchema.js";
import bcrypt from "bcrypt";
import { getDateRange, getSalesData, calculateOverallMetrics, getTopProducts, getChartData } from '../../helpers/salesReportHelper.js';
import { exportToPDF, exportToCSV, exportToExcel } from '../../helpers/exportHelper.js'


const loadLogin = async (req, res) => {
    try {
        if (req.session.admin) return res.redirect("/admin/dashboard");

        res.render("adminLogin", { message: "" });

    } catch (error) {
        console.error("Error at load Admin login", error)
        res.render("page-error")
    }
}


const login = async (req, res) => {
    try {

        const { email, password } = req.body;
        
        const admin = await User.findOne({ email, isAdmin: true });
        
        if (admin) {

            const isMatch = await bcrypt.compare(password, admin.password)

            if (isMatch) {

                req.session.admin = admin._id
                return res.redirect("/admin/dashboard")

            } else {
                res.render("adminLogin", { message: "Password is not matching" })
            }

        } else {
            res.render("adminLogin", { message: "User not exist" })
        }

    } catch (error) {
        console.error("Error at adminLogin", error)
        return res.redirect("/admin/404");
    }
}


const page_error = async (req, res) => res.render("page-error");


const logout = async (req, res) => {
    try {
        delete req.session.admin

        res.redirect("/admin/login")
    } catch (error) {
        console.error("Error at Logout", error);
        res.redirect("/admin/404")
    }
}


const loadSalesReport = async (req, res) => {
    try {

        const { period = 'monthly', startDate, endDate, customRange } = req.query;

        let matchCondition = getDateRange(period, startDate, endDate, customRange);

        const salesData = await getSalesData(matchCondition);
        const chartData = await getChartData(matchCondition, period);
        const topProducts = await getTopProducts(matchCondition);


        const overallMetrics = calculateOverallMetrics(salesData);

        res.render("salesReport", {
            salesData,
            chartData,
            topProducts,
            overallMetrics,
            period,
            startDate: startDate || '',
            endDate: endDate || '',
            customRange: customRange || 'day'
        });

    } catch (error) {
        console.error("Error loading sales report:", error);
        res.redirect("/admin/404");
    }
};


const getSalesReportData = async (req, res) => {
    try {
        const { period, startDate, endDate, customRange } = req.query;

        let matchCondition = getDateRange(period, startDate, endDate, customRange);

        const salesData = await getSalesData(matchCondition);
        const chartData = await getChartData(matchCondition, period);
        const topProducts = await getTopProducts(matchCondition);
        const overallMetrics = calculateOverallMetrics(salesData);

        res.json({ success: true, data: { salesData, chartData, topProducts, overallMetrics } });

    } catch (error) {
        console.error("Error fetching sales report data:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sales data" });
    }
};


const exportSalesReport = async (req, res) => {
    try {

        const { period = 'monthly', startDate, endDate, customRange, format = 'xlsx' } = req.query;

        let matchCondition = getDateRange(period, startDate, endDate, customRange);

        const salesData = await getSalesData(matchCondition);
        const overallMetrics = calculateOverallMetrics(salesData);


        const exportData = salesData.map((order, index) => ({
            'Sr. No.': index + 1,
            'Order ID': '#' + order._id.toString().slice(-8).toUpperCase(),
            'Customer Name': order.customerName || 'Guest',
            'Customer Email': order.customerEmail || 'N/A',
            'Order Date': new Date(order.orderDate).toLocaleDateString('en-IN'),
            'Payment Method': order.paymentMethod || 'COD',
            'Payment Status': order.paymentStatus || 'Pending',
            'Order Status': order.status || 'Processing',
            'Total Amount': order.totalAmount || 0,
            'Discount': order.discount || 0,
            'Shipping': order.shippingPrice || 0,
            'Cancelled Amount': order.cancelledAmount || 0,
            'Returned Amount': order.returnedAmount || 0,
            'Final Amount': order.finalAmount || 0,
            'Items Count': order.itemsCount || 0
        }));


        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sales-report-${period}-${timestamp}`;

        if (format === 'csv') {
            await exportToCSV(res, exportData, overallMetrics, filename);
        } else if (format === 'xlsx') {
            await exportToExcel(res, exportData, overallMetrics, filename, period);
        } else if (format === 'pdf') {
            await exportToPDF(res, exportData, overallMetrics, filename, period);
        } else {
            res.status(400).json({ success: false, message: 'Unsupported export format' });
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate export' });
    }
};




export default {
    loadLogin,
    login,
    page_error,
    logout,
    loadSalesReport,
    getSalesReportData,
    exportSalesReport
};