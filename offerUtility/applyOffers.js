import Offer from "../models/offerSchema.js";
import Product from "../models/productSchema.js";

const applyOffers = async () => {
  try {
    const now = new Date();
    const products = await Product.find();

    for (const product of products) {

      const productOffer = await Offer.findOne({
        offerType: "product",
        products: { $in: [product._id] },
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      });


      const categoryOffer = await Offer.findOne({
        offerType: "category",
        categories: { $in: [product.category] },
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      let bestDiscount = 0;
      if (productOffer) bestDiscount = Math.max(bestDiscount, productOffer.percentage);
      if (categoryOffer) bestDiscount = Math.max(bestDiscount, categoryOffer.percentage);


      product.variants = product.variants.map(v => {
        const discountPrice = v.salesPrice - (v.salesPrice * bestDiscount / 100);
        return {
          ...v.toObject(),
          finalPrice: Math.round(discountPrice),
          appliedOffer: bestDiscount
        };
      });

      await product.save();
    }

    console.log("Offers applied successfully at", new Date());
  } catch (error) {
    console.error(" Error applying offers:", error);
  }
};

export default applyOffers;
