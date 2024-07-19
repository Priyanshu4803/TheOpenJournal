const bcrypt = require("bcryptjs");
const User = require("../../model/user/User");
const appErr = require("../../utils/appErr");
const twilio = require("twilio");
const nodemailer = require("nodemailer");

//register
// const client = new twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// Function to send OTP email
const sendOTPEmail = async (recipientEmail, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "theopenjournalweb@gmail.com", // Your Gmail address
        pass: "vixx jvlh dugj hqtt", // Your Gmail password or App Password
      },
    });

    const info = await transporter.sendMail({
      from: "theopenjournalweb@gmail.com", // Your Gmail address
      to: recipientEmail, // Recipient's email address
      subject: "Your OTP", // Email subject
      text: `Your OTP is ${otp}`, // Email body with OTP
    });

    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

//function to send update password email
const sendUPEmail = async (recipientEmail, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "theopenjournalweb@gmail.com", // Your Gmail address
        pass: "vixx jvlh dugj hqtt", // Your Gmail password or App Password
      },
    });

    const info = await transporter.sendMail({
      from: "theopenjournalweb@gmail.com", // Your Gmail address
      to: recipientEmail, // Recipient's email address
      subject: "Password reset link", // Email subject
      text: `Your token is ${otp}\n\nPlease click on the following link to reset your password:\nhttp://theopenjournal.xyz/api/v1/users/reset-password\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`, // Email body with OTP
    });

    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const resetPasswordCtrl = async (req, res, next) => {
  const { token, password } = req.body;
  try {
    const user = await User.findById(req.session.userAuth);
    if (!user) {
      return res.render("users/resetPassword", {
        error: "unAuthorized user",
      });
    }
    if (token !== user.otp) {
      return res.render("users/resetPassword", {
        error: "wrong token",
      });
    }
    if (Date.now() > user.otpExpires) {
      return res.render("users/resetPassword", {
        error: "Token has expired",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user's password and clear the OTP fields
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.render("users/resetPasswordSuccessfully");
  } catch (error) {
    return res.render("users/resetPassword", {
      error: error.message,
    });
  }
};

const visitCtrl = async (req, res, next) => {
  try {
    console.log("hi");
    const username = req.params.id;
    const user = await User.findOne({ username });
    let u;
    let flag = false;
    if (user) {
      flag = true;
      u = await User.findOne({ username })
        .populate("posts")
        .populate("comments");
    }
    // console.log(u.username);
    console.log("h");
    if (flag == true) {
      console.log("n");
      return res.render("users/profileView", { u, error: "" });
    }
    console.log("z");
    return res.render("users/profileView", {
      u: " ",
      error: "No user found",
    });
  } catch (error) {}
};
const registerCtrl = async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if any field is empty
  if (!username || !email || !password) {
    return res.render("users/register2", {
      error: "All fields are required",
    });
  }

  try {
    // Check if the user already exists
    const userFound = await User.findOne({ email });
    if (userFound && userFound.verified == true) {
      return res.render("users/register2", {
        error: "User already exists",
      });
    } else if (username.length > 15) {
      return res.render("users/register2", {
        error: "Username can only have 15 characters",
      });
    } else if (password.length < 8) {
      return res.render("users/register2", {
        error: "Password should have at least 8 characters",
      });
    }

    // Hash the user's password
    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = Date.now() + 300000;
    // Create a new user with OTP and OTP expiry
    const user = await User.create({
      username,
      email,
      password: passwordHashed,
      otp,
      otpExpires: Date.now() + 300000, // 5 min
      verified: false,
    });

    await sendOTPEmail(email, otp); // Implement your own function to send OTP via email
    // Send OTP to the user's phone number
    // await client.messages.create({
    //   body: `Your OTP is ${otp}`,
    //   from: process.env.TWILIO_NUMBER,
    //   to: phoneNumber,
    // });

    // Save the user ID in session
    // req.session.userAuth = user._id;

    // Redirect to OTP verification page
    res.render("users/otp", {
      email: email,
      otp_expires: otp_expires,
      error: "",
    });
  } catch (error) {
    res.json(error);
    // next(error);
  }
};

const verifyOtpCtrl = async (req, res, next) => {
  const { otp, email, otp_expires } = req.body;
  console.log(otp);

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    // const u = await User.findOne({ email });
    // const otp_expires = new Date(u.otpExpires).getTime();
    // console.log(Date.now() + 3000);
    // console.log(otp_expires);
    // console.log(user);
    if (!user) {
      return res.render("users/otp", {
        email: email,
        otp_expires: otp_expires,
        error: "wrong OTP",
      });
    }

    //delete other non - verified users with same email
    await User.deleteMany({
      email: email,
      verified: false,
      _id: { $ne: user._id }, // Ensure we do not delete the currently verified user
    });

    // OTP is verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.verified = true;
    await user.save();
    req.session.userAuth = user._id;

    // Redirect to user profile or another page
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    res.json(error);
    // next(error);
  }
};
const verifyOtpFPCtrl = async (req, res, next) => {
  const { otp, email, otp_expires } = req.body;
  console.log(otp);

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    console.log(user);
    if (!user) {
      return res.render("users/otpFP", {
        error: "wrong OTP",
        email: email,
        otp_expires: otp_expires,
      });
    }

    // OTP is verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.verified = true;
    await user.save();
    req.session.userAuth = user._id;

    // Redirect to user profile or another page
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    res.json(error);
    // next(error);
  }
};
const forgotPasswordCtrl = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({
      email,
      verified: true,
    });

    if (!user) {
      return res.render("users/forgotPassword", {
        error: "this email is not verified",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = Date.now() + 300000;

    await User.findByIdAndUpdate(user._id, {
      otp: otp,
      otpExpires: otp_expires,
    });

    await sendOTPEmail(email, otp);

    res.render("users/otpFP", {
      email: email,
      otp_expires: otp_expires,
      error: "",
    });
  } catch (error) {
    res.json(error);
    // next(error);
  }
};

//login
const loginCtrl = async (req, res, next) => {
  // console.log(req.session);
  const { username, password } = req.body;
  if (!username || !password) {
    // return next(appErr("email and password fields are required"));
    return res.render("users/login2", {
      error: "email and password fields are required",
    });
  }
  try {
    //check if email exist
    const userFound = await User.findOne({ username })
      .populate("posts")
      .populate("comments");
    if (!userFound) {
      // return next(appErr("Invalid login credentials"));
      return res.render("users/login2", {
        error: "invalid login credentials",
      });
      // return res.json({ status: "failed", data: "invalid login email" });
    }
    if (userFound.verified === false) {
      return res.render("users/login2", {
        error: "verify your email first",
      });
    }
    //verify password
    const isPasswordValid = await bcrypt.compare(password, userFound.password);
    if (!isPasswordValid) {
      // return next(appErr("Invalid login credentials"));
      return res.render("users/login2", {
        error: "invalid login credentials",
      });
      // return res.json({ status: "failed", data: "invalid login credentials" });
    }

    //for keeping user logged in - authentication
    req.session.userAuth = userFound._id;

    // console.log(req.session);
    // res.json({
    //   status: "success",
    //   data: userFound,
    // });
    //!redirect
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    // res.json(error);
    next(error);
  }
};

//details
const userDetailsCtrl = async (req, res) => {
  try {
    //get userID from params
    const userId = req.params.id;
    //find the user
    const user = await User.findById(userId);
    // res.json({
    //   status: "success",
    //   data: user,
    // });
    res.render("users/updateUser2", { error: "", user });
  } catch (error) {
    res.render("users/updateUser2", { error: error.message });
    return;
  }
};

//profile
const profileCtrl = async (req, res) => {
  try {
    //get the login is userID by using session
    const userId = req.session.userAuth;
    //find the user
    const user = await User.findById(userId)
      .populate("posts")
      .populate("comments");
    // res.json({
    //   status: "success",
    //   data: user,
    // });
    res.render("users/profile2", { user });
  } catch (error) {
    res.json(error);
  }
};

//profile photo upload
const uploadProfilePhotoCtrl = async (req, res, next) => {
  // console.log(req.file);
  try {
    //check if file exist
    console.log(req);
    if (!req.file) {
      // return next(appErr("Please upload image", 403));
      return res.render("users/uploadProfilePhoto2", {
        error: "Please provide image",
      });
    }
    if (req.file.size > 6 * 1024 * 1024) {
      return res.render("users/uploadProfilePhoto2", {
        error: "File size should not exceed 6MB",
      });
    }
    //1. find the user to be updated
    const userID = req.session.userAuth;
    const userFound = await User.findById(userID);

    //2. check if user is found
    if (!userFound) {
      // return next(appErr("user not found"), 403);
      return res.render("users/uploadProfilePhoto2", {
        error: "user not found",
      });
    }

    //3. update profile photo
    await User.findByIdAndUpdate(
      userID,
      {
        profileImage: req.file.path,
      },
      { new: true }
    );
    // res.json({
    //   status: "success",
    //   data: "profile photo updated successfully",
    // });

    //!redirect
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    // return next(appErr(error.message));
    return res.render("users/uploadProfilePhoto2", {
      error: error.message,
    });
  }
};

//cover photo upload
const uploadCoverPhotoCtrl = async (req, res) => {
  try {
    // console.log(req.file);
    //check if file exist
    if (!req.file) {
      // return next(appErr("Please upload image", 403));
      return res.render("users/uploadCoverPhoto2", {
        error: "Please provide image",
      });
    }
    //1. find the user to be updated
    const userID = req.session.userAuth;
    const userFound = await User.findById(userID);

    if (!userFound) {
      // return next(appErr("user not found"), 403);
      return res.render("users/uploadCoverPhoto2", {
        error: "user not found",
      });
    }
    //2. check if user is found
    if (!userFound) {
      return next(appErr("user not found"), 403);
    }

    //3. update profile photo
    await User.findByIdAndUpdate(
      userID,
      {
        coverImage: req.file.path,
      },
      { new: true }
    );
    // res.json({
    //   status: "success",
    //   data: userFound,
    // });
    //!redirect
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    // return next(appErr(error.message));
    return res.render("users/uploadCoverPhoto2", {
      error: error.message,
    });
  }
};

// const AlertPage = () => {
//   alert("your password has been updated");
// };
//update password
const updatePasswordCtrl = async (req, res, next) => {
  const { oldPassword, password, confirmPassword } = req.body;

  try {
    // Validate new password
    // if (!password) {
    //   return res.render("users/updatePassword2", {
    //     error: "Please type the new password",
    //   });
    // }
    // if (password.length < 8) {
    //   return res.render("users/updatePassword2", {
    //     error: "Password should have at least 8 characters",
    //   });
    // }
    if (password !== confirmPassword) {
      return res.render("users/updatePassword2", {
        error: "Passwords do not match",
      });
    }

    // Verify old password
    console.log(oldPassword);
    const user = await User.findById(req.session.userAuth);
    console.log(user.password);
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.render("users/updatePassword2", {
        error: "Incorrect old password",
      });
    }

    // Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    // Update user password in the database
    await User.findByIdAndUpdate(
      req.session.userAuth, // Use _id to specify the user to update
      { password: passwordHashed },
      { new: true }
    );

    // Redirect to the profile page
    // alert("Your password has been updated");
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    // Handle errors
    return res.render("users/updatePassword2", {
      // Ensure the correct template name
      error: error.message,
    });
  }
};

