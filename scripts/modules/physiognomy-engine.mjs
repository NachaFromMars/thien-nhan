/**
 * 🔱 THIÊN NHÃN — Physiognomy Engine
 * Beat 7/18 | Module: physiognomy-engine.mjs
 * 
 * AI-powered face reading combining Eastern (Đông) and Western (Tây) physiognomy.
 * Uses AI vision prompts (no external Python dependency required).
 * Can optionally integrate DeepFace for technical face analysis.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(__dirname, '..', '..', 'knowledge');

// ═══════════════════════════════════════════
// KNOWLEDGE LOADERS
// ═══════════════════════════════════════════

function loadJSON(filename) {
  const filepath = join(KNOWLEDGE_DIR, filename);
  if (!existsSync(filepath)) {
    console.warn(`⚠️ Thiên Nhãn: Knowledge file not found: ${filepath}`);
    return null;
  }
  try {
    const content = readFileSync(filepath, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON structure');
    return parsed;
  } catch (err) {
    console.warn(`⚠️ Thiên Nhãn: Failed to load ${filename}: ${err.message}`);
    return null;
  }
}

let _eastKnowledge, _westKnowledge;
function getEast() { return _eastKnowledge || (_eastKnowledge = loadJSON('physiognomy-east.json')); }
function getWest() { return _westKnowledge || (_westKnowledge = loadJSON('physiognomy-west.json')); }

// ═══════════════════════════════════════════
// FACE ANALYSIS PROMPT BUILDER
// ═══════════════════════════════════════════

/**
 * Build AI vision prompt for face reading
 * @param {Object} options
 * @param {string} options.mode - 'eastern', 'western', 'combined', 'hiring'
 * @param {string} [options.role] - Target role for hiring-specific analysis
 * @param {string} [options.language] - 'vi' or 'en'
 * @returns {string} Structured prompt for AI vision model
 */
