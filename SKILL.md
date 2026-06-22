---
name: thien-nhan
description: "Hệ thống đánh giá nhân sự toàn diện cấp tập đoàn. Kết hợp DISC, Big Five, MBTI personality assessment với nhân tướng học Đông-Tây (physiognomy), phân tích phỏng vấn STAR, behavioral signals, anti-cheat, và hiring wisdom. Use when: tuyển dụng, phỏng vấn, đánh giá ứng viên, xem tướng, nhân tướng, so sánh ứng viên, personality test, face reading, HR assessment, recruitment, hiring."
---

# 🔱 Thiên Nhãn (天眼) — Supreme HR Assessment Skill

**Version:** 1.0.1
**Author:** Tiểu Tâm × Nấng (VaultCore)
**Category:** HR / Recruitment / Assessment

## Description

Hệ thống đánh giá nhân sự toàn diện cấp tập đoàn, kết hợp khoa học tâm lý phương Tây với nhân tướng học phương Đông. Dành cho tuyển dụng, phỏng vấn, và xây dựng đội ngũ.

## Capabilities

### 🧠 Personality Assessment
- **DISC** — 40 câu hỏi, 4 profiles, 12 combined profiles, 8 role-fit mappings
- **Big Five OCEAN** — 50 câu Likert, 5 factors, workplace insights
- **MBTI** — 40 câu A/B, 16 types, clarity scoring
- **Combined Profile** — Cross-validation DISC ↔ Big Five ↔ MBTI

### 🏯 Physiognomy (Nhân Tướng)
- **Đông Phương** — Ngũ Quan, Tam Đình, Tứ Khí Chất, Ngũ Nhạc, Thập Nhị Cung
- **Tây Phương** — Four Temperaments, Face Shapes, Micro-Expressions (Ekman), Eye Analysis
- **AI Vision** — Structured prompts for Claude/GPT-4V face reading
- **DeepFace Bridge** — Optional Python integration for age/gender/emotion detection

### 🎤 Interview Analysis
- **Transcript Processing** — Parse speaker turns, statistics
- **Keyword Extraction** — Top keywords, themes (positive/negative/technical/teamwork/leadership)
- **Behavioral Signals** — Filler words, hesitation, confidence, engagement
- **STAR Detection** — Automatic Situation/Task/Action/Result compliance check

### 📊 Scoring & Ranking
- **STAR Response Scorer** — Compliance + specificity + quality + impact scoring
- **Behavioral Scorer** — Filler rate, confidence, engagement metrics
- **Candidate Overall** — Weighted scoring across all assessments
- **Role Fit Analysis** — Match personality to role requirements

### 🛡️ Anti-Cheat
- Timing anomaly detection
- Perfect score pattern flag
- AI-generated text detection
- Tab switching / focus loss tracking
- Keystroke pattern analysis

### 📚 Hiring Wisdom
- 22 principles distilled from hiring & psychology literature
- Context-aware recommendation engine

## Usage

### CLI
```bash
# Generate assessment questions
node scripts/thien-nhan.mjs assess disc
node scripts/thien-nhan.mjs assess all --export questions.json

# Analyze personality from answers
node scripts/thien-nhan.mjs profile answers.json

# Face reading
node scripts/thien-nhan.mjs face photo.jpg --role "Hành chính" --mode hiring

# Interview analysis
node scripts/thien-nhan.mjs interview recording.mp3 --transcript transcript.txt

# Score candidate
node scripts/thien-nhan.mjs score results.json

# Compare candidates
node scripts/thien-nhan.mjs compare alice.json bob.json

# Generate report
node scripts/thien-nhan.mjs report results.json --output report.md

# Anti-cheat scan
node scripts/thien-nhan.mjs anticheat data.json

# Hiring wisdom
node scripts/thien-nhan.mjs wisdom
```

### As Module (Import)
```javascript
import { scoreDISC, scoreBigFive, scoreMBTI, combinedProfile } from './scripts/modules/personality-profiler.mjs';
import { buildFaceReadingPrompt, prepareFaceAnalysis } from './scripts/modules/physiognomy-engine.mjs';
import { parseTranscript, analyzeBehavioralSignals } from './scripts/modules/interview-analyzer.mjs';
import { scoreCandidateOverall, detectCheating } from './scripts/modules/candidate-scorer.mjs';
```

### With AI Agent (OpenClaw)
```
Thiên Nhãn, đánh giá ứng viên này:
- Chạy bài test DISC + Big Five
- Phân tích ảnh hồ sơ (nhân tướng)
- Phân tích transcript phỏng vấn
- Cho điểm tổng hợp + so sánh
```

## File Structure
```
hr-supreme-skill/
├── SKILL.md                           # This file
├── scripts/
│   ├── thien-nhan.mjs                 # CLI entry point (10 commands)
│   └── modules/
│       ├── assessment-engine.mjs      # Quiz/test generator from JD
│       ├── personality-profiler.mjs   # DISC + Big Five + MBTI scorer
│       ├── physiognomy-engine.mjs     # AI face reading engine
│       ├── interview-analyzer.mjs     # Transcript + behavioral analysis
│       └── candidate-scorer.mjs       # Scoring + anti-cheat + wisdom
├── knowledge/
│   ├── disc-questions.json            # 40 DISC questions + profiles
│   ├── big-five-questions.json        # 50 Big Five questions + factors
│   ├── mbti-questions.json            # 40 MBTI questions + 16 types
│   ├── star-framework.json            # 15 competencies + 7 role templates
│   ├── physiognomy-east.json          # Ngũ Quan, Tam Đình, Thập Nhị Cung
│   └── physiognomy-west.json          # Temperaments, micro-expressions
└── templates/
    ├── candidate-report.md            # Individual assessment report
    ├── comparison-report.md           # Multi-candidate comparison
    └── interview-questions.md         # Interview question template
```

## Ethical Guidelines

⚠️ **QUAN TRỌNG:**
1. Nhân tướng là **tham khảo bổ sung** (max 10-15% trọng số) — KHÔNG PHẢI tiêu chí chính
2. Luôn **kết hợp** với phỏng vấn, bài test, kinh nghiệm, references
3. **Không phân biệt đối xử** dựa trên ngoại hình
4. **Bias awareness** — halo effect, attractiveness bias, cultural differences
5. Kết quả assessment là **guidance**, quyết định cuối cùng thuộc về con người

## Requirements

- **Runtime:** Node.js 18+
- **Optional:** Python 3.10+ (for DeepFace), Whisper (for STT)
- **No external API keys required** — all scoring runs locally
- **AI Vision** (Claude/GPT-4V) needed only for physiognomy image analysis

## Version History

- **1.0.0** (2026-03-10) — Initial release. 18 beats, 5 modules, 6 knowledge files, 3 templates, 10 CLI commands.
