/**
 * 🔱 THIÊN NHÃN — Assessment Engine
 * Beat 1/18 | Module: assessment-engine.mjs
 * 
 * Chức năng: Tạo bài đánh giá (quiz/test) từ Job Description
 * Input: Job Description text hoặc role name
 * Output: Structured assessment với multiple question types
 * 
 * Question types:
 *   - MCQ (Multiple Choice)
 *   - TRUE_FALSE
 *   - SITUATIONAL (tình huống)
 *   - OPEN (tự luận)
 *   - RANKING (xếp hạng ưu tiên)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(__dirname, '..', 'knowledge');

// ═══════════════════════════════════════════
// CORE: Assessment Generator
// ═══════════════════════════════════════════

/**
 * Extract key competencies from a Job Description
 * @param {string} jobDescription - Raw JD text
 * @returns {Object} Extracted competencies and requirements
 */
export function extractCompetencies(jobDescription) {
  if (!jobDescription || typeof jobDescription !== 'string') {
    throw new Error('Job description must be a non-empty string');
  }

  const jd = jobDescription.toLowerCase();
  
  // Competency keyword mapping
  const competencyMap = {
    leadership: ['leadership', 'lead', 'manage team', 'supervise', 'direct', 'mentor', 'quản lý', 'lãnh đạo', 'dẫn dắt'],
    communication: ['communication', 'present', 'negotiate', 'collaborate', 'giao tiếp', 'thuyết trình', 'đàm phán'],
    analytical: ['analytical', 'analyze', 'data', 'problem-solving', 'critical thinking', 'phân tích', 'giải quyết vấn đề'],
    organization: ['organize', 'planning', 'schedule', 'coordinate', 'multitask', 'tổ chức', 'lập kế hoạch', 'sắp xếp'],
    technical: ['technical', 'software', 'programming', 'engineering', 'IT', 'kỹ thuật', 'phần mềm'],
    customer_service: ['customer', 'client', 'service', 'support', 'khách hàng', 'hỗ trợ', 'phục vụ'],
    financial: ['financial', 'budget', 'accounting', 'audit', 'tài chính', 'ngân sách', 'kế toán'],
    administrative: ['administrative', 'office', 'filing', 'document', 'hành chính', 'văn phòng', 'hồ sơ', 'công văn'],
    creativity: ['creative', 'design', 'innovation', 'ideation', 'sáng tạo', 'thiết kế'],
    teamwork: ['team', 'collaborate', 'cooperation', 'group', 'nhóm', 'phối hợp', 'hợp tác'],
    attention_to_detail: ['detail', 'accuracy', 'precise', 'thorough', 'chi tiết', 'chính xác', 'tỉ mỉ'],
    stress_management: ['pressure', 'deadline', 'stress', 'fast-paced', 'áp lực', 'deadline', 'cao điểm'],
    initiative: ['proactive', 'initiative', 'self-motivated', 'independent', 'chủ động', 'tự giác'],
    adaptability: ['adaptable', 'flexible', 'change', 'dynamic', 'linh hoạt', 'thích nghi'],
    integrity: ['integrity', 'ethical', 'honest', 'trustworthy', 'trung thực', 'đạo đức', 'liêm chính']
  };

  const detected = {};
  for (const [comp, keywords] of Object.entries(competencyMap)) {
    const matchCount = keywords.filter(kw => jd.includes(kw)).length;
    if (matchCount > 0) {
      detected[comp] = {
        score: Math.min(matchCount / keywords.length, 1.0),
        matchedKeywords: keywords.filter(kw => jd.includes(kw))
      };
    }
  }

  // Extract experience level
  const expMatch = jd.match(/(\d+)\s*(?:\+|-)?\s*(?:years?|năm)/i);
  const experienceYears = expMatch ? parseInt(expMatch[1]) : null;

  // Extract education
  const eduKeywords = {
    bachelor: ['bachelor', 'đại học', 'cử nhân', 'university', 'degree'],
    master: ['master', 'thạc sĩ', 'mba', 'postgraduate'],
    phd: ['phd', 'doctor', 'tiến sĩ'],
    vocational: ['vocational', 'trung cấp', 'cao đẳng', 'certificate']
  };
  
  let education = null;
  for (const [level, kws] of Object.entries(eduKeywords)) {
    if (kws.some(kw => jd.includes(kw))) {
      education = level;
      break;
    }
  }

  // Sort competencies by relevance
  const ranked = Object.entries(detected)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([name, data]) => ({ name, ...data }));

  return {
    competencies: ranked,
    topCompetencies: ranked.slice(0, 5).map(c => c.name),
    experienceYears,
    education,
    totalKeywordsMatched: ranked.reduce((sum, c) => sum + c.matchedKeywords.length, 0)
  };
}