export function buildFaceReadingPrompt(options = {}) {
  const { mode = 'combined', role = '', language = 'vi' } = options;
  
  const isVi = language === 'vi';
  const prompts = [];

  // Base instruction
  prompts.push(isVi
    ? 'Bạn là chuyên gia nhân tướng học kết hợp Đông-Tây. Phân tích khuôn mặt trong ảnh theo các tiêu chí sau:'
    : 'You are an expert in physiognomy combining Eastern and Western approaches. Analyze the face in the image:'
  );

  if (mode === 'eastern' || mode === 'combined') {
    prompts.push('');
    prompts.push(isVi ? '## NHÂN TƯỚNG ĐÔNG PHƯƠNG' : '## EASTERN PHYSIOGNOMY');
    prompts.push(isVi ? `
### Ngũ Quan (5 Giác Quan)
1. **Nhĩ (Tai)** — Thính quan: Kích thước, hình dáng, vị trí so với mắt, dái tai
2. **Mi (Lông mày)** — Bảo thọ quan: Độ dày, hình dáng, khoảng cách
3. **Mục (Mắt)** — Giám sát quan: Kích thước, hình dáng, ánh nhìn, khoảng cách hai mắt
4. **Tỵ (Mũi)** — Thẩm biện quan: Kích thước sống mũi, cánh mũi, đầu mũi
5. **Khẩu (Miệng)** — Xuất nạp quan: Kích thước, hình dáng, tỷ lệ môi trên/dưới

### Tam Đình (3 Phần Khuôn Mặt)
1. **Thượng Đình** (trán → lông mày): Trí tuệ, may mắn sớm
2. **Trung Đình** (lông mày → mũi): Sự nghiệp, trung niên
3. **Hạ Đình** (mũi → cằm): Tuổi già, sức khỏe, phúc đức

### Tứ Khí Chất
- Phong (Gió): Nhẹ nhàng, linh hoạt
- Hỏa (Lửa): Nóng nảy, nhiệt huyết
- Thủy (Nước): Trầm tĩnh, uyển chuyển
- Thổ (Đất): Vững chắc, đáng tin
` : `[Eastern analysis: Five Features, Three Courts, Four Elements]`);
  }

  if (mode === 'western' || mode === 'combined') {
    prompts.push('');
    prompts.push(isVi ? '## NHÂN TƯỚNG TÂY PHƯƠNG' : '## WESTERN PHYSIOGNOMY');
    prompts.push(isVi ? `
### Four Temperaments (Tứ Khí Chất Tây)
1. **Sanguine** (Lạc quan): Mặt tròn, hồng hào, biểu cảm sống động
2. **Choleric** (Nóng nảy): Mặt vuông/góc cạnh, jaw mạnh, ánh mắt quyết đoán
3. **Melancholic** (Trầm tư): Mặt dài/oval, features tinh tế, biểu cảm suy tư
4. **Phlegmatic** (Điềm tĩnh): Mặt tròn mềm, biểu cảm bình thản, relaxed

### Facial Shape Analysis
- **Oval**: Cân bằng, ngoại giao
- **Round**: Thân thiện, hòa đồng
- **Square**: Quyết đoán, lãnh đạo
- **Heart**: Sáng tạo, cảm xúc
- **Long/Oblong**: Logic, cẩn thận
- **Diamond**: Perfectionistic, hiếm
` : `[Western analysis: Four Temperaments, Facial Shape]`);
  }

  if (mode === 'hiring' || role) {
    prompts.push('');
    prompts.push(isVi ? `## ĐÁNH GIÁ TUYỂN DỤNG` : `## HIRING ASSESSMENT`);
    if (role) prompts.push(isVi ? `Vị trí ứng tuyển: **${role}**` : `Position: **${role}**`);
    prompts.push(isVi ? `
Đánh giá mức phù hợp với vị trí dựa trên:
- Năng lượng / Sự tự tin thể hiện qua khuôn mặt
- Tỷ lệ Tam Đình (trí tuệ vs sự nghiệp vs phúc đức)
- Biểu cảm tự nhiên (positive/neutral/negative)
- Ánh mắt (tập trung, lơ đễnh, tự tin, lo lắng)
- Tổng quan ấn tượng ban đầu (first impression score 1-10)
` : `Evaluate face fit for the role based on energy, proportions, expression, eye contact, first impression.`);
  }

  // Output format
  prompts.push('');
  prompts.push(isVi ? `## OUTPUT FORMAT (JSON)
\`\`\`json
{
  "overview": "Mô tả tổng quan ấn tượng",
  "eastern": {
    "ngu_quan": { "nhi": "...", "mi": "...", "muc": "...", "ty": "...", "khau": "..." },
    "tam_dinh": { "thuong": "...", "trung": "...", "ha": "..." },
    "tu_khi_chat": "Phong/Hỏa/Thủy/Thổ + giải thích",
    "summary": "Tổng kết nhân tướng Đông"
  },
  "western": {
    "face_shape": "oval/round/square/heart/long/diamond",
    "temperament": "sanguine/choleric/melancholic/phlegmatic",
    "features": { "eyes": "...", "nose": "...", "mouth": "...", "jaw": "...", "forehead": "..." },
    "summary": "Tổng kết nhân tướng Tây"
  },
  "personality_prediction": {
    "disc_likely": "D/I/S/C",
    "big_five_high": ["O","C","E","A","N"],
    "mbti_likely": "XXXX",
    "confidence": 1-10
  },
  "hiring_fit": {
    "first_impression": 1-10,
    "energy_level": "high/moderate/low",
    "confidence_signal": "strong/moderate/weak",
    "role_fit_score": 1-10,
    "recommendation": "Recommend/Consider/Caution",
    "notes": "..."
  }
}
\`\`\`` : `[Output format: JSON with eastern, western, personality_prediction, hiring_fit]`);

  return prompts.join('\n');
}

// ═══════════════════════════════════════════
// FACE ANALYSIS (IMAGE → STRUCTURED DATA)
// ═══════════════════════════════════════════

