# The Morning Brief prompt

This document records the exact instruction the app sends to the AI when you
press **Refresh** on a Morning Brief, what gets filled into it, what comes back,
and what to watch for if you change it.

The prompt itself lives in [`src/constants/prompts.ts`](../src/constants/prompts.ts),
in `MORNING_BRIEF_PROMPT`. It is assembled and sent by `generateMorningBrief` in
[`src/services/aiService.ts`](../src/services/aiService.ts). If you edit the
prompt, edit it there — this file is a record, not the source.

---

## The three things filled into the prompt

The prompt is a template with three blanks.

| Blank | What goes in | Where it comes from |
|---|---|---|
| `part` | `1`, `2` or `3` | The `part` field of the day's entry in the lesson plan |
| `topic` | The day's topic name | The `topic` field of the day's entry in the lesson plan |
| `errorBridgeContext` | Your five most recent wrong answers | The `errors` table, newest first |

The error list is formatted one per line as `- category: question text`. The four
categories are `rule_gap`, `calculation_error`, `exception_missed` and
`trap_fallen`. If you have no recorded errors, this blank is left empty and the
prompt asks for commonly missed nuances instead.

There is also a fixed value, `TAX_YEAR`, set to **2025** at the top of the
prompts file. Every prompt in the app uses it. Changing it there changes it
everywhere.

---

## The prompt, exactly as sent

Text in `${...}` is a blank filled in at the moment you press Refresh.

```text
You are an expert IRS tax educator helping a student prepare for the IRS Special Enrollment Examination (SEE) Part ${part}.

Tax Year: **${TAX_YEAR}** — Use ${TAX_YEAR} figures, thresholds, and inflation-adjusted amounts throughout.

Today's topic contains the following subtopics (separated by newlines):
${topic}

IMPORTANT INSTRUCTIONS ON DEPTH AND DETAIL:
- Be THOROUGH and COMPREHENSIVE. Cover EVERY testable aspect of each subtopic.
- Each item's "rule" field should be a DETAILED explanation (2-4 sentences), not a one-line summary.
- Each item's "threshold" field should list ALL relevant ${TAX_YEAR} dollar amounts, percentages, phase-out ranges, and income limits — not just one number.
- Each item's "tip" field should explain the trap in enough detail that a student understands WHY it's tricky.
- Aim for at LEAST 4-6 items per section. If a subtopic has more testable areas, include them ALL.
- Do NOT summarize or abbreviate. The student relies on this brief as their primary study material.

Break the topic into granular, digestible sub-items grouped by subtopic. For example, "Filing Status & Dependents" should become two sections: one for Filing Status (with items for MFJ, MFS, HOH, QSS, Single) and one for Dependents (with items for Qualifying Child test, Qualifying Relative test). Keep each item focused on one key concept but explain it thoroughly.

Recent errors to address in the Error Bridge section:
${errorBridgeContext}

Return ONLY a valid JSON object (no markdown, no explanation outside JSON):
{
  "overview": "A 3-5 sentence paragraph explaining what this topic covers in plain English, why it matters in real-world tax practice, and what real-life situations trigger these rules.",
  "sections": [
    {
      "heading": "Subtopic heading (e.g., Filing Status)",
      "items": [
        {
          "label": "Specific item name (e.g., Head of Household)",
          "rule": ["Bullet point 1 — core rule or definition with ${TAX_YEAR} figure", "Bullet point 2 — additional rule detail or condition", "Bullet point 3 — further detail if needed"],
          "threshold": ["Bullet 1 — specific ${TAX_YEAR} dollar amount or limit", "Bullet 2 — phase-out range or income limit", "Bullet 3 — additional threshold if applicable"],
          "form": ["Bullet 1 MUST detail: The IRS required sources through which a tax preparer shall confirm the amount to be included while preparing tax returns/filing", "Bullet 2 MUST detail: The supplemental forms/schedules where the amounts and information are to be recorded and attached while filing tax returns", "Bullet 3 — any additional form details"],
          "tip": ["Bullet 1 — exam trap with explanation of WHY it tricks students and how to avoid it", "Bullet 2 — additional trap or memorization tip if applicable"]
        }
      ]
    }
  ],
  "connections": "3-5 sentences on how today's subtopics connect to other SEE exam domains — be specific about which other topics interact with today's material",
  "examTraps": "5-8 bullet points: '• [detailed trap description explaining the trap and the correct approach]'",
  "errorBridge": "Detailed guidance to avoid repeating recent wrong answers — explain the correct rule for each error"
}
```

