import { config } from "dotenv";
config();
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET;
export const signUp = async (req, res) => {
  try {
    // console.log("SIGNUP ROUTE HIT!", req.body);
    const { fullname, email, age, username, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    if (!fullname)
      return res.status(400).json({ message: "Fullname is required." });
    if (!username)
      return res.status(400).json({ message: "Username is required." });
    if (!/^[a-zA-Z0-9]+$/.test(username))
      return res
        .status(400)
        .json({ message: "Username must be alphanumeric." });
    if (!email) return res.status(400).json({ message: "Email is required." });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: "Email format is invalid." });
    if (!age || isNaN(age) || age <= 16) {
      return res
        .status(400)
        .json({ message: "Age must be a valid number from 16 and above." });
    }
    if (!password)
      return res.status(400).json({ message: "Password is required." });
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email: normalizedEmail,
      age,
      username,
      password: hashedPassword,

      // Set default profile details
      defaultProfile: {
        fullname,
        email: normalizedEmail,
        username,
        age,
      },
      defaultPasswordHash: hashedPassword,

      isSubscribed: false,
      subscriptionType: "basic",
      hasGameAccess: false,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.status(201).json({
      message: "User registered successfully!",
      token,
      fullname: newUser.fullname,
      email: newUser.email,
      username: newUser.username,
      isSubscribed: newUser.isSubscribed,
      // hasGameAccess: newUser.hasGameAccess,
      subscriptionType: newUser.subscriptionType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed." });
  }
};
export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }
    const user = await User.findOne({ username });

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
      // hasGameAccess: user.hasGameAccess,
      subscriptionType: user.subscriptionType || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signin failed." });
  }
};

export const logout = async (req, res) => {
  // This assumes JWT is stored client-side (localStorage or cookie)
  // You may optionally blacklist the token if needed

  return res.status(200).json({
    message: "Logout successful",
  });
};

// ==============================start=============================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error(`Enter a valid and registered email`);
    //send forgot password mail to user
    //we then return success message

    return res.status(200).json({
      message: `reset password link or data sent!`,
    });
  } catch (err) {
    res.status().json({ message: `Error forgot password! ${err?.message}` });
  }
};
