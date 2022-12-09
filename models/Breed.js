const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const autoInc = require("mongoose-auto-increment");

const breedSchema = new Schema({
  name: { type: String, required: true },
  size: { type: Schema.Types.ObjectId, ref: "Size" },
  isActive: { type: Boolean, default: true },
});

breedSchema.plugin(autoInc.plugin, {
  model: "Breed",
  field: "serial",
});

module.exports = mongoose.model("Breed", breedSchema);
