/**
 * 🔱 THIÊN NHÃN — Interview Analyzer
 * Beat 10/18 | Module: interview-analyzer.mjs
 * 
 * Core engine for analyzing interview recordings (audio/video).
 * Features: Transcript extraction, keyword analysis, behavioral signals (speaker rate, filler words, hesitation).
 * Works with whisper for STT, can integrate with video frame extraction.
 */

import { existsSync, readFileSync } from 'fs';
import { extname } from 'path';

// ═══════════════════════════════════════════
// INTERVIEW ANALYSIS ORCHESTRATOR
// ═══════════════════════════════════════════

/**
 * Prepare interview for analysis
 * @param {string} filePath - Path to audio/video file
 * @param {Object} options - Analysis options
 * @returns {Object} Prepared analysis config
 */
export function prepareInterviewAnalysis(filePath, options = {}) {
  if (!filePath || !existsSync(filePath)) {
    throw new Error(`Interview file not found: ${filePath}`);
  }

  const ext = extname(filePath).toLowerCase();
  const isAudio = ['.mp3', '.wav', '.m4a', '.ogg'].includes(ext);
  const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);

  if (!isAudio && !isVideo) {
    throw new Error(`Unsupported file format: ${ext}. Use audio (mp3/wav/m4a/ogg) or video (mp4/mov/avi/mkv/webm).`);
  }

  const { 
    jobDescription = '', 
    role = '', 
    duration = null,
    interviewType = 'behavioral', // behavioral, technical, competency, culture
    language = 'vi'
  } = options;

  return {
    filePath,
    fileType: isAudio ? 'audio' : 'video',
    jobDescription,
    role,
    duration,
    interviewType,
    language,
    nextStep: 'Run STT (Whisper) to extract transcript',
    estimatedDuration: duration || '(extract from file)',
    analysis: {
      transcript: null,
      keywords: null,
      behavioral: null,
      scoring: null
    }
  };
}

// ═══════════════════════════════════════════
// TRANSCRIPT PROCESSING
// ═══════════════════════════════════════════

/**
 * Parse transcript (can be from Whisper or manual)
 * @param {string} transcriptText - Raw transcript
 * @param {Object} options - Processing options
 * @returns {Object} Structured transcript with metadata
 */
export function parseTranscript(transcriptText, options = {}) {
  if (!transcriptText || typeof transcriptText !== 'string') {
    throw new Error('Transcript must be a non-empty string');
  }

  const { 
    role = 'candidate',
    language = 'vi'
  } = options;

  // Split into speaker turns (heuristic: "Speaker:" or timestamp)
  const turns = transcriptText
    .split(/(?=Speaker:|Interviewer:|Candidate:|^\[\d{2}:\d{2}:\d{2}\])/m)
    .filter(t => t.trim().length > 0)
    .map(turn => {
      // FIX: Support Vietnamese names + limit length to avoid false matches
      const speakerMatch = turn.match(/^(Speaker\s*\d*|Interviewer|Candidate|[A-Za-zÀ-ỹ\s]{2,25}):/);
      const speaker = speakerMatch ? speakerMatch[1].trim() : 'Unknown';
      const text = turn.replace(/^(?:Speaker\s*\d*|Interviewer|Candidate|[A-Za-zÀ-ỹ\s]{2,25}):/, '').trim();
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const sentenceCount = (text.match(/[.!?]/g) || []).length;
      
      return {
        speaker,
        text,
        wordCount,
        sentenceCount,
        avgWordsPerSentence: sentenceCount > 0 ? wordCount / sentenceCount : wordCount,
        duration: null
      };
    });

  // Calculate statistics
  const candidateTurns = turns.filter(t => 
    t.speaker.toLowerCase().includes('candidate') || 
    t.speaker.toLowerCase() === role.toLowerCase()
  );
  
  const totalCandidateWords = candidateTurns.reduce((sum, t) => sum + t.wordCount, 0);
  const avgTurnLength = candidateTurns.length > 0 ? totalCandidateWords / candidateTurns.length : 0;
  const avgSentenceLength = candidateTurns.reduce((sum, t) => sum + t.avgWordsPerSentence, 0) / (candidateTurns.length || 1);

  return {
    fullTranscript: transcriptText,
    turns: candidateTurns,
    totalTurns: candidateTurns.length,
    totalWords: totalCandidateWords,
    statistics: {
      avgTurnLength: Math.round(avgTurnLength),
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      totalSentences: candidateTurns.reduce((sum, t) => sum + t.sentenceCount, 0)
    },
    allTurns: turns
  };
}

// ═══════════════════════════════════════════
// KEYWORD & TOPIC EXTRACTION
// ═══════════════════════════════════════════

/**
 * Extract keywords and themes from transcript
 * @param {Object} parsedTranscript - Parsed transcript from parseTranscript()
 * @param {Object} options - Extraction options
 * @returns {Object} Keywords and themes
 */