// ═══════════════════════════════════════════
// QUESTION GENERATORS
// ═══════════════════════════════════════════

/**
 * Generate MCQ questions for a competency
 */
export function generateMCQ(competency, difficulty = 'medium') {
  const templates = {
    leadership: [
      {
        question: 'Khi một thành viên trong nhóm liên tục không hoàn thành deadline, bạn sẽ:',
        options: [
          { text: 'Giao việc cho người khác thay thế', score: 1 },
          { text: 'Nói chuyện riêng để tìm hiểu nguyên nhân và hỗ trợ', score: 4 },
          { text: 'Báo cáo lên cấp trên ngay lập tức', score: 2 },
          { text: 'Gửi email nhắc nhở chung cho cả nhóm', score: 1 }
        ],
        competency: 'leadership',
        type: 'MCQ',
        difficulty
      },
      {
        question: 'Bạn vừa được bổ nhiệm quản lý một đội ngũ mới. Việc đầu tiên bạn làm là:',
        options: [
          { text: 'Đặt ra quy tắc mới ngay để thiết lập kỷ luật', score: 2 },
          { text: 'Gặp gỡ từng người để hiểu vai trò và mong muốn', score: 4 },
          { text: 'Quan sát im lặng trong 2 tuần trước khi hành động', score: 3 },
          { text: 'Tổ chức một cuộc họp lớn để giới thiệu bản thân', score: 2 }
        ],
        competency: 'leadership',
        type: 'MCQ',
        difficulty
      }
    ],
    communication: [
      {
        question: 'Khi phải truyền đạt một tin xấu cho đồng nghiệp, bạn sẽ:',
        options: [
          { text: 'Gửi email để tránh đối mặt trực tiếp', score: 1 },
          { text: 'Nói trực tiếp, rõ ràng và đề xuất giải pháp', score: 4 },
          { text: 'Nhờ người khác truyền đạt hộ', score: 0 },
          { text: 'Chờ thời điểm thích hợp và nói nhẹ nhàng', score: 3 }
        ],
        competency: 'communication',
        type: 'MCQ',
        difficulty
      }
    ],
    organization: [
      {
        question: 'Bạn có 5 tasks cần hoàn thành trong ngày nhưng chỉ đủ thời gian cho 3. Bạn sẽ:',
        options: [
          { text: 'Làm theo thứ tự nhận task', score: 1 },
          { text: 'Phân loại theo độ khẩn cấp và quan trọng, ưu tiên 3 task quan trọng nhất', score: 4 },
          { text: 'Cố gắng làm hết 5, chấp nhận chất lượng kém hơn', score: 1 },
          { text: 'Xin thêm thời gian cho sếp', score: 2 }
        ],
        competency: 'organization',
        type: 'MCQ',
        difficulty
      }
    ],
    administrative: [
      {
        question: 'Khi phát hiện sai sót trong hồ sơ công văn đã gửi đi, bạn sẽ:',
        options: [
          { text: 'Im lặng hy vọng không ai phát hiện', score: 0 },
          { text: 'Báo cáo ngay, thu hồi và gửi lại bản đúng kèm lời xin lỗi', score: 4 },
          { text: 'Chờ ai phát hiện thì mới sửa', score: 1 },
          { text: 'Sửa bản gốc và gửi lại mà không giải thích', score: 2 }
        ],
        competency: 'administrative',
        type: 'MCQ',
        difficulty
      }
    ],
    attention_to_detail: [
      {
        question: 'Bạn nhận được một bảng tính Excel 500 dòng cần kiểm tra. Cách tiếp cận của bạn:',
        options: [
          { text: 'Lướt nhanh qua, tin vào người gửi', score: 0 },
          { text: 'Dùng công thức kiểm tra chéo, spot-check ngẫu nhiên 10%, và kiểm tra tổng', score: 4 },
          { text: 'Đọc từng dòng một từ đầu đến cuối', score: 2 },
          { text: 'Chỉ kiểm tra dòng cuối cùng có tổng đúng không', score: 1 }
        ],
        competency: 'attention_to_detail',
        type: 'MCQ',
        difficulty
      }
    ],
    teamwork: [
      {
        question: 'Trong cuộc họp nhóm, ý kiến của bạn bị đa số phản đối. Bạn sẽ:',
        options: [
          { text: 'Bảo vệ quan điểm bằng mọi giá vì bạn đúng', score: 1 },
          { text: 'Im lặng theo đám đông', score: 1 },
          { text: 'Trình bày thêm lý lẽ, lắng nghe phản biện, và tìm điểm chung', score: 4 },
          { text: 'Rút lui và thực hiện ý mình riêng', score: 0 }
        ],
        competency: 'teamwork',
        type: 'MCQ',
        difficulty
      }
    ],
    stress_management: [
      {
        question: 'Sếp giao thêm 3 việc gấp khi bạn đang quá tải. Bạn sẽ:',
        options: [
          { text: 'Nhận hết và làm thêm giờ', score: 2 },
          { text: 'Từ chối thẳng vì đã quá tải', score: 1 },
          { text: 'Trình bày workload hiện tại, đề xuất ưu tiên lại và xin thêm nguồn lực nếu cần', score: 4 },
          { text: 'Nhận nhưng làm qua loa cho xong', score: 0 }
        ],
        competency: 'stress_management',
        type: 'MCQ',
        difficulty
      }
    ],
    customer_service: [
      {
        question: 'Khách hàng gọi điện phàn nàn gay gắt về một lỗi không phải do bạn. Bạn sẽ:',
        options: [
          { text: 'Giải thích đó không phải lỗi của bạn', score: 1 },
          { text: 'Lắng nghe, xin lỗi về trải nghiệm, và đề xuất giải pháp cụ thể', score: 4 },
          { text: 'Chuyển cuộc gọi sang bộ phận khác', score: 2 },
          { text: 'Yêu cầu khách bình tĩnh rồi mới nói chuyện', score: 1 }
        ],
        competency: 'customer_service',
        type: 'MCQ',
        difficulty
      }
    ],
    integrity: [
      {
        question: 'Bạn phát hiện đồng nghiệp thân khai khống chi phí công tác. Bạn sẽ:',
        options: [
          { text: 'Giả vờ không biết', score: 0 },
          { text: 'Nói riêng với đồng nghiệp trước, khuyên họ tự sửa. Nếu không thay đổi, báo cáo cấp trên', score: 4 },
          { text: 'Báo cáo cấp trên ngay lập tức', score: 3 },
          { text: 'Đăng lên group chat công ty', score: 0 }
        ],
        competency: 'integrity',
        type: 'MCQ',
        difficulty
      }
    ]
  };

  return templates[competency] || [];
}

