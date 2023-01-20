const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

const User = require("../models/User");

cloudinary.config({
  cloud_name: "dfpivxo6y",
  api_key: "359114345329771",
  api_secret: "Bkmv23cXPcM4fBKSIJx0zvq_dOU",
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const password = req.body.password;
    const userPicture = req.files.picture;

    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);
    if (await User.findOne({ email: req.body.email })) {
      return res.json({ message: "An account already use this email" });
    }
    const newUser = new User({
      email: req.body.email,
      account: { username: req.body.username },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    const resultUserPicture = await cloudinary.uploader.upload(
      convertToBase64(userPicture),
      {
        folder: `/vinted/users/${newUser.id}`,
      }
    );
    newUser.account.avatar = resultUserPicture;
    await newUser.save();
    res.json({
      _id: newUser._id,
      token: newUser.token,
      account: { username: newUser.account.username },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// router.post("/user/signup", async (req, res) => {
//   try {
//     // console.log(req.body);
//     // Destructuring

//     const { username, email, password, newsletter } = req.body;

//     if (!username || !email || !password || typeof newsletter !== "boolean") {
//       return res.status(400).json({ message: "Missing parameter" });
//     }

//     // Si l'email est déjà utilisé par quelqu'un d'autre, on renvoie une erreur
//     const emailAlreadyUsed = await User.findOne({ email });
//     // console.log(emailAlreadyUsed);

//     if (emailAlreadyUsed) {
//       return res.status(409).json({ message: "This email is already used" });
//     }

//     const token = uid2(64);
//     const salt = uid2(16);
//     const hash = SHA256(salt + password).toString(encBase64);

//     const newUser = new User({
//       email,
//       account: {
//         username,
//       },
//       newsletter,
//       token,
//       hash,
//       salt,
//     });
//     await newUser.save();
//     const response = {
//       _id: newUser._id,
//       account: newUser.account,
//       token: newUser.token,
//     };
//     res.json(response);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });
router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!(await User.findOne({ email: req.body.email })))
      return res.status(400).json({ message: "Email or password unvalid" });

    if (
      user.hash === SHA256(req.body.password + user.salt).toString(encBase64)
    ) {
      res.json({
        _id: user._id,
        token: user.token,
        account: { username: user.account.username },
      });
    } else {
      res.status(400).json({ message: "Email or password unvalid" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
