/**
 * 🔱 THIÊN NHÃN — Personality Profiler
 * Beat 6/18 | Module: personality-profiler.mjs
 * 
 * All-in-one engine for DISC, Big Five OCEAN, and MBTI assessments.
 * Loads questions from knowledge/ JSON files, scores answers, generates profiles.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(__dirname, '..', '..', 'knowledge');

// ═══════════════════════════════════════════
// DATA LOADERS
// ═══════════════════════════════════════════

function loadJSON(filename) {
  try {
    const raw = readFileSync(join(KNOWLEDGE_DIR, filename), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Cannot load ${filename}: ${err.message}`);
  }
}

let _disc, _bigFive, _mbti;
function getDisc()    { return _disc    || (_disc    = loadJSON('disc-questions.json')); }
function getBigFive() { return _bigFive || (_bigFive = loadJSON('big-five-questions.json')); }
function getMbti()    { return _mbti    || (_mbti    = loadJSON('mbti-questions.json')); }

// ═══════════════════════════════════════════
// DISC PROFILER
// ═══════════════════════════════════════════

/**
 * Score DISC assessment
 * @param {Array<string>} answers - Array of selected traits: ['D','I','S','C',...] (40 items)
 * @returns {Object} DISC profile
 */
export function scoreDISC(answers) {
  if (!answers || !Array.isArray(answers)) throw new Error('Answers must be an array');
  
  const disc = getDisc();
  const validTraits = ['D', 'I', 'S', 'C'];
  
  // Count trait selections
  const counts = { D: 0, I: 0, S: 0, C: 0 };
  const total = answers.length;
  
  for (const ans of answers) {
    const trait = String(ans).toUpperCase();
    if (validTraits.includes(trait)) {
      counts[trait]++;
    }
  }

  // Normalize to percentages (floor to avoid >100 from rounding)
  const pct = {};
  let remaining = 100;
  const sorted2 = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < sorted2.length; i++) {
    const [t, c] = sorted2[i];
    if (i === sorted2.length - 1) {
      pct[t] = Math.max(0, remaining); // last gets remainder
    } else {
      pct[t] = total > 0 ? Math.floor((c / total) * 100) : 0;
      remaining -= pct[t];
    }
  }

  // Determine primary and secondary
  const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];
  const combinedCode = primary + secondary;

  // Get profile details from knowledge
  const profiles = disc.scoring.profiles;
  const combined = disc.scoring.combinedProfiles;
  const roleFit = disc.scoring.roleFitMapping;

  const primaryProfile = profiles[primary];
  const combinedProfile = combined[combinedCode] || null;

  // Role fit analysis
  const roleFitResults = {};
  for (const [role, mapping] of Object.entries(roleFit)) {
    let fit = 'neutral';
    if (mapping.ideal.includes(primary) || mapping.ideal.includes(combinedCode)) fit = 'ideal';
    else if (mapping.good.includes(primary) || mapping.good.includes(combinedCode)) fit = 'good';
    else if (mapping.caution.includes(primary) || mapping.caution.includes(combinedCode)) fit = 'caution';
    roleFitResults[role] = fit;
  }

  return {
    type: 'DISC',
    scores: pct,
    counts,
    totalAnswered: total,
    primary: {
      code: primary,
      ...primaryProfile
    },
    secondary: {
      code: secondary,
      ...profiles[secondary]
    },
    combinedCode,
    combinedProfile,
    roleFit: roleFitResults,
    chart: {
      D: '█'.repeat(Math.round(pct.D / 5)) + '░'.repeat(20 - Math.round(pct.D / 5)),
      I: '█'.repeat(Math.round(pct.I / 5)) + '░'.repeat(20 - Math.round(pct.I / 5)),
      S: '█'.repeat(Math.round(pct.S / 5)) + '░'.repeat(20 - Math.round(pct.S / 5)),
      C: '█'.repeat(Math.round(pct.C / 5)) + '░'.repeat(20 - Math.round(pct.C / 5))
    }
  };
}

// ═══════════════════════════════════════════
// BIG FIVE OCEAN PROFILER
// ═══════════════════════════════════════════

/**
 * Score Big Five OCEAN assessment
 * @param {Array<number>} answers - Likert 1-5 responses for 50 questions
 * @returns {Object} Big Five profile
 */
