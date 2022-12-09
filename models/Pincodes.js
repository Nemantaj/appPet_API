const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autoInc = require("mongoose-auto-increment");
const unique = require("mongoose-unique-validator");

autoInc.initialize(mongoose.connection);

const pincodeSchema = new Schema({
  code: { type: Number, require: true, unique: true, dropDups: true },
  isActive: { type: Boolean, default: false },
});

pincodeSchema.plugin(autoInc.plugin, "Pincode");
pincodeSchema.plugin(unique);

module.exports = mongoose.model("Pincode", pincodeSchema);
