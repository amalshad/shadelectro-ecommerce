import User from "../../models/userSchema.js"
import Coupon from "../../models/couponSchema.js"
import env from "dotenv"
env.config();
import bcrypt from "bcrypt"
import { sendVerificationEmail, generateOtp } from '../../utils/authHelper.js'
import { generateReferralCode, generateUniqueCouponCode } from '../../helpers/refferalHelper.js'



const loadSignup = async (req, res) => res.render("signup", { message: null });


const loadLogin = async (req, res) => res.render("login", { message: "" });



const signup = async (req, res) => {

  const { name, email, password, confirmPassword, referralCode } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (password !== confirmPassword) return res.render("signup", { message: "Passwords do not match" });


    if (existingUser) return res.render("signup", { message: "User already exists" });



    let userReferralCode;
    let isUnique = false;

    while (!isUnique) {

      userReferralCode = generateReferralCode(name);
      const existingCode = await User.findOne({ referralCode: userReferralCode });

      if (!existingCode) {
        isUnique = true;
      }
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, email, password, referralCode: referralCode || null, userReferralCode };

    res.redirect("/verify-otp");
    console.log("OTP sent", otp);

  } catch (error) {
    console.log("Error at signup", error);
    res.status(500).send("Internal Server Error");
  }
};


const loadVerifyOtp = async (req, res) => {
  try {


    if (req.session.user) {
      res.redirect('/')

    } else {
      res.render('verify-otp')

    }
  } catch (error) {
    console.error("Load Verify Otp", error)
    res.status(500).render("notfound")
  }
}




const verifyOtp = async (req, res) => {
  try {

    const { otp } = req.body;

    if (otp === req.session.userOtp) {
      const userData = req.session.userData;
      const hashpassword = await bcrypt.hash(userData.password, 10);

      let referrer = null;

      if (userData.referralCode) referrer = await User.findOne({ referralCode: userData.referralCode.toUpperCase() });


      const saveUserdata = new User({
        name: userData.name,
        email: userData.email,
        password: hashpassword,
        referralCode: userData.userReferralCode,
        referredBy: referrer ? referrer._id : null
      });

      await saveUserdata.save();


      if (referrer) {
        try {

          const couponCode = generateUniqueCouponCode();

          const coupon = new Coupon({
            couponCode: couponCode,
            users: [{ _id: referrer._id, count: 0 }],
            usageLimit: 1,
            usageLimitPerUser: 1,
            offerPrice: 200,
            minimumPrice: 1000,
            couponType: 'fixed',
            expireOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: true,
            source: 'referral',
            description: 'Referral Reward - ₹200 OFF on your next order!',
            assignedTo: referrer._id
          });

          await coupon.save();

          referrer.redeemedUser.push(saveUserdata._id);

          await referrer.save();

          console.log(`Referral coupon created for  ${referrer._id}, Id ${coupon.couponCode}`);

        } catch (couponError) {
          console.error("Error creating referral coupon:", couponError);
        }
      }

      req.session.user = saveUserdata._id;
      res.json({ success: true, redirectUrl: '/' });

    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }

  } catch (error) {
    console.error("Error Verify OTP", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const resendOTP = async (req, res) => {
  try {

    const { email } = req.session.userData
    if (!email) return res.status(400).json({ success: false, message: "Email not found in session" });

    const otp = generateOtp();
    req.session.userOtp = otp

    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {

      console.log("Resend OTP", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {
      res.status(500).json({ success: false, message: "failed toresend otp. Please try again" });
    }

  } catch (error) {
    console.error("Error resending OTP", error)
    res.status(500).json({ success: false, message: "internal server error.Plaese try again" })

  }
}


const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.trim(), isAdmin: 0 });
    if (!user) return res.status(401).json({ message: "User not found" });


    if (user.isBlocked) return res.status(403).json({ message: "User is blocked by admin" });


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });


    req.session.user = user._id;
    return res.status(200).json({ message: "Login successful", redirect: "/" });

  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const logout = async (req, res) => {
  try {
    if (req.session.user || req.session.passport?.user) {


      if (req.session.passport?.user) {
        delete req.session.passport.user;
      }
      if (req.session.user) {
        delete req.session.user;
      }
    }

    res.redirect("/login")

  } catch (error) {
    console.log("Logout error", error);
    res.redirect("/404")
  }
}


const loadForgotPassword = async (req, res) => {
  try {
    const message = req.session.message
    delete req.session.message

    res.render("forgot", { message, success: "" })

  } catch (error) {
    console.error("Error at loadForgotPassword", error)
    res.redirect("/login")
  }
}


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const exist = await User.findOne({ email })


    if (!exist || exist.isAdmin) {
      req.session.message = "User not found"
      return res.redirect('/forgot')
    }

    const otp = generateOtp()

    req.session.userOtp = otp
    req.session.email = email

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      req.session.message = "Failed to send OTP. Please try again.";
      return res.redirect("/forgot");
    }

    console.log("Forgot otp", otp)
    res.redirect("/forgotOtp")

  } catch (error) {

    console.error("Error in forgotPassword:", error);
    res.status(500).send("Internal Server Error");
  }
}


const loadForgotOtp = async (req, res) => {

  if (req.session.email) {

    res.render("forgotOtp")
  } else {
    res.redirect("/login")
  }



}


const verifyForgotOtp = async (req, res) => {
  try {
    const { otp } = req.body

    if (req.session.userOtp == otp) {


      res.json({ success: true, redirectUrl: "/resetPassword" })
    } else {
      res.json({ message: "OTP is not verified" })
    }
  } catch (error) {
    console.error("Error at verifyForgotOtp", error)
  }
}


const loadResetPassword = async (req, res) => {
  const email = req.session.email
  try {
    if (email) {

      res.render("resetPassword", { message: "", success: "", email })
    } else {
      res.redirect("/login")
    }
  } catch (error) {
    console.error("Error at forgot loadResetPassword", error)
    res.redirect("/404")
  }
}


const resetPassword = async (req, res) => {
  try {

    const { email, password } = req.body

    const hashpassword = await bcrypt.hash(password, 10)
    await User.findOneAndUpdate({ email: email }, { $set: { password: hashpassword } })

    console.log("updated")

    res.redirect("/login")

  } catch (error) {
    console.error("Error at resetPassword", error)
    res.redirect("/404")
  }
}


const forgotResendOtp = async (req, res) => {
  try {

    const otp = generateOtp()
    req.session.userOtp = otp

    const email = req.session.email
    const emailSent = await sendVerificationEmail(email, otp);

    console.log("forgotResendOtp", otp);

    if (emailSent) {

      console.log("Resend OTP", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {
      res.status(500).json({ success: false, message: "failed to resend otp. Please try again" });
    }

  } catch (error) {
    console.error("Error at forgot resendotp", error)
    res.redirect("/404")
  }
}


export default {
  loadLogin,
  loadSignup,
  signup,
  loadVerifyOtp,
  verifyOtp,
  resendOTP,
  login,
  logout,
  loadForgotPassword,
  forgotPassword,
  loadForgotOtp,
  verifyForgotOtp,
  loadResetPassword,
  resetPassword,
  forgotResendOtp
}