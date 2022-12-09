const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "Admin" },
  token: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("Token", tokenSchema);
