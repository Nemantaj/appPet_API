const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autoInc = require("mongoose-auto-increment");

const couponSchema = new Schema({
  code: { type: String, required: true },
  amount: { type: Number, require: true, default: 0 },
  isActive: { type: Boolean, default: false },
});

module.exports = mongoose.model("Coupon", couponSchema);
