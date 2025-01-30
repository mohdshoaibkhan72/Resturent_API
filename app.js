require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const connectDB = require("./config/DbConnection");
const { registerUser, login } = require("./controllers/auth.user");
const User = require("./Models/UserModel");

const app = express();
app.use(express.json());

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.ACCESS_TOKEN_SECRET) {
  console.error("❌ Missing environment variables. Check your .env file.");
  process.exit(1);
}

// Allowed origins for CORS
const allowedOrigins = [
  "https://resutrents-clients.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Initialize Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Connect to MongoDB
connectDB();

// Google OAuth Login Route
app.post("/google-login", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Token required" });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, sub: googleId } = ticket.getPayload();

    // Check if the user exists, otherwise create a new user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ name, email, googleId });
    }

    // Generate authentication token
    const authToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, accessToken: authToken });
  } catch (error) {
    console.error("Google Login Error:", error.message);
    next(error); // Pass error to global handler
  }
});

// User Authentication Routes
app.post("/register", registerUser);
app.post("/login", login);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res
    .status(500)
    .json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
});

// Root Route
app.get("/", (req, res) => {
  res.send("🚀 Auth API is running");
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
