const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dogSchema = new Schema({
  name: { type: String },
  weight: { type: Number },
  breed: { type: Schema.Types.ObjectId, ref: "Breed" },
  medicalCondition: { type: String },
  vet: { type: String },
  age: { type: Number },
  ageMetric: { type: String },
  userEmail: { type: String },
  gender: { type: String },
  plan: {
    isActive: { type: Boolean, default: false },
    expiresAt: { type: Date },
    renewedAt: { type: Date },
    planType: { type: String },
    used: [{ type: String }],
  },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Dog", dogSchema);
