import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "primepitsecret";

// PUT /api/updateprofile/updateProfile
export const updateUserDetails = async (req, res) => {
  try {
    const { fullname, email, age, username } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User account profile not found." });

    if (!fullname || !fullname.trim()) {
      return res.status(400).json({ message: "Full name is required." });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required." });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!age || isNaN(age) || parseInt(age, 10) <= 16) {
      return res.status(400).json({ message: "Age must be a valid number from 16 and above." });
    }

    const sanitizedUsername = username.trim();
    if (!/^[a-zA-Z0-9]+$/.test(sanitizedUsername)) {
      return res.status(400).json({ message: "Username must be alphanumeric." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Check for unique configuration conflicts across separate records
    if (sanitizedUsername !== user.username) {
      const existingUsername = await User.findOne({ username: sanitizedUsername });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use by another account." });
      }
      user.username = sanitizedUsername;
    }

    if (normalizedEmail !== user.email) {
      const existingEmail = await User.findOne({ email: normalizedEmail });
      if (existingEmail) {
        return res.status(400).json({ message: "Email address already in use by another account." });
      }
      user.email = normalizedEmail;
    }

    user.fullname = fullname.trim();
    user.age = parseInt(age, 10);

    await user.save();

    // Regenerate fresh signature credentials to align client states cleanly
    const freshToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, isProducer: user.isProducer },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({ 
      message: "User details updated successfully.", 
      token: freshToken,
      user: {
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        age: user.age
      }
    });
  } catch (err) {
    console.error("Update User Details Core Error:", err);
    return res.status(500).json({ message: "Failed to update user parameters." });
  }
};

// PUT /api/updateprofile/updatePassword
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: "Current password, new password, and confirmation are required." 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match confirmation bounds." });
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[!@#$%^&*]/.test(newPassword)
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
      });
    }

    // Hydrate whole account document block to fetch underlying target password hash string
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User account profile not found." });

    // Enforce high-level security: Verify ownership criteria before mutating passwords
    const currentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!currentPasswordValid) {
      return res.status(401).json({ message: "The current password provided is incorrect." });
    }

    // Block matching redundant loops
    const passwordIsRedundant = await bcrypt.compare(newPassword, user.password);
    if (passwordIsRedundant) {
      return res.status(400).json({ message: "New password cannot match your current active password." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("Password change system core error:", err);
    return res.status(500).json({ message: "Failed to securely change password." });
  }
};