/**
 * Analyze a face image using AI vision
 * @param {string} imagePath - Path to face image
 * @param {Object} options - Analysis options
 * @returns {Object} Analysis result with prompt (for AI execution by caller)
 */
export function prepareFaceAnalysis(imagePath, options = {}) {
  if (!imagePath || typeof imagePath !== 'string') {
    throw new Error('Image path must be a non-empty string');
  }
  
  if (!existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  const prompt = buildFaceReadingPrompt(options);
  
  return {
    imagePath,
    prompt,
    options,
    instructions: 'Send this prompt along with the image to an AI vision model (Claude, GPT-4V, etc.)',
    estimatedTokens: Math.round(prompt.length / 4),
    knowledgeLoaded: {
      eastern: getEast() !== null,
      western: getWest() !== null
    }
  };
}

/**
 * Parse AI vision response into structured physiognomy result
 * @param {string} rawResponse - Raw text response from AI vision model
 * @returns {Object} Parsed physiognomy result
 */
export function parsePhysiognomyResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== 'string') {
    throw new Error('Response must be a non-empty string');
  }

  // Try to extract JSON from response (non-greedy, balanced braces)
  const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
  let parsedJson = null;
  
  if (jsonMatch) {
    try { parsedJson = JSON.parse(jsonMatch[1]); } catch {}
  }
  
  if (!parsedJson) {
    // Find balanced JSON object containing "overview"
    const idx = rawResponse.indexOf('"overview"');
    if (idx > -1) {
      let start = rawResponse.lastIndexOf('{', idx);
      if (start > -1) {
        let depth = 0;
        for (let i = start; i < rawResponse.length; i++) {
          if (rawResponse[i] === '{') depth++;
          if (rawResponse[i] === '}') depth--;
          if (depth === 0) {
            try { parsedJson = JSON.parse(rawResponse.slice(start, i + 1)); } catch {}
            break;
          }
        }
      }
    }
  }
  
  if (parsedJson) {
    return { success: true, data: parsedJson, rawResponse };
  }

  // Fallback: extract key information from text
  return {
    success: false,
    data: extractFromText(rawResponse),
    rawResponse,
    note: 'JSON parsing failed, extracted from text'
  };
}

function extractFromText(text) {
  const result = {
    overview: '',
    personality_prediction: {},
    hiring_fit: {}
  };

  // Extract first impression score
  const scoreMatch = text.match(/(?:first.?impression|ấn tượng|điểm)[^\d]*(\d+)\s*\/?\s*10/i);
  if (scoreMatch) result.hiring_fit.first_impression = parseInt(scoreMatch[1]);

  // Extract DISC prediction — require separator to avoid matching 'DISC' word itself
  const discMatch = text.match(/DISC\s*(?:type|profile|:)\s*([DISC])\b/i);
  if (discMatch) result.personality_prediction.disc_likely = discMatch[1].toUpperCase();

  // Extract MBTI prediction
  const mbtiMatch = text.match(/MBTI[:\s]*([EINSFPTJ]{4})/i);
  if (mbtiMatch) result.personality_prediction.mbti_likely = mbtiMatch[1].toUpperCase();

  // Extract recommendation
  const recMatch = text.match(/(recommend|consider|caution|phù hợp|cân nhắc|cẩn trọng)/i);
  if (recMatch) {
    const rec = recMatch[1].toLowerCase();
    if (rec.includes('recommend') || rec.includes('phù hợp')) result.hiring_fit.recommendation = 'Recommend';
    else if (rec.includes('consider') || rec.includes('cân nhắc')) result.hiring_fit.recommendation = 'Consider';
    else result.hiring_fit.recommendation = 'Caution';
  }

  // Extract temperament
  const tempMatch = text.match(/(sanguine|choleric|melancholic|phlegmatic|lạc quan|nóng nảy|trầm tư|điềm tĩnh)/i);
  if (tempMatch) result.western = { temperament: tempMatch[1].toLowerCase() };

  // First paragraph as overview
  const lines = text.split('\n').filter(l => l.trim().length > 20);
  if (lines.length > 0) result.overview = lines[0].trim();

  return result;
}

