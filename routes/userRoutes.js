import express from 'express';
import UserControllers from "../config/UserControllers.js"
import passport from 'passport';
const router = express.Router();
import { userAuth, userBlock, sessionAuth } from "../middlewares/auth.js"
import multer from 'multer';
const upload = multer();


router.get("/404", UserControllers.pageController.pageNotFound);

router.get("/logout", UserControllers.authController.logout);

router.get("/", userBlock, UserControllers.pageController.loadHome);

router.get("/login", userAuth, UserControllers.authController.loadLogin);
router.post("/login", userAuth, UserControllers.authController.login);
router.get("/signup", userAuth, UserControllers.authController.loadSignup);
router.post("/signup", userAuth, UserControllers.authController.signup);

router.get("/verify-otp", userAuth, UserControllers.authController.loadVerifyOtp);
router.post('/verify-otp', userAuth, UserControllers.authController.verifyOtp);
router.post("/resend-otp", userAuth, UserControllers.authController.resendOTP);


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }), (req, res) => {
        res.redirect('/');
});

router.get("/forgot", UserControllers.authController.loadForgotPassword);
router.post("/forgot", UserControllers.authController.forgotPassword);
router.get("/forgotOtp", UserControllers.authController.loadForgotOtp);
router.post("/forgotOtp", UserControllers.authController.verifyForgotOtp);
router.get("/resetPassword", UserControllers.authController.loadResetPassword);
router.post("/resetPassword", UserControllers.authController.resetPassword);
router.post("/forgotResend", UserControllers.authController.forgotResendOtp);

router.get("/shop", userBlock, UserControllers.pageController.loadShop);
router.get("/shop/:id", userBlock, UserControllers.pageController.loadProductDetail);

router.get("/profile", sessionAuth, UserControllers.profileController.loadUserProfile);
router.patch("/profile", sessionAuth, UserControllers.profileController.updateUserProfile);

router.get("/address", sessionAuth, UserControllers.addressController.loadAddress);
router.post("/address", sessionAuth, UserControllers.addressController.addAddress);
router.patch("/address/:id", sessionAuth, UserControllers.addressController.editAddress);
router.delete("/address/:id", sessionAuth, UserControllers.addressController.deleteAddress);

router.get("/security", sessionAuth, UserControllers.profileController.loadSecurity);
router.patch("/reset-password", sessionAuth, UserControllers.profileController.resetPassword);
router.post("/reset-email", sessionAuth, UserControllers.profileController.resetEmail);
router.post("/resendEmail", sessionAuth, UserControllers.profileController.resendEmailOtp);
router.post("/confirm-otp", sessionAuth, UserControllers.profileController.confirmOtp);
;
router.get("/cart", sessionAuth, UserControllers.cartController.loadCart);
router.post("/cart", sessionAuth, UserControllers.cartController.addCart);
router.delete("/cart/:id", sessionAuth, UserControllers.cartController.removeItem);
router.get('/productVariant/:productId', sessionAuth, UserControllers.cartController.getProductVariant);
router.put("/cart", sessionAuth, UserControllers.cartController.updateCartItem);

router.get("/wishlist", sessionAuth, UserControllers.wishlistController.loadWishlist);
router.post("/wishlist", sessionAuth, UserControllers.wishlistController.addWishlist);
router.delete("/wishlist/:productId/:variantIndex", sessionAuth, UserControllers.wishlistController.removeWishlist);

router.get("/checkout", sessionAuth, UserControllers.checkoutController.loadCheckout);
router.post("/checkout", sessionAuth, upload.none(), UserControllers.checkoutController.razorpayVerificationMiddleware, UserControllers.checkoutController.checkout);

router.get('/order-success/:id', sessionAuth, UserControllers.checkoutController.orderSuccess);


router.get("/orders", sessionAuth, UserControllers.orderController.loadOrder);
router.put("/orders", sessionAuth, UserControllers.orderController.cancelItem);
router.post("/orders/:orderId", sessionAuth, UserControllers.orderController.cancelOrder);
router.get("/order-detail/:id", sessionAuth, UserControllers.orderController.loadOrderDetail);
router.post("/returnOrder/:orderId", sessionAuth, UserControllers.orderController.returnOrder);
router.post("/returnItem/:orderId/:itemIndex", sessionAuth, UserControllers.orderController.returnItem);

router.get("/wallet", sessionAuth, UserControllers.walletController.loadWallet);
router.post("/wallet", sessionAuth, UserControllers.walletController.addMoney);
router.post('/wallet/create-order', sessionAuth, UserControllers.walletController.createWalletOrder);

router.post("/coupon", sessionAuth, UserControllers.checkoutController.couponApply)

router.get("/orderInvoice/:orderId", sessionAuth, UserControllers.orderController.orderInvoice);
router.get("/download-invoice/:id", sessionAuth, UserControllers.orderController.downloadInvoice);

router.post('/create-razorpay-order', UserControllers.checkoutController.createRazorpayOrder);
router.post('/orders/:orderId/retry-payment', sessionAuth, UserControllers.checkoutController.retryPayment);
router.post('/verify-retry-payment', sessionAuth, UserControllers.checkoutController.verifyRetryPayment);

router.get("/about", sessionAuth, UserControllers.pageController.aboutPage)
router.get("/contact", sessionAuth, UserControllers.pageController.contactPage)

export default router;