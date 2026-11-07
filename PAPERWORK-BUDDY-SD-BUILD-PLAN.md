# Paperwork Buddy SD — Build Plan

**One-line pitch:** Older San Diegans photograph a confusing letter (bills, insurance denials, benefits notices) and get a plain-language summary, an action checklist, a scam check, and — when it's a denial — a ready-to-file draft appeal letter. Built with Google Gemini. Built *with* GitHub Copilot.

**Prize tracks targeted:** Google Gemini API · Best Use of GitHub Copilot · Social impact (healthcare access + accessibility/inclusion for seniors)

---

## 1. What the app does (user flow)

```
[Photo / upload letter] → [Big-text summary] → [Action checklist w/ deadlines]
        → (if denial) [Draft appeal letter + how-to-file]
        → [Scam check] → [Local help: 211 SD, HICAP, County AIS]
```

### Screen 1 — Home
- Giant text: **"Got a letter you don't understand? Take a picture."**
- Big buttons: `📷 Take photo` | `📄 Upload file (PDF/JPG)` | `Paste text`
- Large font toggle (A / A+ / A++) — accessibility is a judging theme, make it visible
- Disclaimer bar: "Not legal or medical advice. Free human help is always listed with your results."

### Screen 2 — Reading level picker
- "How should we explain it?" → Simple / Very simple / Explain like I'm talking to a friend
- Radio buttons, huge hit targets. Default: Very simple.

### Screen 3 — Results (one card per section)
1. **The short version** — 2–3 sentences: what this letter is and what it means for them
2. **What to do** — numbered checklist, one step per line, each with a date if there's a deadline. Deadlines in big red bold text with the exact date.
3. **Appeal mode (auto-triggers when the letter is a denial)** — see §3
4. **Scam check** — ✅ "Looks legitimate" or ⚠️ red flags listed (urgency threats, gift cards, SSN requests, "act now")
5. **Talk to a real person** — 211 San Diego, HICAP (free Medicare counseling, incl. appeals), County Aging & Independence Services, senior legal aid. Phone numbers as tappable `tel:` links.

### Screen 4 — Appeal Assist (appears as a button on results when a denial is detected)
- What was denied and the plain-English reason
- Their rights + deadline (huge red date) + how to file (phone/mail/portal)
- **Draft appeal letter** in a copyable textarea, with 2–3 `[FILL IN: ___]` blanks
- "Print this" button + "Email to a family member" button
- Escalation path if appeal #1 fails

---

## 2. Tech stack (beginner-friendly, one-day-buildable)

- **Frontend:** single-page app — plain HTML/CSS/JS or React if the team knows it. One page does it.
- **API:** Google Gemini via `@google/genai` (JavaScript SDK) — send image + text, get structured response.
- **No backend needed** if you call Gemini client-side with a key entered at runtime (fine for a hackathon demo; note in README that production would use a server proxy).
- **Files:**
  ```
  paper-work-buddy-sd/
  ├── index.html
  ├── app.js            # upload → Gemini → render cards
  ├── style.css         # senior-friendly: min 20px font, high contrast, big buttons
  ├── prompts.js        # all Gemini prompts, versioned & commented
  ├── README.md         # the judging document — see §6
  ├── docs/
  │   ├── COPILOT_LOG.md      # the Copilot prize evidence — see §5
  │   └── copilot-screenshots/
  │       ├── 01-copilot-writes-api-call.png
  │       ├── 02-copilot-fixes-bug.png
  │       └── ...
  └── sample-letters/   # fake demo letters you generate for the demo
  ```

---

## 3. The Gemini prompts (the heart of the Gemini prize)

Put these in `prompts.js`, commented. Judges **will** open this file — make the prompt engineering visible and explain it in the README.

### System prompt (sent with every request)

```
You are Paperwork Buddy, an assistant for older adults in San Diego reading
official letters they receive in the mail. You are NOT a lawyer and never
claim to be. Your job is to make the letter understandable and actionable.

Rules:
- Read level: {reading_level}. Short sentences. No jargon; when a technical
  term is needed, explain it in parentheses.
- Never invent facts. If something is unclear in the letter, say so.
- Be warm and reassuring, but never dismiss risk. Deadlines are serious.
- If the document is a bill, state clearly what they owe and by when.
- If the document is a denial or adverse decision, say so plainly and
  follow the APPEAL section format.
- If the document shows scam red flags, lead with a clear warning.
```

### Structured output prompt

Ask Gemini for JSON so rendering is clean:

