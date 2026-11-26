# UCI Entrena — ICU nursing training POC

Proof of concept of a bedside training platform for ICU nurses (ECMO and CRRT), designed around the Hospital Dr. Rafael Ángel Calderón Guardia (CCSS, Costa Rica) use case. The UI is in Spanish (target users); this README is in English.

> **Educational prototype.** Content is a draft pending clinical validation. It does not replace institutional protocols, manufacturer IFUs or medical orders. It stores no patient data.

## Run it

Open `index.html` in any browser. There is no build step and no dependencies apart from Google Fonts. `app.html` is the same page without the `<html>/<head>` wrapper, which is the format used for publishing it as a claude.ai Artifact.

## What the POC demonstrates

| Feature | Where | Notes |
|---|---|---|
| **Shift mode**: alarm/symptom lookup | `#turno` | Accent-insensitive search; emergency vs. adjustment severity; numbered steps; sources per card. |
| **Device-aware content** | `#equipos` | The unit selects its models. Lookup cards show model-specific notes, and scenario monitors relabel pressures (e.g. Cardiohelp `Pven / Pint / Part`). |
| **Interactive cases** (state machine) | `#casos`, `#caso-<id>` | 9 real-life scenarios (6 ECMO, 3 CRRT). Each choice scores 2/1/0 (best / incomplete / unsafe) with an explanation, followed by a debrief with key points. |
| **Hard question bank** | `#preguntas` | 17 MCQs with explanation and citation. |
| **Costa Rica context** | `#contexto` | Research findings and open items. |
| **Traceability** | `#fuentes` | 30+ sources, each typed (guideline / manufacturer / review / teaching). |

Progress and inventory are saved to `localStorage` only. This is a POC; real persistence belongs to the backend below.

## Target architecture (MVP and beyond)

```
PWA (Angular or Next.js, offline cache for "shift mode")
   │  REST/GraphQL
API (Spring Boot or NestJS) ── Auth (institutional SSO / email + roles)
   │
PostgreSQL ── Object storage (photos/short videos of the REAL devices)
   │
Headless CMS / admin panel for clinical editors (draft → review → published → expires)
```

### Core data model

```
Hospital 1─* Unit 1─* DeviceInstance *─1 DeviceModel (category: ecmo|crrt|vent|pump, sw_version)
DeviceModel 1─* AlarmGuide, Checklist, Procedure          (model-specific content)
Topic 1─* Module 1─* LearningObjective
ClinicalCase (state machine: nodes{monitor, prompt, choices[{label, score, feedback, next}]})
   *─* DeviceModel (applies_to)   *─* Source
Source (type, edition, url, license)  ← linked from EVERY content item
ContentItem.review {status, reviewer, reviewed_at, expires_at, version}
User (role: learner|editor|clinical_lead|unit_admin) 1─* Attempt (case_id, score, path) — no patient data
```

The scenario format in `app.html` (`SCENARIOS[]`) is deliberately the same JSON shape the CMS would store, so content written for the POC carries over.

### Content governance (important for a clinical product)

1. Every item carries its sources and a review status. The clinical lead approves before publishing.
2. Source hierarchy: **institutional protocol > manufacturer IFU > ELSO/KDIGO guideline > review/study > teaching material**.
3. Expiry dates (e.g. 12 months) trigger re-review. Guideline updates (e.g. KDIGO 2026 AKI) trigger targeted review.
4. Paraphrase and cite guidelines and manuals; don't copy them verbatim (copyright).

## Next steps

See `RESEARCH.md` → *Pendientes* (open items). The highest-value next action is confirming the real device inventory (brand, model, software version, filter set) and the unit's own protocols (anticoagulation targets, citrate protocol, emergency drills).
