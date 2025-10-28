import Address from "../../models/addresSchema.js"
import User from "../../models/userSchema.js"
import Category from "../../models/categorySchema.js";
import Product from "../../models/productSchema.js"
import Cart from '../../models/cartSchema.js'
import Order from '../../models/orderSchema.js'
import Coupon from "../../models/couponSchema.js"
import crypto from 'crypto';
import Razorpay from 'razorpay';

const loadCheckout = async (req, res) => {
  try {
    const id = req.session.user || req.session.passport?.user
    const cart = await Cart.findOne({ userId: id }).populate("items.productId");

    const categories = await Category.find()

    const addresses = await Address.findOne({ userId: id })
    const coupons = await Coupon.find({ status: true, expireOn: { $gt: new Date() }, $or: [{ assignedTo: null }, { assignedTo: id }] }).lean();


    const user = await User.findById(id)
    res.render('checkout', {
      title: "Shad Electro",
      user,
      cart,
      categories,
      addresses,
      coupons

    })
  } catch (error) {
    console.error("Error At CheckOut", error)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}






function verifyRazorpaySignature(orderId, paymentId, signature) {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
}


const createNewRazorpayOrder = async (order) => {
  const options = {
    amount: Math.round(order.finalAmount * 100), // Amount in paise
    currency: 'INR',
    receipt: `retry_${order._id}_${Date.now()}`,
    notes: {
      orderId: order._id.toString(),
      retry: 'true'
    }
  };

  const razorpayOrder = await razorpay.orders.create(options);
  return razorpayOrder.id;
};




const razorpayVerificationMiddleware = async (req, res, next) => {
  try {
    const { paymentMethod, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (paymentMethod === 'razorpay') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {

        req.paymentFailed = true;
        req.paymentFailureReason = 'Missing payment details';
        return next();
      }

      const isValidSignature = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

      if (!isValidSignature) {
        console.log('Razorpay signature verification failed');

        req.paymentFailed = true;
        req.paymentFailureReason = 'Invalid payment signature';
        return next();
      }

      console.log('Razorpay signature verified successfully');


      req.verifiedPayment = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        isVerified: true
      };
    }

    next();

  } catch (error) {
    console.error('Error in Razorpay verification:', error);
    req.paymentFailed = true;
    req.paymentFailureReason = 'Verification error';
    next();
  }
};


const checkout = async (req, res) => {

  try {

    const userId = req.session.user || req.session.passport?.user;
    const { selectedAddressId, paymentMethod, shippingPrice, subtotal, discount, razorpayOrderId } = req.body;

    const Discount = Number(discount) || 0

    if (!paymentMethod) return res.status(400).json({ success: false, message: "Choose a payment method" })

    const cart = await Cart.findOne({ userId }).populate("items.productId");


    if (!cart || cart.items.length === 0) return res.status(400).json({ success: false, message: "Cart is empty" });



    const orderedItemsraw = await Promise.all(cart.items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (product.variants[item.variantIndex].quantity < 1) return null;

      return {
        product: item.productId._id,
        variantIndex: item.variantIndex,
        quantity: item.quantity,
        price: product.variants[item.variantIndex].finalPrice,
        status: req.paymentFailed ? "Pending" : "Processing"
      };
    }));

    const orderedItems = orderedItemsraw.filter(item => item !== null)

    const addressDoc = await Address.findOne({ userId });
    const selectedAddress = addressDoc.address.find(addr => addr._id.toString() === selectedAddressId);

    if (!selectedAddress) return res.status(400).json({ success: false, message: "Address not found" });


    let orderStatus = "Processing";
    let paymentStatus = "Pending";

    if (paymentMethod === "cod") {
      paymentStatus = "Pending";
      orderStatus = "Processing";

    } else if (paymentMethod === "razorpay") {
      if (req.paymentFailed) {

        paymentStatus = "Failed";
        orderStatus = "Pending";
      } else if (req.verifiedPayment && req.verifiedPayment.isVerified) {

        paymentStatus = "Paid";
        orderStatus = "Processing";
      }
    }



    const orderData = {
      userId,
      orderedItems,
      totalPrice: parseFloat(subtotal),
      discount: parseFloat(discount) || 0,
      finalAmount: (Number(subtotal) - Discount) + Number(shippingPrice),
      shippingPrice: Number(shippingPrice),
      shippingAddress: selectedAddress,
      paymentMethod,
      paymentStatus: paymentStatus,
      status: orderStatus,
      couponApplied: discount > 0,
      razorpayOrderId: razorpayOrderId || null,
      invoiceDate: new Date()
    };

    if (req.verifiedPayment && req.verifiedPayment.isVerified) {
      orderData.razorpayPaymentId = req.verifiedPayment.razorpayPaymentId;
      orderData.razorpayOrderId = req.verifiedPayment.razorpayOrderId;
    }

    const newOrder = new Order(orderData);
    await newOrder.save();

    if (paymentStatus === "Paid" || paymentMethod === "cod") {

      for (const item of orderedItems) {
        const product = await Product.findById(item.product);
        if (product && product.variants[item.variantIndex]) {
          product.variants[item.variantIndex].quantity -= item.quantity;
          if (product.variants[item.variantIndex].quantity < 0) {
            product.variants[item.variantIndex].quantity = 0;
          }
          await product.save();
        }
      }

      await Cart.findOneAndUpdate({ userId }, { items: [] });
      return res.json({ success: true, orderId: newOrder._id, redirectTo: 'success' });

    } else {
      return res.json({ success: true, orderId: newOrder._id, redirectTo: 'orders', message: 'Payment verification failed. Order saved as pending.' });
    }
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


