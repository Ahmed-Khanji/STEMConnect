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

// sign a new refresh token (including the version)
function signRefreshToken(user) {
  const ver = user.refreshTokenVersion ?? 0;
  return jwt.sign(
    { userId: user._id, tokenVersion: ver },
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
router.get("/google/callback",
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

    // 3) set short-lived HttpOnly cookies (2-min transport only, claimed by /google/exchange)
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 2 * 60 * 1000,
    };
    res.cookie("gc_access", accessToken, cookieOpts);
    res.cookie("gc_refresh", refreshToken, cookieOpts);
    res.redirect(`${process.env.FRONTEND_URL}/auth?google=success`);
  }
);

// One-time exchange: frontend calls this after the Google callback redirect
// to claim the transport cookies and get tokens as JSON
router.get("/google/exchange", (req, res) => {
  const { gc_access, gc_refresh } = req.cookies;
  if (!gc_access || !gc_refresh) {
    return res.status(400).json({ error: "No pending Google session" });
  }
  // clear the cookies
  res.clearCookie("gc_access");
  res.clearCookie("gc_refresh");
  // return the tokens as JSON
  return res.json({ accessToken: gc_access, refreshToken: gc_refresh });
});

module.exports = router;
