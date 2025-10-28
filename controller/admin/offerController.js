import Offer  from"../../models/offerSchema.js"
import Product  from"../../models/productSchema.js"
import Category  from"../../models/categorySchema.js"
import  applyOffers from"../../offerUtility/applyOffers.js"

function getDateRange(startDate, endDate) {
    const dates = [];
    let current = new Date(startDate);

    while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}


const loadOfferPage = async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find();
        const offers = await Offer.find();

        // Build blocked offers data
              const blockedByProduct = {};
        const blockedByCategory = {};

        offers.forEach(offer => {
            const dateRange = getDateRange(new Date(offer.startDate), new Date(offer.endDate));
            
            // Block by products
            if (offer.offerType === 'product' && offer.products) {
                offer.products.forEach(product => {
                    const productId = product._id || product;
                    if (!blockedByProduct[productId]) {
                        blockedByProduct[productId] = [];
                    }
                    blockedByProduct[productId].push({
                        offerId: offer._id,
                        offerName: offer.offerName,
                        offerType: offer.offerType,
                        percentage: offer.percentage,
                        startDate: offer.startDate,
                        endDate: offer.endDate,
                        blockedDates: dateRange,
                        productName: product.productName || 'Unknown Product'
                    });
                });
            }

            // Block by categories
            if (offer.offerType === 'category' && offer.categories) {
                offer.categories.forEach(category => {
                    const categoryId = category._id || category;
                    if (!blockedByCategory[categoryId]) {
                        blockedByCategory[categoryId] = [];
                    }
                    blockedByCategory[categoryId].push({
                        offerId: offer._id,
                        offerName: offer.offerName,
                        offerType: offer.offerType,
                        percentage: offer.percentage,
                        startDate: offer.startDate,
                        endDate: offer.endDate,
                        blockedDates: dateRange,
                        categoryName: category.name || 'Unknown Category'
                    });
                });
            }
        });
        // console.log(blockedByProduct)
       

        res.render("offer", {
            products,
            categories,
            offers,
            blockedByProduct,
            blockedByCategory:blockedByCategory  ||""
        });
    } catch (error) {
        console.error("Error at Load Offer:", error);
        res.redirect("/404");
    }
};



const addOffer = async (req, res) => {
    try {


        const { offerName, offerType, percentage, startDate, endDate, isActive, description, products, categories } = req.body

        const newOffer = new Offer({
            offerName,
            offerType,
            percentage,
            products: products || [],
            categories: categories || [],
            startDate,
            endDate,
            isActive,
            description
        })

        await newOffer.save()

        res.json({ success: true, message: "Offer Created Successfully" })

        await applyOffers();

    } catch (error) {

        console.error("Error at Add offer:", error);
        res.status(400).json({ success: false, message: "Failed to create offer." });
    }
}


const loadedit = async (req, res) => {
    try {

        const offer = await Offer.findById(req.params.id).populate('products').populate('categories');

        if (!offer) return res.json({ success: false, message: 'Offer not found' });

        res.json({ success: true, offer });

    } catch (error) {

        console.error("Error at load edit ", error)
        res.json({ success: false, message: 'Error loading offer' });
    }
}


const editOffer = async (req, res) => {
    try {

        const id = req.params.id;

        const offer = await Offer.findByIdAndUpdate(id, {
            $set: {
                offerName: req.body.offerName,
                offerType: req.body.offerType,
                percentage: req.body.percentage,
                products: req.body.products,
                categories: req.body.categories,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                isActive: req.body.isActive,
                description: req.body.description
            }
        }, { new: true });

        if (!offer) return res.json({ success: false, message: "Offer not found" });

        res.json({ success: true, message: "Offer updated Successfully", offer });

        await applyOffers();

    } catch (error) {

        console.error("Error at edit offer", error);
        res.json({ success: false, message: "Error updating offer" });
    }
};


const offerStatus = async (req, res) => {
    try {

        const id = req.params.id

        const offer = await Offer.findById(id)
        if (!offer) return res.status(404).json({ success: false, message: "Offer not found!" });

        offer.isActive = !offer.isActive

        await offer.save()

        res.json({ success: true, message: `Offer is ${offer.isActive ? "Activated" : "Deactived"} Successfully!` })

        await applyOffers();
    } catch (error) {

        console.error("Error at offerstatus", error);
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


const deleteOffer = async (req, res) => {
    try {

        const id = req.params.id
        const offer = await Offer.findByIdAndDelete(id)

        if (!offer) return res.status(404).json({ success: false, message: "Offer not found!" });

        res.json({ success: true, message: "Offer deleted Successfully!" })
        await applyOffers();

    } catch (error) {

        console.error("Error at Delete Coupon", error)
        res.status(500).json({ success: false, message: "Server error" });
    }
}




export  default{ loadOfferPage, addOffer, editOffer, offerStatus, deleteOffer, loadedit }