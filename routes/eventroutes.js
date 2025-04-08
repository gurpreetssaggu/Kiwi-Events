const express = require("express");
const multer = require("multer");
const fs = require("fs");
const Event = require("../models/event");
const User = require("../models/user");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage });

// ✅ Route to create an event (Saves as Draft)
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
    try {
        if (!req.body.title || !req.body.date || !req.body.time) {
            return res.status(400).json({ message: "Title, Date, and Time are required!" });
        }

        const event = new Event({
            title: req.body.title,
            date: req.body.date,
            time: req.body.time,
            description: req.body.description || "",
            category: req.body.category || "General",
            venueName: req.body.venueName || "Unknown",
            address: req.body.address || "",
            city: req.body.city || "",
            image: req.file ? req.file.filename : null,
            createdBy: req.user.id, 
            isApproved: false  // ✅ Defaults to false (Draft)
        });

        await event.save();
        return res.status(201).json({ message: "Event created! Pending admin approval.", event });

    } catch (error) {
        console.error("Event Creation Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
});

// ✅ Route to get only Approved events (for users)
// Get all events for admin
router.get("/all", async (req, res) => {
    try {
      const events = await Event.find().sort({ createdAt: -1 });
      res.json(events);
    } catch (error) {
      console.error("❌ Failed to load events:", error.message);
      res.status(400).json({ message: "Failed to load events" });
    }
  });
  
  
// ✅ Route to get all events including drafts (Admin Only)
router.get("/all", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isAdmin) return res.status(403).json({ message: "Access Denied" });

        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch events" });
    }
});

// ✅ Route to approve an event (Admin Only)
router.patch("/approve/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isAdmin) return res.status(403).json({ message: "Access Denied" });

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        event.isApproved = true;
        await event.save();
        res.json({ message: "Event approved successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Route to delete an event (Admin Only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isAdmin) return res.status(403).json({ message: "Access Denied" });

        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isAdmin) {
            return res.status(403).json({ message: "Access Denied" });
        }

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // ✅ Only update fields that are provided in the request
        Object.keys(req.body).forEach(key => {
            if (req.body[key]) {
                event[key] = req.body[key];
            }
        });

        await event.save();
        res.json({ message: "Event updated successfully", event });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Failed to update event" });
    }
});

// Public route to get all events for Explore page
// ✅ Public route to get only approved events (Explore page)
router.get("/", async (req, res) => {
    try {
        console.log("📥 GET /api/events hit");

        const events = await Event.find({ isApproved: true }).sort({ title: 1 });

        console.log(`✅ ${events.length} approved events found`);
        res.json(events);
    } catch (error) {
        console.error("❌ Error fetching events for explore:", error);
        res.status(500).json({ message: "Server error while loading events", error: error.message });
    }
});

