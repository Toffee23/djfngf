import { User } from "../models/User.js";

export const resetProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.defaultProfile) {
      return res
        .status(404)
        .json({ message: "User or default profile not found." });
    }

    const { fullname, age, username, email } = user.defaultProfile;

    // Check if the username or email is taken by someone else
    const usernameExists = await User.findOne({
      username,
      _id: { $ne: userId },
    });
    const emailExists = await User.findOne({ email, _id: { $ne: userId } });

    if (usernameExists || emailExists) {
      return res.status(409).json({
        message:
          "Cannot reset profile. Original username or email is now in use by another user.",
      });
    }

    // Reset current profile to defaults
    user.fullname = fullname;
    user.age = age;
    user.username = username;
    user.email = email.toLowerCase();

    await user.save();

    res.status(200).json({
      message: "Profile has been reset to original signup details.",
      user: {
        fullname: user.fullname,
        username: user.username,
        age: user.age,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Reset profile error:", err);
    res.status(500).json({ message: "Failed to reset profile." });
  }
};

// controllers/userController.js

export const resetPasswordToDefault = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || !user.defaultPasswordHash) {
      return res
        .status(404)
        .json({ message: "User or default password not found." });
    }

    user.password = user.defaultPasswordHash;

    await user.save();

    res.status(200).json({
      message: "Password has been reset to your original signup password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password." });
  }
};
