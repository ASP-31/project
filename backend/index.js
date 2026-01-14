const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getDistance } = require('./services/distance');

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

// 2. Route to serve the index.html specifically
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'templates', 'index.html'));
});

// --- THE MAIN ROUTE ---
app.get('/api/report', async (req, res) => {
    const requestedZone = req.query.zone || "Kakkanad SmartCity";
    // Find the scenario matching the dropdown choice
    const scenario = scenarios.find(s => s.station.includes(requestedZone)) || scenarios[0];
    let report;

    try {
        console.log(`📡 Trying API for ${requestedZone}...`);
        const response = await axios.get('https://api.openaq.org/v3/locations', {
            params: { 
                coordinates: `${scenario.lat},${scenario.lng}`, 
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
            console.log("✅ API SUCCESS");
            report = {
                source: "LIVE_API",
                station: liveLoc.name,
                pm25: pmVal,
                pm10: parseFloat((pmVal * 1.2).toFixed(2)),
                aqi: estimateAQI(pmVal),
                timestamp: new Date().toISOString(),
                isSpike: pmVal > 60,
                suspects: [] 
            };
        } else { 
            throw new Error("No live sensors found in this zone"); 
        }

    } catch (error) {
        console.log(`⚠️ API Fail/No Data: Using Mock for ${requestedZone}`);
        const curPM = applyJitter(scenario.base_pm25);
        
        report = {
            source: "MOCK_DATA",
            station: scenario.station,
            pm25: curPM,
            pm10: applyJitter(scenario.base_pm10),
            aqi: estimateAQI(curPM),
            timestamp: new Date().toISOString(),
            isSpike: curPM > 60,
            suspects: scenario.manual_suspects.map(sus => ({
                ...sus,
                distance: getDistance(scenario.lat, scenario.lng, sus.lat, sus.lng).toFixed(2)
            }))
        };
    }

    // Save for the frontend to extract
    // const dataDir = path.join(__dirname, 'data');
    // if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    // fs.writeFileSync(path.join(dataDir, 'latest_report.json'), JSON.stringify(report, null, 2));

    res.json(report);
});

app.listen(PORT, () => console.log(`🚀 Server ready on http://localhost:${PORT}`));