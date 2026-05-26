import { User } from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { Producer } from "../models/producer.js";
// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "image is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    user.profilePicture = imageUrl;
    // user.profilePicture = req.file.path;
    await user.save();
    res.status(200).json({
      message: "Profile picture has been uploaded",
      imageUrl,
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// Get profile picture
export const getProfilePicture = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ profilePicture: user.profilePicture || null });
};

// Create extra profile (limit 3)
export const createExtraProfile = async (req, res) => {
  const profileCount = await Profile.countDocuments({ user: req.user.id });
  if (profileCount >= 3) {
    return res
      .status(400)
      .json({ message: "Maximum of 3 extra profiles allowed" });
  }

  const newProfile = new Profile({ ...req.body, user: req.user.id });
  await newProfile.save();
  res
    .status(201)
    .json({ message: "Extra profile created", profile: newProfile });
};

// Get all extra profiles
export const getExtraProfiles = async (req, res) => {
  const profiles = await Profile.find({ user: req.user.id });
  res.status(200).json({ profiles });
};

//Get specific extra profile
export const getExtraProfileById = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({ message: "Extra profile not found" });
    }

    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const extraProfiles = await Profile.find({ user: req.user.id });
    let producerProfile = null;
    if (user.isProducer) {
      producerProfile = await Producer.findOne({ user: req.user.id });
    }
    res.status(200).json({
      message: "Welcome to your profile",
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture || null,
      isSubscribed: user.isSubscribed,
      isProducer: user.isProducer,
      extraProfiles,
      producer: producerProfile
        ? {
            productionName: producerProfile.productionName,
            countryOfResidence: producerProfile.countryOfResidence,
            countryOfProduction: producerProfile.prodCountry,
            bio: producerProfile.bio,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({
      message: "Error retrieving user profile.",
      error: error.message,
    });
  }
};
