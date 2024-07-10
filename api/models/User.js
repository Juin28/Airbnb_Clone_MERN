const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema ({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    }
});

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
