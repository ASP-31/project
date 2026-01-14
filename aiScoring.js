/**
 * Source Attribution AI Engine (Rule-based, Explainable)
 * -----------------------------------------------
 * This module assigns an AI-like confidence score to
 * suspected pollution sources based on transparent rules.
 *
 * This is NOT ML or LLM-based.
 * This is how real governance dashboards work.
 */

function scoreSuspect({ distance, type }, pm25) {
  let score = 0;
  let reasons = [];

  // 1️⃣ Distance factor
  if (distance < 0.5) {
    score += 35;
    reasons.push("Very close to monitoring station");
  } else if (distance < 2) {
    score += 25;
    reasons.push("Within moderate proximity");
  } else {
    score += 10;
    reasons.push("Farther from station");
  }

  // 2️⃣ Site type factor
  const highImpact = ["Infrastructure", "Industrial", "Roadwork"];
  if (highImpact.includes(type)) {
    score += 30;
    reasons.push(`${type} activities generate dust/emissions`);
  } else {
    score += 15;
    reasons.push(`${type} has lower emission potential`);
  }

  // 3️⃣ PM severity factor
  if (pm25 > 120) {
    score += 25;
    reasons.push("Severe PM spike detected");
  } else if (pm25 > 80) {
    score += 15;
    reasons.push("Moderate PM spike detected");
  }

  // Clamp score to 100
  score = Math.min(score, 100);

  // Confidence label
  let confidence = "Low";
  if (score >= 70) confidence = "High";
  else if (score >= 45) confidence = "Medium";

  return {
    score,
    confidence,
    reasoning: reasons
  };
}

module.exports = { scoreSuspect };
