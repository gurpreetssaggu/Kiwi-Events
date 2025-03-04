const express = require("express");
const multer = require("multer");
const fs = require("fs");
const Event = require("../models/event");
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage });

// ✅ Route to create an event
router.post("/", upload.single("image"), async (req, res) => {
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
        });

        await event.save();
        return res.status(201).json({ message: "Event created successfully!", event });

    } catch (error) {
        console.error("Event Creation Error:", error);
        return res.status(500).json({ message: "Server Error: " + error.message });
    }
});

// ✅ Updated route to get all events with correct image path
router.get('/', async (req, res) => {
    try {
        const events = await Event.find(); // Fetch all events from the database
        const eventsWithImageUrl = events.map(event => ({
            ...event._doc,
            image: event.image ? `http://localhost:5001/uploads/${event.image}` : null
        }));
        res.json(eventsWithImageUrl);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});

// ✅ Route to fetch a single event by ID
router.get("/:id", async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        res.json(event);
    } catch (error) {
        res.status(500).json({ message: "Error fetching event details" });
    }
});

// ✅ DELETE route to remove an event by ID
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        return res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
