import bcrypt from "bcryptjs";

const saltRounds = 10;

const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 18);
};

export const generateRandomCreds = (fullName) => {
  const temp_username =
    fullName.charAt(0).toUpperCase() +
    fullName.slice(1).toLowerCase().split(" ")[0] +
    generateRandomString();

  //tempPassword will include special characters, uppercase letters, lowercase letters and numbers
  const randomSpecialChar = Math.random().toString(36).slice(2, 18);
  const tempPassword =
    generateRandomString().charAt(0).toUpperCase() +
    generateRandomString().slice(1).toLowerCase() +
    randomSpecialChar;

  return { temp_username, tempPassword };
};

export const hashData = async (password) => {
  return bcrypt.hash(password, saltRounds);
};
