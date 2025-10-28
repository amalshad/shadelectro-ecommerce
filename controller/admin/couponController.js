import Coupon from "../../models/couponSchema.js"


const loadCoupon = async (req, res) => {
    try {

        const rawCoupons = await Coupon.find().lean();

        const coupons = rawCoupons.map(c => ({
            id: c._id,
            code: c.couponCode,
            type: c.couponType,
            value: c.offerPrice,
            minAmount: c.minimumPrice,
            usageLimit: c.usageLimit || null,
            usageLimitPerUser: c.usageLimitPerUser || null,
            used: c.users ? c.users.length : 0,
            source: c.source,
            startDate: c.createdOn.toISOString().slice(0, 16),
            endDate: c.expireOn.toISOString().slice(0, 16),
            description: c.description,
            isActive: c.status,
            isPublic: true
        }));

        res.render("coupon", { coupons })
    } catch (error) {
        console.error("Error at load Coupon", error)
        res.status(500).json({ success: false, message: "Server error" });

    }
}


const addCoupon = async (req, res) => {
    try {

        const { couponCode, createdOn, expireOn, offerPrice, minimumPrice, couponType, description, usageLimit, usageLimitPerUser } = req.body;

        const couponExist = await Coupon.findOne({ couponCode })
        if (couponExist) return res.status(400).json({ success: false, message: "This Coupon already exist" });

        const couponNew = new Coupon({
            usageLimit: usageLimit || Infinity,
            usageLimitPerUser:usageLimitPerUser||Infinity,
            couponCode: couponCode.toUpperCase(),
            createdOn,
            expireOn,
            offerPrice,
            minimumPrice,
            source: "admin",
            couponType,
            description
        })

        if (!couponNew) return res.json({ success: false, message: "Coupon not added " });

        await couponNew.save()

        res.json({ success: true, message: "Coupon added successfully" })

    } catch (error) {

        console.error("Error at Add Coupon", error)
        res.status(500).json({ success: false, message: "Server error" });

    }
}


const updateCoupon = async (req, res) => {
    try {

        const id = req.params.id;

        const coupon = await Coupon.findByIdAndUpdate(id, {
            $set: {
                couponCode: req.body.couponCode.toUpperCase(),
                usageLimit: req.body.usageLimit || Infinity,
                usageLimitPerUser: req.body.usageLimitPerUser||Infinity,
                createdOn: req.body.createdOn,
                expireOn: req.body.expireOn,
                offerPrice: req.body.offerPrice,
                minimumPrice: req.body.minimumPrice,
                couponType: req.body.couponType,
                description: req.body.description,
                status: req.body.status
            }
        }, { new: true });

        if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });

        res.json({ success: true, message: "Coupon Update Successfully", coupon })

        console.log("Coupon Update")
    } catch (error) {

        console.error("Error at Update Coupon", error)
        res.status(500).json({ success: false, message: "Server error" });
    }
}


const deleteCoupon = async (req, res) => {
    try {


        const id = req.params.id
        const coupon = await Coupon.findByIdAndDelete(id)

        if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" })

        res.json({ success: true, message: "Coupon Delete Successfully" });


    } catch (error) {

        console.error("Error at Delete Coupon", error)
        res.status(500).json({ success: false, message: "Server error" });
    }
}


const couponStatus = async (req, res) => {
    try {

        const id = req.params.id


        const coupon = await Coupon.findById(id)
        if (!coupon) return res.status(404).json({ success: false, message: "Coupon not Exist" });

        coupon.status = !coupon.status;
        await coupon.save();

        res.json({
            success: true, message: `Coupon ${coupon.status ? "activated" : "deactivated"} successfully`, status: coupon.status
        });

    } catch (error) {

        console.error("Error at CouponStatus", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}



export default { loadCoupon, addCoupon, updateCoupon, deleteCoupon, couponStatus }