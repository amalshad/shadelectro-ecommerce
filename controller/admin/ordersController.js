import Product from "../../models/productSchema.js"
import Category from "../../models/categorySchema.js"
import Order from "../../models/orderSchema.js";
import Wallet from "../../models/walletSchema.js"
import User from "../../models/userSchema.js"
import calculateRefund from "../../utils/calculateRefund.js"




const loadOrders = async (req, res) => {
  try {

    const search = req.query.search || '';
    const status = req.query.status || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const paymentStatus = req.query.paymentStatus || '';

    let userIds = [];
    if (search) {
      const users = await User.find({ name: { $regex: search, $options: 'i' } }, '_id');
      userIds = users.map(u => u._id);
    }

    const query = {};

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }


    const orders = await Order.find(query)
      .populate('userId')
      .sort({ createdOn: -1 })
      .skip((page - 1) * limit)
      .limit(limit);


    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const orderStats = {
      pending: await Order.countDocuments({ status: "Pending" }),
      processing: await Order.countDocuments({ status: "Processing" }),
      shipped: await Order.countDocuments({ status: "Shipped" }),
      delivered: await Order.countDocuments({ status: "Delivered" }),
      cancelled: await Order.countDocuments({ status: "Cancelled" }),
      requested: await Order.countDocuments({ status: "Return Request" }),
      returned: await Order.countDocuments({ status: "Return Accepted" })
    };

    res.render("orders", {
      orders,
      search,
      status,
      currentPage: page,
      totalPages,
      orderStats,
      paymentStatus
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).render("page-error", { message: "Internal Server Error" });
  }
};

const orderDetail = async (req, res) => {
  try {
    const id = req.params.id

    const order = await Order.findById(id).populate("orderedItems.product").populate("userId")

    res.render('order-details', {
      order,
    })
  } catch (error) {

    console.error("Error at Order Detail:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

const updateOrderStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });




    if (status === "Returned") {
      const userId = order.userId;

      let refundAmount = 0;

      order.orderedItems.forEach(item => {
        if (item.status !== 'Returned' && item.status !== 'Cancelled') {
          refundAmount = +item.quantity * item.price

        };
      });

      //-----wallet
      let wallet = await Wallet.findOne({ userId });

      const transaction = {
        direction: "Credit",
        amount: refundAmount,
        description: `Refund for returned order ${order.orderId}`,
        orderId: order._id,
        paymentMethod: "Refunded"
      };

      if (wallet) {

        wallet.balance += refundAmount;
        wallet.transaction.push(transaction);
        await wallet.save();

      }
      else {

        wallet = new Wallet({
          userId,
          balance: refundAmount,
          transaction: [transaction]

        });
        await wallet.save();

      }
    }

    //--- Status
    order.status = status;

    order.orderedItems.forEach(item => {
      if (item.status !== 'Returned' && item.status !== 'Cancelled') {
        item.status = status;
      }
    });

    if (status == "Delivered" && order.paymentMethod == "cod") {
      order.paymentStatus = "Paid"
    }


    await order.save();
    res.json({ success: true, message: "Order status updated" });

  } catch (err) {

    console.error("Error at updating order status:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const updateItemStatus = async (req, res) => {

  try {

    const userId = req.session.user || req.session.passport?.user;
    const { orderId, itemIndex } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const item = order.orderedItems[itemIndex];
    if (!item) return res.status(400).json({ success: false, message: "Invalid item index" });

    item.status = status;
    if (status == "Delivered" && order.paymentMethod == "cod") {
      order.paymentStatus = "Paid"
    }

    if (status === "Returned" || status === 'Return Accepted') {
      const amount = calculateRefund(order, [item])

      // order.finalAmount-=amount
      let wallet = await Wallet.findOne({ userId });


      const transaction = {
        direction: "Credit",
        amount,
        description: `Refund for returned item in order ${order.orderId}`,
        orderId
      };

      if (wallet) {
        wallet.balance += amount;
        wallet.transaction.push(transaction);
        await wallet.save();

      }
      else {
        wallet = new Wallet({
          userId,
          balance: amount,
          transaction: [transaction]
        });
        await wallet.save();
      }
    }

    const allSame = order.orderedItems.every(i => i.status === status);

    if (allSame || !["Cancelled", "Returned", "Return Rejected", "Return Accepted"].includes(status)) {
      order.status = status;
    }

    await order.save();
    return res.json({ success: true, message: 'Item status updated successfully' });

  } catch (err) {

    console.error("Update item status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export default { loadOrders, orderDetail, updateOrderStatus, updateItemStatus }