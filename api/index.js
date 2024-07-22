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
const Place = require("./models/Place");
const app = express();
const multer = require("multer");
const fs = require("fs");
const path = require('path');

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;;

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));    // so that the images can be displayed by using API
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
});

app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';
    await imageDownloader.image ({
        url: link,
        dest: __dirname + '/uploads/' + newName,
    });

    res.json(newName);
});

const photosMiddleware = multer({ dest: 'uploads'});
app.post('/upload', photosMiddleware.array('photos', 100), async (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
        const { path: filePath, originalname } = req.files[i];
        const ext = originalname.split('.').pop();
        const newPath = filePath + '.' + ext;
        fs.renameSync(filePath, newPath);
        // uploadedFiles.push(newPath);
        uploadedFiles.push(path.basename(newPath));
    }
    res.json(uploadedFiles);
});

app.post('/places', async (req, res) => {
    const { token } = req.cookies;
    const { 
        title, address, addedPhotos, 
        description, perks, extraInfo, 
        checkIn, checkOut, maxGuests 
    } = req.body;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            res.status(StatusCodes.UNAUTHORIZED).json(err);
        }
        
        const placeDoc = await Place.create({
            owner: userData.id,
            title, address, photos: addedPhotos, 
            description, perks, extraInfo, 
            checkIn, checkOut, maxGuests 
        })

        res.json(placeDoc);
    });
});

app.get('/places', async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            res.status(StatusCodes.UNAUTHORIZED).json(err);
        }
        
        const { id } = userData;
        res.json( await Place.find({ owner: id }));
    });

});

app.listen(3000)