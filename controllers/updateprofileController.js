import { User } from "../models/User.js";
import bcrypt from "bcryptjs";

export const updateUserDetails = async (req, res) => {
  try {
    const { fullname, email, age, username } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Normalize and validate
    const normalizedEmail = email?.trim().toLowerCase();

    if (!fullname) {
      return res.status(400).json({ message: "Full name is required." });
    }
    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!age || isNaN(age) || age <= 16) {
      return res
        .status(400)
        .json({ message: "Age must be a valid number from 16 and above." });
    }
    if (username && !/^[a-zA-Z0-9]+$/.test(username)) {
      return res
        .status(400)
        .json({ message: "Username must be alphanumeric." });
    }

    if (normalizedEmail && !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Check for conflicts
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing)
        return res.status(400).json({ message: "Username already in use." });
      user.username = username;
    }

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing)
        return res.status(400).json({ message: "Email already in use." });
      user.email = normalizedEmail;
    }

    if (fullname) user.fullname = fullname;
    if (age) user.age = age;

    await user.save();
    res.status(200).json({ message: "User updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirmation are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[!@#$%^&*]/.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
    });

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Failed to change password." });
  }
};
