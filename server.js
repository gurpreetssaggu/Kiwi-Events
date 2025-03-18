const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

const Event = require("./models/event");

const eventRoutes = require("./routes/eventroutes");
const authRoutes = require("./routes/authroutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Serve Static Files but disable default index.html loading
app.use(express.static(path.join(__dirname, "public"), { index: false }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Explicit Routes for HTML Files
app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/events.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "events.html"));
});

app.get("/create-event.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "create-event.html"));
});

app.get("/saved-events.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "saved-events.html"));
});

app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/signup.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signup.html"));
});


// ✅ Serve Admin Dashboard
app.get("/admin.html", (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), "secretKey");
        if (decoded.isAdmin) {
            res.sendFile(path.join(__dirname, "public", "admin.html"));
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid Token" });
    }
});


app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);

mongoose.connect("mongodb://localhost:27017/kiwiEventsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// ✅ Fix Route Definition Order – DEFINE BEFORE LISTENING
app.get("/api/events/:id", async (req, res) => {
    try {
        // ✅ Ensure valid MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid event ID format" });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json(event);
    } catch (error) {
        console.error("❌ Error fetching event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



app.use(express.static(path.join(__dirname, "public")));

// ✅ Fix MIME type issue
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
    }
    next();
});
