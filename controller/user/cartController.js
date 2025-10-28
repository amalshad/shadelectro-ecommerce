import Address from "../../models/addresSchema.js"
import User from "../../models/userSchema.js"
import Category from "../../models/categorySchema.js";
import Product from "../../models/productSchema.js"
import Cart from '../../models/cartSchema.js'


const loadCart = async (req, res) => {
  try {

    const userId = req.session.passport?.user || req.session.user;
    const search = req.query.query || '';

    const categories = await Category.find({ isListed: true });
    const userData = await User.findById(userId);

    let cart = await Cart.findOne({ userId }).populate("items.productId");

    const stockWarnings = [];


    if (cart) {
      for (const item of cart.items) {
        const product = item.productId;
        const variant = product?.variants?.[item.variantIndex];

        if (!variant) continue;

        if (item.quantity > variant.quantity) {
          item.quantity = variant.quantity;
          stockWarnings.push({
            productName: product.productName,
            available: variant.quantity
          });
        }
      }
      await cart.save();

      if (search.trim()) {
        cart.items = cart.items.filter(item => {
          const productName = item.productId?.productName || '';
          const variant = item.productId?.variants[item.variantIndex]?.type || '';
          return productName.toLowerCase().includes(search.toLowerCase()) ||
            variant.toLowerCase().includes(search.toLowerCase());
        });
      }
    }

    res.render("cart", {
      title: "Shad Electro",
      user: userData,
      orders: "",
      categories,
      cart,
      stockWarnings,
      search
    });

  } catch (err) {
    console.error("Error loading cart:", err);
    res.status(500).render("notfound", { message: "Internal Server Error" });
  }
};



const addCart = async (req, res) => {
  try {

    const userId = req.session.passport?.user || req.session.user;
    const { productId, quantity, variantIndex } = req.body;

    const product = await Product.findById(productId);

    if (quantity > product.variants[variantIndex].quantity) return res.json({ success: false, message: "Quantity exceeds available stock." });


    let cart = await Cart.findOne({ userId });

    const existingItemIndex = cart?.items.findIndex(
      item => item.productId.toString() === productId && item.variantIndex === variantIndex
    );

    if (cart && existingItemIndex !== -1) {

      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.variants[variantIndex].quantity) {

        return res.json({ success: false, message: "Quantity exceeds available stock." });
      }

      cart.items[existingItemIndex].quantity = newQuantity;

    } else {
      const cartItem = { productId, variantIndex, quantity, };

      if (!cart) {
        cart = new Cart({ userId, items: [cartItem] });
      } else {
        cart.items.push(cartItem);
      }
    }

    await cart.save();
    res.json({ success: true, message: "Product added to Cart" });

  } catch (error) {
    console.error("Error at addCart", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const removeItem = async (req, res) => {
  try {

    const { id: itemId } = req.params;
    const userId = req.session.passport?.user || req.session.user;

    const result = await Cart.updateOne({ userId }, { $pull: { items: { _id: itemId } } });

    res.json({ success: true });

  } catch (error) {
    console.error("Error at removeItem", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const getProductVariant = async (req, res) => {
  try {

    const product = await Product.findById(req.params.productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ variants: product.variants });

  } catch (error) {
    console.error("getProductVarinat", error)
    res.status(500).json({ message: "Server error" });
  }
};


const updateCartItem = async (req, res) => {
  try {

    const { itemId, quantity } = req.body;
    const userId = req.session.passport?.user || req.session.user;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.json({ success: false, message: 'Item not in cart' });

    const product = await Product.findById(item.productId);
    const variant = product.variants[item.variantIndex];

    if (quantity > variant.quantity) return res.json({ success: false, message: `Only ${variant.quantity} in stock` });


    item.quantity = quantity;
    await cart.save();

    res.json({ success: true });

  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export default { loadCart, addCart, removeItem, getProductVariant, updateCartItem }