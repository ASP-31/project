// frontend/services/storage.js

(function () {
  const INCIDENT_HISTORY_KEY = 'incidentHistory';
  const INCIDENT_REPORT_KEY = 'incidentReport';

  const StorageService = {
    /* ===========================
       INCIDENT HISTORY
       =========================== */

    getHistory() {
      return JSON.parse(localStorage.getItem(INCIDENT_HISTORY_KEY)) || [];
    },

    saveToHistory(data) {
      const history = this.getHistory();

      history.push({
        station: data.station,
        pm25: data.pm25,
        pm10: data.pm10,
        aqi: data.aqi,
        timestamp: data.timestamp,
        spikeDetectedAt: data.spikeDetectedAt,
        suspects: data.suspects
      });

      localStorage.setItem(INCIDENT_HISTORY_KEY, JSON.stringify(history));
    },

    deleteFromHistory(index) {
      const history = this.getHistory();
      history.splice(index, 1);
      localStorage.setItem(INCIDENT_HISTORY_KEY, JSON.stringify(history));
    },

    clearHistory() {
      localStorage.removeItem(INCIDENT_HISTORY_KEY);
    },

    /* ===========================
       ACTIVE INCIDENT
       =========================== */

    setActiveIncident(data) {
      localStorage.setItem(INCIDENT_REPORT_KEY, JSON.stringify(data));
    },

    getActiveIncident() {
      return JSON.parse(localStorage.getItem(INCIDENT_REPORT_KEY));
    }
  };

  // Expose globally
  window.StorageService = StorageService;
})();
