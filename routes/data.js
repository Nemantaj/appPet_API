const express = require("express");
const isUser = require("../middlewares/isUser");
const dataController = require("../controllers/data.controller");
const router = express.Router();

router.get("/get-breeds", dataController.getBreeds);
router.get("/promo/:code", dataController.checkCoupon);

module.exports = router;
