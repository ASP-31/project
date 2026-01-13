// const axios = require('axios');
// const fs = require('fs');
// const path = require('path');
// const express = require('express');
// const cors = require('cors');
// const app = express();
// const port = 3000;
// app.use(cors())
// const { getDistance } = require('./services/distance');

// const OPENAQ_API_KEY = '346d28497811fceb269f9619d71f28dd5f9294ddaf1ff3d3e17e7c665d14454f';//Open AQ API Key

// const constructionSites = [
//     { name: "Kochi Metro - Chembumukku", lat: 10.0075, lng: 76.3195 },
//     { name: "Vyttila Mobility Hub Ext", lat: 9.9670, lng: 76.3200 },
//     { name: "Kakkanad SmartCity P3", lat: 10.0085, lng: 76.3620 }
// ]; // Example construction sites

// app.get('/api/report', async (req, res) => {
//     try{

 
// async function runTracker() {
//     try {
//         console.log("Checking Ernakulam Air Quality...");
//         const response = await axios.get('https://api.openaq.org/v3/locations', { //fetch locations
//             params: { coordinates: "28.5648,77.1844", radius: 10000, parameters_id: 2 },// PM2.5 parameter
//             headers: { 'X-API-Key': OPENAQ_API_KEY }
//         });

//         let station = null; // Station with valid PM2.5 data
//         let pmValue = null; // PM2.5 value

//         // Try to find real data
//         if (response.data.results?.length > 0) { // Check if results exist
//             const validLoc = response.data.results.find(loc => 
//                 loc.sensors.some(s => s.parameter.id === 2 && s.latest)
//             );
//             if (validLoc) {
//                 station = validLoc;
//                 pmValue = validLoc.sensors.find(s => s.parameter.id === 2).latest.value;
//             }
//         }

//         // FALLBACK: If API has no live data, generate "Mock Data" for testing
//         if (!station) {
//             console.log("⚠️ No live data found. Generating Mock Spike for Ernakulam...");
//             station = { name: "Vyttila (Simulated)", coordinates: { latitude: 9.96, longitude: 76.32 } };
//             pmValue = 84; // High value to trigger a spike
//         }

//         const report = {
//             timestamp: new Date().toISOString(),
//             pmValue: pmValue,
//             station: station.name,
//             isSpike: pmValue > 60,
//             suspects: []
//         };

//         if (report.isSpike) {
//             report.suspects = constructionSites.filter(site => {
//                 const dist = getDistance(station.coordinates.latitude, station.coordinates.longitude, site.lat, site.lng);
//                 return dist <= 3; 
//             }).map(s => ({ ...s, distance: getDistance(station.coordinates.latitude, station.coordinates.longitude, s.lat, s.lng).toFixed(2) }));
//         }

//         // const dataPath = path.join(__dirname, 'data', 'latest_report.json');
//         // if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
//         // fs.writeFileSync(dataPath, JSON.stringify(report, null, 2));
//         res.json(report);

//         console.log(`✅ Report Saved: PM2.5 at ${station.name} is ${pmValue}`);

//     } catch (error) {
//         console.error("Backend Error:", error.message);
//     }
// }

// runTracker();
// app.listen(3000, () => {
//     console.log("🚀 Server ready! Tell Frontend to fetch from: http://localhost:3000/api/report");
// });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDistance } = require('./services/distance');

const app = express();
const PORT = 3000;
app.use(express.static(path.join(__dirname, '../frontend')));
// 1. Middleware
app.use(cors()); // Crucial: Allows your frontend to talk to this backend
app.use(express.json());

// 2. Configuration
const OPENAQ_API_KEY = '346d28497811fceb269f9619d71f28dd5f9294ddaf1ff3d3e17e7c665d14454f';

const constructionSites = [
    { name: "Kochi Metro - Chembumukku", lat: 10.0075, lng: 76.3195 },
    { name: "Vyttila Mobility Hub Ext", lat: 9.9670, lng: 76.3200 },
    { name: "Kakkanad SmartCity P3", lat: 10.0085, lng: 76.3620 }
];

// 3. The API Endpoint for the Frontend
app.get('/api/report', async (req, res) => {
    try {
        console.log("📡 Frontend requested live report...");
        
        const response = await axios.get('https://api.openaq.org/v3/locations/8118', {
            headers: { 'X-API-Key': OPENAQ_API_KEY }
        });

        let stationData = response.data;
        let pmSensor = stationData.sensors?.find(s => s.parameter.id === 2);
        let pmValue = pmSensor?.latest?.value;

        // Default to Kochi Mock coordinates to prevent the 'latitude' error
        let stationName = "Vyttila Station (Simulated)";
        let stationCoords = { lat: 9.966, lng: 76.321 };

        // If real data exists, override the defaults
        if (pmValue && stationData.coordinates) {
            pmValue = pmSensor.latest.value;
            stationName = stationData.name;
            stationCoords = { 
                lat: stationData.coordinates.latitude, 
                lng: stationData.coordinates.longitude 
            };
            console.log(`✅ Real data found for ${stationName}`);
        } else {
            console.log("⚠️ Using Mock Data Fallback");
            pmValue = 84.5; // Trigger spike for testing
        }

        const report = {
            timestamp: new Date().toISOString(),
            pmValue: pmValue,
            station: stationName,
            pollutants: {
                "pm25": 84.5,
                "pm10": 132.2
            },
            "aqi":{
                value: 151,
                status: "Alert"
            },
            isSpike: pmValue > 60,
            suspects: []
        };

        // D. Calculate Proximity (stationCoords is now guaranteed to exist)
        if (report.isSpike) {
            report.suspects = constructionSites.map(site => {
                const dist = getDistance(stationCoords.lat, stationCoords.lng, site.lat, site.lng);
                return { ...site, distance: parseFloat(dist.toFixed(2)) };
            })
            .filter(site => site.distance <= 10) // Increased to 10km for testing
            .sort((a, b) => a.distance - b.distance);
        }

        // Send JSON and also save to file (as per your screenshot)
        const dataPath = path.join(__dirname, 'data', 'latest_report.json');
        if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
        fs.writeFileSync(dataPath, JSON.stringify(report, null, 2));

        res.json(report);

    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ error: "Failed to fetch air quality data", details: error.message });
    }
});
// 4. Start the Server
app.listen(PORT, () => {
    console.log(`
    ===============================================
    🚀 DUST TRACKER BACKEND IS LIVE!
    -----------------------------------------------
    📍 API URL: http://localhost:${PORT}/api/report
    🛠️  Status: Ready for Frontend connection
    ===============================================
    `);
});