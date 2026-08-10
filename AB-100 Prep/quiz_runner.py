"""
Quiz Runner CLI — Interactive practice question drill for Microsoft certification prep.

Usage:
    python quiz_runner.py questions.json --domain 1         # All questions from domain 1
    python quiz_runner.py questions.json --topic "1.1"      # Questions matching topic prefix "1.1"
    python quiz_runner.py questions.json --ids q001,q005    # Specific question IDs
    python quiz_runner.py questions.json --cross 1,2        # Cross-topic: mix domains 1 and 2
    python quiz_runner.py questions.json --all              # All questions (mock exam mode)
    python quiz_runner.py questions.json --day-lock 7       # Strict study-plan day lock (no future)

Results saved to session-results.json after completion.
"""

import json
import sys
import os
import argparse
import random
import time
import re
import webbrowser
from datetime import datetime

# ── ANSI color helpers (works on Windows 10+ and all Unix terminals) ──

def _enable_ansi_windows():
    """Enable ANSI escape sequences on Windows terminal."""
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        # STD_OUTPUT_HANDLE = -11, ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004
        handle = kernel32.GetStdHandle(-11)
        mode = ctypes.c_ulong()
        kernel32.GetConsoleMode(handle, ctypes.byref(mode))
        kernel32.SetConsoleMode(handle, mode.value | 0x0004)
    except Exception:
        pass

if os.name == "nt":
    _enable_ansi_windows()

# Color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"
UNDERLINE = "\033[4m"

CASE_STUDY_HEADER_RE = re.compile(
    r"^\[Case Study - (?P<name>.+?) - Q(?P<order>\d+) of (?P<total>\d+)\]\s*",
    re.IGNORECASE,
)

def _load_day_assignments(questions_filepath):
    """
    Load day-assignments.json from the same folder as questions_filepath.

    The file specifies per-day question pools and daily targets for the exam plan.
    It is exam-specific and lives alongside questions.json — the runner itself
    contains no hardcoded exam or domain knowledge.

    Expected schema:
        {
          "totalDays": 32,
          "studyDays": 28,
          "dayTargets": { "1": 8, "2": 8, ... },
          "dayAssignments": { "1": ["q001", ...], "2": [...], ... }  // days 1-studyDays
        }

    Raises FileNotFoundError if the file is missing.
    """
    base_dir = os.path.dirname(os.path.abspath(questions_filepath))
    path = os.path.join(base_dir, "day-assignments.json")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"day-assignments.json not found in {base_dir}. "
            "This file must exist alongside questions.json for --day-lock mode."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _flatten_with_domain(data):
    """Flatten canonical dataset into stable ordered rows with domain metadata."""
    rows = []
    for domain in data.get("domains", []):
        d_id = str(domain.get("domainId", ""))
        d_name = domain.get("domainName", "")
        for q in domain.get("questions", []):
            q_copy = dict(q)
            q_copy["domainId"] = d_id
            q_copy["domainName"] = d_name
            rows.append(q_copy)
    return rows


def _pick_recent_unique(source_ids, count):
    """Pick up to count most-recent unique question ids preserving recency."""
    picked = []
    seen = set()
    for qid in reversed(source_ids):
        if qid in seen:
            continue
        seen.add(qid)
        picked.append(qid)
        if len(picked) >= count:
            break
    picked.reverse()
    return picked


def build_day_locked_questions(data, day, carryover_count=3, questions_filepath=None):
    """
    Build the question set for the given study day, driven entirely by day-assignments.json.

    For study days (1 to studyDays in day-assignments.json):
        - Serves the pre-assigned question list for that day (round-robin distributed
          from questions.json when the file was generated — see day-assignments.json).
        - Carryover (up to carryover_count) recent questions from prior days are
          prepended for spaced-repetition reinforcement.

    For review / mock days (studyDays+1 to totalDays):
        - The full question pool is used, capped to dayTargets[day].
        - Carryover is applied, then remaining slots are filled from the full pool.

    Parameters:
        data              – normalized question dataset (output of load_questions)
        day               – target study day (int, 1-indexed)
        carryover_count   – max prior-session questions to prepend (0–3, default 3)
        questions_filepath – path to the questions.json file; used to locate day-assignments.json

    Rules:
        - Day 1 has no carryover.
        - Review days exceed the study-days range in day-assignments.json.
    """
    if questions_filepath is None:
        raise ValueError("--day-lock requires questions_filepath to locate day-assignments.json")

    config = _load_day_assignments(questions_filepath)
    study_days = int(config.get("studyDays", 28))
    day_targets = {int(k): int(v) for k, v in config.get("dayTargets", {}).items()}
    day_assignments = {int(k): v for k, v in config.get("dayAssignments", {}).items()}
    total_days = int(config.get("totalDays", max(day_targets.keys(), default=32)))

    if day < 1 or day > total_days:
        raise ValueError(f"--day-lock must be between 1 and {total_days}")

    carryover_count = max(0, min(int(carryover_count), 3))
    all_rows = _flatten_with_domain(data)
    by_id = {q.get("id"): q for q in all_rows}

    # Flat ordered history of question IDs asked on days prior to today (for carryover).
    asked_history_flat = []
    for d in range(1, day):
        asked_history_flat.extend(day_assignments.get(d, []))

    carry_ids = [] if day == 1 else _pick_recent_unique(asked_history_flat, carryover_count)
    carry_set = set(carry_ids)

    if day <= study_days:
        # Study day: serve the pre-assigned questions for this day plus carryover.
        primary_ids = [qid for qid in day_assignments.get(day, []) if qid not in carry_set]
        selected_ids = carry_ids + primary_ids

    else:
        # Review / mock day: full pool capped to dayTargets[day].
        target = day_targets.get(day, 20)
        pool = [q.get("id") for q in all_rows if q.get("id") not in carry_set]
        fill_count = max(0, target - len(carry_ids))
        selected_ids = carry_ids + pool[:fill_count]

    return [by_id[qid] for qid in selected_ids if qid in by_id]




