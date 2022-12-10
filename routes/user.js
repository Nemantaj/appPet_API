const express = require("express");
const isUser = require("../middlewares/isUser");
const usersController = require("../controllers/user.controller");

const router = express.Router();

router.post("/create-plan", usersController.createPlan);
router.post("/create-order", usersController.createOrder);
router.post("/login", usersController.login);
router.get("/get-codes/:email", usersController.sendRecoveryCodes);
router.post("/validate-codes", usersController.validateCode);
router.post("/change-password", usersController.changePassword);
router.get("/get-status/:order_id", usersController.confirmOrder);
router.get("/get-orders/:userId", isUser, usersController.getOrder);
router.post("/renew-plan/:planId", isUser, usersController.renewPlan);
router.get("/confirm-renew/:order_id", usersController.confirmRenewal);
router.get("/user/:userId", isUser, usersController.getUserData);
router.get("/plan-details/:planId", isUser, usersController.getPlanDetails);

module.exports = router;
