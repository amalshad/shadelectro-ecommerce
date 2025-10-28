import mongoose from "mongoose";
const { Schema } = mongoose;

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: [{
        addressType: {
            type: String,
            required: true,
            default: "Shipping"

        },
        addressTitle: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        landMark: {
            type: String,
        },
        state: {
            type: String,
            required: true
        },
        pinCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            rewuired: true
        },
        phone: {
            type: String,
            required: true
        },
        altPhone: {
            type: String,
            required: false
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isBilling: {
            type: Boolean,
            default: false,
        }, createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }]
},
    {
        timestamps: true,
    },)

const Address = mongoose.model("address", addressSchema)

export default Address;