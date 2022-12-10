const mongoose = require("mongoose");
const User = require("../models/User");
const Token = require("../models/UserToken");
const Dog = require("../models/Dogs");
const Pincode = require("../models/Pincodes");
const Breed = require("../models/Breed");
const Size = require("../models/Size");
const Order = require("../models/Orders");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodeMailer = require("nodemailer");
const crypto = require("crypto");

const apiKey = "278827ad240a6189b8e496bcdd728872";
const Secret = "87511d1ab284f52cfe0b544556e46cbff21cde4c";

exports.createPlan = async (req, res, next) => {
  const dog = req.body.dog[0];
  const user = req.body.user;
  let userDoc;

  try {
    userDoc = await User.findOne({ email: user.email });
    if (!userDoc) {
      const hash = crypto.randomBytes(64).toString("hex");
      const hashPass = await bcryptjs.hash(hash, 12);
      const newUser = new User({
        email: user.email,
        mobile: user.mobile,
        pincode: user.pincode,
        password: hashPass,
        address: [{ address: user.address }],
        fullName: user.name,
      });

      await newUser.save();
      userDoc = newUser;

      let mailTransporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: "nemantajsahu7@gmail.com",
          pass: "lphqnirgfqpclqyt",
        },
      });

      let mailDetails = {
        from: "Kukurku <noreply@kukurku.com>",
        to: user.email,
        subject: "Your account has been created successfully!",
        html: `<h3>Your password is :-</h3><br/><p>${hash}</p>`,
      };

      return mailTransporter.sendMail(mailDetails);
    }

    const isPincode = await Pincode.findOne({
      code: user.pincode,
      isActive: true,
    });

    console.log(isPincode);

    if (!isPincode) {
      return res.json({ success: true, isPincode: false });
    }

    const newDog = new Dog({
      name: dog.name,
      weight: dog.weight,
      breed: dog.breed,
      medicalCondition: dog.condition,
      vet: dog.vet,
      age: dog.age,
      ageMetric: dog.ageMetric,
      userEmail: user.email,
      gender: dog.gender,
      userId: userDoc._id,
      plan: {
        used: [],
        isActive: false,
      },
    });

    await newDog.save();

    const dogPlan = await Breed.findById(dog.breed).populate("size");

    res.json({ plan: dogPlan, isPincode: true, success: true, dog: newDog });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  const email = req.body.email;

  try {
    if (!email) {
      const error = new Error(
        "User identification is missing in the request object!"
      );
      error.title = "Error Occured";
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findOne({ email: email });
    const order_id = (Math.floor(Math.random() * 90000) + 10000).toString();

    const newOrder = {
      order_id: order_id,
      order_amount: req.body.amount,
      order_currency: "INR",
      order_note: req.body.note,
      customer_details: {
        customer_name: user.fullName,
        customer_id: user._id,
        customer_email: user.email,
        customer_phone: user.mobile.toString(),
      },
      order_meta: {
        return_url: process.env.RED + "/order?order_id={order_id}",
        notify_url: process.env.RED + "/order",
      },
      petInfo: req.body.petId,
      plan: {
        type: req.body.plan,
        price: req.body.planPrice,
      },
      coupons: req.body.coupons,
    };

    const newCash = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "content-type": "application/json",
        "x-client-id": apiKey,
        "x-client-secret": Secret,
      },
      body: JSON.stringify(newOrder),
    });

    const newJson = await newCash.json();
    const saveOrder = await new Order({
      orderDetails: newJson,
      userId: user._id,
      petInfo: req.body.petId,
      plan: {
        type: req.body.plan,
        price: req.body.planPrice,
      },
      coupons: req.body.coupons,
    });
    await saveOrder.save();
    res.json({ order: newJson, success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.confirmOrder = async (req, res, next) => {
  const order_id = req.params.order_id;

  try {
    if (!order_id) {
      const error = new Error(
        "Please provide your login credentials to continue!"
      );
      error.title = "Error Occured";
      error.statusCode = 422;
      throw error;
    }

    const status = await fetch(
      "https://sandbox.cashfree.com/pg/orders/" + order_id,
      {
        headers: {
          accept: "application/json",
          "x-api-version": "2022-09-01",
          "content-type": "application/json",
          "x-client-id": apiKey,
          "x-client-secret": Secret,
        },
      }
    );

    const response = await status.json();

    const orders = await Order.findOneAndUpdate(
      {
        "orderDetails.order_id": order_id.toString(),
      },
      { $set: { orderDetails: response } },
      { new: true }
    );

    if (response.order_status === "PAID") {
      const dogPlan = await Dog.findById(orders.petInfo);

      dogPlan.plan.renewedAt = new Date();
      let exp = new Date();
      let planType;
      if (orders.plan.type === "Subscription Plan") {
        exp.setDate(exp.getDate() + 31);
        planType = "Subscription Plan";
      } else {
        exp.setDate(exp.getDate() + 8);
        planType = "Trial Plan";
      }

      const isUsed = dogPlan.plan.used.some((doc) => {
        return doc.toString() === response.order_id;
      });

      if (!isUsed) {
        dogPlan.plan.used = [...dogPlan.plan.used, response.order_id];
      }

      dogPlan.plan.expiresAt = exp;
      dogPlan.plan.isActive = true;
      dogPlan.plan.planType = planType;

      await dogPlan.save();
    }
    res.json(response);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrder = (req, res, next) => {
  const userId = req.params.userId;

  if (!userId) {
    const error = new Error(
      "Please provide your login credentials to continue!"
    );
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  Dog.find({ userId: userId, "plan.isActive": true })
    .populate([
      { path: "userId" },
      { path: "breed", populate: [{ path: "size" }] },
    ])
    .then((result) => {
      res.json({ orders: result, success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.renewPlan = async (req, res, next) => {
  const planId = req.params.planId;

  try {
    if (!planId) {
      const error = new Error(
        "Please provide your login credentials to continue!"
      );
      error.title = "Error Occured";
      error.statusCode = 422;
      throw error;
    }

    const plan = await Dog.findById(planId).populate([
      { path: "userId" },
      { path: "breed", populate: [{ path: "size" }] },
    ]);

    console.log(plan);
    // if (plan.plan.planType !== "Subscription Plan") {
    //   const error = new Error("This plan cannot be renewed!");
    //   error.title = "Error Occured";
    //   error.statusCode = 422;
    //   throw error;
    // }

    const order_id = (Math.floor(Math.random() * 90000) + 10000).toString();
    const newOrder = {
      order_id: order_id,
      order_amount: req.body.amount,
      order_currency: "INR",
      order_note: req.body.note,
      customer_details: {
        customer_name: plan.userId.fullName,
        customer_id: plan.userId._id,
        customer_email: plan.userId.email,
        customer_phone: plan.userId.mobile.toString(),
      },
      order_meta: {
        return_url: process.env.RED + "/renew?order_id={order_id}",
        notify_url: process.env.RED + "/renew",
      },
      petInfo: planId,
      plan: {
        type: "Subscription Plan",
        price: plan.breed.size.price.subscription,
      },
      coupons: req.body.coupons,
    };

    const newCash = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "content-type": "application/json",
        "x-client-id": apiKey,
        "x-client-secret": Secret,
      },
      body: JSON.stringify(newOrder),
    });

    const newJson = await newCash.json();
    const saveOrder = await new Order({
      orderDetails: newJson,
      userId: plan.userId._id,
      petInfo: planId,
      plan: {
        type: "Subscription Plan",
        price: plan.breed.size.price.subscription,
      },
      coupons: req.body.coupons,
    });
    await saveOrder.save();

    res.json({ order: newJson, success: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.confirmRenewal = async (req, res, next) => {
  const order_id = req.params.order_id;

  try {
    if (!order_id) {
      const error = new Error(
        "Please provide your login credentials to continue!"
      );
      error.title = "Error Occured";
      error.statusCode = 422;
      throw error;
    }

    const status = await fetch(
      "https://sandbox.cashfree.com/pg/orders/" + order_id,
      {
        headers: {
          accept: "application/json",
          "x-api-version": "2022-09-01",
          "content-type": "application/json",
          "x-client-id": apiKey,
          "x-client-secret": Secret,
        },
      }
    );

    const response = await status.json();

    const orders = await Order.findOneAndUpdate(
      {
        "orderDetails.order_id": order_id.toString(),
      },
      { $set: { orderDetails: response } },
      { new: true }
    );

    if (response.order_status === "PAID") {
      console.log("here!");
      const dogPlan = await Dog.findById(orders.petInfo);

      let exp = dogPlan.plan.expiresAt;

      exp.setDate(exp.getDate() + 31);

      const isUsed = dogPlan.plan.used.some((doc) => {
        return doc.toString() === response.order_id;
      });

      console.log(isUsed);

      let newOrder = [...dogPlan.plan.used];

      if (!isUsed) {
        newOrder = [...newOrder, response.order_id];
        await Dog.findByIdAndUpdate(dogPlan._id, {
          $set: {
            "plan.renewedAt": new Date(),
            "plan.expiresAt": exp,
            "plan.used": newOrder,
            "plan.planType": "Subscription Plan",
          },
        });
      }
    }
    res.json(response);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const pwd = req.body.pass;

  let user;

  if (!email || !pwd) {
    const error = new Error(
      "Please provide your login credentials to continue!"
    );
    error.title = "Error Occured";
    error.statusCode = 422;
    throw error;
  }

  User.findOne({ email: email })
    .then((result) => {
      if (!result) {
        const error = new Error(
          "There are no users related to this email address!"
        );
        error.title = "Error Occured";
        error.statusCode = 422;
        throw error;
      }

      user = result;
      return bcryptjs.compare(pwd, result.password);
    })
    .then((passMatch) => {
      if (!passMatch) {
        const error = new Error("The password you entered is incorrect!.");
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      const token = jwt.sign(
        {
          email: user.email,
          adminId: user._id.toString(),
        },
        "secret"
      );

      res.status(200).json({
        token: token,
        userId: user._id,
        name: user.fullName,
        success: true,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.sendRecoveryCodes = (req, res, next) => {
  const email = req.params.email;

  if (!email) {
    const error = new Error(
      "No email address is found in the request object!."
    );
    error.title = "Error Occured!";
    error.statusCode = 422;
    throw error;
  }

  let user;
  let recoveryCodes;

  User.findOne({ email: email })
    .then((result) => {
      if (!result) {
        const error = new Error(
          "There are no users with this corresponding email address!"
        );
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      user = result;

      return Token.findOne({ userId: result._id });
    })
    .then((result) => {
      recoveryCodes = Math.floor(100000 + Math.random() * 900000);

      if (result === null) {
        const token = new Token({
          userId: user._id,
          token: recoveryCodes,
        });
        return token.save();
      } else {
        result.token = recoveryCodes;
        result.createdAt = Date.now();
        return result.save();
      }
    })
    .then((result) => {
      if (!result) {
        const error = new Error("An internal occured, please try again!");
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      let mailTransporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: "nemantajsahu7@gmail.com",
          pass: "lphqnirgfqpclqyt",
        },
      });

      let mailDetails = {
        from: "Kukurku <noreply@kukurku.com>",
        to: email,
        subject: "Reset your password",
        html: `<h2>Your recovery code for Password Reset is:</h2><h3>${recoveryCodes}</h3><p>The code will expire in 10 minutes.</p>`,
      };

      return mailTransporter.sendMail(mailDetails);
    })
    .then((result) => {
      if (!result) {
        const error = new Error("An internal occured, please try again!");
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      res.json({ success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.validateCode = (req, res, next) => {
  const email = req.body.emailSaved;
  const code = req.body.code;

  if (!email || !code) {
    const error = new Error(
      "No email address is found in the request object!."
    );
    error.title = "Error Occured!";
    error.statusCode = 422;
    throw error;
  }

  let user;

  User.findOne({ email: email })
    .then((result) => {
      if (!result) {
        const error = new Error(
          "No account is found related to this email address!."
        );
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      user = result;
      return Token.findOne({ userId: result._id, token: code });
    })
    .then((result) => {
      if (!result) {
        const error = new Error(
          "The recovery code you provided has been expired!."
        );
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      const hash = crypto.randomBytes(64).toString("hex");
      user.token = hash;
      return user.save();
    })
    .then((result) => {
      if (!result) {
        const error = new Error("An internal occured, please try again!");
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      res.json({ success: true, token: result.token });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.changePassword = (req, res, next) => {
  const email = req.body.email;
  const token = req.body.token;
  const pass = req.body.pass;

  let user;

  if (!email || !token) {
    const error = new Error(
      "No email address is found in the request object!."
    );
    error.title = "Error Occured!";
    error.statusCode = 422;
    throw error;
  }

  User.findOne({ token: token })
    .then((result) => {
      if (!result) {
        const error = new Error("Your recovery token has expired!");
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      user = result;

      return bcryptjs.hash(pass, 12);
    })
    .then((hashed) => {
      user.password = hashed;
      user.token = "";

      return user.save();
    })
    .then((result) => {
      if (!result) {
        const error = new Error("An internal server error occured!");
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      res.json({ success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserData = (req, res, next) => {
  const userId = req.params.userId;

  if (!userId) {
    const error = new Error("An internal server error occured!");
    error.title = "Error Occured!";
    error.statusCode = 422;
    throw error;
  }

  User.findById(userId)
    .then((result) => {
      if (!result) {
        const error = new Error("An internal server error occured!");
        error.title = "Error Occured!";
        error.statusCode = 422;
        throw error;
      }

      res.json({
        payload: {
          email: result.email,
          mobile: result.mobile,
          address: result.address[0].address,
          pincode: result.pincode,
          name: result.fullName,
        },
        success: true,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPlanDetails = (req, res, next) => {
  const planId = req.params.planId;

  if (!planId) {
    const error = new Error("An internal server error occured!");
    error.title = "Error Occured!";
    error.statusCode = 422;
    throw error;
  }

  Order.find({ petInfo: planId })
    .then((result) => {
      res.json({ payload: result, success: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
