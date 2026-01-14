const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getDistance } = require('./services/distance');
const { scoreSuspect } = require('./services/aiScoring');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const OPENAQ_API_KEY = '346d28497811fceb269f9619d71f28dd5f9294ddaf1ff3d3e17e7c665d14454f';
const scenarios = require('./data/scenarios.json');

// --- HELPER FUNCTIONS ---
function applyJitter(base) {
    return parseFloat((base + (Math.random() * 4 - 2)).toFixed(2));
}

function estimateAQI(pm25) {
    if (pm25 <= 30) return Math.round(pm25 * 1.5);
    if (pm25 <= 60) return Math.round((pm25 - 30) * 1.6 + 50);
    return Math.round(pm25 * 2);
}

// 1. Tell Express where your HTML files are (templates folder)
app.use(express.static(path.join(__dirname, '..', 'frontend', 'templates')));

// 2. Tell Express where your CSS/JS/Images are (frontend folder)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 2. Route to serve the dashboard.html specifically
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'templates', 'dashboard.html'));
});

// --- THE MAIN ROUTE ---
app.get('/api/report', async (req, res) => {
    // 1. Get the zone and trim any hidden spaces
    const requestedZone = (req.query.zone || "").trim();
    
    // 2. SMART MATCHING: Case-insensitive and partial match
    // This ensures "Kalamassery Startup Village" matches "Kalamassery Startup"
    const scenario = scenarios.find(s => 
        requestedZone.toLowerCase().includes(s.station.toLowerCase()) || 
        s.station.toLowerCase().includes(requestedZone.toLowerCase())
    );
    
    // 3. Fallback logic with logging for debugging
    if (!scenario) {
        console.log(`⚠️ No exact match for "${requestedZone}". Using default.`);
        var activeScenario = scenarios[0]; 
    } else {
        console.log(`✅ Matched Request "${requestedZone}" to Scenario: ${scenario.station}`);
        var activeScenario = scenario;
    }

    let report;
    try {
        // Try Live API first
        const response = await axios.get('https://api.openaq.org/v3/locations', {
            params: { 
                coordinates: `${activeScenario.lat},${activeScenario.lng}`, 
                radius: 10000, 
                parameters_id: 2 
            },
            headers: { 'X-API-Key': OPENAQ_API_KEY },
            timeout: 3000
        });

        const liveLoc = response.data.results?.find(loc => 
            loc.sensors.some(s => s.parameter.id === 2 && s.latest)
        );

        if (liveLoc) {
            const pmVal = liveLoc.sensors.find(s => s.parameter.id === 2).latest.value;
            report = generateReport("LIVE_API", activeScenario, pmVal);
        } else { throw new Error("No live sensors"); }

    } catch (error) {
        // Use Mock Data if API fails
        const curPM = applyJitter(activeScenario.base_pm25);
        report = generateReport("MOCK_DATA", activeScenario, curPM);
    }
    res.json(report);
});

// Helper to keep code clean
function generateReport(source, scenario, pmVal) {
    return {
        source: source,
        station: scenario.station, // Returns the specific station name
        pm25: pmVal,
        pm10: applyJitter(scenario.base_pm10),
        aqi: estimateAQI(pmVal),
        timestamp: new Date().toISOString(),
        isSpike: pmVal > 50,
        // Map unique suspects for THIS specific scenario
        suspects: scenario.manual_suspects.map(sus => {
            const dist = getDistance(scenario.lat, scenario.lng, sus.lat, sus.lng);
            const ai = scoreSuspect({ distance: dist, type: sus.type }, pmVal);
            return { 
                ...sus, 
                distance: dist.toFixed(2),
                aiScore: ai.score,
                confidence: ai.confidence,
                reasoning: ai.reasoning 
            };
        })
    };
}


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});