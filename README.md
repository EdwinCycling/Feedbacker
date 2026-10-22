# Feedbacker

A local-first customer feedback workspace with an English/Dutch landing page,
light/dark themes, source-linked feedback, charts, filters, search, CSV export and
review workflows. Built with React, TypeScript and Vite as a fully static site:
documents are read in the browser and never uploaded.

## Run

Requires Node.js 20 or newer (22 recommended).

```powershell
npm install
npm run dev       # http://127.0.0.1:5173
npm test
npm run build     # static output in dist/
npm run preview   # http://127.0.0.1:4173, with production security headers
```

VS Code's Run button also includes install, start, build and test tasks.

## Deploy to Netlify

Connect the GitHub repository in Netlify. [netlify.toml](netlify.toml) sets the
build command (`npm run build`), publish directory (`dist`), Node version and
security headers (strict CSP, no framing). No server, functions or environment
variables are needed. Customer documents are never part of the repository:
`Sources/`, `data/`, `Videos/`, `*.doc(x)` and `*.mp4` are git-ignored.

## Documents and analysis

- The workspace starts empty. Drag `.docx`, UTF-8 `.md` or `.txt` session documents
  anywhere onto the workspace, or use **Add documents / Documenten toevoegen**.
  MeetingSum Markdown and text downloads can be imported directly.
- Documents are kept in memory only. A reload or new visit starts empty again; the
  browser warns before leaving while documents are loaded. Re-adding a file with the
  same name replaces the previous version.
- Remove a single session from the session library (with undo), or use
  **Clear all / Alles wissen**, which can optionally clear the notebook too.
- Legacy binary `.doc` files are not supported. Open them in Word and save as `.docx`.
  Unsupported, unreadable, duplicate, empty or oversized files (over 20 MB, max.
  100 files per import) produce visible notices.
- The current parser understands the supplied Dutch interview structure:
  `Datum:`, `Onderwerp:`, `Executive Summary`, `Hoofdpunten` and numbered sections.
  Unstructured documents fall back to one observation. Customer names are inferred
  from filenames. Missing dates are left blank. Check extracted metadata.
- Sentiment and topics use lightweight Dutch-focused rules; they are not a trained
  model, confidence score or authoritative interpretation. Source text stays in its
  original language when the interface language changes.
- Summaries are original document excerpts and recurring-topic counts, **not
  generative AI**. No external AI services receive data.
- The workspace supports product, customer, date range, topic, sentiment and status
  filters. Search includes original source text, evidence and notes. Source-text
  matches intentionally include all observations from the matching session.
- CSV exports include the filtered observations and neutralize leading spreadsheet
  formula characters.

## Structured AI summaries with MeetingSum

