const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;
const isAuthentificated = require("../middleware/isAuthentificated");
const fileUpload = require("express-fileupload");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/publish", fileUpload(), isAuthentificated, async (req, res) => {
  try {
    const token = req.headers.authorization.replace("Bearer ", "");
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, description, price, condition, city, brand, size, color } =
      req.body;

    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],

      owner: req.user._id,
      product_image: {},
    });

    const result = await cloudinary.uploader.upload(
      convertToBase64(req.files.picture)
    );
    newOffer.product_image = result;
    console.log(result);

    await newOffer.save();

    const responseObj = {
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      product_image: result,
      owner: {
        account: req.user.account,
        _id: req.user._id,
      },
    };

    res.json(responseObj);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page = 1 } = req.query;
    const filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin && !isNaN(Number(priceMin))) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    if (priceMax && !isNaN(Number(priceMax))) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = { $lte: Number(priceMax) };
      }
    }

    const sortFilter = {};
    if (sort === "price-desc") {
      sortFilter.product_price = -1;
    } else if (sort === "price-asc") {
      sortFilter.product_price = 1;
    }
    const limit = 10;
    const skip = (page - 1) * limit;

    const result = await Offer.find(filters)
      .sort(sortFilter)
      .limit(limit)
      .skip(skip);

    res.json(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
