import Category from "../../models/categorySchema.js"
import User from "../../models/userSchema.js"
import Wallet from "../../models/walletSchema.js"
import Razorpay from 'razorpay';



const loadWallet = async (req, res) => {
  try {

    const userId = req.session.user || req.session.passport?.user
    const user = await User.findById(userId)
    const categories = await Category.find()
    const wallet = await Wallet.findOne({ userId })


    res.render("wallet", {
      user, categories,
      wallet: wallet || { balance: 0, transaction: [] }
    })

  } catch (error) {
    console.error("Error at loadWallet", error);
    res.status(500).render("notfound", { message: "Internal Server Error" });
  }
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});


const addMoney = async (req, res) => {
  try {

    const userId = req.session.user || req.session.passport?.user;
    const { amount, direction, paymentMethod, description } = req.body;


    let wallet = await Wallet.findOne({ userId })

    const transaction = {
      direction,
      amount,
      description,
      paymentMethod
    }

    if (wallet) {
      wallet.balance += amount,
        wallet.transaction.push(transaction)
      await wallet.save()
    } else {
      wallet = new Wallet({
        userId,
        balance: amount,
        transaction: [transaction]
      });
      await wallet.save()
    }

    res.json({ success: true, message: "Amount Credited Successfully" })

  } catch (error) {
    console.error("Error at addMoney:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


const createWalletOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `wallet_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({ success: true, orderId: order.id, key_id: process.env.RAZORPAY_KEY_ID, });

  } catch (error) {
    console.error("Wallet Razorpay order error:", error);
    res.status(500).json({ success: false, message: "Failed to create Razorpay order." });
  }
};


export default { loadWallet, addMoney, createWalletOrder }