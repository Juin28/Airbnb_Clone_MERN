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
const Booking = require("./models/Booking");
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
    // origin: "https://airbnb-clone-mern-api.vercel.app"
    // origin: "http://localhost:3000"
    origin: ["http://localhost:3000", "http://localhost:5173", "https://airbnb-clone-mern-api.vercel.app"]
}));

// const uploadsDir = path.join(__dirname, 'uploads');

// // Create the uploads directory if it doesn't exist
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
// }

// mongoose.connect(process.env.MONGO_URL);

function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
        jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
            if (err) {
                reject(err);
            }
            resolve(userData);
        });
    });
};

app.get("/", (req, res) => {
    res.json("Airbnb Clone API");
});

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

        const { name, email, _id } = await User.findById(userData.id);

        res.json({ name, email, _id });
    });
});

app.post("/logout", (req, res) => {
    res.cookie('token', '').json(true);
});

// Set up Multer storage configuration
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, `photo-${Date.now()}.jpg`);
//     },
// });

// Initialize Multer with the storage configuration
// const upload = multer({ storage: storage });

// Route handler that uses Multer
// app.post('/upload-by-link', upload.single('photos'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'Uploaded file should not be empty' });
//     }

//     // Access the uploaded file through req.file
//     const { filename } = req.file;

//     res.json({ filename });
// });

const uploadsDir = __dirname + '/uploads/';
// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
}

app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';
    const uploadsPath = uploadsDir + newName;

    await imageDownloader.image({
        url: link,
        // dest: __dirname + '/uploads/' + newName,
        dest: uploadsPath,
    });

    res.json(newName);
});

const photosMiddleware = multer({ dest: 'uploads' });
// const photosMiddleware = multer({ storage: storage });
app.post('/upload', photosMiddleware.array('photos', 100), async (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
        const { path: filePath, originalname } = req.files[i];
        const ext = originalname.split('.').pop();
        const newPath = filePath + '.' + ext;
        fs.renameSync(filePath, newPath);
        uploadedFiles.push(path.basename(newPath));
    }
    res.json(uploadedFiles);
});

app.post('/places', async (req, res) => {
    const { token } = req.cookies;
    const {
        title, address, addedPhotos,
        description, perks, extraInfo,
        checkIn, checkOut, maxGuests, price
    } = req.body;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            res.status(StatusCodes.UNAUTHORIZED).json(err);
        }

        const placeDoc = await Place.create({
            owner: userData.id,
            title, address, photos: addedPhotos,
            description, perks, extraInfo,
            checkIn, checkOut, maxGuests, price
        })

        res.json(placeDoc);
    });
});

app.get('/user-places', async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            res.status(StatusCodes.UNAUTHORIZED).json(err);
        }

        const { id } = userData;
        res.json(await Place.find({ owner: id }));
    });

});

app.get('/places/:id', async (req, res) => {
    const { id } = req.params;
    res.json(await Place.findById(id));
});

app.put('/places', async (req, res) => {
    const { token } = req.cookies;
    const {
        id, title, address, addedPhotos,
        description, perks, extraInfo,
        checkIn, checkOut, maxGuests, price
    } = req.body;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            res.status(StatusCodes.UNAUTHORIZED).json(err);
        }

        const placeDoc = await Place.findById(id);
        if (userData.id === placeDoc.owner.toString()) {
            placeDoc.set({
                title, address, photos: addedPhotos,
                description, perks, extraInfo,
                checkIn, checkOut, maxGuests, price
            });
            await placeDoc.save();
            res.json(placeDoc);
        }

    });

});

app.get('/places', async (req, res) => {
    res.json(await Place.find());
});

app.post('/bookings', async (req, res) => {
    const userData = await getUserDataFromReq(req);
    const { place, checkIn, checkOut, numberOfGuests, name, phone, price } = req.body;
    Booking.create({ place, user: userData.id, checkIn, checkOut, numberOfGuests, name, phone, price })
        .then((doc) => { res.json(doc); })
        .catch((err) => { throw err; });
});

app.get('/bookings', async (req, res) => {
    const userData = await getUserDataFromReq(req);
    res.json(await Booking.find({ user: userData.id }).populate('place'));
});

const port = process.env.PORT || 3000;

const start = async () => {
    try {
        mongoose.connect(process.env.MONGO_URL);
        app.listen(port, () => console.log(`Server is listening on port ${port}...`));
    } catch (error) {
        console.log(error);
    }
};

start();