export function extractKeywords(parsedTranscript, options = {}) {
  if (!parsedTranscript || !parsedTranscript.fullTranscript) {
    throw new Error('Parsed transcript required');
  }

  const { 
    topN = 15,
    language = 'vi'
  } = options;

  const text = parsedTranscript.fullTranscript.toLowerCase();
  
  // Common stop words (Vi)
  const stopWords = new Set([
    'và', 'hoặc', 'là', 'các', 'cái', 'được', 'bị', 'để', 'có', 'không', 'có được',
    'như', 'nên', 'nhưng', 'tại', 'từ', 'với', 'trong', 'trên', 'dưới', 'giữa',
    'cũng', 'thì', 'hay', 'khi', 'nếu', 'mà', 'sao', 'gì', 'ai', 'nào', 'bao',
    'a', 'an', 'and', 'the', 'of', 'to', 'in', 'is', 'it', 'that', 'or', 'by',
    'i', 'you', 'he', 'she', 'we', 'they', 'be', 'have', 'has', 'do', 'does'
  ]);

  // Extract words
  const words = text
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .map(w => w.replace(/[^\w]/g, ''));

  // Count frequencies
  const freq = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Sort by frequency
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, frequency: count, percentage: Math.round(count / words.length * 100 * 100) / 100 }));

  // Detect themes
  const themes = {
    positive: detectPositiveThemes(text),
    negative: detectNegativeThemes(text),
    technical: detectTechnicalThemes(text),
    teamwork: detectTeamworkThemes(text),
    leadership: detectLeadershipThemes(text)
  };

  return {
    topKeywords: sorted,
    themes,
    totalUniqueWords: Object.keys(freq).length,
    totalWords: words.length,
    vocabularyRichness: (Object.keys(freq).length / words.length * 100).toFixed(2) + '%'
  };
}

function detectPositiveThemes(text) {
  const indicators = ['success', 'thành công', 'achieved', 'đạt được', 'proud', 'tự hào', 'improved', 'cải thiện', 'learned', 'học được', 'great', 'tốt', 'excellent', 'xuất sắc', 'happy', 'vui'];
  return indicators.filter(ind => text.includes(ind.toLowerCase())).length;
}

function detectNegativeThemes(text) {
  const indicators = ['failed', 'thất bại', 'difficult', 'khó khăn', 'problem', 'vấn đề', 'mistake', 'lỗi', 'conflict', 'xung đột', 'stressed', 'căng thẳng'];
  return indicators.filter(ind => text.includes(ind.toLowerCase())).length;
}

function detectTechnicalThemes(text) {
  const indicators = ['code', 'mã', 'debug', 'test', 'api', 'database', 'sql', 'system', 'hệ thống', 'algorithm', 'thuật toán'];
  return indicators.filter(ind => text.includes(ind.toLowerCase())).length;
}

function detectTeamworkThemes(text) {
  const indicators = ['team', 'nhóm', 'collaborate', 'cộng tác', 'together', 'cùng', 'communication', 'giao tiếp', 'support', 'hỗ trợ', 'cooperation', 'hợp tác'];
  return indicators.filter(ind => text.includes(ind.toLowerCase())).length;
}

function detectLeadershipThemes(text) {
  const indicators = ['lead', 'dẫn dắt', 'manage', 'quản lý', 'decision', 'quyết định', 'responsibility', 'trách nhiệm', 'initiative', 'chủ động', 'mentor', 'hướng dẫn'];
  return indicators.filter(ind => text.includes(ind.toLowerCase())).length;
}

// ═══════════════════════════════════════════
// BEHAVIORAL SIGNAL ANALYSIS
// ═══════════════════════════════════════════

/**
 * Analyze behavioral signals from transcript
 * @param {Object} parsedTranscript - Parsed transcript
 * @returns {Object} Behavioral metrics
 */
