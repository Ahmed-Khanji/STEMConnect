const router = require("express").Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase() || null;
  
          let user =
            (await User.findOne({ oauthId: profile.id, authProvider: "google" })) ||
            (email ? await User.findOne({ email }) : null);
  
          if (!user) {
            user = await User.create({
              name: profile.displayName || "Google User",
              email,
              password: null,
              authProvider: "google",
              oauthId: profile.id,
            });
          }
  
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
);

function signAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}

// Start OAuth
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"], // profile include: name, Google ID, avatar
    session: false,
  })
);

// Finish OAuth
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=google`,
  }),
  async (req, res) => {
    // 1) create both tokens (same as local login)
    const accessToken = signAccessToken(req.user);
    const refreshToken = signRefreshToken(req.user);

    // 2) store refresh token in DB (so /api/auth/token works)
    req.user.refreshToken = refreshToken;
    await req.user.save();

    // 3) send both to frontend
    res.redirect(`${process.env.FRONTEND_URL}/auth?token=${accessToken}&refreshToken=${refreshToken}`);
  }
);

module.exports = router;
