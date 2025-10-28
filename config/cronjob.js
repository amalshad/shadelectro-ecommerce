import cron from "node-cron"
import Coupon from "../models/couponSchema.js"


const couponCron = cron.schedule('0 0 * * *', async (req, res) => {
    try {

        await Coupon.updateMany({ expireOn: { $lt: new Date() }, status: true }, { $set: { status: false } });
        console.log("Coupon Expired");

    } catch (error) {
        console.error("Error at Cron-Job", error)
    }
});

export default couponCron