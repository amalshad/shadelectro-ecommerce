import express from "express";
const router = express.Router();
import adminController from "../controller/admin/adminController.js"
import { adminAuth } from "../middlewares/auth.js"
import uploads from "../middlewares/multer.js"
import AdminControllers from '../config/AdminControllers.js'


router.get("/404", adminController.page_error)

router.get("/login", adminController.loadLogin)
router.post("/login", adminController.login)

router.get("/logout", adminAuth, adminController.logout)


router.get("/users", adminAuth, AdminControllers.customerController.customerInfo)
router.post("/users/:id", adminAuth, AdminControllers.customerController.listCustomer)


router.get("/category", adminAuth, AdminControllers.categoryController.categoryInfo)
router.post("/category", adminAuth, AdminControllers.categoryController.addCategory)
router.patch("/category/:id", adminAuth, AdminControllers.categoryController.listCategory)
router.put("/category/:id", adminAuth, AdminControllers.categoryController.editCategory);


router.get("/product", adminAuth, AdminControllers.productController.loadProduct)
router.get("/productAdd", adminAuth, AdminControllers.productController.loadAddProduct)
router.post("/productAdd", adminAuth, uploads.any(), AdminControllers.productController.addProduct);
router.get("/editProduct/:id", adminAuth, AdminControllers.productController.loadEditProduct)
router.post("/editProduct/:id", adminAuth, uploads.any(), AdminControllers.productController.editProduct)
router.patch("/listProduct/:id", adminAuth, AdminControllers.productController.listProduct)

router.get("/orders", adminAuth, AdminControllers.ordersController.loadOrders)
router.get("/orders/:id", adminAuth, AdminControllers.ordersController.orderDetail)
router.patch("/orders/:id", adminAuth, AdminControllers.ordersController.updateOrderStatus)
router.patch("/orders/:orderId/:itemIndex", adminAuth, AdminControllers.ordersController.updateItemStatus)

router.get("/coupon", adminAuth, AdminControllers.couponController.loadCoupon)
router.post("/coupon", adminAuth, AdminControllers.couponController.addCoupon)
router.patch("/coupon/:id", adminAuth, AdminControllers.couponController.couponStatus)
router.put("/coupon/:id", adminAuth, AdminControllers.couponController.updateCoupon)
router.delete("/coupon/:id", adminAuth, AdminControllers.couponController.deleteCoupon)

router.get("/offers", adminAuth, AdminControllers.offerController.loadOfferPage)
router.post("/offers", adminAuth, AdminControllers.offerController.addOffer)
router.get("/offers/:id", adminAuth, AdminControllers.offerController.loadedit)
router.put("/offers/:id", adminAuth, AdminControllers.offerController.editOffer)
router.patch("/offers/:id", adminAuth, AdminControllers.offerController.offerStatus)
router.delete("/offers/:id", adminAuth, AdminControllers.offerController.deleteOffer)

router.get("/salesReport", adminAuth, adminController.loadSalesReport)
router.get('/sales-report', adminAuth, adminController.getSalesReportData);
router.get('/sales-report/export', adminAuth, adminController.exportSalesReport);


router.get("/dashboard", adminAuth,AdminControllers.dashboardController.loadDashboard)
router.post("/generate-ledger", adminAuth, AdminControllers.dashboardController.generateLedger)
router.get("/chart-data", adminAuth, AdminControllers.dashboardController.getChartData)




export default router;