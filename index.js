const express = require("express");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const offerRoutes = require("./routes/offer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

require("dotenv").config();
const app = express();
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

app.use(express.json());

app.use("/offer", offerRoutes);
app.use("/uploads", express.static("uploads"));

const userRouter = require("./routes/user");
const offersRouter = require("./routes/offer");
app.use(offersRouter);

app.use("/user", userRouter);

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
