# AI-102 Final Last-Minute Revision (Trap-Only)

Use this as your final read before starting the exam. This is built from your full 32-day history, including repeated misses and your strongest patterns.

## What your results say right now

- Overall preparation is strong: 32/32 sessions completed, ~88.3% overall accuracy.
- Final mock was good but still trap-sensitive: 82.9% with 6 misses, mostly pattern/option traps (not concept gaps).
- Biggest risk is execution under pressure: hotspot mapping, sequence order, endpoint/class specificity, and RBAC boundary mix-ups.
- Biggest strength is fundamentals: when options are clean, your service selection and architecture reasoning are consistently correct.

## Your strongest areas (do not overthink these tomorrow)

- Domain 1 security/RAI controls were consistently strong.
- Domain 5 QA and several Bot/NLP days were high confidence.
- Domain 6 core search/content safety days included multiple perfect runs.
- You recover well after mistakes when the trap is recognized once.

Keep this mindset: **you usually lose marks from avoidable trap mechanics, not lack of knowledge.**

## High-probability traps from your own misses

### 1) Service boundary traps

- **Document Intelligence vs generic OCR/vision endpoint confusion**  
  If requirement is structured extraction from forms/receipts/invoices, think Document Intelligence model endpoints first.
- **OpenAI grounding source confusion**  
  “On your data” grounding points to Azure AI Search extension configuration, not generic chat extension wiring.
- **QnA Maker dependency trap**  
  Auto-provisioning patterns are specific (Search + Web App); do not add resources that “sound likely”.

### 2) RBAC and permission traps

- **Azure OpenAI User vs Contributor**  
  User is inference-focused. Contributor is required when question includes manage/deploy/fine-tune/upload lifecycle actions.
- **Least privilege wording trap**  
  If stem asks for only inferencing access, avoid higher roles even if they also work.

### 3) Endpoint/class specificity traps

- **Generic vs specific class names in SDK questions**  
  Pick the class that explicitly matches the feature in the stem (especially Search/OpenAI integration).
- **Recognizer class confusion in Speech/Translation**  
  TranslationRecognizer for translation scenario; SpeechRecognizer for plain STT.

### 4) Sequence/order traps

- Container export/deploy and bot debugging questions often have one strict order.  
  If steps feel all valid, question is usually testing order, not whether each step exists.
- Build/run-before-connect and create-before-send-before-run style flows must be followed exactly.

### 5) Hotspot mapping traps

- Do statement-by-statement mapping first, then choose combined option.
- Do not mentally “average” answers across statements.
- Your history shows losses when one statement is assumed from another.

### 6) Knowledge store / projection traps

- Object projection = JSON object output semantics.
- Empty `files` means no file/blob projection for that path.
- Avoid assuming image binaries are projected when schema does not specify them.

### 7) Search ranking/threshold traps

- If requirement is confidence cutoff (for example ≥ 70%), pick score threshold control.
- Ranker type/algorithm choice does not satisfy confidence threshold requirement by itself.

### 8) Multi-select discipline traps

- Many misses came from selecting an almost-correct second option.
- If question says “select two”, force yourself to identify why each selected option is independently required.
- Reject options that are merely related technology, older pattern, or setup-adjacent.

### 9) Quota/limit traps

- TPM/RPM math and account-level vs deployment-level capacity can be the deciding detail.
- Face and vision quota/size limits were a recurring hotspot category for you.

## Exam-time execution rules (final behavior checklist)

1. First pass: answer all high-certainty items fast.
2. Mark hotspot/order/RBAC-class questions for second pass.
3. For every marked question, ask:
   - Is this testing **service choice**, **role boundary**, **exact endpoint/class**, or **step order**?
4. In hotspot questions:
   - evaluate each statement independently
   - map Y/N (or A/B) independently
   - only then pick composite option
5. In multi-select:
   - prove each selected option
   - prove why each non-selected option is wrong
6. Do not change a first-pass answer unless you found a concrete contradiction in stem details.

## Final memory hooks (from your real misses)

- Confidence requirement -> think threshold property.
- “On your data” -> think Search-specific extension config.
- Fine-tune/deploy/manage -> think Contributor, not User.
- Structured forms/receipts -> think Document Intelligence model endpoints.
- QnA provisioning questions -> remember Search + Web App dependency pattern.
- Hotspot misses are usually mapping errors, not knowledge errors.

## 30-second pre-start script

I know this content. My risk is traps, not fundamentals.  
I will read every keyword, map hotspot statements independently, and treat role/endpoint/order words as scoring details.  
I will not rush multi-select second options.  
If uncertain, I will choose the option that best matches least privilege, native service fit, and exact requirement wording.
