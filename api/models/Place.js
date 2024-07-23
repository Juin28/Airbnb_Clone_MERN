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
    checkIn: {
        type: String,
        required: [true, "Check-in time is required"]
    },
    checkOut: {
        type: String,
        required: [true, "Check-out time is required"]
    },
    maxGuests: Number,
    price: {
        type: Number,
        required: [true, "Price is required"]
    },
});

const PlaceModel = mongoose.model("Place", PlaceSchema);

module.exports = PlaceModel;