export function scoreBigFive(answers) {
  if (!answers || !Array.isArray(answers)) throw new Error('Answers must be an array');
  
  const bf = getBigFive();
  const factors = { O: [], C: [], E: [], A: [], N: [] };
  
  for (let i = 0; i < Math.min(answers.length, bf.questions.length); i++) {
    const q = bf.questions[i];
    let score = Number(answers[i]);
    
    if (isNaN(score) || score < 1 || score > 5) score = 3; // neutral default
    
    // Reverse-scored items
    if (q.reverse) score = 6 - score;
    
    factors[q.factor].push(score);
  }

  // Calculate raw and normalized scores
  const results = {};
  const factorDetails = bf.scoring.factors;
  
  for (const [factor, scores] of Object.entries(factors)) {
    const sum = scores.reduce((a, b) => a + b, 0);
    const max = scores.length * 5;
    const min = scores.length * 1;
    const normalized = max > min ? Math.round(((sum - min) / (max - min)) * 100) : 50;
    
    const detail = factorDetails[factor];
    const level = normalized >= 70 ? 'HIGH' : normalized >= 40 ? 'MODERATE' : 'LOW';
    const traits = level === 'HIGH' ? detail.highTraits : detail.lowTraits;
    
    results[factor] = {
      name: detail.name,
      nameVi: detail.nameVi,
      emoji: detail.emoji,
      raw: sum,
      normalized,
      level,
      questionsAnswered: scores.length,
      traits,
      careers: detail.careers,
      strength: detail.strength,
      weakness: detail.weakness,
      chart: '█'.repeat(Math.round(normalized / 5)) + '░'.repeat(20 - Math.round(normalized / 5))
    };
  }

  // Overall profile summary
  const highFactors = Object.entries(results).filter(([, v]) => v.level === 'HIGH').map(([k]) => k);
  const lowFactors = Object.entries(results).filter(([, v]) => v.level === 'LOW').map(([k]) => k);

  return {
    type: 'BIG_FIVE',
    factors: results,
    summary: {
      highFactors,
      lowFactors,
      totalAnswered: answers.length,
      dominantFactor: Object.entries(results).sort((a, b) => b[1].normalized - a[1].normalized)[0][0],
      weakestFactor: Object.entries(results).sort((a, b) => a[1].normalized - b[1].normalized)[0][0]
    },
    workplaceInsight: generateBigFiveInsight(results)
  };
}

function generateBigFiveInsight(results) {
  const insights = [];
  
  if (results.C.level === 'HIGH' && results.N.level === 'LOW') {
    insights.push('Ứng viên rất phù hợp vai trò cần kỷ luật + ổn định: Kế toán, Hành chính, QA');
  }
  if (results.E.level === 'HIGH' && results.A.level === 'HIGH') {
    insights.push('Ứng viên phù hợp vai trò tiếp xúc khách hàng: Sales, HR, Customer Success');
  }
  if (results.O.level === 'HIGH') {
    insights.push('Ứng viên sáng tạo, thích thử nghiệm — phù hợp R&D, Marketing, Design');
  }
  if (results.N.level === 'HIGH') {
    insights.push('Cần lưu ý: mức Neuroticism cao — có thể gặp khó khăn dưới áp lực cao');
  }
  if (results.C.level === 'LOW') {
    insights.push('Cần lưu ý: Conscientiousness thấp — deadline và organization có thể là thách thức');
  }
  
  return insights.length > 0 ? insights : ['Profile cân bằng — phù hợp nhiều vai trò khác nhau'];
}

// ═══════════════════════════════════════════
// MBTI PROFILER
// ═══════════════════════════════════════════

/**
 * Score MBTI assessment
 * @param {Array<string>} answers - 'A' or 'B' for each question
 * @returns {Object} MBTI profile
 */
export function scoreMBTI(answers) {
  if (!answers || !Array.isArray(answers)) throw new Error('Answers must be an array');
  
  const mbti = getMbti();
  const dims = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  
  for (let i = 0; i < Math.min(answers.length, mbti.questions.length); i++) {
    const q = mbti.questions[i];
    const ans = String(answers[i]).toUpperCase();
    
    if (ans === 'A') {
      dims[q.option_A.type]++;
    } else if (ans === 'B') {
      dims[q.option_B.type]++;
    }
  }

  // Determine type
  const EI = dims.E >= dims.I ? 'E' : 'I';
  const SN = dims.S >= dims.N ? 'S' : 'N';
  const TF = dims.T >= dims.F ? 'T' : 'F';
  const JP = dims.J >= dims.P ? 'J' : 'P';
  const typeCode = EI + SN + TF + JP;

  // Clarity scores (how clear the preference is)
  const total = answers.length;
  const clarity = {
    EI: total > 0 ? Math.round(Math.abs(dims.E - dims.I) / (dims.E + dims.I || 1) * 100) : 0,
    SN: total > 0 ? Math.round(Math.abs(dims.S - dims.N) / (dims.S + dims.N || 1) * 100) : 0,
    TF: total > 0 ? Math.round(Math.abs(dims.T - dims.F) / (dims.T + dims.F || 1) * 100) : 0,
    JP: total > 0 ? Math.round(Math.abs(dims.J - dims.P) / (dims.J + dims.P || 1) * 100) : 0
  };

  // Get type profile
  const types = mbti.scoring.types;
  const profile = types[typeCode] || { name: 'Unknown', nameVi: 'Không xác định', traits: [] };

  // Dimension descriptions
  const dimDescs = mbti.dimensions;

  return {
    type: 'MBTI',
    typeCode,
    profile: {
      ...profile,
      code: typeCode
    },
    dimensions: {
      EI: { selected: EI, score: { E: dims.E, I: dims.I }, clarity: clarity.EI, description: dimDescs.EI },
      SN: { selected: SN, score: { S: dims.S, N: dims.N }, clarity: clarity.SN, description: dimDescs.SN },
      TF: { selected: TF, score: { T: dims.T, F: dims.F }, clarity: clarity.TF, description: dimDescs.TF },
      JP: { selected: JP, score: { J: dims.J, P: dims.P }, clarity: clarity.JP, description: dimDescs.JP }
    },
    totalAnswered: answers.length,
    clarityAvg: Math.round((clarity.EI + clarity.SN + clarity.TF + clarity.JP) / 4),
    uncertainDimensions: Object.entries(clarity).filter(([, v]) => v < 20).map(([k]) => k)
  };
}

