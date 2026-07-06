const express = require('express');
const router = express.Router();
const axios = require('axios');

// Endpoint to get the public Map API key for frontend Google Maps component
router.get("/get-google-map-key", (req, res) => {
    console.log("Fetching Google Map Key from Backend...");
    res.json({ key: process.env.Google_Map_API });
});

// Proxy route for Weather data (Safe backend-to-backend call)
router.get('/weather', async (req, res) => {
    console.log("Weather Proxy Request Received:", req.query);
    const { lat, lon, q } = req.query;
    const apiKey = process.env.Weather_API;

    if (!apiKey) {
        return res.status(500).json({ error: "Weather API key not configured in backend .env" });
    }

    try {
        const params = q ? { q, appid: apiKey, units: 'metric' } : { lat, lon, appid: apiKey, units: 'metric' };
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params
        });
        res.json(response.data);
    } catch (error) {
        console.error("Weather Proxy Error:", error.message);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch weather data from external provider." });
    }
});

// Proxy route for Nearby Places (Safe backend-to-backend call)
router.get('/nearby', async (req, res) => {
    const { lat, lon, type } = req.query;
    const apiKey = process.env.Google_Map_API;

    if (!apiKey) {
        return res.status(500).json({ error: "Google Map API key not configured in backend .env" });
    }

    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
            params: {
                location: `${lat},${lon}`,
                radius: 5000,
                type: type || 'hospital',
                key: apiKey
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Location Proxy Error:", error.message);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch nearby location data." });
    }
});

// Proxy route for Reverse Geocoding (Lat/Lon to Address) - Using OpenStreetMap (FREE)
router.get('/geocode', async (req, res) => {
    const { lat, lon } = req.query;

    try {
        // Using OpenStreetMap Nominatim API (No Key Required)
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
                lat,
                lon,
                format: 'json',
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'DisasterReliefApp/1.0' // Required by Nominatim policy
            }
        });

        if (response.data) {
            // Map OSM response to a format similar to what the frontend expects
            // or just return the display_name directly.
            res.json({
                status: "OK",
                results: [{
                    formatted_address: response.data.display_name
                }]
            });
        } else {
            res.json({ status: "ZERO_RESULTS", results: [] });
        }
    } catch (error) {
        console.error("OSM Geocoding Error:", error.message);
        res.status(500).json({ 
            error: "Failed to geocode location via free mesh.",
            details: error.message 
        });
    }
});

module.exports = router;
