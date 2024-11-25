const User = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Login function
const login = async (req, res) => {
  try {
    const { email, password, googleId } = req.body;
    if (!email && !googleId) {
      return res.status(400).json({
        success: false,
        message: "Please provide email or Google ID",
      });
    }

    let user;

    // If Google ID is provided, check for Google login
    if (googleId) {
      user = await User.findOne({ googleId });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }
    } else {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Please provide a password",
        });
      }

      // Find user by email
      user = await User.findOne({ email });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Password does not match" });
      }
    }

    const accessToken = jwt.sign(
      {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      success: true,
      accessToken,
      user: {
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      details: error.message,
    });
  }
};

// Register function
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, googleId } = req.body;

    if (googleId && (!email || !googleId)) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and Google ID",
      });
    }

    if (!googleId && (!fullName || !email || !password)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (fullName, email, password)",
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    let user;
    if (googleId) {
      user = new User({
        email,
        googleId,
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        fullName,
        email,
        password: hashedPassword,
      });
    }

    await user.save();

    // Create JWT token
    const accessToken = jwt.sign(
      { userId: user._id, fullName: user.fullName, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    res.status(201).json({
      success: true,
      message: "Registration successful",
      accessToken,
      user: { fullName: user.fullName, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

module.exports = { registerUser, login };
