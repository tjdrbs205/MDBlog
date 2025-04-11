const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URI, {
      dbName: "dev_blog",
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.log("MongoDB connection failed:", err);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "dev") {
    mongoose.set("debug", (coll, method, query, doc) => {
      console.log(
        `[Mongoose] ${coll}.${method}`,
        JSON.stringify(query),
        JSON.stringify(doc)
      );
    });
  }
};

module.exports = connectDB;
