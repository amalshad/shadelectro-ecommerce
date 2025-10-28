import mongoose from "mongoose";
const {Schema}=mongoose;

const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null
    },
    dateOfBirth:{
        type:Date,
        required:false,
        
    },
    gender:{
        type:String,
        // enum:["Male","Female","Other","Prefer not to say"],
        default:""
    },
    password:{
        type:String,
        required:false
    },
    profileImg:{
        type:String,
        require:false
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
      referralCode: {
        type: String,
        unique: true,
        index: true,
    },
    referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    redeemedUser: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    
    
    // searchHistory:[{
    //     category:{
    //         type:Schema.Types.ObjectId,
    //         ref:"Category"
    //     },
    //     brand:{
    //         type:String,
    //     },
    //     searchOn:{
    //         type:Date,
    //         default:Date.now
    //     }
    // }]
})

const User = mongoose.model("User",userSchema);


export default User;