// ═══════════════════════════════════════════
// COMBINED PROFILER
// ═══════════════════════════════════════════

/**
 * Run all three assessments and produce combined insight
 */
export function combinedProfile(discAnswers, bigFiveAnswers, mbtiAnswers) {
  const discResult = scoreDISC(discAnswers);
  const bfResult = scoreBigFive(bigFiveAnswers);
  const mbtiResult = scoreMBTI(mbtiAnswers);

  // Cross-validate consistency
  const consistency = [];
  
  // DISC D high ↔ Big Five E high + A low
  if (discResult.scores.D > 30 && bfResult.factors.E.level === 'HIGH') {
    consistency.push({ match: true, note: 'DISC Dominance + Big Five Extraversion — consistent leadership signal' });
  }
  
  // DISC I high ↔ MBTI E
  if (discResult.scores.I > 30 && mbtiResult.typeCode[0] === 'E') {
    consistency.push({ match: true, note: 'DISC Influence + MBTI Extraversion — consistent social orientation' });
  }
  
  // DISC S high ↔ Big Five A high
  if (discResult.scores.S > 30 && bfResult.factors.A.level === 'HIGH') {
    consistency.push({ match: true, note: 'DISC Steadiness + Big Five Agreeableness — consistent cooperation signal' });
  }
  
  // DISC C high ↔ Big Five C high
  if (discResult.scores.C > 30 && bfResult.factors.C.level === 'HIGH') {
    consistency.push({ match: true, note: 'DISC Compliance + Big Five Conscientiousness — consistent detail-oriented signal' });
  }

  // Contradictions
  if (discResult.scores.D > 30 && mbtiResult.typeCode[0] === 'I') {
    consistency.push({ match: false, note: '⚠️ DISC Dominance cao nhưng MBTI Introvert — có thể assertive nhưng private' });
  }

  return {
    disc: discResult,
    bigFive: bfResult,
    mbti: mbtiResult,
    crossValidation: consistency,
    consistencyScore: consistency.length > 0 
      ? Math.round(consistency.filter(c => c.match).length / consistency.length * 100) 
      : 50,
    overallStrengths: [
      ...discResult.primary.strengths.slice(0, 2),
      ...bfResult.factors[bfResult.summary.dominantFactor].strength.slice(0, 2),
      ...(mbtiResult.profile.strength || []).slice(0, 2)
    ],
    overallChallenges: [
      ...discResult.primary.weaknesses.slice(0, 1),
      ...bfResult.factors[bfResult.summary.weakestFactor].weakness.slice(0, 1),
      ...(mbtiResult.profile.challenge || []).slice(0, 1)
    ]
  };
}

// ═══════════════════════════════════════════
// QUESTION GETTERS (for CLI/UI)
// ═══════════════════════════════════════════

export function getDISCQuestions() {
  const disc = getDisc();
  return { questions: disc.questions, instructions: disc.instructions, total: disc.questions.length };
}

export function getBigFiveQuestions() {
  const bf = getBigFive();
  return { questions: bf.questions, instructions: bf.instructions, scale: bf.scale, total: bf.questions.length };
}

export function getMBTIQuestions() {
  const mbti = getMbti();
  return { questions: mbti.questions, instructions: mbti.instructions, total: mbti.questions.length };
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════

export default {
  scoreDISC,
  scoreBigFive,
  scoreMBTI,
  combinedProfile,
  getDISCQuestions,
  getBigFiveQuestions,
  getMBTIQuestions
};
