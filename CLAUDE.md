# CLAUDE.md — Place this file in your ea-command-center project root

```
# CLAUDE.md

## Project
EA Command Center — IRS SEE exam prep daily study app

## Commands
- `npm run dev` — Start Vite dev server (port 5173)
- `npm run build` — Production build to dist/
- `npm run lint` — ESLint check
- `vercel` — Deploy to Vercel

## Architecture
- React 18 + TypeScript + Tailwind CSS + Vite
- Supabase for auth + database (PostgreSQL with RLS)
- Claude API for AI features (Smart Opus Hybrid routing)
  - Opus 4.6 for: morning brief, mind map scaffold, Anki card generation
  - Haiku 4.5 for: MCQ generation, error categorization
- localStorage as write-through cache for offline resilience
- Deployed to Vercel for cross-device access

## File Structure
- src/lib/supabase.ts — Supabase client init
- src/types/index.ts — All TypeScript interfaces
- src/constants/lessonPlan.ts — 50-topic lesson plan data
- src/constants/prompts.ts — AI prompt templates
- src/services/aiService.ts — Model-agnostic AI service layer
- src/services/storageService.ts — Supabase + localStorage sync
- src/services/authService.ts — Login/signup/session
- src/components/AuthGate.tsx — Login/signup screen
- src/components/Sidebar.tsx — Lesson plan with status indicators
- src/components/tabs/ — TodayTab, DashboardTab, CardsTab, SettingsTab
- src/components/today/ — MorningBrief, VideoLinks, StudyNotes, MindMapScaffold, MCQQuiz, EveningLock
- src/components/dashboard/ — ErrorTable, TopicHeatMap
- src/components/cards/ — CardLibrary, FlipReview
- supabase/schema.sql — Database tables + RLS policies

## Conventions
- TypeScript strict mode, no `any` types
- Tailwind for all styling, no separate CSS files
- Dark mode support required (use Tailwind dark: prefix)
- All Supabase tables use Row Level Security (user_id = auth.uid())
- AI service is model-agnostic: provider/model configurable in Settings
- Professional tone, no emojis in UI
- Use structured cards for AI output, never raw text or chat bubbles
- MCQ options are large clickable buttons, not radio buttons or text input

## Environment Variables (.env)
- VITE_SUPABASE_URL — Supabase project URL
- VITE_SUPABASE_ANON_KEY — Supabase anonymous key
(Claude API key is stored in user_settings table, entered by user in Settings tab)

## Database Tables (Supabase PostgreSQL)
- sessions — Per-day study session data (brief viewed, notes, quiz, scores)
- errors — All wrong MCQ answers with categories across all days
- anki_cards — Generated flashcards with review status
- user_settings — AI provider config, current day

## Error Categories
- rule_gap — Didn't know or misapplied the IRC rule/threshold
- calculation_error — Knew the rule but computed incorrectly
- exception_missed — Knew general rule but missed a specific exception
- trap_fallen — Fell for a common exam distractor or trick question

## IRS SEE Exam MCQ Formats (the app must generate these)
- Direct Question: "What is the maximum contribution limit for..."
- Incomplete Sentence: "The standard deduction for Head of Household is ________."
- All of the following EXCEPT: "All of the following are requirements EXCEPT:"
- Scenario-based: "John, age 67, received $24,000 in Social Security..."
```