```
Analyze the attached letter and respond ONLY with JSON:
{
  "letter_type": "bill | denial | benefits_notice | tax | utility | scam_suspected | other",
  "short_version": "2-3 plain sentences: what this is and what it means",
  "action_steps": [{"step": "...", "due_date": "YYYY-MM-DD or null"}],
  "deadline": "YYYY-MM-DD or null",
  "is_denial": true/false,
  "denial": {
    "what_was_denied": "...",
    "reason_in_plain_words": "...",
    "possible_error": "does the denial look like a mistake? why or why not",
    "appeal_deadline": "YYYY-MM-DD or null",
    "how_to_file": "phone / mail / portal, with any info from the letter"
  },
  "scam_check": {"verdict": "likely_legit | suspicious | clear_warning",
                 "red_flags": ["..."]},
  "local_help": pick relevant from: 211 San Diego (dial 211),
    HICAP 800-434-0222 (free Medicare counseling & appeals help),
    County of San Diego Aging & Independence Services 800-510-2020
}
```

### Appeal letter prompt (second call, only when `is_denial`)

```
Draft a formal but simple appeal letter for this denial. Use the details
from the letter (claim number, date, denial reason). Address it to the
appeals address in the letter. Leave 2-3 clearly marked blanks like
[FILL IN: your member ID] for anything the letter doesn't contain.
Keep it under 250 words. End by requesting reconsideration and a written
response. This is a draft the person will review, not legal advice.
```

### Why this wins the Gemini track (say this in the README)
- Vision + OCR on photographs of crumpled mail — genuinely hard input, not clean PDFs
- Structured JSON output driving the UI
- Adaptive reading-level generation
- A second, chained prompt (analysis → appeal draft) — shows prompt chaining, not one-shot use

---

## 4. The Copilot workflow (planned, so the evidence writes itself)

The Copilot prize goes to teams that **document** Copilot usage. Don't just use it — narrate it.

### Build the app in Copilot-first order:
1. **Scaffold:** ask Copilot chat to generate `index.html` (upload UI, big-font CSS, accessibility contrast).
2. **Gemini integration:** inline chat "how do I call the Gemini API from browser JS with an image file?" → screenshot the result.
3. **Structured output:** "make app.js parse Gemini's JSON response and render the cards" → screenshot.
4. **Appeal branch:** "add logic: if response.is_denial, show Appeal Assist button" → screenshot.
5. **A real bug fix:** when something breaks (it will), screenshot the error + the Copilot fix. **This is your single most valuable screenshot.**
6. **Accessibility pass:** "audit this CSS for WCAG contrast and font sizes for low-vision users" → screenshot. Doubles as social-impact evidence.

### Documentation discipline (assign ONE teammate as Copilot Historian):
- `docs/COPILOT_LOG.md` — an entry per feature:
  ```
  ## Feature: Appeal Assist
  **Date/time:** 2026-11-07 3:42pm
  **What we asked Copilot:** <paste the exact prompt>
  **What it produced:** <paste or summarize the code>
  **What we changed:** we adjusted X because Y (shows human judgment)
  **Time saved estimate:** ~45 min
  ```
- `docs/copilot-screenshots/` — numbered screenshots of the best moments (aim for 6–10: feature generations, one bug fix, one accessibility audit)
- Commit these alongside the code, with commit messages like `copilot: drafted appeal-letter prompt chain` — the git history itself becomes evidence

---

## 5. Demo letters to prepare (make fakes, don't use real mail)

Generate 3 realistic-looking fake letters with Copilot and save in `sample-letters/`:
1. **Insurance denial** — "not medically necessary," 60-day appeal window → triggers Appeal Assist. **This is your hero demo.**
2. **Medicare EOB** — $1,400 billed, $140 owed, easy-to-miss line.
3. **Scam letter** — "Your Medicare will be CANCELED, send $500 gift card" → scam check fires.

Demo script (~90 seconds): photo of denial letter → "Here's what it really says" → red deadline → **draft appeal letter** → HICAP phone number. Then flash the scam letter. Land the sentence: *"From 'I can't read this' to 'here's your appeal' in under a minute."*

---

## 6. README = the judging document

Judges spend ~3–5 minutes. Structure it exactly like this:

1. **The problem** — 3 sentences + one statistic. ("In San Diego County, 1 in 5 residents is 65+, and the average Medicare denial is only appealed ~1% of the time — mostly because the letters are unreadable.")
2. **30-second demo GIF** at the top, below the problem. Make it with a screen recorder; it must show the appeal draft.
3. **How it uses Gemini** — bullet the 4 techniques from §3 with a link to `prompts.js`.
4. **How we used Copilot** — link `COPILOT_LOG.md`, embed the 3 best screenshots inline in the README (don't make judges dig for them).
5. **Impact** — aging-in-place, scam protection, accessibility (WCAG-conscious design, reading levels), routes to free human help instead of replacing it.
6. **Run it** — clone, `npm i`, add key, open. Under 4 lines.
7. **What's next** — Spanish translation (huge in San Diego), family member sharing, 211 API integration.

---

## 7. Division of labor (3–4 people)

- **Person A:** Copilot Historian + README + demo GIF (the prize documentation)
- **Person B:** Frontend (screens 1–3) with Copilot
- **Person C:** Gemini integration + prompts.js (screens 4 + appeal branch)
- **Person D (or A):** fake sample letters, testing, pitch script

**Done at 60%:** summary + checklist + deadline in big red text on one page. Everything after that is upside.