def load_questions(filepath):
    """Load questions JSON from canonical schema or raw ExamTopics-style dump."""
    with open(filepath, "r", encoding="utf-8") as f:
        raw = json.load(f)
    audit = load_quality_audit(filepath)
    return normalize_dataset(raw, audit=audit)


def load_quality_audit(questions_filepath):
    """Load optional audit metadata from questions.audit.json in same folder."""
    try:
        base_dir = os.path.dirname(os.path.abspath(questions_filepath))
        audit_path = os.path.join(base_dir, "questions.audit.json")
        if not os.path.exists(audit_path):
            return {}
        with open(audit_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        return payload if isinstance(payload, dict) else {}
    except Exception:
        return {}


def normalize_dataset(raw, audit=None):
    """Normalize supported source schemas to canonical quiz-runner schema."""
    if isinstance(raw, list):
        return convert_examtopics_array(raw, audit=audit)

    if isinstance(raw, dict) and "domains" in raw:
        for domain in raw.get("domains", []):
            for q in domain.get("questions", []):
                q["question"] = clean_question_text(q.get("question", ""))
                normalize_mc_options(q)
                if "questionImages" not in q and "question_images" in q:
                    q["questionImages"] = normalize_image_list(q.get("question_images"))
                if "answerImages" not in q and "answer_images" in q:
                    q["answerImages"] = normalize_image_list(q.get("answer_images"))
                q["questionImages"] = normalize_image_list(q.get("questionImages"))
                q["answerImages"] = normalize_image_list(q.get("answerImages"))
                if "sourceUrl" not in q and "url" in q:
                    q["sourceUrl"] = q.get("url")
                q["ungraded"] = not has_answer_key(q)
        return raw

    raise ValueError("Unsupported questions schema. Expected canonical dict or array-based dump.")


def clean_question_text(text):
    """Normalize whitespace and remove image placeholders from question text."""
    cleaned = (text or "").replace("//IMG//", "").replace("\u2028", " ").replace("\u2029", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def normalize_image_list(values):
    """Return normalized image URL list from mixed payloads."""
    if not values:
        return []
    if isinstance(values, str):
        return [values.strip()] if values.strip() else []

    normalized = []
    for item in values:
        if isinstance(item, str) and item.strip():
            normalized.append(item.strip())
        elif isinstance(item, dict):
            for k in ("url", "src", "image", "href"):
                if item.get(k):
                    normalized.append(str(item[k]).strip())
                    break
    return [u for u in normalized if u]


def _discussion_summary(discussion):
    """Build a concise discussion summary from top-voted comments."""
    if not discussion:
        return ""

    try:
        ranked = sorted(
            discussion,
            key=lambda d: int(str(d.get("upvote_count", "0")).strip() or "0"),
            reverse=True,
        )
    except Exception:
        ranked = discussion

    snippets = []
    for d in ranked[:2]:
        content = re.sub(r"\s+", " ", str(d.get("content", "")).strip())
        if content:
            snippets.append(content[:220])
    return " | ".join(snippets)


def _extract_letter_answer(answer_value):
    """Extract answer letters from free-form answer payload."""
    answer = (answer_value or "").strip().upper()
    if re.fullmatch(r"[A-F]+", answer):
        return answer

    match = re.search(r"\b([A-F](?:\s*,\s*[A-F]){0,5}|[A-F]{1,6})\b", answer)
    if not match:
        return ""

    token = match.group(1).replace(",", "").replace(" ", "")
    token = "".join(ch for ch in token if ch in "ABCDEF")
    return token


def _extract_option_letters(options):
    """Extract valid option letters (A-F) from normalized option list."""
    letters = []
    for opt in options or []:
        match = re.match(r"^\s*([A-F])\.", str(opt).upper())
        if match:
            letter = match.group(1)
            if letter not in letters:
                letters.append(letter)
    return letters


def _extract_answer_from_comment_text(text, valid_letters):
    """Extract likely answer letters from one discussion comment body."""
    if not text:
        return ""

    upper = re.sub(r"\s+", " ", str(text).upper())
    markers = [
        r"(?:CORRECT\s+ANSWER|CORRECT|ANSWER\s+IS|ANSWER|ANS)\s*[:=\-]?\s*([A-F](?:\s*(?:,|AND|&|/)\s*[A-F]){0,5}|[A-F]{1,6})",
        r"\b([A-F](?:\s*(?:,|AND|&|/)\s*[A-F]){1,5})\b",
    ]

    for pattern in markers:
        match = re.search(pattern, upper)
        if not match:
            continue
        token = match.group(1)
        token = re.sub(r"\s*(?:AND|&|/|,)\s*", "", token)
        letters = [ch for ch in token if ch in "ABCDEF"]
        if not letters:
            continue
        deduped = []
        for letter in letters:
            if letter not in deduped:
                deduped.append(letter)
        if valid_letters and any(letter not in valid_letters for letter in deduped):
            continue
        return "".join(deduped)
    return ""


def infer_answer_from_discussion(discussion, valid_letters, top_n=3):
    """Infer answer by weighted consensus from top upvoted discussion comments."""
    if not discussion:
        return ""

    try:
        ranked = sorted(
            discussion,
            key=lambda d: int(str(d.get("upvote_count", "0")).strip() or "0"),
            reverse=True,
        )
    except Exception:
        ranked = discussion

    ranked = ranked[:top_n]
    votes = {}
    first_seen_rank = {}

    for rank, item in enumerate(ranked):
        content = item.get("content", "")
        upvotes = int(str(item.get("upvote_count", "0")).strip() or "0")
        answer = _extract_answer_from_comment_text(content, valid_letters)
        if not answer:
            continue
        votes[answer] = votes.get(answer, 0) + max(upvotes, 1)
        if answer not in first_seen_rank:
            first_seen_rank[answer] = rank

    if not votes:
        return ""

    best = sorted(votes.items(), key=lambda item: (-item[1], first_seen_rank[item[0]], item[0]))[0][0]
    return best


def normalize_mc_options(question):
    """Ensure mc/multi options are represented as list entries like 'A. text'."""
    options = question.get("options")
    if not options:
        question["options"] = []
        return

    if isinstance(options, list):
        normalized = []
        for item in options:
            text = str(item).strip()
            if re.match(r"^[A-F][\).:-]\s*", text, flags=re.IGNORECASE):
                text = re.sub(r"^([A-F])[\).:-]\s*", r"\1. ", text, flags=re.IGNORECASE)
            normalized.append(text)
        question["options"] = normalized
        return

    if isinstance(options, dict):
        normalized = []
        for key in sorted(options.keys()):
            value = re.sub(r"\s+", " ", str(options[key]).strip())
            normalized.append(f"{str(key).upper()}. {value}")
        question["options"] = normalized
        return

    question["options"] = []


def _build_weighted_domain_groups(normalized_questions):
    """Split normalized questions into 6 domains using official weight proportions."""
    total = len(normalized_questions)
    if total == 0:
        return {d[0]: [] for d in DOMAIN_BLUEPRINT}

    quotas = []
    allocated = 0
    for index, (domain_id, _, weight) in enumerate(DOMAIN_BLUEPRINT):
        if index == len(DOMAIN_BLUEPRINT) - 1:
            count = total - allocated
        else:
            count = int(round(total * weight))
            count = max(1, count)
        allocated += count
        quotas.append((domain_id, count))

    if allocated != total:
        diff = total - allocated
        last_domain, last_count = quotas[-1]
        quotas[-1] = (last_domain, last_count + diff)

    grouped = {d[0]: [] for d in DOMAIN_BLUEPRINT}
    cursor = 0
    for domain_id, count in quotas:
        grouped[domain_id] = normalized_questions[cursor: cursor + count]
        cursor += count
    return grouped


def convert_examtopics_array(raw_questions, audit=None):
    """Convert array-style ExamTopics dump to canonical quiz-runner schema."""
    audit = audit or {}
    recovery_map = {
        str(item.get("id", "")): str(item.get("answer", "")).upper()
        for item in audit.get("recoveries", [])
        if item.get("id") and item.get("answer")
    }
    suspect_ids = set(str(x) for x in audit.get("suspectInferredIds", []))

    normalized = []

    for idx, src in enumerate(raw_questions, 1):
        qid = str(src.get("id") or f"q{idx:03d}")
        question_text = clean_question_text(src.get("question_text", ""))
        topic_value = str(src.get("topic") or "0")
        topic_number = int(topic_value) if topic_value.isdigit() else 0

        options_map = src.get("choices") or {}
        q = {
            "id": qid,
            "question": question_text,
            "options": options_map,
            "explanation": "",
            "topic": f"Topic {topic_value}",
            "difficulty": "medium",
            "source": "ExamTopics community dump",
            "sourceUrl": src.get("url", ""),
            "questionImages": normalize_image_list(src.get("question_images")),
            "answerImages": normalize_image_list(src.get("answer_images")),
            "topicOrder": topic_number,
        }

        normalize_mc_options(q)
        valid_letters = _extract_option_letters(q.get("options", []))

        answer_letters = _extract_letter_answer(src.get("answer", ""))
        q["answerStatus"] = "explicit"

        if not answer_letters and qid in recovery_map:
            candidate = _extract_letter_answer(recovery_map.get(qid, ""))
            if candidate:
                answer_letters = candidate
                q["answerInferredFrom"] = "subagent_recovery_high"
                q["answerStatus"] = "recovered_high"

        if not answer_letters:
            inferred = infer_answer_from_discussion(src.get("discussion"), valid_letters, top_n=3)
            if inferred:
                answer_letters = inferred
                q["answerInferredFrom"] = "discussion_top3_consensus"
                q["answerStatus"] = "inferred_consensus"

        if answer_letters and valid_letters:
            if any(letter not in valid_letters for letter in answer_letters):
                answer_letters = ""

        if qid in suspect_ids and q.get("answerInferredFrom") == "discussion_top3_consensus":
            answer_letters = ""
            q.pop("answerInferredFrom", None)
            q["answerStatus"] = "inference_blocked_by_audit"

        if len(answer_letters) > 1:
            q["type"] = "multi"
            q["correctAnswers"] = sorted(list(dict.fromkeys(list(answer_letters))))
            q.pop("correctAnswer", None)
        else:
            q["type"] = "mc"
            q["correctAnswer"] = answer_letters
            q.pop("correctAnswers", None)

        parts = []
        if src.get("answer_description"):
            parts.append(str(src.get("answer_description")).strip())
        discussion_notes = _discussion_summary(src.get("discussion"))
        if discussion_notes:
            parts.append(f"Discussion highlights: {discussion_notes}")
        if q.get("answerInferredFrom"):
            parts.append("Answer inferred from top upvoted discussion consensus.")
        if q.get("answerStatus") == "inference_blocked_by_audit":
            parts.append("Inference was flagged as suspect by subagent audit and left ungraded.")
        q["explanation"] = re.sub(r"\s+", " ", " | ".join(parts)).strip()
        q["ungraded"] = not has_answer_key(q)
        if q["ungraded"] and q.get("answerStatus") == "explicit":
            q["answerStatus"] = "ungraded_no_evidence"

        normalized.append(q)

    normalized.sort(key=lambda item: (item.get("topicOrder", 0), item.get("id", "")))
    grouped = _build_weighted_domain_groups(normalized)

    domains = []
    for domain_id, domain_name, _ in DOMAIN_BLUEPRINT:
        questions = grouped.get(domain_id, [])
        for q in questions:
            q.pop("topicOrder", None)
        domains.append({
            "domainId": domain_id,
            "domainName": domain_name,
            "questions": questions,
        })

    return {
        "examCode": "AI-102",
        "examName": "Designing and Implementing a Microsoft Azure AI Solution",
        "totalQuestions": len(normalized),
        "sources": ["ExamTopics community dump", "AI-generated normalization"],
        "domains": domains,
    }


def _slugify(value):
    """Create a stable, lowercase slug for ids from free-form text."""
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", str(value)).strip("-").lower()
    return cleaned or "case-study"


def _parse_case_study_header(question_text):
    """Parse '[Case Study - Name - Qx of y]' metadata from question text."""
    match = CASE_STUDY_HEADER_RE.match(question_text or "")
    if not match:
        return None
    return {
        "name": match.group("name").strip(),
        "order": int(match.group("order")),
        "total": int(match.group("total")),
    }


def _strip_case_study_header(question_text):
    """Remove case study header line from question text for cleaner display."""
    return CASE_STUDY_HEADER_RE.sub("", question_text or "", count=1).strip()


def _build_case_study_lookup(data):
    """Build a lookup map from top-level caseStudies array (if provided)."""
    lookup = {}
    for case in data.get("caseStudies", []):
        case_id = str(case.get("id", "")).strip().lower()
        case_name = str(case.get("name", "")).strip().lower()
        if case_id:
            lookup[case_id] = case
        if case_name:
            lookup[case_name] = case
    return lookup


def enrich_case_study_metadata(selected_questions, data):
    """
    Enrich selected questions with normalized case-study metadata.

    Supports explicit caseStudyId/caseStudyOrder fields and also derives metadata
    from existing '[Case Study - ... - Qx of y]' question headers.
    """
    enriched = []
    case_lookup = _build_case_study_lookup(data)

    for q in selected_questions:
        q_copy = dict(q)
        header = _parse_case_study_header(q_copy.get("question", ""))
        is_case = q_copy.get("section") == "casestudy" or header is not None or bool(q_copy.get("caseStudyId"))

        if is_case:
            explicit_case_id = str(q_copy.get("caseStudyId", "")).strip()
            case_name = str(q_copy.get("caseStudyName", "")).strip() or (header["name"] if header else "Case Study")
            normalized_case_id = _slugify(explicit_case_id or case_name)

            if header:
                q_copy["caseStudyOrder"] = int(q_copy.get("caseStudyOrder") or header["order"])
                q_copy["caseStudyTotal"] = int(q_copy.get("caseStudyTotal") or header["total"])

            q_copy["caseStudyId"] = normalized_case_id
            q_copy["caseStudyName"] = case_name

            case_meta = case_lookup.get(normalized_case_id) or case_lookup.get(case_name.lower()) or {}
            q_copy["caseStudyContext"] = q_copy.get("caseStudyContext") or case_meta.get("context")
            q_copy["caseStudyContextPlaceholder"] = (
                q_copy.get("caseStudyContextPlaceholder")
                or case_meta.get("contextPlaceholder")
                or f"Use the shared context for '{case_name}' before answering this case-study sequence."
            )

            q_copy["displayQuestion"] = _strip_case_study_header(q_copy.get("question", ""))
        else:
            q_copy["displayQuestion"] = q_copy.get("question", "")

        enriched.append(q_copy)

    return enriched


def deduplicate_questions(questions):
    """Remove duplicate question IDs while preserving first occurrence order."""
    seen = set()
    unique = []
    duplicates = 0

    for q in questions:
        qid = q.get("id")
        if qid in seen:
            duplicates += 1
            continue
        seen.add(qid)
        unique.append(q)

    if duplicates:
        print(f"{YELLOW}Removed {duplicates} duplicate question(s) by ID before starting quiz.{RESET}")

    return unique


def has_answer_key(q):
    """Return True when question has a machine-checkable answer key."""
    qtype = q.get("type", "mc")
    if qtype == "mc":
        return bool((q.get("correctAnswer") or "").strip())
    if qtype == "multi":
        return len(q.get("correctAnswers", [])) > 0
    if qtype == "dropdown":
        return len(q.get("dropdowns", [])) > 0
    if qtype == "yesno":
        return len(q.get("statementAnswers", [])) > 0
    return False


def render_image_links(label, image_urls, open_images=False):
    """Print image URLs and optionally open remote links in browser."""
    urls = normalize_image_list(image_urls)
    if not urls:
        return

    print(f"{YELLOW}{label} ({len(urls)}):{RESET}")
    for idx, image_url in enumerate(urls, 1):
        print(f"  [{idx}] {image_url}")
        if open_images and str(image_url).lower().startswith(("http://", "https://")):
            try:
                webbrowser.open_new_tab(image_url)
            except Exception:
                pass
    print()


def _build_case_study_blocks_for_shuffle(questions):
    """
    Build shuffle blocks where each case-study sequence is one block.

    This keeps Q1..Qn for a case study adjacent even when randomizing order.
    """
    blocks = []
    standalone = []
    case_groups = {}

    for idx, q in enumerate(questions):
        q["_selectedOrder"] = idx
        case_id = q.get("caseStudyId")
        if case_id:
            case_groups.setdefault(case_id, []).append(q)
        else:
            standalone.append([q])

    for case_id, group in case_groups.items():
        group.sort(key=lambda item: (int(item.get("caseStudyOrder") or 10**9), item.get("_selectedOrder", 10**9)))
        blocks.append(group)

    blocks.extend(standalone)
    return blocks


def shuffle_preserving_case_studies(questions):
    """Shuffle by blocks so case-study questions stay together in sequence."""
    blocks = _build_case_study_blocks_for_shuffle(questions)
    random.shuffle(blocks)

    shuffled = []
    for block in blocks:
        shuffled.extend(block)

    return shuffled


def limit_preserving_case_studies(questions, limit):
    """
    Apply question limit without splitting case-study sequences.

    If the first block is larger than the limit, include it fully so context
    is not broken.
    """
    if limit is None or limit <= 0:
        return questions

    blocks = []
    current_case_id = None
    current_block = []

    for q in questions:
        case_id = q.get("caseStudyId")

        if case_id:
            if current_case_id is None or current_case_id == case_id:
                current_block.append(q)
                current_case_id = case_id
            else:
                blocks.append(current_block)
                current_block = [q]
                current_case_id = case_id
        else:
            if current_block:
                blocks.append(current_block)
                current_block = []
                current_case_id = None
            blocks.append([q])

    if current_block:
        blocks.append(current_block)

    selected = []
    for block in blocks:
        if len(selected) + len(block) <= limit:
            selected.extend(block)
            continue

        if not selected and len(block) > limit:
            selected.extend(block)
        break

    return selected


def filter_questions(data, domain_id=None, topic_prefix=None, question_ids=None, cross_domains=None, all_mode=False):
    """
    Filter questions from the dataset based on criteria.

    Args:
        data: Parsed questions.json dict
        domain_id: Single domain ID string (e.g., "1")
        topic_prefix: Topic prefix to match (e.g., "1.1")
        question_ids: List of specific question IDs
        cross_domains: List of domain IDs to mix together
        all_mode: If True, return all questions

    Returns:
        List of question dicts with domainName injected
    """
    selected = []

    for domain in data.get("domains", []):
        d_id = str(domain["domainId"])
        d_name = domain["domainName"]

        for q in domain["questions"]:
            q_copy = dict(q)
            q_copy["domainName"] = d_name
            q_copy["domainId"] = d_id

            if all_mode:
                selected.append(q_copy)
            elif question_ids and q["id"] in question_ids:
                selected.append(q_copy)
            elif domain_id and d_id == str(domain_id):
                if topic_prefix:
                    if q.get("topic", "").startswith(topic_prefix):
                        selected.append(q_copy)
                else:
                    selected.append(q_copy)
            elif cross_domains and d_id in [str(x) for x in cross_domains]:
                selected.append(q_copy)
            elif topic_prefix and not domain_id:
                if q.get("topic", "").startswith(topic_prefix):
                    selected.append(q_copy)

    return selected


def display_question(q, index, total, open_images=False):
    """Display a single question with formatted options. Handles mc, dropdown, yesno, multi types."""
    qtype = q.get("type", "mc")
    print(f"\n{'─' * 60}")
    print(f"{CYAN}{BOLD}Question {index}/{total}{RESET}  {DIM}[{q['domainName']}]{RESET}")
    print(f"{DIM}Topic: {q.get('topic', 'N/A')} | Difficulty: {q.get('difficulty', 'N/A')} | ID: {q['id']}{RESET}")
    print(f"{'─' * 60}")
    print(f"\n{q.get('displayQuestion', q['question'])}\n")
    render_image_links("Question image links", q.get("questionImages"), open_images=open_images)
    if q.get("sourceUrl"):
        print(f"{DIM}Source: {q.get('sourceUrl')}{RESET}\n")

    if not q.get("options") and q.get("type", "mc") in ("mc", "multi"):
        print(f"{YELLOW}No inline options were captured for this item. Review the explanation/discussion context.{RESET}\n")

    if qtype == "mc":
        for opt in q["options"]:
            print(f"  {opt}")
        print()
    elif qtype == "multi":
        # Multi-select: show options, indicate how many to pick
        num_correct = len(q.get("correctAnswers", []))
        print(f"  {YELLOW}(Select {num_correct} answers){RESET}\n")
        for opt in q["options"]:
            print(f"  {opt}")
        print()
    elif qtype == "dropdown":
        # Show each dropdown slot with numbered options
        for di, dd in enumerate(q.get("dropdowns", []), 1):
            print(f"  {BOLD}[Slot {di}] {dd['label']}{RESET}")
            for oi, opt in enumerate(dd["options"], 1):
                print(f"    {oi}. {opt}")
        print()
    elif qtype == "yesno":
        # Show numbered statements
        for si, stmt in enumerate(q.get("statements", []), 1):
            print(f"  {BOLD}Statement {si}:{RESET} {stmt}")
        print()


def _get_mc_answer(valid_options):
    """Get single-choice answer (mc type). Returns (answer, skipped, quit)."""
    while True:
        try:
            raw = input(f"{YELLOW}Your answer ({'/'.join(valid_options)}) [s=skip, q=quit]: {RESET}").strip().upper()
        except (EOFError, KeyboardInterrupt):
            return None, False, True
        if raw == "Q":
            return None, False, True
        if raw == "S":
            return None, True, False
        if raw in valid_options:
            return raw, False, False
        print(f"{RED}  Invalid. Enter one of: {', '.join(valid_options)}, s, or q{RESET}")


def _get_multi_answer(valid_options, num_required):
    """Get multi-select answer. Returns (sorted list of letters, skipped, quit)."""
    while True:
        try:
            raw = input(f"{YELLOW}Your answers (comma-separated, e.g. A,C) [s=skip, q=quit]: {RESET}").strip().upper()
        except (EOFError, KeyboardInterrupt):
            return None, False, True
        if raw == "Q":
            return None, False, True
        if raw == "S":
            return None, True, False
        parts = sorted(set(p.strip() for p in raw.split(",")))
        if all(p in valid_options for p in parts) and len(parts) == num_required:
            return parts, False, False
        print(f"{RED}  Enter exactly {num_required} valid options from {', '.join(valid_options)}, comma-separated.{RESET}")


def _get_dropdown_answers(dropdowns):
    """Get answers for each dropdown slot. Returns (list of chosen indices, skipped, quit)."""
    answers = []
    for di, dd in enumerate(dropdowns, 1):
        num_opts = len(dd["options"])
        while True:
            try:
                raw = input(f"{YELLOW}  Slot {di} — {dd['label']} (1-{num_opts}) [s=skip, q=quit]: {RESET}").strip().upper()
            except (EOFError, KeyboardInterrupt):
                return None, False, True
            if raw == "Q":
                return None, False, True
            if raw == "S":
                return None, True, False
            if raw.isdigit() and 1 <= int(raw) <= num_opts:
                answers.append(int(raw) - 1)  # zero-based index
                break
            print(f"{RED}    Enter a number between 1 and {num_opts}.{RESET}")
    return answers, False, False


def _get_yesno_answers(statements):
    """Get Yes/No answer per statement. Returns (list of 'Yes'/'No', skipped, quit)."""
    answers = []
    for si, stmt in enumerate(statements, 1):
        while True:
            try:
                raw = input(f"{YELLOW}  Statement {si} — Yes or No? [s=skip, q=quit]: {RESET}").strip().upper()
            except (EOFError, KeyboardInterrupt):
                return None, False, True
            if raw == "Q":
                return None, False, True
            if raw == "S":
                return None, True, False
            if raw in ("YES", "Y"):
                answers.append("Yes")
                break
            elif raw in ("NO", "N"):
                answers.append("No")
                break
            print(f"{RED}    Enter Yes/Y or No/N.{RESET}")
    return answers, False, False


def _get_review_ack():
    """Acknowledge review-only question that has no structured answer key."""
    while True:
        try:
            raw = input(f"{YELLOW}Review-only item. Press Enter to continue [s=skip, q=quit]: {RESET}").strip().upper()
        except (EOFError, KeyboardInterrupt):
            return None, False, True
        if raw == "Q":
            return None, False, True
        if raw == "S":
            return None, True, False
        if raw == "":
            return None, False, False
        print(f"{RED}  Press Enter, or use s/q.{RESET}")


def get_answer_for_question(q):
    """
    Route to the correct input handler based on question type.

    Returns:
        Tuple of (user_answer, skipped, quit_early)
        user_answer type varies by question type:
          mc: str (letter)
          multi: list of str (letters)
          dropdown: list of int (zero-based indices)
          yesno: list of str ('Yes'/'No')
    """
    qtype = q.get("type", "mc")

    if not has_answer_key(q):
        return _get_review_ack()

    if qtype == "mc":
        valid = []
        for opt in q.get("options", []):
            letter = opt.strip()[0].upper()
            if letter.isalpha():
                valid.append(letter)
        if not valid:
            valid = ["A", "B", "C", "D"]
        return _get_mc_answer(valid)

    elif qtype == "multi":
        valid = []
        for opt in q.get("options", []):
            letter = opt.strip()[0].upper()
            if letter.isalpha():
                valid.append(letter)
        if not valid:
            valid = ["A", "B", "C", "D", "E"]
        num_required = len(q.get("correctAnswers", []))
        return _get_multi_answer(valid, num_required)

    elif qtype == "dropdown":
        return _get_dropdown_answers(q.get("dropdowns", []))

    elif qtype == "yesno":
        return _get_yesno_answers(q.get("statements", []))

    else:
        # Fallback: treat as mc
        return _get_mc_answer(["A", "B", "C", "D"])


def check_correct(q, user_answer):
    """
    Check if user_answer is correct for the given question type.
    Returns True/False.
    """
    qtype = q.get("type", "mc")

    if not has_answer_key(q):
        return None

    if qtype == "mc":
        return user_answer == q["correctAnswer"].strip().upper()

    elif qtype == "multi":
        correct_set = sorted(a.strip().upper() for a in q.get("correctAnswers", []))
        return user_answer == correct_set

    elif qtype == "dropdown":
        dropdowns = q.get("dropdowns", [])
        for i, dd in enumerate(dropdowns):
            if user_answer[i] != dd["correctIndex"]:
                return False
        return True

    elif qtype == "yesno":
        expected = q.get("statementAnswers", [])
        return user_answer == expected

    return None


def get_correct_display(q):
    """Return a human-readable string of the correct answer for any question type."""
    qtype = q.get("type", "mc")

    if qtype == "mc":
        return q["correctAnswer"].strip().upper()

    elif qtype == "multi":
        return ", ".join(sorted(a.strip().upper() for a in q.get("correctAnswers", [])))

    elif qtype == "dropdown":
        parts = []
        for dd in q.get("dropdowns", []):
            parts.append(f"{dd['label']} {dd['correctAnswer']}")
        return " | ".join(parts)

    elif qtype == "yesno":
        expected = q.get("statementAnswers", [])
        return ", ".join(f"S{i+1}={a}" for i, a in enumerate(expected))

    return "?"


def get_user_display(q, user_answer):
    """Return a human-readable string of the user's answer for any question type."""
    qtype = q.get("type", "mc")

    if user_answer is None:
        return "—"

    if qtype == "mc":
        return str(user_answer)

    elif qtype == "multi":
        return ", ".join(user_answer)

    elif qtype == "dropdown":
        dropdowns = q.get("dropdowns", [])
        parts = []
        for i, dd in enumerate(dropdowns):
            chosen = dd["options"][user_answer[i]] if i < len(user_answer) else "?"
            parts.append(f"{dd['label']} {chosen}")
        return " | ".join(parts)

    elif qtype == "yesno":
        return ", ".join(f"S{i+1}={a}" for i, a in enumerate(user_answer))

    return str(user_answer)


def show_result(q, user_answer, skipped, open_images=False):
    """Show whether user was correct, with explanation. Handles all question types."""
    correct_display = get_correct_display(q)

    if skipped:
        print(f"{YELLOW}  ⏭  SKIPPED{RESET} — Correct answer: {GREEN}{correct_display}{RESET}")
    else:
        verdict = check_correct(q, user_answer)
        if verdict is None:
            print(f"{CYAN}  ℹ  REVIEW MODE{RESET} — This question has no structured answer key.")
        elif verdict:
            print(f"{GREEN}{BOLD}  ✓  CORRECT!  Nice one!{RESET}")
        else:
            user_display = get_user_display(q, user_answer)
            print(f"{RED}{BOLD}  ✗  WRONG.{RESET}  You chose {RED}{user_display}{RESET}")
            print(f"  Correct: {GREEN}{correct_display}{RESET}")
            print(f"{YELLOW}  📝  Note this one down — review it later!{RESET}")

    if q.get("answerImages"):
        render_image_links("Answer image links", q.get("answerImages"), open_images=open_images)

    # Show explanation
    explanation = q.get("explanation", "")
    if explanation:
        print(f"\n{DIM}  Explanation: {explanation}{RESET}")


def show_summary(results, total_time_sec):
    """Print final score summary."""
    total = len(results)
    graded_attempted = sum(1 for r in results if r.get("gradable", True) and not r["skipped"])
    correct = sum(1 for r in results if r["correct"])
    wrong = sum(1 for r in results if r.get("gradable", True) and not r["correct"] and not r["skipped"])
    skipped = sum(1 for r in results if r["skipped"])
    ungraded = sum(1 for r in results if not r.get("gradable", True))
    pct = (correct / graded_attempted * 100) if graded_attempted > 0 else 0
    minutes = int(total_time_sec // 60)
    seconds = int(total_time_sec % 60)

    print(f"\n{'═' * 60}")
    print(f"{BOLD}{CYAN}  QUIZ COMPLETE — RESULTS{RESET}")
    print(f"{'═' * 60}\n")

    # Score bar
    bar_len = 30
    filled = int(bar_len * pct / 100)
    bar = "█" * filled + "░" * (bar_len - filled)
    color = GREEN if pct >= 70 else YELLOW if pct >= 50 else RED
    print(f"  Score: {color}{BOLD}{correct}/{graded_attempted} ({pct:.0f}%){RESET}  [{color}{bar}{RESET}]")
    print(f"  Time:  {minutes}m {seconds}s")
    print(f"  {GREEN}✓ Correct: {correct}{RESET}  |  {RED}✗ Wrong: {wrong}{RESET}  |  {YELLOW}⏭ Skipped: {skipped}{RESET}  |  {CYAN}ℹ Ungraded: {ungraded}{RESET}")

    # Encouragement based on score
    print()
    if pct >= 90:
        print(f"  {GREEN}{BOLD}🏆  Outstanding! You're exam-ready on these topics!{RESET}")
    elif pct >= 70:
        print(f"  {GREEN}👍  Solid performance! Review the ones you missed and you'll nail it.{RESET}")
    elif pct >= 50:
        print(f"  {YELLOW}💪  Getting there! Focus on the wrong answers — understanding WHY helps most.{RESET}")
    else:
        print(f"  {RED}📚  Needs more study. Re-read the topic explanations and try again tomorrow.{RESET}")

    # Show wrong/skipped questions for review
    missed = [r for r in results if (r.get("gradable", True) and not r["correct"]) or r["skipped"]]
    if missed:
        print(f"\n{'─' * 60}")
        print(f"{BOLD}  Questions to review:{RESET}\n")
        for r in missed:
            status = f"{YELLOW}SKIPPED{RESET}" if r["skipped"] else f"{RED}WRONG (you: {r['userAnswer']}, correct: {r['correctAnswer']}){RESET}"
            print(f"  • {r['questionId']}: {status}")
            print(f"    {DIM}{r['question'][:80]}...{RESET}" if len(r["question"]) > 80 else f"    {DIM}{r['question']}{RESET}")

    print(f"\n{'═' * 60}\n")
    print(f"\n{'═' * 60}\n")


def save_results(results, data, total_time_sec, output_path="session-results.json"):
    """
    Save session results to JSON for agent to read back.

    Args:
        results: List of per-question result dicts
        data: Original questions.json data
        total_time_sec: Total quiz duration in seconds
        output_path: Where to save results
    """
    total = len(results)
    graded_attempted = sum(1 for r in results if r.get("gradable", True) and not r["skipped"])
    correct = sum(1 for r in results if r["correct"])
    skipped = sum(1 for r in results if r["skipped"])
    ungraded = sum(1 for r in results if not r.get("gradable", True))

    # Per-topic breakdown
    topic_stats = {}
    for r in results:
        topic = r.get("topic", "Unknown")
        if topic not in topic_stats:
            topic_stats[topic] = {"total": 0, "correct": 0, "wrong": 0, "skipped": 0}
        topic_stats[topic]["total"] += 1
        if r["skipped"]:
            topic_stats[topic]["skipped"] += 1
        elif r["correct"]:
            topic_stats[topic]["correct"] += 1
        else:
            topic_stats[topic]["wrong"] += 1

    # Per-domain breakdown
    domain_stats = {}
    for r in results:
        d_name = r.get("domainName", "Unknown")
        if d_name not in domain_stats:
            domain_stats[d_name] = {"total": 0, "correct": 0, "wrong": 0, "skipped": 0}
        domain_stats[d_name]["total"] += 1
        if r["skipped"]:
            domain_stats[d_name]["skipped"] += 1
        elif r["correct"]:
            domain_stats[d_name]["correct"] += 1
        else:
            domain_stats[d_name]["wrong"] += 1

    output = {
        "timestamp": datetime.now().isoformat(),
        "examCode": data.get("examCode", ""),
        "examName": data.get("examName", ""),
        "summary": {
            "totalQuestions": total,
            "gradedQuestions": graded_attempted,
            "correct": correct,
            "wrong": graded_attempted - correct,
            "skipped": skipped,
            "ungraded": ungraded,
            "accuracy": round(correct / graded_attempted * 100, 1) if graded_attempted > 0 else 0,
            "timeSeconds": round(total_time_sec, 1)
        },
        "domainBreakdown": domain_stats,
        "topicBreakdown": topic_stats,
        "wrongQuestions": [
            {
                "questionId": r["questionId"],
                "question": r["question"],
                "userAnswer": r["userAnswer"],
                "correctAnswer": r["correctAnswer"],
                "questionImages": r.get("questionImages", []),
                "answerImages": r.get("answerImages", []),
                "sourceUrl": r.get("sourceUrl", ""),
                "explanation": r.get("explanation", ""),
                "topic": r.get("topic", ""),
                "domainName": r.get("domainName", "")
            }
            for r in results if r.get("gradable", True) and not r["correct"] and not r["skipped"]
        ],
        "skippedQuestions": [r["questionId"] for r in results if r["skipped"]],
        "allResults": results
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"{DIM}Results saved to: {output_path}{RESET}")
    return output_path


def run_quiz(questions, data, open_images=False, output_path="session-results.json"):
    """
    Main quiz loop — present questions one-by-one, collect answers, show results.

    Args:
        questions: List of question dicts to ask
        data: Original questions.json data (for metadata in results)

    Returns:
        Path to saved results file
    """
    total = len(questions)
    if total == 0:
        print(f"{RED}No questions matched your filter criteria.{RESET}")
        sys.exit(1)

    print(f"\n{BOLD}{CYAN}{'═' * 60}{RESET}")
    print(f"{BOLD}{CYAN}  QUIZ SESSION — {data.get('examName', 'Certification Prep')}{RESET}")
    print(f"{BOLD}{CYAN}  {total} questions | Type answer letter | 's' to skip | 'q' to quit{RESET}")
    print(f"{BOLD}{CYAN}{'═' * 60}{RESET}")

    results = []
    start_time = time.time()

    for i, q in enumerate(questions, 1):
        if q.get("caseStudyId"):
            prev_case_id = questions[i - 2].get("caseStudyId") if i > 1 else None
            if q.get("caseStudyId") != prev_case_id:
                print(f"\n{BOLD}{CYAN}{'=' * 60}{RESET}")
                print(f"{BOLD}{CYAN}  CASE STUDY: {q.get('caseStudyName', 'Case Study')}{RESET}")
                case_context = q.get("caseStudyContext") or q.get("caseStudyContextPlaceholder")
                if case_context:
                    print(f"{DIM}  {case_context}{RESET}")
                print(f"{BOLD}{CYAN}{'=' * 60}{RESET}")

        display_question(q, i, total, open_images=open_images)

        user_answer, skipped, quit_early = get_answer_for_question(q)

        if quit_early:
            print(f"\n{YELLOW}Quitting early after {i - 1} questions.{RESET}")
            break

        verdict = check_correct(q, user_answer) if not skipped else None
        is_correct = verdict is True

        show_result(q, user_answer, skipped, open_images=open_images)

        results.append({
            "questionId": q["id"],
            "question": q["question"],
            "userAnswer": get_user_display(q, user_answer) if not skipped else None,
            "correctAnswer": get_correct_display(q),
            "correct": is_correct,
            "gradable": has_answer_key(q),
            "skipped": skipped,
            "topic": q.get("topic", ""),
            "domainName": q.get("domainName", ""),
            "domainId": q.get("domainId", ""),
            "difficulty": q.get("difficulty", ""),
            "explanation": q.get("explanation", ""),
            "questionImages": q.get("questionImages", []),
            "answerImages": q.get("answerImages", []),
            "sourceUrl": q.get("sourceUrl", ""),
        })

    elapsed = time.time() - start_time

    if results:
        show_summary(results, elapsed)
        return save_results(results, data, elapsed, output_path=output_path)
    else:
        print(f"{YELLOW}No questions answered.{RESET}")
        return None


def main():
    """Entry point — parse args, filter questions, run quiz."""
    parser = argparse.ArgumentParser(
        description="Interactive quiz runner for Microsoft certification exam prep"
    )
    parser.add_argument("questions_file", help="Path to questions.json")
    parser.add_argument("--domain", type=str, help="Filter by domain ID (e.g., 1, 2, 3)")
    parser.add_argument("--topic", type=str, help="Filter by topic prefix (e.g., '1.1', '2.3')")
    parser.add_argument("--ids", type=str, help="Comma-separated question IDs (e.g., q001,q005,q010)")
    parser.add_argument("--cross", type=str, help="Cross-topic: comma-separated domain IDs to mix (e.g., 1,2)")
    parser.add_argument("--all", action="store_true", help="All questions (mock exam mode)")
    parser.add_argument("--day-lock", type=int, help="Strict day lock by plan day (1-32); blocks future questions")
    parser.add_argument("--carryover", type=int, default=3, help="Questions from previous sessions to include with --day-lock (0-3)")
    parser.add_argument("--shuffle", action="store_true", help="Randomize question order")
    parser.add_argument("--limit", type=int, help="Limit number of questions")
    parser.add_argument("--output", type=str, default="session-results.json", help="Output results file path")
    parser.add_argument("--open-images", action="store_true", help="Open image URLs in browser as questions are shown")
    parser.add_argument("--web", action="store_true", help="Launch local web UI instead of terminal prompts")
    parser.add_argument("--port", type=int, default=8765, help="Port for --web mode (default 8765)")

    args = parser.parse_args()

    # Load questions
    data = load_questions(args.questions_file)

    # Parse filter criteria
    q_ids = args.ids.split(",") if args.ids else None
    cross = args.cross.split(",") if args.cross else None

    if args.day_lock is not None:
        questions = build_day_locked_questions(data, args.day_lock, carryover_count=args.carryover, questions_filepath=args.questions_file)
        if not questions:
            print(f"{RED}Day-lock selected zero questions. Check day or dataset content.{RESET}")
            sys.exit(1)
        print(f"{CYAN}Day-lock mode active: Day {args.day_lock} with carryover={max(0, min(args.carryover, 3))}.{RESET}")
    else:
        questions = filter_questions(
            data,
            domain_id=args.domain,
            topic_prefix=args.topic,
            question_ids=q_ids,
            cross_domains=cross,
            all_mode=args.all
        )

    questions = enrich_case_study_metadata(questions, data)
    questions = deduplicate_questions(questions)

    if args.shuffle:
        questions = shuffle_preserving_case_studies(questions)

    if args.limit and args.limit < len(questions):
        questions = limit_preserving_case_studies(questions, args.limit)

    # Run the quiz
    if args.web:
        try:
            from quiz_web import run_web_quiz
        except ImportError:
            print(f"{YELLOW}--web requested but quiz_web.py was not found next to quiz_runner.py.{RESET}")
            print(f"{YELLOW}Falling back to terminal mode for this run.{RESET}")
            run_web_quiz = None

        if run_web_quiz is not None:
            result_path = run_web_quiz(
                questions,
                data,
                output_path=args.output,
                port=args.port,
                helpers={
                    "check_correct": check_correct,
                    "get_correct_display": get_correct_display,
                    "get_user_display": get_user_display,
                    "has_answer_key": has_answer_key,
                    "save_results": save_results,
                },
            )
        else:
            result_path = run_quiz(questions, data, open_images=args.open_images, output_path=args.output)
    else:
        result_path = run_quiz(questions, data, open_images=args.open_images, output_path=args.output)

    if result_path:
        # Print path for agent to pick up
        print(f"\n{DIM}[AGENT_RESULT_PATH:{result_path}]{RESET}")


if __name__ == "__main__":
    main()
