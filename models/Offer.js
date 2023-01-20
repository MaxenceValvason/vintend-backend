const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, maxLenght: 50 },
  product_description: { type: String, maxLenght: 500 },
  product_price: { type: Number, max: 100000 },
  product_details: Array,
  product_pictures: [Object],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
