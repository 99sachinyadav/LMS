import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4   // ⭐ forces IPv4 (important)
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.log("DB ERROR:", error);
    process.exit(1);
  }
};

export default connectDB;