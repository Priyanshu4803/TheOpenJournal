const express = require("express");
const multer = require("multer");
const storage = require("../../config/cloudinary");
const router = express();
const userRoutes = express.Router();
const {
  visitCtrl,
  resetPasswordCtrl,
  registerCtrl,
  verifyOtpCtrl,
  verifyOtpFPCtrl,
  loginCtrl,
  userDetailsCtrl,
  profileCtrl,
  uploadProfilePhotoCtrl,
  uploadCoverPhotoCtrl,
  updatePasswordCtrl,
  updatePasswordNewCtrl,
  updateUserCtrl,
  logoutCtrl,
  forgotPasswordCtrl,
} = require("../../controllers/users/users");
const protected = require("../../middlewares/protected");

//instance of ulter
const upload = multer({ storage });

//! rendering forms
//?login form
userRoutes.get("/login", (req, res) => {
  res.render("users/login2", { error: "" });
});
//?register form
userRoutes.get("/register", (req, res) => {
  res.render("users/register2", {
    error: "",
  });
});
//?verify-otp
userRoutes.post("/verify-otp", verifyOtpCtrl);
//?verify-otpFP
userRoutes.post("/verify-otpFP", verifyOtpFPCtrl);
//?forgot-password
userRoutes.get("/forgot-password", (req, res) => {
  res.render("users/forgotPassword", { error: "" });
});
//?forgot-password
userRoutes.post("/forgot-password", forgotPasswordCtrl);
//?upload profile photo
userRoutes.get("/upload-profile-photo-form", (req, res) => {
  res.render("users/uploadProfilePhoto2", { error: "" });
});
//?upload cover photo
userRoutes.get("/upload-cover-photo-form", (req, res) => {
  res.render("users/uploadCoverPhoto2", { error: "" });
});
//?update user password
userRoutes.get("/update-user-password", (req, res) => {
  res.render("users/updatePassword2", { error: "" });
});
userRoutes.get("/reset-password", (req, res) => {
  res.render("users/resetPassword", { error: "" });
});
//register
userRoutes.post("/register", registerCtrl);
userRoutes.post("/login", loginCtrl);
userRoutes.get("/profile-page", protected, profileCtrl);
userRoutes.put(
  "/profile-photo-upload/",
  protected,
  upload.single("profile"),
  uploadProfilePhotoCtrl
);
userRoutes.put(
  "/cover-photo-upload/",
  protected,
  upload.single("profile"),
  uploadCoverPhotoCtrl
);
userRoutes.put("/update-password", updatePasswordCtrl);
userRoutes.put("/update-password-new", updatePasswordNewCtrl);
userRoutes.put("/reset-password", resetPasswordCtrl);
userRoutes.put("/update", updateUserCtrl);
userRoutes.get("/logout", logoutCtrl);
//visit someone else profile
userRoutes.get("/visit/:id", visitCtrl);
userRoutes.get("/:id", userDetailsCtrl);

module.exports = userRoutes;
