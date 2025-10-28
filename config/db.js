import mongoose from 'mongoose';
import env from 'dotenv'
env.config();



const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDB connected to Atlas");

    } catch (error) {
        console.log("MongoDB connection error:", error.message)
        process.exit(1)
    }
}

export default connectDB;