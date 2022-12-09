const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderDetails: { type: Schema.Types.Mixed },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    petInfo: { type: Schema.Types.ObjectId, ref: "Dog" },
    plan: { type: Schema.Types.Mixed },
    coupons: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
