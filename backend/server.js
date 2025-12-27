require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require("passport");

const userRoutes = require("./routes/userRoutes");
const { authRoutes, authenticateToken } = require("./routes/authRoutes");
const authGoogleRoutes = require("./routes/authGoogle");
const courseRoutes = require("./routes/courseRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(passport.initialize());

// Routes
app.get('/', (req, res) => { res.send('APUI is running...'); });
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/auth", authRoutes);
app.use("/auth", authGoogleRoutes);
app.use("/api/courses", courseRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => { console.error('Failed to connect to MongoDB', err);});