/**
 * Generate situational judgment questions
 */
export function generateSituational(competency) {
  const scenarios = {
    administrative: [
      {
        scenario: 'Bạn đang chuẩn bị hồ sơ cho cuộc họp ban giám đốc lúc 14h. Lúc 11h, sếp yêu cầu bạn đặt phòng họp gấp cho khách VIP lúc 13h, đồng thời đồng nghiệp nhờ bạn soạn công văn gấp trước 12h.',
        question: 'Hãy mô tả cách bạn xử lý tình huống này. Bạn sẽ ưu tiên thế nào và tại sao?',
        competency: 'administrative',
        type: 'SITUATIONAL',
        evaluationCriteria: [
          'Phân loại ưu tiên theo khẩn cấp + quan trọng (Eisenhower matrix)',
          'Xử lý đặt phòng VIP trước (khẩn + quan trọng)',
          'Trao đổi với đồng nghiệp về deadline công văn',
          'Đảm bảo hồ sơ họp BGĐ vẫn hoàn thành đúng hạn',
          'Giao tiếp rõ ràng với các bên về timeline'
        ],
        maxScore: 10
      }
    ],
    leadership: [
      {
        scenario: 'Nhóm của bạn có 2 thành viên đang mâu thuẫn gay gắt về phương pháp thực hiện dự án. Cả hai đều có lý, nhưng sự bất đồng đang ảnh hưởng tiến độ nhóm.',
        question: 'Bạn sẽ giải quyết tình huống này như thế nào?',
        competency: 'leadership',
        type: 'SITUATIONAL',
        evaluationCriteria: [
          'Gặp riêng từng người để lắng nghe',
          'Tổ chức thảo luận có cấu trúc, focus vào mục tiêu chung',
          'Tìm giải pháp kết hợp ưu điểm cả hai',
          'Đưa ra quyết định cuối cùng nếu cần',
          'Follow up để đảm bảo quan hệ được phục hồi'
        ],
        maxScore: 10
      }
    ]
  };

  return scenarios[competency] || [];
}