export function analyzeBehavioralSignals(parsedTranscript) {
  if (!parsedTranscript || !parsedTranscript.turns) {
    throw new Error('Parsed transcript with turns required');
  }

  // Filler words (hesitation)
  const fillerWords = {
    vi: ['ồ', 'ộ', 'ị', 'ũ', 'à', 'ừ', 'eh', 'hơi', 'kiểu', 'như'],
    en: ['um', 'uh', 'ah', 'like', 'you know', 'sort of', 'kind of', 'basically', 'literally']
  };

  const allFillers = [...fillerWords.vi, ...fillerWords.en];
  let fillerCount = 0;
  let fillerTurnsCount = 0;

  const turns = parsedTranscript.turns || [];
  for (const turn of turns) {
    const turnLower = turn.text.toLowerCase();
    const turnFillers = allFillers.filter(f => turnLower.includes(f.toLowerCase())).length;
    if (turnFillers > 0) {
      fillerCount += turnFillers;
      fillerTurnsCount += 1;
    }
  }

  // Hesitation patterns (ellipsis, pause indicators)
  const hesitationMarkers = (parsedTranscript.fullTranscript.match(/\.\.\.|pauseMs\(\d+\)/g) || []).length;

  // Question responsiveness (turns per question assuming interviewer asks)
  const totalTurns = turns.length;
  const avgWordsPerTurn = parsedTranscript.statistics.avgTurnLength;

  // Confidence signals (short/long turns, specificity)
  let specificAnswers = 0;
  let vagueAnswers = 0;
  for (const turn of turns) {
    const hasNumbers = /\d+/.test(turn.text);
    const hasSpecificDetails = /tên|số|ngày|tháng|năm|ví dụ|cụ thể/.test(turn.text.toLowerCase());
    if (hasNumbers || hasSpecificDetails) specificAnswers++;
    // FIX: Removed 'lẳng lơ' (irrelevant), 'gì' (too broad), 'chưa' (too common)
    if (turn.wordCount < 10 || /không biết|chưa rõ|không chắc|không nhớ/.test(turn.text.toLowerCase())) vagueAnswers++;
  }

  // Response latency (if timestamps available, otherwise estimate)
  const avgLatency = 'N/A'; // Would need timestamp data

  return {
    fillerAnalysis: {
      totalFillers: fillerCount,
      turnsWithFillers: fillerTurnsCount,
      fillerRate: turns.length > 0 ? (fillerTurnsCount / turns.length * 100).toFixed(1) + '%' : '0%',
      interpretation: fillerTurnsCount / (turns.length || 1) > 0.3 ? 'High hesitation' : 'Low hesitation'
    },
    hesitationMarkers,
    confidence: {
      specificAnswers,
      vagueAnswers,
      specificity: turns.length > 0 ? (specificAnswers / turns.length * 100).toFixed(1) + '%' : '0%',
      signal: specificAnswers > vagueAnswers ? 'Confident, specific' : 'Vague, hesitant'
    },
    speech: {
      avgWordsPerTurn,
      totalTurns,
      avgWordsPerTurnInterpretation: avgWordsPerTurn > 50 ? 'Verbose, detailed' : avgWordsPerTurn > 20 ? 'Moderate' : 'Brief, direct'
    },
    engagement: {
      questionResponsiveness: totalTurns,
      avgResponseLength: avgWordsPerTurn,
      signal: avgWordsPerTurn > 30 ? 'Engaged, thorough' : 'Minimal, guarded'
    }
  };
}

// ═══════════════════════════════════════════
// STAR ANSWER DETECTION
// ═══════════════════════════════════════════

/**
 * Detect if answer follows STAR framework
 * @param {string} answerText - A single answer from transcript
 * @returns {Object} STAR compliance check
 */
export function detectSTARStructure(answerText) {
  if (!answerText || typeof answerText !== 'string') {
    throw new Error('Answer text required');
  }

  const lower = answerText.toLowerCase();
  const viIndicators = {
    situation: /tình huống|bối cảnh|khi đó|lúc đó|đó là|story|câu chuyện|dự án|vấn đề/,
    task: /nhiệm vụ|công việc|trách nhiệm|yêu cầu|mục tiêu|cần phải/,
    action: /tôi đã|em đã|làm|thực hiện|quyết định|giải quyết|áp dụng|đề xuất/,
    result: /kết quả|thành công|đạt được|cải thiện|học được|nhân được|phúc|tôi|người/
  };

  const enIndicators = {
    situation: /situation|context|when|at the time|problem|project/,
    task: /task|responsibility|goal|objective|assignment|required/,
    action: /i did|i implemented|i decided|i used|i proposed|i created/,
    result: /result|achieved|improved|learned|increased|reduced/
  };

  // FIX: Detect Vietnamese by diacritics, not just 'tôi'
  const isVietnamese = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/.test(lower)
    || /\b(em|tôi|mình|anh|chị)\b/.test(lower);
  
  const indicators = Object.keys(isVietnamese ? viIndicators : enIndicators);
  const detected = {};
  for (const key of indicators) {
    const pattern = isVietnamese ? viIndicators[key] : enIndicators[key];
    detected[key] = pattern.test(lower);
  }

  const score = Object.values(detected).filter(Boolean).length;
  const maxScore = 4;

  return {
    detected,
    score: score + '/' + maxScore,
    compliance: score >= 3 ? 'Good STAR' : score >= 2 ? 'Partial STAR' : 'Weak STAR',
    suggestion: score < 4 ? `Missing: ${Object.entries(detected).filter(([_, v]) => !v).map(([k]) => k).join(', ')}` : 'Complete STAR answer'
  };
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════

export default {
  prepareInterviewAnalysis,
  parseTranscript,
  extractKeywords,
  analyzeBehavioralSignals,
  detectSTARStructure
};
