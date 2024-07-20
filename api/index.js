require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { StatusCodes, TOO_MANY_REQUESTS } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const mongoose = require("mongoose");
const User = require("./models/User");
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;;

app.use(express.json());
app.use(cookieParser());
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
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(error);
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const userDoc = await User.findOne({ email });

        if (!userDoc) {
            throw new Error("User not found");
        }
        if (!bcrypt.compareSync(password, userDoc.password)) {
            throw new Error("Invalid password");
        }

        jwt.sign({ 
            email: userDoc.email,
            id: userDoc._id,
            name: userDoc.name
        }, jwtSecret, {}, (err, token) => {
            if (err) {
                throw err;
            }
            res.cookie('token', token).json(userDoc);
        })

    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json(error);
    }
});

app.get("/profile", async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        res.status(StatusCodes.UNAUTHORIZED).json("Unauthorized");
    }

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            res.status(StatusCodes.UNAUTHORIZED).json(err);
        }

        const { name, email, _id} = await User.findById(userData.id);

        res.json({ name, email, _id});
    });
});

app.post("/logout", (req, res) => {
    res.cookie('token', '').json(true);
})

app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = Date.now() + '.jpg';
    await imageDownloader.image ({
        url: link,
        dest: __dirname + '/uploads/' + newName,
    });

    res.json(__dirname + '/uploads/' + newName);

})

app.listen(3000)