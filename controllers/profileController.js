import { User } from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { Producer } from "../models/producer.js";

// POST /api/profile/upload-picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL identifier string is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User profile record not found." });
    
    user.profilePicture = imageUrl;
    await user.save();
    
    return res.status(200).json({
      message: "Profile picture has been uploaded",
      imageUrl,
    });
  } catch (err) {
    console.error("Upload Profile Picture Error:", err);
    return res.status(500).json({ message: "Upload failed execution bounds", error: err.message });
  }
};

// GET /api/profile/profile-picture
export const getProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User profile record not found." });
    }
    return res.json({ profilePicture: user.profilePicture || null });
  } catch (err) {
    console.error("Get Profile Picture Error:", err);
    return res.status(500).json({ message: "Server error fetching profile image record." });
  }
};

// POST /api/profile/extra-profile
export const createExtraProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User account profile context missing." });

    // Premium Subscription Gating Layer
    if (!user.isSubscribed || user.subscriptionType !== "premium") {
      return res.status(403).json({ 
        message: "Access denied. Creating sub-profiles is exclusively limited to Premium subscription tier tiers." 
      });
    }

    const profileCount = await Profile.countDocuments({ user: user._id });
    if (profileCount >= 3) {
      return res.status(400).json({ message: "Maximum boundary allocation of 3 extra profiles reached." });
    }

    // Explicitly destructure allowed body fields to secure against Object Parameter Escalation
    const { profileName, avatarUrl, preferences } = req.body;
    if (!profileName || !profileName.trim()) {
      return res.status(400).json({ message: "Profile name is required." });
    }

    const newProfile = new Profile({
      profileName: profileName.trim(),
      avatarUrl,
      preferences,
      user: user._id 
    });

    await newProfile.save();
    return res.status(201).json({ message: "Extra profile created successfully", profile: newProfile });
  } catch (err) {
    console.error("Create Extra Profile Error:", err);
    return res.status(500).json({ message: "Failed to create secondary profile interface.", error: err.message });
  }
};

// GET /api/profile/extra-profiles
export const getExtraProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ user: req.user.id });
    return res.status(200).json({ profiles });
  } catch (err) {
    console.error("Get Extra Profiles Error:", err);
    return res.status(500).json({ message: "Server structural processing error." });
  }
};

// GET /api/profile/extra-profile/:id
export const getExtraProfileById = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({ message: "Extra profile workspace match not found." });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Get Extra Profile Match Error:", error);
    return res.status(500).json({ message: "Server error tracking sub-profile reference.", error: error.message });
  }
};

// GET /api/profile/user-profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -defaultPasswordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    const extraProfiles = await Profile.find({ user: user._id });
    let producerProfile = null;
    
    if (user.isProducer) {
      producerProfile = await Producer.findOne({ user: user._id });
    }
    
    return res.status(200).json({
      message: "Welcome to your profile workspace context",
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture || null,
      isSubscribed: user.isSubscribed || false,
      subscriptionType: user.subscriptionType || "basic",
      isProducer: user.isProducer || false,
      extraProfiles: extraProfiles || [],
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
    console.error("Error in getUserProfile core aggregate execution:", error);
    return res.status(500).json({
      message: "Error retrieving integrated user metrics landscape.",
      error: error.message,
    });
  }
};