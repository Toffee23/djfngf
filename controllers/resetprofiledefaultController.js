import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "primepitsecret";

// PUT /api/resetprofile/resetProfile
export const resetProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.defaultProfile) {
      return res
        .status(404)
        .json({ message: "User or default profile details mapping not found." });
    }

    const { fullname, age, username, email } = user.defaultProfile;

    // Check if the username or email has been claimed by someone else since original signup
    const usernameExists = await User.findOne({
      username: username.trim(),
      _id: { $ne: userId },
    });
    const emailExists = await User.findOne({ 
      email: email.trim().toLowerCase(), 
      _id: { $ne: userId } 
    });

    if (usernameExists || emailExists) {
      return res.status(409).json({
        message:
          "Cannot reset profile structural criteria. Original username or email credentials have been claimed by another active user profile account.",
      });
    }

    // Reset current profile variables safely back to defaults
    user.fullname = fullname;
    user.age = age;
    user.username = username.trim();
    user.email = email.trim().toLowerCase();

    await user.save();

    // Regenerate a fresh synchronized JWT token payload to prevent client-side authorization drops
    const freshToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, isProducer: user.isProducer },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Profile has been reset to original signup details successfully.",
      token: freshToken, // Pass token up so frontend client can transparently replace it
      user: {
        fullname: user.fullname,
        username: user.username,
        age: user.age,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Reset profile core handling error:", err);
    return res.status(500).json({ message: "Failed to reset profile." });
  }
};

// PUT /api/resetprofile/resetPassword
export const resetPasswordToDefault = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || !user.defaultPasswordHash) {
      return res
        .status(404)
        .json({ message: "User account context or default password registry fallback missing." });
    }

    user.password = user.defaultPasswordHash;
    await user.save();

    return res.status(200).json({
      message: "Password has been reset to your original signup credential parameters successfully.",
    });
  } catch (err) {
    console.error("Reset password default loop exception error:", err);
    return res.status(500).json({ message: "Failed to reset password." });
  }
};