const mongoose = require("mongoose");

const PlaceSchema = new mongoose.Schema({
    owner:{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    title: {
        type: String,
        required: [true, "Title is required"]
    },
    address: {
        type: String,
        required: [true, "Address is required"]
    },
    photos: {
        type: [String],
        required: [true, "Photos are required"]
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    perks: [String],
    extraInfo: String,
    checkIn: Number,
    checkOut: Number,
    maxGuests: Number,
});

const PlaceModel = mongoose.model("Place", PlaceSchema);

module.exports = PlaceModel;