import mongoose from "mongoose";
const {Schema}=mongoose;

const cartSchema= new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true,
        },
        variantIndex:{
            type:Number,
            required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        // price:{
        //     type:Number,
        //     required:true
        // },
        // totalPrice:{
        //     type:Number,
        //     required:true
        // },
    }]
})

const Cart=mongoose.model("Cart",cartSchema);

export default Cart;