import { GoogleGenAI } from "https://esm.sh/@google/genai";
import { APPEAL_PROMPT, ANALYZE_PROMPT, SENIOR_SYSTEM_PROMPT } from "./prompts.js";

const fileInput = document.querySelector("#letter-file");
const fileName = document.querySelector("#file-name");
const apiKeyInput = document.querySelector("#api-key");
const analyzeButton = document.querySelector("#analyze-button");
const status = document.querySelector("#status");
const results = document.querySelector("#results");
const resultsContent = document.querySelector("#results-content");

apiKeyInput.value = localStorage.getItem("paperwork-buddy-gemini-key") || "";
apiKeyInput.addEventListener("input", () => {
  localStorage.setItem("paperwork-buddy-gemini-key", apiKeyInput.value.trim());
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  fileName.textContent = file ? `${file.name} (${formatBytes(file.size)})` : "No file selected";
  analyzeButton.disabled = !file;
});

document.querySelectorAll("[data-font-size]").forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.remove("large-text", "x-large-text");
    const size = button.dataset.fontSize;
    if (size === "large") document.body.classList.add("large-text");
    if (size === "x-large") document.body.classList.add("x-large-text");
  });
});

analyzeButton.addEventListener("click", analyzeLetter);

async function analyzeLetter() {
  const file = fileInput.files?.[0];
  const apiKey = apiKeyInput.value.trim();
  if (!file || !apiKey) {
    showStatus("Choose a letter and enter a Gemini API key first.", true);
    return;
  }

  setBusy(true);
  showStatus("Reading your letter...");
  results.hidden = true;

  try {
    const analysis = await requestGemini(
      apiKey,
      file,
      SENIOR_SYSTEM_PROMPT.replace("{reading_level}", getReadingLevel()),
      ANALYZE_PROMPT,
    );
    renderAnalysis(analysis, apiKey, file);
    results.hidden = false;
    showStatus("Your letter has been explained below.");
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "We could not read this letter. Please try again.", true);
  } finally {
    setBusy(false);
  }
}

async function requestGemini(apiKey, file, systemInstruction, prompt) {
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToBase64(file);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: file.type || "application/octet-stream", data: base64Data } },
        { text: prompt },
      ],
    }],
    config: { systemInstruction, responseMimeType: "application/json" },
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Gemini returned an unexpected response. Please try again.");
  }
}

function renderAnalysis(analysis, apiKey, file) {
  resultsContent.replaceChildren();
  if (analysis.scam_check?.verdict === "clear_warning" || analysis.scam_check?.verdict === "suspicious") {
    resultsContent.append(createCard("Scam check", renderScamCheck(analysis.scam_check), "warning"));
  }
  resultsContent.append(createCard("The short version", `<p>${escapeHtml(analysis.short_version || "The letter was unclear.")}</p>`));

  const steps = Array.isArray(analysis.action_steps) ? analysis.action_steps : [];
  const stepsHtml = steps.length
    ? `<ol class="checklist">${steps.map((item) => `<li>${escapeHtml(item.step || "")}${item.due_date ? ` <span class="due-date">Due ${escapeHtml(formatDate(item.due_date))}</span>` : ""}</li>`).join("")}</ol>`
    : "<p>No specific action steps were found.</p>";
  resultsContent.append(createCard("What to do", stepsHtml));

  if (analysis.deadline) {
    resultsContent.append(createCard("Important deadline", `<div class="deadline">${escapeHtml(formatDate(analysis.deadline))}</div>`));
  }
  if (analysis.is_denial) {
    resultsContent.append(createAppealCard(analysis, apiKey, file));
  }
  if (analysis.scam_check?.verdict === "likely_legit") {
    resultsContent.append(createCard("Scam check", renderScamCheck(analysis.scam_check)));
  }
  const help = Array.isArray(analysis.local_help) ? analysis.local_help : [];
  resultsContent.append(createCard("Talk to a real person", `<div class="help-links">${help.map((item) => `<a href="${helpLink(item)}">${escapeHtml(item)}</a>`).join("") || "<p>Call 211 for local help.</p>"}</div>`));
}

function createAppealCard(analysis, apiKey, file) {
  const card = createCard("Appeal Assist", `<p><strong>${escapeHtml(analysis.denial?.what_was_denied || "This decision was denied.")}</strong></p><p>${escapeHtml(analysis.denial?.reason_in_plain_words || "The letter does not explain the reason clearly.")}</p>${analysis.denial?.appeal_deadline ? `<div class="deadline">Appeal by ${escapeHtml(formatDate(analysis.denial.appeal_deadline))}</div>` : ""}<p>${escapeHtml(analysis.denial?.how_to_file || "Follow the appeal instructions in the letter.")}</p>`);
  const button = document.createElement("button");
  button.className = "primary-button";
  button.textContent = "Help me write an appeal";
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Writing your draft...";
    try {
      const draftText = await requestAppealDraft(apiKey, file, `${APPEAL_PROMPT}${JSON.stringify(analysis)}`);
      card.append(renderDraft(draftText));
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "We could not write the appeal draft.", true);
    } finally {
      button.remove();
    }
  });
  card.append(button);
  return card;
}

async function requestAppealDraft(apiKey, file, prompt) {
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToBase64(file);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: file.type || "application/octet-stream", data: base64Data } },
        { text: prompt },
      ],
    }],
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty appeal draft.");
  return text;
}

function renderDraft(text) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<h3>Your draft appeal letter</h3><div class="appeal-draft" role="textbox" aria-label="Draft appeal letter" tabindex="0">${escapeHtml(text).replace(/\[FILL IN:[^\]]+\]/g, '<span class="fill-in">$&</span>').replace(/\n/g, "<br>")}</div>`;
  return wrapper;
}

function renderScamCheck(check) {
  const label = check.verdict === "likely_legit" ? "✅ Looks legitimate" : "⚠️ Be careful";
  const flags = Array.isArray(check.red_flags) && check.red_flags.length ? `<ul>${check.red_flags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join("")}</ul>` : "<p>No red flags were found.</p>";
  return `<p><strong>${label}</strong></p>${flags}`;
}

function createCard(title, body, className = "") {
  const card = document.createElement("article");
  card.className = `card ${className}`.trim();
  card.innerHTML = `<h3>${title}</h3>${body}`;
  return card;
}

function getReadingLevel() {
  return document.querySelector('input[name="reading-level"]:checked')?.value || "very simple";
}

function showStatus(message, isError = false) {
  status.hidden = false;
  status.className = `status${isError ? " error" : ""}`;
  status.textContent = message;
}

function setBusy(isBusy) {
  analyzeButton.disabled = isBusy || !fileInput.files?.length;
  analyzeButton.textContent = isBusy ? "Reading your letter..." : "Explain my letter";
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("We could not open that file."));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function helpLink(item) {
  if (item.includes("211")) return "tel:211";
  if (item.includes("HICAP")) return "tel:18004340222";
  if (item.includes("Aging")) return "tel:18005102020";
  return "#";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}
