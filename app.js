require("dotenv").config();
const express = require("express");
const connectDB = require("./config/DbConnection");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { registerUser, login } = require("./controllers/auth.user");
const User = require("./Models/UserModel");

const app = express();
app.use(express.json());

// Define the allowed origins directly in the code
const allowedOrigins = [
  "https://resutrents-clients.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Google OAuth Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Connect to the database
connectDB();

// Google OAuth Login Route
app.post("/google-login", async (req, res) => {
  const { token } = req.body;

  try {
    // Verifying the Google token with OAuth2Client
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Check if the user already exists
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ name, email, googleId });
      await user.save();
    }

    // Generate a JWT token for the user
    const authToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Return the generated token to the client
    res.json({ success: true, accessToken: authToken });
  } catch (error) {
    console.error("Google Login Error:", error.message);
    res.status(401).json({ success: false, message: "Invalid Google token!" });
  }
});

// User Registration & Login Routes
app.post("/register", registerUser);
app.post("/login", login);

app.use((err, req, res, next) => {
  console.error("Error Stack:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the Auth APIs");
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
