const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/register/registerModel');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    passReqToCallback: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Create new user if doesn't exist
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          isVerified: true
        });
        await user.save();
      } else if (!user.googleId) {
        // Update existing user with Google ID
        user.googleId = profile.id;
        await user.save();
      }
      
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
