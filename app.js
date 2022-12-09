const path = require("path");

const express = require("express");
const parser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
const dataRoutes = require("./routes/data");

const PORT = process.env.PORT || 3001;
const corsOptions = {
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};

const MONGODB_URI =
  "mongodb+srv://root:8349727696@cluster0.suc8sow.mongodb.net/main?retryWrites=true&w=majority";

const app = express();
app.use(cors(corsOptions));
app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "build")));
// app.use("/images", express.static(path.join(__dirname, "images")));

app.use(userRoutes);
app.use(dataRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode;
  res.status(status).json({
    title: error.title,
    msg: error.message,
  });
});

 app.get("/", (req, res) => {
     res.json({success: true})
   });

mongoose
  .connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then((res) => {
    console.log("Connected!");
    const server = app.listen(PORT, () => {
      console.log(`listening on PORT ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