/**
 * Generate TRUE/FALSE questions
 */
export function generateTrueFalse(competency) {
  const pool = {
    administrative: [
      { statement: 'Hồ sơ mật có thể gửi qua email cá nhân nếu cần gấp.', answer: false, explanation: 'Hồ sơ mật phải tuân thủ quy trình bảo mật, không được gửi qua kênh không an toàn.' },
      { statement: 'Biên bản cuộc họp cần được gửi cho tất cả người tham dự trong vòng 24h.', answer: true, explanation: 'Best practice là gửi biên bản trong vòng 24h để đảm bảo accuracy.' },
      { statement: 'Khi nhận công văn đến, bước đầu tiên là chuyển ngay cho sếp ký.', answer: false, explanation: 'Bước đầu tiên là vào sổ công văn đến, kiểm tra nội dung, rồi mới trình lãnh đạo.' }
    ],
    organization: [
      { statement: 'Ma trận Eisenhower chia công việc thành 4 ô: Khẩn cấp-Quan trọng, Không khẩn-Quan trọng, Khẩn cấp-Không quan trọng, Không khẩn-Không quan trọng.', answer: true, explanation: 'Đúng. Đây là framework quản lý thời gian kinh điển.' },
      { statement: 'Multitasking luôn hiệu quả hơn single-tasking.', answer: false, explanation: 'Nghiên cứu cho thấy multitasking làm giảm hiệu suất 40%. Context switching tốn thời gian.' }
    ]
  };

  return (pool[competency] || []).map(q => ({
    ...q,
    competency,
    type: 'TRUE_FALSE'
  }));
}

// ═══════════════════════════════════════════
// ASSESSMENT BUILDER
// ═══════════════════════════════════════════

/**
 * Build a complete assessment from Job Description
 * @param {string} jobDescription - Raw JD text
 * @param {Object} options - Configuration options
 * @returns {Object} Complete assessment package
 */
export function buildAssessment(jobDescription, options = {}) {
  const {
    totalQuestions = 20,
    includeTypes = ['MCQ', 'TRUE_FALSE', 'SITUATIONAL'],
    difficulty = 'medium',
    language = 'vi',
    roleName = ''
  } = options;

  // Step 1: Extract competencies from JD
  const analysis = extractCompetencies(jobDescription);
  
  if (analysis.competencies.length === 0) {
    return {
      error: 'Không tìm thấy năng lực nào từ JD. Vui lòng cung cấp mô tả chi tiết hơn.',
      analysis
    };
  }

  // Step 2: Generate questions per competency
  const questions = [];
  const topComps = analysis.topCompetencies;
  
  // Distribute questions across top competencies
  const questionsPerComp = Math.ceil(totalQuestions / topComps.length);
  
  for (const comp of topComps) {
    if (includeTypes.includes('MCQ')) {
      const mcqs = generateMCQ(comp, difficulty);
      questions.push(...mcqs.slice(0, Math.ceil(questionsPerComp * 0.5)));
    }
    
    if (includeTypes.includes('TRUE_FALSE')) {
      const tfs = generateTrueFalse(comp);
      questions.push(...tfs.slice(0, Math.ceil(questionsPerComp * 0.2)));
    }
    
    if (includeTypes.includes('SITUATIONAL')) {
      const sits = generateSituational(comp);
      questions.push(...sits.slice(0, Math.ceil(questionsPerComp * 0.3)));
    }
  }

  // Step 3: Trim to desired count and shuffle
  const trimmed = questions.slice(0, totalQuestions);
  const shuffled = trimmed.sort(() => Math.random() - 0.5);

  // Number the questions
  const numbered = shuffled.map((q, i) => ({ ...q, id: i + 1 }));

  // Step 4: Build assessment metadata
  const assessment = {
    title: roleName 
      ? `Bài Đánh Giá Ứng Viên — ${roleName}`
      : 'Bài Đánh Giá Ứng Viên',
    createdAt: new Date().toISOString(),
    config: {
      totalQuestions: numbered.length,
      difficulty,
      language,
      types: [...new Set(numbered.map(q => q.type))],
      timeLimit: numbered.length * 2, // 2 phút/câu
    },
    analysis: {
      topCompetencies: topComps,
      experienceYears: analysis.experienceYears,
      education: analysis.education,
      totalCompetenciesDetected: analysis.competencies.length
    },
    questions: numbered,
    scoring: {
      maxScore: numbered.reduce((sum, q) => {
        if (q.type === 'MCQ') return sum + 4;
        if (q.type === 'TRUE_FALSE') return sum + 2;
        if (q.type === 'SITUATIONAL') return sum + (q.maxScore || 10);
        return sum + 5;
      }, 0),
      passingPercentage: 70,
      competencyWeights: Object.fromEntries(
        topComps.map((c, i) => [c, Math.max(0.1, 1 - i * 0.15)])
      )
    }
  };

  return assessment;
}

