const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getDistance } = require('./services/distance');

const OPENAQ_API_KEY = '346d28497811fceb269f9619d71f28dd5f9294ddaf1ff3d3e17e7c665d14454f';//Open AQ API Key

const constructionSites = [
    { name: "Kochi Metro - Chembumukku", lat: 10.0075, lng: 76.3195 },
    { name: "Vyttila Mobility Hub Ext", lat: 9.9670, lng: 76.3200 },
    { name: "Kakkanad SmartCity P3", lat: 10.0085, lng: 76.3620 }
]; // Example construction sites

async function runTracker() {
    try {
        console.log("Checking Ernakulam Air Quality...");
        const response = await axios.get('https://api.openaq.org/v3/locations', { //fetch locations
            params: { coordinates: "9.98,76.28", radius: 10000, parameters_id: 2 },// PM2.5 parameter
            headers: { 'X-API-Key': OPENAQ_API_KEY }
        });

        let station = null; // Station with valid PM2.5 data
        let pmValue = null; // PM2.5 value

        // Try to find real data
        if (response.data.results?.length > 0) { // Check if results exist
            const validLoc = response.data.results.find(loc => 
                loc.sensors.some(s => s.parameter.id === 2 && s.latest)
            );
            if (validLoc) {
                station = validLoc;
                pmValue = validLoc.sensors.find(s => s.parameter.id === 2).latest.value;
            }
        }

        // FALLBACK: If API has no live data, generate "Mock Data" for testing
        if (!station) {
            console.log("⚠️ No live data found. Generating Mock Spike for Ernakulam...");
            station = { name: "Vyttila (Simulated)", coordinates: { latitude: 9.96, longitude: 76.32 } };
            pmValue = 84; // High value to trigger a spike
        }

        const report = {
            timestamp: new Date().toISOString(),
            pmValue: pmValue,
            station: station.name,
            isSpike: pmValue > 60,
            suspects: []
        };

        if (report.isSpike) {
            report.suspects = constructionSites.filter(site => {
                const dist = getDistance(station.coordinates.latitude, station.coordinates.longitude, site.lat, site.lng);
                return dist <= 3; 
            }).map(s => ({ ...s, distance: getDistance(station.coordinates.latitude, station.coordinates.longitude, s.lat, s.lng).toFixed(2) }));
        }

        const dataPath = path.join(__dirname, 'data', 'latest_report.json');
        if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(report, null, 2));

        console.log(`✅ Report Saved: PM2.5 at ${station.name} is ${pmValue}`);

    } catch (error) {
        console.error("Backend Error:", error.message);
    }
}

runTracker();