const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullName: { type: String },
  email: { type: String },
  pincode: { type: Number },
  address: [{ address: { type: String } }],
  password: { type: String },
  token: { type: String },
  mobile: { type: Number },
});

module.exports = mongoose.model("User", userSchema);
