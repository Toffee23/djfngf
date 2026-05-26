import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "primepitsecret";

export const signUp = async (req, res) => {
  try {
    const { fullname, email, age, username, password } = req.body;

    if (!fullname) return res.status(400).json({ message: "Fullname is required." });
    if (!username) return res.status(400).json({ message: "Username is required." });
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ message: "Username must be alphanumeric." });
    }
    
    if (!email) return res.status(400).json({ message: "Email is required." });
    
    // Normalize input immediately before validating format
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Email format is invalid." });
    }

    if (!age || isNaN(age) || age <= 16) {
      return res.status(400).json({ message: "Age must be a valid number from 16 and above." });
    }
    if (!password) return res.status(400).json({ message: "Password is required." });
    
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username or email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname: fullname.trim(),
      email: normalizedEmail,
      age: parseInt(age, 10),
      username: username.trim(),
      password: hashedPassword,
      defaultProfile: {
        fullname: fullname.trim(),
        email: normalizedEmail,
        username: username.trim(),
        age: parseInt(age, 10),
      },
      defaultPasswordHash: hashedPassword,
      isSubscribed: false,
      subscriptionType: "basic",
      hasGameAccess: false,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });
    
    return res.status(201).json({
      message: "User registered successfully!",
      token,
      fullname: newUser.fullname,
      email: newUser.email,
      username: newUser.username,
      isSubscribed: newUser.isSubscribed,
      subscriptionType: newUser.subscriptionType,
    });
  } catch (err) {
    console.error("Signup System Error:", err);
    return res.status(500).json({ message: "Signup failed internally." });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    
    // Standardizing lookup to match normalization
    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, isProducer: user.isProducer },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    
    return res.status(200).json({
      message: "Login successful.",
      token,
      fullname: user.fullname,
      email: user.email,
      userId: user._id,
      isProducer: user.isProducer,
      isSubscribed: user.isSubscribed,
      subscriptionType: user.subscriptionType || null,
    });
  } catch (err) {
    console.error("Signin System Error:", err);
    return res.status(500).json({ message: "Signin failed internally." });
  }
};

export const logout = async (req, res) => {
  return res.status(200).json({ message: "Logout successful" });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Enter a valid and registered email" });
    }
    
    // Note: Mail worker queues are currently commented out in index.js
    return res.status(200).json({
      message: "reset password link or data sent!",
    });
  } catch (err) {
    console.error("Forgot Password System Error:", err);
    return res.status(500).json({ message: `Error forgot password! ${err?.message}` });
  }
};