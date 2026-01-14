// backend/services/aiScoring.js
function scoreSuspect({ distance, type }, pm25) {
    let score = 0;
    let reasons = [];

    // 1. Proximity
    if (distance < 1.0) { score += 40; reasons.push("Critical proximity (<1km)"); }
    else if (distance < 3.0) { score += 20; reasons.push("Moderate proximity (1-3km)"); }
    else { score += 5; reasons.push("Extended radius (>3km)"); }

    // 2. Activity Type
    const highRisk = ["Infrastructure", "Industrial", "Roadwork", "Commercial"];
    if (highRisk.includes(type)) { score += 30; reasons.push(`${type} activity detected`); }
    else { score += 10; reasons.push("Low-emission site profile"); }

    // 3. PM Intensity
    if (pm25 > 100) { score += 30; reasons.push("High PM concentration supports attribution"); }
    else if (pm25 > 60) { score += 15; reasons.push("Moderate PM levels detected"); }

    score = Math.min(score, 100);
    let confidence = "Low";
    if (score >= 75) confidence = "High";
    else if (score >= 45) confidence = "Medium";

    return { score, confidence, reasoning: reasons };
}

module.exports = { scoreSuspect };