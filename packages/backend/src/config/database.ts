import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URI as string, {
      dbName: process.env.DB_NAME,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit();
  }
};

if (process.env.NODE_ENV === "dev") {
  mongoose.set("debug", (coll, method, query, doc) => {
    console.log(`[Mongoose] ${coll}.${method}`, JSON.stringify(query), JSON.stringify(doc));
  });
}

export default connectDB;
