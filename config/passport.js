import passport from "passport";
import GoogleStrategy from "passport-google-oauth20"
GoogleStrategy.Strategy;
import User from "../models/userSchema.js";
import env from "dotenv";
import { generateReferralCode } from '../helpers/refferalHelper.js'

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {

            let user = await User.findOne({ googleId: profile.id });
            let userReferralCode = generateReferralCode(profile.displayName);
            if (user) {
                if (user.isBlocked) {
                    return done(null, false, { message: "User is Blocked" })
                }

                return done(null, user)
            } else {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    referralCode: userReferralCode
                });
                await user.save();
                return done(null, user)
            }
        } catch (error) {
            return done(error, null)
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id)
});


passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user)
        })
        .catch(error => {
            done(error, null)
        })
})

export default passport