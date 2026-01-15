const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { getDistance } = require('./services/distance');
const { scoreSuspect } = require('./services/aiScoring');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const OPENAQ_API_KEY = 'ffbf3fb591e7dcce1326d9d485d89b32';
const scenarios = require('./data/scenarios.json');

app.use(express.static(path.join(__dirname, '..', 'frontend', 'templates')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'templates', 'dashboard.html'));
});

// --- THE MAIN ROUTE ---
app.get('/api/report', async (req, res) => {
    const requestedZone = (req.query.zone || "").trim();
    
    // Inlined scenario matching logic
    const scenario = scenarios.find(s => 
        requestedZone.toLowerCase().includes(s.station.toLowerCase()) ||
        s.station.toLowerCase().includes(requestedZone.toLowerCase())
    ) || scenarios[0];

    try {
        console.log(`📡 Attempting OPENWEATHER API for: ${scenario.station}`);
        
        const response = await axios.get('http://api.openweathermap.org/data/2.5/air_pollution', {
            params: { 
                lat: scenario.lat, 
                lon: scenario.lng, 
                appid: 'ffbf3fb591e7dcce1326d9d485d89b32'
            },
            timeout: 4000 
        });

        if (response.data.list && response.data.list.length > 0) {
            const components = response.data.list[0].components;
            const pmVal = components.pm2_5;
            const pm10Val = components.pm10;

            console.log(`✅ API Success: Found PM2.5(${pmVal}) and PM10(${pm10Val})`);

            // Inlined AQI calculation
            let aqi;
            if (pmVal <= 30) aqi = Math.round(pmVal * 1.5);
            else if (pmVal <= 60) aqi = Math.round((pmVal - 30) * 1.6 + 50);
            else aqi = Math.round(pmVal * 2);

            const isSpike = pmVal > 55;
            const now = new Date();

            return res.json({
                source: "OPENWEATHER_API",
                station: scenario.station,
                pm25: pmVal,
                pm10: pm10Val,
                aqi: aqi,
                timestamp: now.toISOString(),
                spikeDetectedAt: isSpike ? scenario.spike_time : null,
                isSpike: isSpike,
                suspects: scenario.manual_suspects.map(sus => {
                    const dist = getDistance(scenario.lat, scenario.lng, sus.lat, sus.lng);
                    const ai = scoreSuspect({ distance: dist, type: sus.type }, pmVal);
                    return { 
                        ...sus, 
                        distance: dist.toFixed(2),
                        aiScore: isSpike ? ai.score : 0,
                        confidence: isSpike ? ai.confidence : "None",
                        reasoning: isSpike ? ai.reasoning : ["Air quality is within safe limits."],
                        timestamp: now.toISOString()
                    };
                })
            });
        } else { 
            throw new Error("Empty data from OpenWeather"); 
        }
    } catch (error) {
        console.log(`⚠️ API Fail/Empty: Falling back to Mock Data for ${scenario.station}`);
        
        // Inlined realistic pollution simulation logic
        const hour = new Date().getHours();
        let multiplier = 1.0;
        if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) multiplier = 1.4;
        else if (hour >= 23 || hour <= 5) multiplier = 0.4;

        const curPM = parseFloat(((scenario.base_pm25 * multiplier) + (Math.random() * 4 - 2)).toFixed(2));
        const curPM10 = parseFloat(((scenario.base_pm10 * multiplier) + (Math.random() * 4 - 2)).toFixed(2));

        // Inlined AQI calculation for mock data
        let aqi;
        if (curPM <= 30) aqi = Math.round(curPM * 1.5);
        else if (curPM <= 60) aqi = Math.round((curPM - 30) * 1.6 + 50);
        else aqi = Math.round(curPM * 2);

        const isSpike = curPM > 55;
        const now = new Date();

        return res.json({
            source: "MOCK_DATA",
            station: scenario.station,
            pm25: curPM,
            pm10: curPM10,
            aqi: aqi,
            timestamp: now.toISOString(),
            spikeDetectedAt: isSpike ? scenario.spike_time : null,
            isSpike: isSpike,
            suspects: scenario.manual_suspects.map(sus => {
                const dist = getDistance(scenario.lat, scenario.lng, sus.lat, sus.lng);
                const ai = scoreSuspect({ distance: dist, type: sus.type }, curPM);
                return { 
                    ...sus, 
                    distance: dist.toFixed(2),
                    aiScore: isSpike ? ai.score : 0,
                    confidence: isSpike ? ai.confidence : "None",
                    reasoning: isSpike ? ai.reasoning : ["Air quality is within safe limits."],
                    timestamp: now.toISOString()
                };
            })
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});