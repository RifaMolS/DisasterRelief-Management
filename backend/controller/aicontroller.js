const axios = require("axios");

exports.predictDisaster = async (req, res) => {
    try {
        const { telemetry } = req.body;
        // Call the Flask ML server (now on port 8005 to avoid Django conflicts)
        const response = await axios.post("http://localhost:8005/predict", telemetry);
        res.json(response.data);
    } catch (err) {
        console.error("AI Prediction Error:", err.message);
        res.status(500).json({ status: "error", message: "AI Analysis failed to respond." });
    }
};

exports.predictBatch = async (req, res) => {
    try {
        const { telemetryArray } = req.body;
        if (!Array.isArray(telemetryArray)) {
            return res.status(400).json({ status: "error", message: "telemetryArray must be an array" });
        }
        
        let results = [];
        let summary = { Extreme: 0, High: 0, Medium: 0, Low: 0 };
        
        for (const telemetry of telemetryArray) {
            try {
                const response = await axios.post("http://localhost:8005/predict", telemetry);
                const prediction = response.data.prediction;
                results.push(prediction);
                if (prediction.risk_level) {
                    summary[prediction.risk_level] = (summary[prediction.risk_level] || 0) + 1;
                }
            } catch (err) {
                console.error("Batch item error", err.message);
                // Push an error for this specific row so it doesn't break the whole batch
                results.push({ error: true });
            }
        }
        
        res.json({ status: "success", summary, results });
    } catch (err) {
        console.error("AI Batch Prediction Error:", err.message);
        res.status(500).json({ status: "error", message: "AI Batch Analysis failed to respond." });
    }
};