//updatePasswordNew
const updatePasswordNewCtrl = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userAuth);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = Date.now() + 300000;
    console.log(user.email);
    await User.findByIdAndUpdate(user._id, {
      otp: otp,
      otpExpires: otp_expires,
    });

    await sendUPEmail(user.email, otp);
    return res.render("users/updatePassword2", {
      error: "Reset link has been sent",
    });
  } catch (error) {}
};

//update user
const updateUserCtrl = async (req, res, next) => {
  const { username } = req.body;
  try {
    const user = await User.findById(req.session.userAuth);
    if (!username) {
      return res.render("users/updateUser2", {
        error: "Please provide details",
        user,
      });
    }

    if (username.length > 15)
      return res.render("users/updateUser2", {
        error: "user name can only have 15 characters",
        user,
      });

    const u = await User.findById(req.session.userAuth);
    if (username !== u.username) {
      //check if email is not taken
      if (username) {
        const usernameTaken = await User.findOne({ username });
        if (usernameTaken) {
          return res.render("users/updateUser2", {
            error: "this username is already taken",
            user,
          });
        }
      }
    }

    //update the user
    await User.findByIdAndUpdate(
      req.session.userAuth,
      {
        username,
      },
      { new: true }
    );
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    // return next(appErr(error.message));
    return res.render("users/updateUser2", {
      error: error.message,
      user: "",
    });
  }
};

//logout
const logoutCtrl = async (req, res) => {
  // res.json({
  //   status: "success",
  //   user: "User logout",
  // });
  //destroy session
  req.session.destroy(() => {
    res.redirect("/api/v1/users/login");
  });
};

module.exports = {
  visitCtrl,
  resetPasswordCtrl,
  registerCtrl,
  verifyOtpCtrl,
  verifyOtpFPCtrl,
  forgotPasswordCtrl,
  loginCtrl,
  userDetailsCtrl,
  profileCtrl,
  uploadProfilePhotoCtrl,
  uploadCoverPhotoCtrl,
  updatePasswordCtrl,
  updatePasswordNewCtrl,
  updateUserCtrl,
  logoutCtrl,
};
