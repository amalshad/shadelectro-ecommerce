import User from "../../models/userSchema.js"
import Category from "../../models/categorySchema.js";
import Product from "../../models/productSchema.js"
import Order from '../../models/orderSchema.js'
import Wallet from "../../models/walletSchema.js"
import calculateRefund from '../../utils/calculateRefund.js'
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import puppeteer from "puppeteer";
import { getStatusClass, getStatusIcon, getPaymentStatusClass } from '../../utils/ejsHelpers.js';


const loadOrder = async (req, res) => {
  try {
    const userId = req.session.user || req.session.passport?.user;

    const user = await User.findById(userId);
    const categories = await Category.find({ isListed: true });
    const orders = await Order.find({ userId })
      .sort({ createdOn: -1 })
      .populate('orderedItems.product');

    res.render("userOrders", {
      user,
      categories,
      orders,
      getStatusClass,
      getStatusIcon,
      getPaymentStatusClass
    });
  } catch (error) {

    console.error("Error loading orders:", error);
    res.status(500).render("notfound", { message: "Unable to load orders" });
  }
};


const cancelItem = async (req, res) => {
  try {

    const { orderId, itemIndex, cancelletionTitle, cancelletionReason } = req.body

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const item = order.orderedItems[itemIndex]
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    if (!['Processing', 'Pending'].includes(item.status)) {
      return res.status(404).json({ success: false, message: "Item cannot be cancelled now" })
    };

    if (order.paymentStatus == 'Paid') {
      const userId = req.session.user || req.session.passport.user
      item.status = 'Cancelled';
      item.cancelletionTitle = cancelletionTitle;
      item.cancelletionReason = cancelletionReason;
      const amount = calculateRefund(order, [item])
      // order.finalAmount -= amount
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
    } else {
      item.status = 'Cancelled';
      item.cancelletionTitle = cancelletionTitle;
      item.cancelletionReason = cancelletionReason;
      // order.finalAmount -= item.quantity * item.price

    }


    const product = await Product.findById(item.product)
    if (product) {
      product.variants[item.variantIndex].quantity += item.quantity;
      await product.save();
    };

    const allCancelled = order.orderedItems.every(it => it.status === 'Cancelled');
    if (allCancelled) order.status = 'Cancelled';

    await order.save()

    res.json({ success: true, message: 'Item cancelled successfully' });

  } catch (error) {
    console.error('Error at cancelItem:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

const cancelOrder = async (req, res) => {
  try {

    const { orderId } = req.params

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });


    for (let item of order.orderedItems) {

      if (item.status === "Cancelled") continue;

      const product = await Product.findById(item.product);
      if (product) {

        product.variants[item.variantIndex].quantity += item.quantity;
        await product.save();

      }
      item.status = "Cancelled";
    }

    order.status = "Cancelled";
    await order.save();

    if (order.paymentStatus == "Paid") {

      const userId = req.session.user || req.session.passport.use
      let amount = order.finalAmount
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

    res.json({ success: true, message: "Entire order cancelled and stock restored" });

  } catch (error) {
    console.error("Error at Cancel Order :", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}


const loadOrderDetail = async (req, res) => {
  try {

    const userId = req.session.user || req.session.passport?.user;

    const user = await User.findById(userId);
    const categories = await Category.find();

    const order = await Order.findOne({ _id: req.params.id, userId }).populate('orderedItems.product');
    if (!order) return res.status(404).render("notfound", { message: "Order not found" });

    res.render("order-detail", {
      user,
      categories,
      order,
      getStatusClass,
      getStatusIcon,
      getPaymentStatusClass
    })

  } catch (error) {
    console.error("Error at Load Order Detail:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


const returnOrder = async (req, res) => {
  try {


    const { orderId } = req.params
    const { returnTitle, returnReason } = req.body

    const order = await Order.findById(orderId)
    if (!order) return res.status(400).json({ success: false, message: "Order not found" });

    order.status = "Return Request"
    order.returnTitle = returnTitle
    order.returnReason = returnReason

    order.orderedItems.forEach(item => {
      if (item.status !== 'Returned' && item.status !== 'Cancelled') {
        item.status = 'Return Request'
      };
    });

    await order.save()

    res.json({ success: true, message: 'Return initiated for order' });

  } catch (error) {
    console.error("Error at Return order:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


const returnItem = async (req, res) => {
  try {

    const { orderId, itemIndex } = req.params
    const { returnTitle, returnReason } = req.body

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!order.orderedItems[itemIndex]) {
      return res.status(400).json({ success: false, message: 'Item index invalid' });
    };

    order.orderedItems[itemIndex].status = "Return Request";

    order.orderedItems[itemIndex].returnTitle = returnTitle;

    if (returnReason) order.orderedItems[itemIndex].returnReason = returnReason;


    const allRequest = order.orderedItems.every(it => it.status === "Return Request");
    if (allRequest) order.status = "Return Request";

    await order.save()

    res.json({ success: true, message: 'Item marked for return' });

  } catch (error) {
    console.error("Error at Return item:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });

  }
}

const orderInvoice = async (req, res) => {
  try {

    const userId = req.session.user || req.session.passport?.user;
    const user = await User.findById(userId);
    const orderId = req.params.orderId;
    const categories = await Category.find({ isListed: true });
    const order = await Order.findOne({ _id: orderId, userId }).populate("orderedItems.product");


    res.render("orderInvoice", { categories, order, user })

  } catch (error) {
    console.error("Error at orderInvoice", error);
    res.status(500).redirect("/404");
  }
}


const downloadInvoice = async (req, res) => {
  try {

    const userId = req.session.user || req.session.passport?.user;
    const id = req.params.id;

    const order = await Order.findOne({ _id: id, userId }).populate('orderedItems.product')
    const user = await User.findById(userId)
    const categories = await Category.find()


    const html = await ejs.renderFile(path.join(__dirname, "../../views/user/orderInvoice.ejs"), { categories, order, user });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.set({ "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=invoice.pdf" });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error at downloadInvoice", error);
    res.status(500).json({ success: false, message: "Error generating invoice PDF" });
  }
}



export default { loadOrder, cancelItem, cancelOrder, loadOrderDetail, returnItem, returnOrder, orderInvoice, downloadInvoice }