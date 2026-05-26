import bcrypt from "bcryptjs";

const saltRounds = 10;

/**
 * Generates an alphanumeric tracking string of variable length
 */
const generateRandomString = (length = 8) => {
  return Math.random().toString(36).slice(2, 2 + length);
};

/**
 * Safely generates secure temporary credential structures for onboarding creators
 * @param {string} fullName - Input registration name parameter (defensively guarded)
 * @returns {Object} Cleaned, structurally secure tracking username and complexity-compliant temp password
 */
export const generateRandomCreds = (fullName) => {
  // Defensive validation patch to handle empty inputs safely without throwing system crashes
  const sanitizedName = fullName && typeof fullName === "string" ? fullName.trim() : "Producer";
  const firstName = sanitizedName.split(" ")[0].replace(/[^a-zA-Z]/g, "");
  
  // Formats a clean, predictable username prefix: e.g., Charles_7f2k9a
  const temp_username = `${firstName.charAt(0).toUpperCase()}${firstName.slice(1).toLowerCase()}_${generateRandomString(6)}`;

  // Builds a secure, complexity-compliant password matching your validation regex
  const baseString = generateRandomString(6);
  const specialChars = "!@#$*&";
  const structuralSpecialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const numericString = Math.floor(100 + Math.random() * 900); // Guarantees numeric characters are included

  // Combines structures into a secure temporary layout: e.g., T7a2f!824
  const tempPassword = `${baseString.charAt(0).toUpperCase()}${baseString.slice(1).toLowerCase()}${structuralSpecialChar}${numericString}`;

  return { temp_username, tempPassword };
};

/**
 * Generates a standard bcrypt security hash for input text blocks
 */
export const hashData = async (password) => {
  if (!password) throw new Error("Encryption layer requires a valid input data string parameter.");
  return bcrypt.hash(password, saltRounds);
};