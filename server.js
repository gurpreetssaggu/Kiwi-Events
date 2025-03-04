const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

const eventRoutes = require("./routes/eventroutes");
const authRoutes = require("./routes/authroutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Serve Static Files (Fix for 404 error)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ Serve uploaded images

// ✅ Use session middleware BEFORE passport
app.use(
    session({
        secret: "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",
        resave: false,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);

// ✅ Serve index.html for all non-API routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

mongoose
    .connect("mongodb://localhost:27017/kiwiEventsDB", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