// ═══════════════════════════════════════════
// DEEPFACE BRIDGE (OPTIONAL)
// ═══════════════════════════════════════════

/**
 * Run DeepFace analysis if available (Python)
 * @param {string} imagePath 
 * @returns {Object|null} DeepFace results or null if unavailable
 */
export function runDeepFace(imagePath) {
  if (!imagePath || !existsSync(imagePath)) return null;
  
  try {
    const script = `
import sys, json
try:
    from deepface import DeepFace
    result = DeepFace.analyze("${imagePath.replace(/"/g, '\\"')}", actions=['age','gender','emotion','race'], enforce_detection=False)
    if isinstance(result, list): result = result[0]
    print(json.dumps({
        "age": result.get("age"),
        "gender": result.get("dominant_gender"),
        "emotion": result.get("dominant_emotion"),
        "race": result.get("dominant_race"),
        "emotion_scores": result.get("emotion", {}),
        "race_scores": result.get("race", {}),
        "success": True
    }))
except ImportError:
    print(json.dumps({"success": False, "error": "DeepFace not installed"}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
    const output = execSync(`python3 -c '${script.replace(/'/g, "'\\''")}'`, { 
      timeout: 30000, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(output.trim());
  } catch {
    return { success: false, error: 'DeepFace execution failed' };
  }
}

// ═══════════════════════════════════════════
// PHYSIOGNOMY SCORING
// ═══════════════════════════════════════════

/**
 * Score physiognomy analysis results for hiring
 * @param {Object} analysis - Parsed physiognomy data
 * @param {string} targetRole - Role being hired for
 * @returns {Object} Scoring results
 */
export function scorePhysiognomy(analysis, targetRole = '') {
  if (!analysis) throw new Error('Analysis data required');
  
  const scores = {
    firstImpression: 5,
    energyLevel: 'moderate',
    confidenceSignal: 'moderate',
    roleFitScore: 5,
    overallScore: 5
  };

  // Extract from hiring_fit if available
  const hf = analysis.hiring_fit || analysis.data?.hiring_fit || {};
  if (hf.first_impression) scores.firstImpression = Math.min(10, Math.max(1, hf.first_impression));
  if (hf.energy_level) scores.energyLevel = hf.energy_level;
  if (hf.confidence_signal) scores.confidenceSignal = hf.confidence_signal;
  if (hf.role_fit_score) scores.roleFitScore = Math.min(10, Math.max(1, hf.role_fit_score));

  // Calculate overall
  scores.overallScore = Math.round((scores.firstImpression + scores.roleFitScore) / 2 * 10) / 10;

  // Role-specific adjustments
  const roleBonus = {
    sales: { highEnergy: 1, strongConfidence: 1 },
    hanh_chinh: { moderateEnergy: 0.5, moderateConfidence: 0.5 },
    giam_doc: { highEnergy: 1.5, strongConfidence: 1.5 },
    it: {} // neutral
  };

  const bonuses = roleBonus[targetRole?.toLowerCase()] || {};
  if (scores.energyLevel === 'high' && bonuses.highEnergy) {
    scores.overallScore = Math.min(10, scores.overallScore + bonuses.highEnergy);
  }
  if (scores.confidenceSignal === 'strong' && bonuses.strongConfidence) {
    scores.overallScore = Math.min(10, scores.overallScore + bonuses.strongConfidence);
  }

  scores.recommendation = scores.overallScore >= 7 ? 'Recommend' : scores.overallScore >= 5 ? 'Consider' : 'Caution';

  return {
    scores,
    targetRole,
    note: 'Physiognomy scores are supplementary — combine with DISC/BigFive/MBTI for comprehensive assessment',
    disclaimer: '⚠️ Nhân tướng là tham khảo bổ sung, KHÔNG phải tiêu chí chính trong tuyển dụng'
  };
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════

export default {
  buildFaceReadingPrompt,
  prepareFaceAnalysis,
  parsePhysiognomyResponse,
  runDeepFace,
  scorePhysiognomy
};
