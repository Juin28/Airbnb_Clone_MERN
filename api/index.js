require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { StatusCode } = require("http-status-code");
const mongoose = require("mongoose");
const User = require("./models/User");
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);

app.use(express.json());
app.use(cors({
    credentials: true,
    origin: "http://localhost:5173"
}));

mongoose.connect(process.env.MONGO_URL);

app.get("/test", (req, res) => {
  res.json("Test OK");
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userDoc = await User.create({ 
            name, 
            email, 
            password: bcrypt.hashSync(password, bcryptSalt)
        });
        res.json(userDoc);
    } catch (error) {
        res.status(StatusCode.UNPROCESSABLE_ENTITY).json(error);
    }
});

app.listen(3000)