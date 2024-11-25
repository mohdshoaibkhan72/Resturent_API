const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
    required: function () {
      return this.googleId ? false : true;
    },
    maxlength: 50,
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: {
    type: String,
    min: 8,
    required: function () {
      return this.googleId ? false : true;
    },
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
  },
});

const Users = mongoose.model("User", UserSchema);
module.exports = Users;
