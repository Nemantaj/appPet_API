const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autoInc = require("mongoose-auto-increment");

const sizeSchema = new Schema(
  {
    size: { type: String, require: true },
    price: {
      trial: { type: Number, require: true },
      subscription: { type: Number, require: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Size", sizeSchema);
