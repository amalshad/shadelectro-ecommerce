import cron from "node-cron";
import Offer from "../models/offerSchema.js";


const updateOfferStatuses = async () => {
  try {
    const now = new Date();


    await Offer.updateMany(
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { $set: { status: "active", isActive: true } }
    );


    await Offer.updateMany(
      { endDate: { $lt: now } },
      { $set: { status: "expire", isActive: false } }
    );


    await Offer.updateMany(
      { startDate: { $gt: now } },
      { $set: { status: "upcoming", isActive: false } }
    );

    console.log(" Offer statuses updated at", now.toISOString());
  } catch (error) {
    console.error(" Error updating offers:", error);
  }
};


cron.schedule('0 0 * * *', updateOfferStatuses);

export default updateOfferStatuses;
