import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Cloudinary storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Extracts format cleanly from the original mimetype (e.g., image/jpeg -> jpeg)
    const fileFormat = file.mimetype.split("/")[1];
    const allowedFormats = ["jpg", "jpeg", "png"];
    
    return {
      folder: "PrimePitProfiles",
      format: allowedFormats.includes(fileFormat) ? fileFormat : "jpg",
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`,
    };
  },
});

// Initialize Multer middleware
export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional safety: limit profile uploads to 5MB
});

export { cloudinary };