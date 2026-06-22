/**
 * 🔱 THIÊN NHÃN — Candidate Scoring & Anti-Cheat (Beats 11-15)
 * v1.0.1 — Fixed: hardcoded bigFive/mbti scores, hardcoded strengths/growth
 */

export function scoreSTARResponse(starResponse, criteria = {}) {
  if (!starResponse) throw new Error('STAR response required');
  const lower = starResponse.toLowerCase();
  const hasS = /tình huống|situation|context/.test(lower);
  const hasT = /nhiệm vụ|task|responsibility/.test(lower);
  const hasA = /đã làm|did|implemented/.test(lower);
  const hasR = /kết quả|result|achieved/.test(lower);
  const starCompliance = (hasS ? 1 : 0) + (hasT ? 1 : 0) + (hasA ? 1 : 0) + (hasR ? 1 : 0);
  const wordCount = starResponse.split(/\s+/).length;
  const sentences = (starResponse.match(/[.!?]/g) || []).length;
  const specificityBonus = /\d+%?|ví dụ|example|cụ thể/.test(lower) ? 2 : 0;
  const overallScore = (starCompliance / 4) * 8 + specificityBonus;
  return {
    starCompliance: starCompliance + '/4',
    wordCount,
    specificity: specificityBonus > 0 ? 'Good' : 'Generic',
    overallScore: Math.round(Math.min(10, overallScore) * 10) / 10,
    verdict: overallScore >= 7 ? 'Excellent' : overallScore >= 5 ? 'Good' : 'Weak'
  };
}

export function scoreBehavioralSignals(signals) {
  if (!signals) throw new Error('Signals required');
  const fillerRate = parseFloat(signals.fillerAnalysis?.fillerRate) || 0;
  const specificity = parseFloat(signals.confidence?.specificity) || 50;
  const avgWords = signals.speech?.avgWordsPerTurn || 25;
  const fillerScore = Math.max(0, 10 - fillerRate);
  const confidenceScore = (specificity / 100) * 10;
  const engagementScore = avgWords > 40 ? 9 : avgWords > 20 ? 7 : 4;
  const responsiveness = Math.min(10, (signals.engagement?.questionResponsiveness || 0) / 2);
  const overallScore = (fillerScore + confidenceScore + engagementScore + responsiveness) / 4;
  return {
    fillerScore: fillerScore.toFixed(1),
    confidenceScore: confidenceScore.toFixed(1),
    engagementScore,
    overallBehavioralScore: Math.round(overallScore * 10) / 10
  };
}

export function scoreCandidateOverall(allScores = {}, weights = {}) {
  const w = {
    star: weights.star || 0.25,
    behavioral: weights.behavioral || 0.25,
    disc: weights.disc || 0.2,
    bigFive: weights.bigFive || 0.15,
    mbti: weights.mbti || 0.15
  };
  // FIX: Read actual scores from allScores instead of hardcoding
  const scores = {
    star: allScores.star?.overallScore || 5,
    behavioral: allScores.behavioral?.overallBehavioralScore || 5,
    disc: allScores.disc?.overallScore || 5,
    bigFive: allScores.bigFive?.overallScore ?? allScores.bigFive?.summary?.dominantScore ?? 5,
    mbti: allScores.mbti?.overallScore ?? (allScores.mbti?.clarityAvg ? allScores.mbti.clarityAvg / 10 : 5)
  };
  let total = 0, weight = 0;
  for (const [k, v] of Object.entries(w)) {
    total += scores[k] * v;
    weight += v;
  }
  const overallScore = weight > 0 ? total / weight : 5;
  const ranking = overallScore >= 8 ? 'A+' : overallScore >= 7 ? 'A' : overallScore >= 6 ? 'B+' : overallScore >= 5 ? 'B' : 'C';
  const recommendation = overallScore >= 7 ? '✅ RECOMMEND' : overallScore >= 5 ? '⏳ CONSIDER' : '❌ PASS';

  // FIX: Compute strengths/growth from actual data
  const topStrengths = computeStrengths(allScores, scores);
  const areasForGrowth = computeGrowth(allScores, scores);

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    ranking,
    recommendation,
    componentScores: scores,
    topStrengths,
    areasForGrowth
  };
}

function computeStrengths(allScores, scores) {
  const strengths = [];
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  // Top 2 scoring areas
  for (const [key, val] of sorted.slice(0, 2)) {
    if (val >= 7) {
      const labels = { star: 'Strong STAR responses', behavioral: 'Good behavioral signals', disc: 'Clear personality profile', bigFive: 'Balanced personality', mbti: 'Strong type clarity' };
      strengths.push(labels[key] || key);
    }
  }
  // Add from DISC if available
  if (allScores.disc?.primary?.name) strengths.push(`${allScores.disc.primary.name} personality`);
  // Add from behavioral
  if (allScores.behavioral?.signals?.confidence?.includes('Confident')) strengths.push('Confident communicator');
  return strengths.length > 0 ? strengths.slice(0, 4) : ['Assessment data limited'];
}

function computeGrowth(allScores, scores) {
  const areas = [];
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  // Bottom 2 scoring areas
  for (const [key, val] of sorted.slice(0, 2)) {
    if (val < 6) {
      const labels = { star: 'Improve STAR answer structure', behavioral: 'Reduce hesitation, increase engagement', disc: 'Personality assessment incomplete', bigFive: 'Big Five assessment needed', mbti: 'MBTI clarity could improve' };
      areas.push(labels[key] || key);
    }
  }
  if (allScores.behavioral?.signals?.hesitation?.includes('High')) areas.push('Reduce filler words');
  if (allScores.star?.specificity === 'Generic') areas.push('Use specific numbers and examples');
  return areas.length > 0 ? areas.slice(0, 3) : ['Continue current development'];
}

export function applyHiringWisdom(candidateScore) {
  const wisdomDb = [
    'Hire for attitude, train for skill',
    'Past behavior predicts future behavior',
    'Diversity matters — hire for the team',
    'Onboarding and mentorship = success',
    'Reference checks are critical'
  ];
  const applicable = candidateScore.overallScore >= 7 ? [wisdomDb[0], wisdomDb[3]] : [wisdomDb[2]];
  return { applicableWisdom: applicable, totalWisdom: wisdomDb.length };
}

export function detectCheating(assessmentData) {
  const ad = assessmentData;
  const flags = [];
  if (ad.timeTaken < ad.expectedDuration * 0.5) {
    flags.push({ type: 'Fast timing', severity: 'HIGH' });
  }
  if (ad.answers?.every((a, i) => a === ad.expectedAnswers?.[i])) {
    flags.push({ type: 'Perfect score', severity: 'HIGH' });
  }
  const cheatScore = flags.length > 0 ? Math.min(100, flags.length * 50) : 0;
  return {
    suspiciousScore: cheatScore + '%',
    verdict: cheatScore > 50 ? '🚨 SUSPICIOUS' : '✅ LIKELY GENUINE',
    flags
  };
}

export const HIRING_WISDOM = {
  principles: [
    'Culture fit = skill fit',
    'Past behavior → future',
    'Team > individual',
    'Onboarding matters',
    'Check references'
  ]
};

export default {
  scoreSTARResponse,
  scoreBehavioralSignals,
  scoreCandidateOverall,
  applyHiringWisdom,
  detectCheating,
  HIRING_WISDOM
};