/**
 * Score a candidate's answers
 * @param {Object} assessment - The assessment object
 * @param {Array} answers - Array of {questionId, answer} objects
 * @returns {Object} Scoring results
 */
export function scoreAssessment(assessment, answers) {
  if (!assessment || !answers || !Array.isArray(answers)) {
    throw new Error('Assessment and answers array required');
  }

  const results = [];
  let totalScore = 0;
  let maxPossible = 0;
  const competencyScores = {};

  for (const q of assessment.questions) {
    const userAnswer = answers.find(a => a.questionId === q.id);
    let score = 0;
    let maxQ = 0;
    
    if (q.type === 'MCQ') {
      maxQ = 4;
      if (userAnswer && q.options) {
        const selected = q.options[userAnswer.answer];
        score = selected ? selected.score : 0;
      }
    } else if (q.type === 'TRUE_FALSE') {
      maxQ = 2;
      if (userAnswer) {
        score = userAnswer.answer === q.answer ? 2 : 0;
      }
    } else if (q.type === 'SITUATIONAL') {
      maxQ = q.maxScore || 10;
      // Situational scored externally (by AI or interviewer)
      score = userAnswer ? (userAnswer.score || 0) : 0;
    }

    totalScore += score;
    maxPossible += maxQ;

    // Track per-competency
    const comp = q.competency;
    if (!competencyScores[comp]) {
      competencyScores[comp] = { total: 0, max: 0, count: 0 };
    }
    competencyScores[comp].total += score;
    competencyScores[comp].max += maxQ;
    competencyScores[comp].count++;

    results.push({
      questionId: q.id,
      type: q.type,
      competency: comp,
      score,
      maxScore: maxQ,
      correct: score >= maxQ * 0.75
    });
  }

  // Calculate competency percentages
  const competencyResults = {};
  for (const [comp, data] of Object.entries(competencyScores)) {
    competencyResults[comp] = {
      score: data.total,
      maxScore: data.max,
      percentage: data.max > 0 ? Math.round((data.total / data.max) * 100) : 0,
      questionCount: data.count,
      level: data.max > 0
        ? (data.total / data.max >= 0.8 ? 'STRONG'
          : data.total / data.max >= 0.6 ? 'ADEQUATE'
          : data.total / data.max >= 0.4 ? 'DEVELOPING'
          : 'WEAK')
        : 'N/A'
    };
  }

  const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  return {
    totalScore,
    maxPossible,
    percentage,
    passed: percentage >= (assessment.scoring?.passingPercentage || 70),
    passingThreshold: assessment.scoring?.passingPercentage || 70,
    competencyResults,
    questionResults: results,
    recommendation: percentage >= 85 ? 'STRONGLY_RECOMMEND'
      : percentage >= 70 ? 'RECOMMEND'
      : percentage >= 55 ? 'CONSIDER_WITH_RESERVATIONS'
      : 'NOT_RECOMMENDED',
    summary: {
      strengths: Object.entries(competencyResults)
        .filter(([, v]) => v.level === 'STRONG')
        .map(([k]) => k),
      weaknesses: Object.entries(competencyResults)
        .filter(([, v]) => v.level === 'WEAK' || v.level === 'DEVELOPING')
        .map(([k]) => k),
      totalQuestions: assessment.questions.length,
      answeredQuestions: answers.length
    }
  };
}

// ═══════════════════════════════════════════
// EXPORT FOR CLI
// ═══════════════════════════════════════════

export default {
  extractCompetencies,
  generateMCQ,
  generateSituational,
  generateTrueFalse,
  buildAssessment,
  scoreAssessment
};
