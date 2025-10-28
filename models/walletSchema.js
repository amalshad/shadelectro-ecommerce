import mongoose from "mongoose";
const { Schema } = mongoose;

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transaction: [
        {
            direction: {
                type: String,
                enum: ["Credit", "Debit"],
                required: true
            },
            paymentMethod: {
                type: String,
            },
            amount: {
                type: Number,
                required: true
            },
            description: {
                type: String
            },
            orderId: {
                type: Schema.Types.ObjectId,
                ref: "Order"
            },

            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