The block beginning `Recent errors to address` is included only when you have
recorded errors. When you have none it is left out completely, and the last line
of the JSON template changes to:

```text
"errorBridge": "No recent errors. Cover 3-4 commonly tested nuances and edge cases that students frequently miss on this topic."
```

---

## A worked example

Day 4 of the lesson plan is `Interest, Dividends & Kiddie Tax`, Part 1. Assuming
two recorded errors, the first lines sent to the AI are:

```text
You are an expert IRS tax educator helping a student prepare for the IRS Special Enrollment Examination (SEE) Part 1.

Tax Year: **2025** — Use 2025 figures, thresholds, and inflation-adjusted amounts throughout.

Today's topic contains the following subtopics (separated by newlines):
Interest, Dividends & Kiddie Tax
```

and further down:

```text
Recent errors to address in the Error Bridge section:
- calculation_error: A child has $3,200 of unearned income. How much is taxed at the parent's rate?
- exception_missed: Which of the following is NOT exempt from federal income tax?
```

---

## What comes back, and where it appears on screen

The AI must reply with a JSON object and nothing else. The app strips any code
fences, parses it, and stores the result in the `morning_brief_content` column of
the `sessions` table.

| Field returned | Where you see it |
|---|---|
| `overview` | The paragraph at the top of the brief |
| `sections[].heading` | Each section title, and the label on its **View Story** button |
| `sections[].items[].label` | The name of each item within a section |
| `sections[].items[].rule` | The **Rule** bullets |
| `sections[].items[].threshold` | The **Threshold** bullets |
| `sections[].items[].form` | The **Form** bullets |
| `sections[].items[].tip` | The **Tip** bullets |
| `connections` | The "How this connects" section |
| `examTraps` | The "Exam traps" list |
| `errorBridge` | The "Error Bridge" section |

If the reply is not valid JSON, the brief fails to generate and an error is shown
instead. Nothing is saved.

---

## Settings that affect the result

These are not part of the prompt text, but they change what you get back.

**Which model answers.** The Morning Brief is classified as a heavy task, so it
goes to the provider's strongest model — `deepseek-v4-pro` for DeepSeek,
`claude-opus-4-6` for Claude. You choose the provider in Settings.

**How long the answer may be.** The brief is capped at 16,384 tokens for most
providers. DeepSeek gets 65,536, because its models think before answering and
that thinking counts against the same allowance.

**Whether DeepSeek thinks first.** Controlled by `DEEPSEEK_THINKING` in
`aiService.ts`. Thinking on produces more carefully checked figures and takes
noticeably longer. Thinking off is faster.

---

## Two things to know before you edit the prompt

**The topic is sent as one line, not a list of subtopics.** The prompt says the
topic "contains the following subtopics (separated by newlines)", but the lesson
plan holds a single topic name such as `Interest, Dividends & Kiddie Tax`. There
are no newlines in it. The AI therefore decides for itself how to split the topic
into sections.

That is why the section headings can differ each time you press Refresh. It is
also why refreshing can orphan a story: a story is filed under the heading it was
generated for, so if the new brief names that section differently, the old story
can no longer be reached. The app already deletes stories whose heading has
disappeared. If you want the sections to stay the same between refreshes, give
each lesson plan entry an explicit list of subtopics and send that instead.

**The depth instructions and the output shape disagree.** The instructions ask
for the `rule`, `threshold` and `tip` fields to be detailed explanations of two
to four sentences. The JSON template asks for those same three fields as arrays
of short bullet points. The AI has to pick one, and it generally follows the JSON
template. If you want longer prose, change the JSON template, not just the
instructions above it.
