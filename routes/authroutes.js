const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/user");
const nodemailer = require('nodemailer');
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;



// ✅ Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gurpreetss97@gmail.com', // Replace with your actual email
        pass: 'brxk sixb jghn byyt' // Use an "App Password" (not your real Gmail password)
    }
});

// ✅ Generate and Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        console.log(`Received OTP request for: ${email}`);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Generated OTP: ${otp}`);

        let user = await User.findOne({ email });

        if (!user) {
            console.log("User does not exist. Creating new OTP-only entry...");
            user = new User({ email, otp }); // ✅ No username/password required
            await user.save();
        } else {
            console.log("User exists. Updating OTP...");
            await User.updateOne({ email }, { $set: { otp: otp } });
        }

        console.log("OTP saved in database:", otp);

        // ✅ Ensure Nodemailer is configured correctly
        try {
            await transporter.sendMail({
                from: 'gurpreetss97@gmail.com',
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP for Kiwi Events sign-up is: ${otp}`
            });
        } catch (emailError) {
            console.error("❌ Error sending email:", emailError);
            return res.status(500).json({ message: "Error sending OTP email", error: emailError.message });
        }

        console.log("✅ OTP sent successfully!");
        res.json({ message: "OTP sent successfully" });

    } catch (err) {
        console.error("❌ Internal Server Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});



// ✅ Verify OTP and Register User
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password, confirmPassword, otp } = req.body;

        if (!username || !email || !password || !confirmPassword || !otp) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // ✅ Retrieve user from the database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found. Please request an OTP first." });
        }

        console.log(`Stored OTP: ${user.otp}, Entered OTP: ${otp}`); // Debugging

        // ✅ Trim whitespace and compare OTPs
        if (!user.otp || user.otp.trim() !== otp.trim()) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        // ✅ Hash the password
        user.username = username;
        user.password = await bcrypt.hash(password, 10);
        user.otp = undefined; // ✅ Remove OTP after verification
        await user.save();

        res.json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration Error:", err);
        next(err);
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, 'secretKey', { expiresIn: '1h' });

        res.json({ token, userId: user._id });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

// ✅ Use session middleware BEFORE passport.initialize()
router.use(
    session({
        secret: "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y", // Change this to a secure random string
        resave: false,
        saveUninitialized: true
    })
);

// ✅ Initialize Passport
router.use(passport.initialize());
router.use(passport.session());

// ✅ Passport Serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ✅ Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: "551322716158-l3kn62k0e5i4l9e1u8e2la9kf2a1v5ov.apps.googleusercontent.com",
            clientSecret: "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",
            callbackURL: "http://localhost:5001/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ email: profile.emails[0].value });

                if (!user) {
                    user = new User({
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        password: null // No password for social logins
                    });
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// ✅ Facebook OAuth Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: "1794413294693631",
            clientSecret: "7622b669066ceedc31730474cb560c1c",
            callbackURL: "http://localhost:5001/api/auth/facebook/callback",
            profileFields: ["id", "displayName", "emails"]
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ email: profile.emails[0].value });

                if (!user) {
                    user = new User({
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        password: null
                    });
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// ✅ Google Login Route
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// ✅ Google Callback Route
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login.html" }),
    (req, res) => {
        res.redirect("/index.html"); // Redirect to homepage after login
    }
);

// ✅ Facebook Login Route
router.get(
    "/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
);

// ✅ Facebook Callback Route
router.get(
    "/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/login.html" }),
    (req, res) => {
        res.redirect("/index.html"); // Redirect to homepage after login
    }
);

// ✅ Logout Route
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) console.error("Logout error:", err);
        res.redirect("/login.html");
    });
});


module.exports = router;
