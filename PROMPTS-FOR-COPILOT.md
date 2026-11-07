# Prompts for Copilot — Paperwork Buddy SD

Put this file and `PAPERWORK-BUDDY-SD-BUILD-PLAN.md` in the same folder you open in VS Code.
Copilot reads your open files, so the build plan is context — you never have to re-explain the project.

**Free-tier budget:** ~2,000 inline completions + ~50 chat requests per month.
This build needs about **5–15 chat messages**. Everything else: use inline completions (typing + Tab)
or select code and hit **Ctrl+I / Cmd+I** for inline chat — cheaper and faster for tweaks.

---

## How to use this file

1. Open Copilot Chat in VS Code (chat icon in the top bar).
2. Set the mode dropdown to **Ask** (reads your whole workspace) for prompt 1,
   then **Edit** or **Agent** for prompts 2–5 so Copilot actually writes the files.
3. Copy-paste one prompt at a time. Review what it generates before moving on.
4. **Screenshot every exchange** right after it happens — that's your prize-track evidence.

---

## Prompt 1 — Scaffold `index.html`

```
Read PAPERWORK-BUDDY-SD-BUILD-PLAN.md in this workspace. Generate index.html: a
single-page app for seniors. One screen: big title "Paperwork Buddy SD", a file
input styled as a giant "Take a photo of your letter" button, a reading-level
picker (Simple / Detailed), and an empty results area. Accessibility: minimum
20px font, high contrast, large tap targets. Link to styles.css, app.js,
prompts.js.
```

## Prompt 2 — Styles `styles.css`

```
Generate styles.css for this app. Seniors are the users: 20px+ base font, high
contrast (near-black text on white), buttons at least 56px tall, generous
spacing, a red deadline banner style, and card styles for the results section.
Support light and dark mode with prefers-color-scheme.
```

## Prompt 3 — Prompts `prompts.js`

```
Generate prompts.js. Export three constants from the build plan:
SENIOR_SYSTEM_PROMPT (the "You are Paperwork Buddy..." system prompt),
ANALYZE_PROMPT (the structured JSON output prompt asking for letter_type,
short_version, action_steps, deadline, is_denial, denial, scam_check,
local_help), and APPEAL_PROMPT (the appeal letter drafting prompt with
[FILL IN] blanks, under 250 words).
```

## Prompt 4 — App logic `app.js`

```
Generate app.js. Flow: user uploads an image → show a loading state with plain
text "Reading your letter..." → send the image + SENIOR_SYSTEM_PROMPT +
ANALYZE_PROMPT to Gemini via the @google/genai SDK with model
"gemini-2.5-flash" → parse the JSON response → render each card (short
version, action steps as a checklist, deadline in red if present, scam
warning first if scam_check flags it). API key comes from a field the user
pastes it into (stored in localStorage), not hardcoded.
```

## Prompt 5 — Appeal branch (add to `app.js`)

```
Add to app.js: if the Gemini JSON has is_denial: true, show an "Appeal
Assist" card with a button "Help me write an appeal". Clicking it sends a
second Gemini request using APPEAL_PROMPT plus the first analysis, then
displays the draft letter in a large readable box with the [FILL IN]
blanks highlighted in yellow.
```

---

## Debugging prompts (spend chat credits here only if inline can't fix it)

```
This error appears when I upload an image: [paste the full error].
app.js is open. Find the cause and fix it.
```

```
Run an accessibility audit on index.html and styles.css. Check: font sizes
20px minimum, color contrast ratios, keyboard navigation, aria labels on
the upload button. List every issue with the exact fix.
```

```
Add a "Print this page" button to the results section that calls
window.print(), and a print stylesheet so the cards print cleanly.
```

---

## After each prompt: log the contribution

Keep a running `COPILOT_LOG.md` in the repo. After each Copilot exchange,
add one entry:

```
## [timestamp] — what was built
**Prompt I sent:** (paste it)
**What Copilot produced:** (one sentence — e.g. "full index.html scaffold")
**What I changed by hand:** (e.g. "renamed button, reworded subtitle, fixed
the label on the reading-level picker")
**Human judgment call:** (why you changed it — "Copilot's default wording
was too jargon-y for seniors")
```

Judges look for **judgment, not copy-paste**. An entry that says "I changed
Copilot's output because X" is worth more than "Copilot did it."

Commit with messages that become git-history evidence, e.g.:
`copilot: drafted appeal-letter prompt chain` or `copilot: fixed image
upload error, adjusted CORS handling by hand`.

---

## Evidence checklist for the Copilot track (screenshot as you go)

- [ ] Prompt 1 → index.html generated (before + after your edits)
- [ ] Prompts 2–5 → each file generated
- [ ] One real bug fix from an error message (the money shot)
- [ ] Accessibility audit output with the fixes applied
- [ ] COPILOT_LOG.md showing repeated human judgment
- [ ] Git commit history with `copilot:` prefixed messages
- [ ] Final demo GIF of the whole app working
