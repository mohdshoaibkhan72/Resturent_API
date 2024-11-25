const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose

      .connect(process.env.MONGO_URI || 8000)
      .then(console.log("mongose is connected suucesfulluly "));
  } catch (error) {
    console.log(error);
  }
};
module.exports = connectDB;
