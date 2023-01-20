const express = require("express");
const fileUpload = require("express-fileupload");

const User = require("../models/User");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      // const user = await User.findById(req.user.id);
      const offerPicture = req.files.picture;

      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const newOffer = await new Offer({
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
        owner: req.user,
      });
      const resultOfferPicture = await cloudinary.uploader.upload(
        convertToBase64(offerPicture),
        {
          folder: `/vinted/offers/${newOffer.id}`,
        }
      );
      newOffer.product_image = resultOfferPicture;
      await newOffer.save();
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(priceMax);
      } else {
        filters.product_price = { $lte: Number(priceMax) };
      }
    }

    const sortFilter = {};

    if (sort) {
      sortFilter.product_price = sort.replace("price-", "");
    }

    const limit = 5;

    let pageRequired = 1;
    if (page) pageRequired = Number(page);
    const skip = (pageRequired - 1) * limit;

    const offers = await Offer.find(filters)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      .populate("owner", "account");
    const count = await Offer.countDocuments(filters);

    const response = {
      count: count,
      offers: offers,
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put(
  "/offer/update/:id/:key/:value",
  isAuthenticated,
  async (req, res) => {
    try {
      const offer = await Offer.findByIdAndUpdate(
        { _id: req.params.id },
        { [req.params.key]: req.params.value },
        { new: true }
      );
      if (offer)
        res.json({
          message: `The ${req.params.key.replace(
            "product_",
            ""
          )} has been change to ${req.params.value}`,
        });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.query.id);
    await cloudinary.uploader.destroy(offer.product_image.public_id);
    await cloudinary.api.delete_folder(`/vinted/offers/${offer.id}`);
    res.json({ message: `Your offer ${offer.product_name} has been deleted` });
    offer.delete();
  } catch (error) {
    console.log({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById({ _id: req.params.id }).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.get("/", (req, res) => {
  res.json({ message: "Welcome to my project" });
});

module.exports = router;
