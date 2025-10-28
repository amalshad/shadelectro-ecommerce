import mongoose from "mongoose"; 
const { Schema } = mongoose;
import { v4 as uuidv4 } from "uuid";

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        variantIndex: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        cancelletionTitle: {
            type: String,
            enum: ["Changed mind", "Found better choice", "Others"]
        },
        cancelletionReason: {
            type: String,
            required: false
        },
        returnTitle: {
            type: String,
            enum: ['Item damaged', 'Not expected', 'Size issue', 'Quality issue', 'Others']
        },
        returnReason: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            required: true,
            enum: ["Processing", "Pending", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned", "Return Rejected", "Return Accepted"]
        },
        date: {
            type: Date,
            default: Date.now
        },
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        addressTitle: {
            type: String,
            required: false
        },
        address: {
            type: String,
            required: true
        },
        landMark: {
            type: String,
        },
        city: {
            type: String,
            required: true
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
            required: true
        },
        phone: {
            type: String,
            required: true
        },

    },
    shippingPrice: {
        type: String,
        default: "free"
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Failed', 'Paid'],
        default: 'Pending'
    },
    invoiceDate: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ["Processing", "Pending", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned", "Return Rejected", "Return Accepted"]
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default: false
    },
    orderNotes: {
        type: String,
        required: false
    },
    returnTitle: {
        type: String,
        enum: ['Item damaged', 'Not expected', 'Size issue', 'Quality issue', 'Others']
    },
    returnReason: {
        type: String,
        required: false,
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
})

const Order = mongoose.model("Order", orderSchema);

export default Order;