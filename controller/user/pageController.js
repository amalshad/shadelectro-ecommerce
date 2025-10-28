import User from "../../models/userSchema.js"
import Category from "../../models/categorySchema.js";
import Product from "../../models/productSchema.js"
import Cart from "../../models/cartSchema.js"
import Wishlist from "../../models/wishlistSchema.js"




const loadHome = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true })
    const cat = categories.map(v => v._id)
    const products = await Product.find({ isBlocked: false, category: { $in: cat } })

    let user = req.session.passport?.user || req.session.user

    const userData = await User.findById(user);

    res.render("home", {
      user: userData,
      title: 'Shad Electro',
      products,
      categories,
    })

  } catch (error) {
    console.log("ERROR", error)
    res.status(500).send("Server Error")
  }
}


const pageNotFound = async (req, res) => {
  try {

    res.status(404).render('notfound', { title: 'Page Not Found - Shad Electro' });

  } catch (error) {
    console.log("ERROR", error)
    res.status(500).send("Server Error")
  }
}


const loadShop = async (req, res) => {
  try {

    const { category, priceRange, sort, search } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const filter = { isBlocked: false };
    const sortOption = {};

    if (category) {
      filter.category = category;
    } else {
      const foundCat = await Category.find({ isListed: true });
      filter.category = foundCat.map(v => v._id);
    }


    if (priceRange) {

      const [min, max] = priceRange.split('-').map(Number);

      
      if (!isNaN(min) && !isNaN(max)) {
        filter.$or = [
          { 'variants.salesPrice': { $gte: min, $lte: max } },
          { 'variants.regularPrice': { $gte: min, $lte: max } }
        ]
      }
    }

    if (search) filter.productName = { $regex: search, $options: "i" };


    if (sort === 'price_asc') {
      sortOption['variants.0.salesPrice'] = 1;
    } else if (sort === 'price_desc') {
      sortOption['variants.0.salesPrice'] = -1;
    } else if (sort === 'name_asc') {
      sortOption.productName = 1;
    } else if (sort === 'name_desc') {
      sortOption.productName = -1;
    }

    const totalProducts = await Product.countDocuments(filter);

    let products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const categories = await Category.find({ isListed: true });

    let selectedCategoryName = '';
    if (category) {
      const categoryObj = await Category.findById(category);
      if (categoryObj) {
        selectedCategoryName = categoryObj.name;
      }
    }

    let user = req.session.passport?.user || req.session.user;
    const userData = await User.findById(user);

    const totalPages = Math.ceil(totalProducts / limit);


    function buildPaginationUrl(pageNumber) {
      const params = new URLSearchParams(req.query);
      params.set("page", pageNumber);
      return `/shop?${params.toString()}`;
    }

    res.render("shop", {
      products,
      title: 'ShadElectro',
      categories,
      user: userData,
      selectedCategory: category || '',
      selectedCategoryName,
      priceRange: priceRange || '',
      sort: sort || 'recommended',
      search: search || "",
      minPrice: 100,
      maxPrice: 2000,
      currentPage: page,
      totalPages,
      productsPerPage: limit,
      totalProducts,
      buildPaginationUrl
    });

  } catch (error) {
    console.error("Shop page error:", error);
    res.status(500).render("error", { message: "Something went wrong" });
  }
};


const loadProductDetail = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);
    const categories = await Category.find({ isListed: true });

    if (!product || product.isBlocked) return res.status(404).render("notfound", { message: "Product not found" });

    const id = req.session.passport?.user || req.session.user;
    const user = await User.findById(id)
    const cart = await Cart.findOne({ userId: id });
    const wishlist = await Wishlist.findOne({ userId: id })


    if (cart) {
      cart.items.forEach(item => {
        if (item.productId.toString() === product._id.toString()) {
          const variant = product.variants[item.variantIndex];
          if (variant) {
            variant.quantity -= item.quantity;
            if (variant.quantity < 0) variant.quantity = 0;
          }
        }
      });
    }

    const relatedProduct = await Product.find({ category: product.category, isBlocked: false, _id: { $ne: req.params.id } });

    const inWishlist = wishlist?.products.some(p => p.productId.toString() === req.params.id.toString()) || false

    res.render("product-detail", {
      title: "Shad Electro",
      product,
      relatedProduct,
      user,
      categories,
      inWishlist: inWishlist || ""

    });

  } catch (err) {
    console.error("Product Detail Error:", err);
    res.status(500).render("notfound", { message: "Something went wrong" });
  }
};


const aboutPage = async (req, res) => {
  try {

    const userId = req.session.user || req.session.passport.user
    const user = await User.findById(userId)

    res.render("about", { user })

  } catch (error) {
    console.error("Error at aboutPage", error)
    res.status(500).render("notfound")
  }
}


const contactPage = async (req, res) => {
  try {

    const userId = req.session.user || req.session.passport.user
    const user = await User.findById(userId)

    res.render("contact", { user })

  } catch (error) {
    console.error("Error at contactPage", error)
    res.status(500).render("notfound")
  }
}


export default { loadHome, pageNotFound, loadShop, loadProductDetail, aboutPage, contactPage }