The bilingual landing page includes a guide for
[MeetingSum](https://meetingsum.netlify.app/), a companion tool from the same maker.
It links to the separate site without sending documents, prompt parameters or a
referrer. There is no embedded service, automatic upload or AI API integration.
The session library links back to the guide.

1. Use MeetingSum's Section mode. Keep `Meeting Details` and `Executive Summary`;
   also select `Hoofdpunten (discussie)` / `Key Points (Discussion)` and
   `Actiepunten` / `Action items`.
2. Keep output language, style, product names, customer identifiers and session tags
   consistent. Use the guide's **Copy Feedbacker instruction** button to append
   formatting and evidence requirements to your generated prompt.
3. Run the prompt only in your organization's approved AI environment. Review the
   output against the transcript and apply appropriate anonymization.
4. Save one reviewed session per `.md`, `.txt` or `.docx` file and add the files
   to the workspace.

The importer recognizes MeetingSum's `[METADATA START]` / `[METADATA EINDE]` block,
including `Datum`, `Tags` and inline/multiline `Executive Summary`. The original
metadata field names remain Dutch even in English-output instructions. Missing
or unknown dates remain blank. An incomplete metadata block produces a visible
import notice instead of silently losing its structure.

Explicit `Klant:` / `Customer:` and `Product:` lines take precedence over filename
and subject inference. Session tags are added as topics to every feedback item
from that session; they do not determine sentiment, priority or status.
Markdown headings and bold field labels are normalized for extraction, while
the source viewer retains the original text. Discussion extraction stops at the
next recognized section, so separately numbered decisions or action lists do not
become duplicate feedback. Selected sections may be reordered.

AI-generated source summaries can contain errors, omissions or lost nuance.
Feedbacker's local processing does not make a separate AI provider's processing
local or private; check its terms and your organization's policy before use.

## Interactive walkthrough and local AI prompts

Use **Walkthrough / Rondleiding** in the workspace header, or start from the
landing page's help section. The optional, restartable walkthrough explains the
workflow: select feedback, identify patterns, inspect evidence, plan follow-up,
generate an analysis prompt and export a selection. Balloons and pointers follow
the relevant element, including on mobile. Use Next/Previous, Stop or Escape.
The walkthrough does not save review changes, and restores the previous workspace
view while preserving filters.

Open **AI prompt builder / AI-promptbouwer** in the workspace navigation:

1. Start with the current dashboard filters or all feedback, then include/exclude
   individual sessions.
2. Select analyses: needs/patterns, customer comparison, sentiment, time trends,
   MoSCoW priorities, risks, follow-up actions or a management brief. Optionally add
   a specific research question.
3. Choose output language, audience, depth, style, Markdown/JSON, source references,
   inclusion of team notes and full-session summaries, and a model context window.
4. Review the live prompt, then copy or download the complete instruction **and
   selected source evidence**. Run it yourself in your approved local AI model.
   Feedbacker does not connect to a model or automatically import generated results.

Prompt options change both instructions and the requested output structure.
Evidence carries stable feedback/source IDs. Team labels and notes are separated
from original evidence. Optional full-session summaries can include context outside
the current filters; the prompt explicitly marks this and excludes it from feedback
counts. Instructions require uncertainty, no invented evidence and human review.

Known-customer-name replacement is optional and **is not full anonymization**:
other names, contact details and identifying context may remain. Inspect the prompt
before copying or sharing it. Token counts are a rough character-based estimate,
not a model tokenizer. A warning appears above 75% of the selected context window;
content is never silently truncated. Reduce the selection or use a larger context.

Enable **Remember these settings** to retain prompt options in optional first-party
cookies. Custom research questions, selected session IDs and customer content are
never stored in those cookies. Without consent, options stay in memory for this visit.
The research question and session selection are not restored after a reload.

## Editing and persistence

### Central notebook

Open **Notebook / Notitiepagina** in the workspace header. Select readable text
in the workspace or a feedback/source dialog and choose **Save to notes / Bewaar
in notities**. The draft receives a quote and its source filename/ID when available.
Page-level selections record the view and date. You can also type or paste directly.
The floating notebook icon is available on the website, workspace and source/feedback
dialogs. It copies selected text, or the current page/dialog's readable content if
nothing is selected. Editable form fields are excluded; the read-only AI prompt is
included. The top bar and navigation remain visible while scrolling, including the
compact navigation on mobile.

This is one central Markdown/plain-text page, not a full Notion editor.
Edit the title/content and explicitly **Save notes**. Drafts survive internal
navigation but not a browser reload; unsaved changes trigger the browser's leave
warning. Saved notes live in this browser's `localStorage`, independently of
cookies, and survive reloads (documents do not). They can contain customer data;
clear them via the notebook or **Clear all** on shared computers.
Concurrent stale saves from another tab are rejected instead of overwriting;
download your draft before reloading to merge manually.

Download the current draft as `.md`. **Open email app** uses a `mailto:` link;
it does not send mail or attach files automatically. Long notes must be downloaded
and attached manually because mail-link lengths vary by platform. Sharing requires
an installed/configured mail client and authorized recipients.

### Reviewing feedback

Review a feedback item to edit title, customer, product, session date, topics,
sentiment, priority, status and notes. Original Word documents are never changed.
Feedback-level metadata edits do not rewrite the original session metadata shown
in the session library.

Edits live in memory with the documents and are lost on reload; export CSV or copy
to the notebook to keep results. Identifiers are based on filename and section
title: re-adding the same file keeps edits for unchanged sections.

## Privacy, cookies and limitations

- The hosted site only serves static files. Documents are parsed in the browser
  and never sent to Netlify or any other server. There is no login, multi-user
  sharing or cloud synchronization.
- Nothing is uploaded to external AI or analytics services. Runtime UI assets and
  fonts are local; typography uses installed system fonts rather than proprietary
  brand fonts or a remote font provider.
- Optional first-party cookies `feedbacker-language`, `feedbacker-theme`,
  `feedbacker-preferences`, `feedbacker-prompt` and `feedbacker-tour` last one year,
  use `SameSite=Strict`, and use `Secure`
  on HTTPS. They contain preferences only, never document content. Choosing
  **Use for this visit** keeps preferences in memory without writing cookies.
  Prompt options and walkthrough dismissal are preferences; neither customer
  content nor custom research questions are saved in cookies. Withdraw preference
  persistence under **Privacy & cookies** or disable it in the prompt builder.
- No advertising, third-party tracking or analytics cookies are used.
- Protect customer personal information and follow your organization's lawful
  processing, access, retention and deletion policies.
- Feedbacker is independent of and not endorsed by Exact. The visual direction uses
  restrained red accents and enterprise typography; it does not use Exact's logo,
  proprietary typefaces or website assets.