const orderSuccess = async (req, res) => {
  try {

    const { id } = req.params;
    const userId = req.session.user || req.session.passport?.user;

    if (!id) return res.redirec('/404')

    const user = await User.findById(userId);
    const order = await Order.findOne({ userId }).sort({ createdOn: -1 }).populate('orderedItems.product');
    const categories = await Category.find();

    res.render("order-success", {
      user,
      order,
      categories
    });

  } catch (error) {
    console.error("Order success error:", error);
    res.status(500).render("notfound", { message: "Something went wrong" });
  }
};


const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET });

const createRazorpayOrder = async (req, res) => {
  try {

    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
  }
};


const retryPayment = async (req, res) => {
  try {

    const { orderId } = req.params;
    const userId = req.session.user || req.session.passport?.user;


    const order = await Order.findOne({ _id: orderId, userId }).populate('userId');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });


    if (order.status !== 'Pending' || order.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'This order is not eligible for payment retry' });
    }

    let razorpayOrderId;

    if (order.razorpayOrderId) {
      try {
        const existingOrder = await razorpay.orders.fetch(order.razorpayOrderId);


        if (existingOrder.status === 'created' || existingOrder.status === 'attempted') {
          razorpayOrderId = order.razorpayOrderId;
        } else {

          razorpayOrderId = await createNewRazorpayOrder(order);
        }
      } catch (error) {

        console.log('Existing order fetch failed, creating new order');
        razorpayOrderId = await createNewRazorpayOrder(order);
      }
    } else {

      razorpayOrderId = await createNewRazorpayOrder(order);
    }


    if (order.razorpayOrderId !== razorpayOrderId) {
      await Order.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrderId, });
    }



    res.json({
      success: true, razorpayKey: process.env.RAZORPAY_KEY_ID, orderId: razorpayOrderId,
      amount: order.finalAmount * 100,
      customer: {
        name: order.userId.name,
        email: order.userId.email,
        phone: order.userId.phone || ''
      }
    });

  } catch (error) {
    console.error('Retry payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while preparing payment retry' });
  }
};


const verifyRetryPayment = async (req, res) => {
  try {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');


    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }


    const updatedOrder = await Order.findByIdAndUpdate(orderId,
      {
        paymentStatus: 'Paid',
        status: 'Processing',
        razorpayPaymentId: razorpay_payment_id,
        paymentVerifiedAt: new Date()
      },
      { new: true }).populate('orderedItems.product');

    if (!updatedOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    await Order.updateOne({ _id: orderId }, { $set: { "orderedItems.$[].status": "Processing" } });


    const finalOrder = await Order.findById(orderId).populate('orderedItems.product');


    for (const item of updatedOrder.orderedItems) {
      const product = await Product.findById(item.product);
      if (product && product.variants[item.variantIndex]) {
        product.variants[item.variantIndex].quantity -= item.quantity;
        if (product.variants[item.variantIndex].quantity < 0) {
          product.variants[item.variantIndex].quantity = 0;
        }
        await product.save();
      }
    }


    await Cart.findOneAndUpdate({ userId: updatedOrder.userId }, { items: [] });

    res.json({ success: true, message: 'Payment verified successfully', order: finalOrder });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};


const couponApply = async (req, res) => {
  try {

    const { couponCode, cartTotal, userId } = req.body;

    if (!couponCode) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase(), status: true, expireOn: { $gt: new Date() } });

    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found or expired' });

    if (cartTotal < coupon.minimumPrice) return res.status(400).json({ success: false, message: `Minimum price of ₹${coupon.minimumPrice} required` });

    // if (coupon.usageLimit !== Infinity && coupon.usageLimit <= 0) return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });


    if (userId) {

      if (coupon.users.length >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });
    

      let userEntry = coupon.users.find(u => u.userId.toString() === userId);

      if (userEntry && userEntry.usageCount >= coupon.usageLimitPerUser) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon the maximum number of times' });
      } else if (!userEntry) {
        let userdata={
          userId:userId,
          usageCount:1
        }
         coupon.users.push(userdata);
        


      } else if (userEntry && userEntry.usageCount < coupon.usageLimitPerUser) {
        userEntry.usageCount +=1
      }

    }



    let discountAmount = 0;
    if (coupon.couponType === 'percentage') {
      discountAmount = (coupon.offerPrice / 100) * cartTotal;

    } else if (coupon.couponType === 'fixed') {
      discountAmount = coupon.offerPrice;
    } else if (coupon.couponType === 'free_shipping') {

    }

    if (discountAmount > cartTotal) discountAmount = cartTotal;


    await coupon.save()

    res.json({ success: true, message: 'Coupon applied successfully', discountAmount, couponCode: coupon.couponCode, couponId: coupon._id });

  } catch (error) {
    console.error("Error at coupon apply", error)
  }
}



export default { loadCheckout, checkout, orderSuccess, createRazorpayOrder, razorpayVerificationMiddleware, couponApply, retryPayment, verifyRetryPayment }