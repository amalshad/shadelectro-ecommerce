import mongoose from "mongoose";
const { Schema } = mongoose


const offerSchema = new Schema({
    offerName: {
        type: String,
        required: true,
    },
    offerType: {
        type: String,
        enum: ["category", "product"],
        required: true
    },
    percentage: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    products: [
        {
            type: Schema.Types.ObjectId,
            ref: "Product",
        }
    ],
    categories: [
        {
            type: Schema.Types.ObjectId,
            ref: "Category",
        }
    ],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    status:{
        type:String,
        enum:["active","upcoming","expire"]

    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,

    }

});

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;