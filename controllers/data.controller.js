const mongoose = require("mongoose");
const Pincode = require("../models/Pincodes");
const Breed = require("../models/Breed");
const Size = require("../models/Size");
const Coupon = require("../models/Coupon");

exports.getBreeds = (req, res, next) => {
  Breed.find({})
    .then((result) => {
      res.json({ payload: result, success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.checkCoupon = (req, res, next) => {
  const code = req.params.code;

  if (!code) {
    const error = new Error(
      "The required parameters are missing in the request object!"
    );
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  Coupon.findOne({ code: code, isActive: true })
    .then((result) => {
      if (!result) {
        const error = new Error("This coupon code is invalid!");
        error.title = "Error Occured";
        error.statusCode = 422;
        throw error;
      }

      res.json({ payload: result, success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
