#!/usr/bin/env node

/**
 * 🔱 THIÊN NHÃN (天眼) — Supreme HR Assessment CLI
 * Beat 16/18 | Main entry point
 * 
 * Commands:
 *   assess <type>     Run personality assessment (disc/bigfive/mbti/all)
 *   profile <file>    Analyze candidate profile from JSON
 *   face <image>      Physiognomy analysis (face reading)
 *   interview <audio> Analyze interview recording
 *   score <file>      Score candidate from assessment results
 *   compare <f1> <f2> Compare two candidates
 *   report <file>     Generate assessment report
 *   anticheat <file>  Run anti-cheat on assessment data
 *   wisdom            Show hiring wisdom tips
 *   help              Show help
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES = join(__dirname, 'modules');

// Lazy imports
async function loadModule(name) {
  return import(join(MODULES, name));
}

// ═══════════════════════════════════════════
// CLI PARSER
// ═══════════════════════════════════════════

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();
const flags = {};
const positional = [];

for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    flags[key] = val;
  } else {
    positional.push(args[i]);
  }
}

// ═══════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════

async function cmdAssess() {
  const type = positional[0] || 'all';
  const { getDISCQuestions, getBigFiveQuestions, getMBTIQuestions } = await loadModule('personality-profiler.mjs');
  
  console.log('🔱 THIÊN NHÃN — Assessment Generator\n');
  
  if (type === 'disc' || type === 'all') {
    const dq = getDISCQuestions();
    console.log(`📋 DISC Assessment: ${dq.total} questions`);
    console.log(`   Instructions: ${typeof dq.instructions === 'string' ? dq.instructions.substring(0, 100) : JSON.stringify(dq.instructions).substring(0, 100)}...`);
    if (flags.export) {
      const out = flags.export === true ? 'disc-assessment.json' : flags.export;
      writeFileSync(out, JSON.stringify(dq, null, 2));
      console.log(`   → Exported to ${out}`);
    }
  }
  
  if (type === 'bigfive' || type === 'all') {
    const bq = getBigFiveQuestions();
    console.log(`📋 Big Five Assessment: ${bq.total} questions (Likert 1-5)`);
  }
  
  if (type === 'mbti' || type === 'all') {
    const mq = getMBTIQuestions();
    console.log(`📋 MBTI Assessment: ${mq.total} questions (A/B)`);
  }
  
  console.log('\nUse --export <file> to export questions as JSON');
}

async function cmdProfile() {
  const file = positional[0];
  if (!file || !existsSync(file)) {
    console.error('❌ Usage: thien-nhan profile <answers.json>');
    console.error('   File should contain { disc: [...], bigFive: [...], mbti: [...] }');
    process.exit(1);
  }
  
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const { scoreDISC, scoreBigFive, scoreMBTI, combinedProfile } = await loadModule('personality-profiler.mjs');
  
  console.log('🔱 THIÊN NHÃN — Personality Profile\n');
  
  if (data.disc) {
    const disc = scoreDISC(data.disc);
    console.log(`DISC: ${disc.primary.code} (${disc.primary.name}) | ${disc.combinedCode}`);
    console.log(`  D: ${disc.chart.D} ${disc.scores.D}%`);
    console.log(`  I: ${disc.chart.I} ${disc.scores.I}%`);
    console.log(`  S: ${disc.chart.S} ${disc.scores.S}%`);
    console.log(`  C: ${disc.chart.C} ${disc.scores.C}%`);
  }
  
  if (data.bigFive) {
    const bf = scoreBigFive(data.bigFive);
    console.log(`\nBig Five: Dominant = ${bf.summary.dominantFactor}`);
    for (const [k, v] of Object.entries(bf.factors)) {
      console.log(`  ${v.emoji} ${k} (${v.nameVi}): ${v.chart} ${v.normalized}% [${v.level}]`);
    }
  }
  
  if (data.mbti) {
    const mbti = scoreMBTI(data.mbti);
    console.log(`\nMBTI: ${mbti.typeCode} — ${mbti.profile.name} (${mbti.profile.nameVi})`);
    console.log(`  Clarity: ${mbti.clarityAvg}%`);
  }
  
  if (data.disc && data.bigFive && data.mbti) {
    const combined = combinedProfile(data.disc, data.bigFive, data.mbti);
    console.log(`\n📊 Cross-validation: ${combined.consistencyScore}% consistent`);
    console.log(`  Strengths: ${combined.overallStrengths.join(', ')}`);
    console.log(`  Challenges: ${combined.overallChallenges.join(', ')}`);
  }
}

async function cmdFace() {
  const image = positional[0];
  if (!image || !existsSync(image)) {
    console.error('❌ Usage: thien-nhan face <image.jpg> [--role "Nhân viên HC"] [--mode combined]');
    process.exit(1);
  }
  
  const { prepareFaceAnalysis } = await loadModule('physiognomy-engine.mjs');
  const mode = flags.mode || 'combined';
  const role = flags.role || '';
  
  const analysis = prepareFaceAnalysis(image, { mode, role, language: 'vi' });
  
  console.log('🔱 THIÊN NHÃN — Physiognomy Analysis\n');
  console.log(`Image: ${image}`);
  console.log(`Mode: ${mode}`);
  if (role) console.log(`Role: ${role}`);
  console.log(`Est. tokens: ${analysis.estimatedTokens}`);
  console.log(`Knowledge loaded: East=${analysis.knowledgeLoaded.eastern}, West=${analysis.knowledgeLoaded.western}`);
  console.log('\n--- AI PROMPT (send with image to vision model) ---');
  console.log(analysis.prompt.substring(0, 500) + '...');
  console.log('\n💡 Tip: Send this prompt + image to Claude/GPT-4V for analysis');
}

async function cmdInterview() {
  const audio = positional[0];
  if (!audio) {
    console.error('❌ Usage: thien-nhan interview <audio.mp3> [--transcript <file>]');
    process.exit(1);
  }
  
  const { prepareInterviewAnalysis, parseTranscript, extractKeywords, analyzeBehavioralSignals } = await loadModule('interview-analyzer.mjs');
  
  console.log('🔱 THIÊN NHÃN — Interview Analyzer\n');
  
  if (flags.transcript && existsSync(flags.transcript)) {
    const text = readFileSync(flags.transcript, 'utf8');
    const parsed = parseTranscript(text);
    const keywords = extractKeywords(parsed);
    const signals = analyzeBehavioralSignals(parsed);
    
    console.log(`Words: ${parsed.totalWords} | Turns: ${parsed.totalTurns}`);
    console.log(`Top keywords: ${keywords.topKeywords.slice(0, 5).map(k => k.word).join(', ')}`);
    console.log(`Filler rate: ${signals.fillerAnalysis.fillerRate} (${signals.fillerAnalysis.interpretation})`);
    console.log(`Confidence: ${signals.confidence.signal}`);
    console.log(`Engagement: ${signals.engagement.signal}`);
  } else if (existsSync(audio)) {
    const prep = prepareInterviewAnalysis(audio);
    console.log(`File: ${audio} (${prep.fileType})`);
    console.log('Next: Run whisper to extract transcript, then use --transcript flag');
    console.log(`  whisper ${audio} --model tiny --language vi --output_format txt`);
  } else {
    console.error('❌ File not found:', audio);
  }
}

async function cmdScore() {
  const file = positional[0];
  if (!file || !existsSync(file)) {
    console.error('❌ Usage: thien-nhan score <results.json>');
    process.exit(1);
  }
  
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const { scoreCandidateOverall, applyHiringWisdom } = await loadModule('candidate-scorer.mjs');
  
  const overall = scoreCandidateOverall(data);
  const wisdom = applyHiringWisdom(overall);
  
  console.log('🔱 THIÊN NHÃN — Candidate Score\n');
  console.log(`Overall: ${overall.overallScore}/10 → ${overall.ranking}`);
  console.log(`Recommendation: ${overall.recommendation}`);
  console.log(`Strengths: ${overall.topStrengths.join(', ')}`);
  console.log(`Growth areas: ${overall.areasForGrowth.join(', ')}`);
  console.log(`\n💡 Wisdom: ${wisdom.applicableWisdom.join(' | ')}`);
}

async function cmdCompare() {
  const [f1, f2] = positional;
  if (!f1 || !f2 || !existsSync(f1) || !existsSync(f2)) {
    console.error('❌ Usage: thien-nhan compare <candidate1.json> <candidate2.json>');
    process.exit(1);
  }
  
  const { scoreCandidateOverall } = await loadModule('candidate-scorer.mjs');
  const d1 = JSON.parse(readFileSync(f1, 'utf8'));
  const d2 = JSON.parse(readFileSync(f2, 'utf8'));
  const s1 = scoreCandidateOverall(d1);
  const s2 = scoreCandidateOverall(d2);
  
  console.log('🔱 THIÊN NHÃN — Candidate Comparison\n');
  console.log(`${basename(f1)}: ${s1.overallScore}/10 → ${s1.ranking}`);
  console.log(`${basename(f2)}: ${s2.overallScore}/10 → ${s2.ranking}`);
  console.log(`\n${s1.overallScore > s2.overallScore ? '✅ ' + basename(f1) + ' leads' : s2.overallScore > s1.overallScore ? '✅ ' + basename(f2) + ' leads' : '🤝 Tie'}`);
}

async function cmdReport() {
  const file = positional[0];
  if (!file || !existsSync(file)) {
    console.error('❌ Usage: thien-nhan report <results.json> [--output report.md]');
    process.exit(1);
  }
  
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const { scoreCandidateOverall, applyHiringWisdom } = await loadModule('candidate-scorer.mjs');
  const overall = scoreCandidateOverall(data);
  const wisdom = applyHiringWisdom(overall);
  
  const report = `# 🔱 THIÊN NHÃN — Báo Cáo Đánh Giá Ứng Viên

## Tổng Điểm: ${overall.overallScore}/10 → ${overall.ranking}

## Khuyến Nghị
${overall.recommendation}

## Điểm Mạnh
${overall.topStrengths.map(s => '- ' + s).join('\n')}

## Cần Cải Thiện
${overall.areasForGrowth.map(a => '- ' + a).join('\n')}

## Lời Khuyên Tuyển Dụng
${wisdom.applicableWisdom.map(w => '> ' + w).join('\n')}

---
*Generated by Thiên Nhãn (天眼) — Supreme HR Assessment Skill*
`;

  const output = flags.output || 'report-thien-nhan.md';
  writeFileSync(output, report);
  console.log(`📝 Report saved to: ${output}`);
}

async function cmdAnticheat() {
  const file = positional[0];
  if (!file || !existsSync(file)) {
    console.error('❌ Usage: thien-nhan anticheat <assessment-data.json>');
    process.exit(1);
  }
  
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const { detectCheating } = await loadModule('candidate-scorer.mjs');
  const result = detectCheating(data);
  
  console.log('🔱 THIÊN NHÃN — Anti-Cheat Scan\n');
  console.log(`Verdict: ${result.verdict}`);
  console.log(`Suspicious score: ${result.suspiciousScore}`);
  if (result.flags.length > 0) {
    console.log('Flags:');
    for (const f of result.flags) console.log(`  ⚠️ [${f.severity}] ${f.type}`);
  }
}

async function cmdWisdom() {
  const { HIRING_WISDOM } = await loadModule('candidate-scorer.mjs');
  console.log('🔱 THIÊN NHÃN — Hiring Wisdom (22 principles)\n');
  HIRING_WISDOM.principles.forEach((p, i) => console.log(`${i + 1}. ${p}`));
}

function cmdHelp() {
  console.log(`
🔱 THIÊN NHÃN (天眼) — Supreme HR Assessment CLI

Commands:
  assess [disc|bigfive|mbti|all]     Generate assessment questions
  profile <answers.json>             Analyze personality from answers
  face <image.jpg>                   Physiognomy (face reading) analysis
  interview <audio.mp3>              Analyze interview recording
  score <results.json>               Score candidate overall
  compare <c1.json> <c2.json>        Compare two candidates
  report <results.json>              Generate assessment report
  anticheat <data.json>              Run anti-cheat detection
  wisdom                             Show hiring wisdom tips
  help                               Show this help

Options:
  --role "Position"    Target role for analysis
  --mode combined      Physiognomy mode (eastern/western/combined/hiring)
  --export file.json   Export assessment questions
  --output file.md     Report output filename
  --transcript file    Pre-made transcript for interview analysis

Examples:
  node thien-nhan.mjs assess disc --export disc.json
  node thien-nhan.mjs profile answers.json
  node thien-nhan.mjs face candidate.jpg --role "Hành chính" --mode hiring
  node thien-nhan.mjs interview call.mp3 --transcript call.txt
  node thien-nhan.mjs score results.json
  node thien-nhan.mjs compare alice.json bob.json
  node thien-nhan.mjs report results.json --output report.md
  `);
}

// ═══════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════

const commands = {
  assess: cmdAssess,
  profile: cmdProfile,
  face: cmdFace,
  interview: cmdInterview,
  score: cmdScore,
  compare: cmdCompare,
  report: cmdReport,
  anticheat: cmdAnticheat,
  wisdom: cmdWisdom,
  help: cmdHelp
};

if (!command || !commands[command]) {
  cmdHelp();
} else {
  try {
    await commands[command]();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
