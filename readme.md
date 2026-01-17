

# 🌬️ Air Quality Intelligence System (AQIS)

> **AI-Powered Pollution Source Attribution & Geospatial Monitoring**

AQIS is a comprehensive environmental monitoring solution that transforms raw particulate matter data into actionable intelligence. By using a custom **AI Attribution Engine**, the system identifies potential industrial sources of pollution spikes, enabling data-driven accountability.

---

## Key Features

* **Real-Time Monitoring:** Live dashboard for **PM2.5, PM10, and AQI** across multiple urban centers (Ernakulam, Delhi, Mumbai).
* **AI Source Attribution:** Proprietary scoring engine that identifies "Suspect Sites" (factories, construction zones) based on pollution levels and proximity.
* **Live Incident Map:** Interactive Leaflet.js integration showing monitoring stations and flagged suspect sites with dynamic "Fly-To" navigation.
* **Admin Governance Panel:** Secure portal for environmental administrators to review crowdsourced reports and manage the suspect database.
* **Incident History & Log:** Persistent storage of past pollution violations for long-term trend analysis.

---

## System Architecture

The project utilizes a **Client-Server Architecture** optimized for low-latency updates:

1. **Data Layer:** Fetches real-time sensor feeds via the OpenWeatherMap API.
2. **Logic Layer (Node.js/Express):** Processes raw data through an AI-scoring algorithm to calculate suspect confidence levels.
3. **Persistence Layer:** Uses `localStorage` for session history, incident logs, and admin moderation queues.
4. **Presentation Layer:** Responsive UI built with Tailwind CSS and dynamic mapping via Leaflet.js.

---

## Tech Stack

* Frontend: HTML5, Tailwind CSS, JavaScript (ES6+), Leaflet.js
* Backend: Node.js, Express.js
* Data Source: OpenWeatherMap API
* Development AI: Google Gemini (Logic Optimization & Data Structuring)

---

## ⚙️ Installation

1. Clone the repository
```bash
git clone https://github.com/ASP-31/project


```


2. **Install dependencies**
```bash
npm install

```


3. **Start the server**
```bash
node server.js

```


4. **Launch the Dashboard**
Open `dashboard.html` in your preferred web browser.

---

## 📈 Future Roadmap

* **Wind Correlation:** Integrating real-time wind speed/direction to track plume trajectories.
* **IoT Integration:** Connecting custom hardware sensor meshes (ESP32/Arduino).
* **Predictive AI:** Implementation of LSTM models to forecast AQI trends 24 hours in advance.


