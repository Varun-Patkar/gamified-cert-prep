"""Local web quiz host for rendering certification questions with images and rich inputs.

This module exposes one entry point, run_web_quiz, and intentionally keeps all
frontend assets embedded in Python so the workflow stays dependency-free.
"""

import json
import socket
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer


HTML_PAGE = """<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>AI-102 Quiz</title>
  <style>
    :root {
      --bg: #f4efe6;
      --panel: #fff9ef;
      --ink: #102a43;
      --muted: #5c6f82;
      --accent: #0f766e;
      --danger: #b42318;
      --ok: #027a48;
      --line: #d7c9aa;
      --chip: #efe3cc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Trebuchet MS", "Gill Sans", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at 15% 15%, #f0e1c3 0, transparent 28%),
        radial-gradient(circle at 82% 2%, #cfe8df 0, transparent 25%),
        linear-gradient(160deg, #f3ede2, #faf8f2 45%, #efe8db);
      min-height: 100vh;
    }
    .shell { max-width: 1100px; margin: 0 auto; padding: 18px; }
    .top {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(16, 42, 67, 0.08);
      display: grid;
      gap: 10px;
    }
    .title { font-size: clamp(1.2rem, 2.4vw, 1.8rem); margin: 0; }
    .meta { color: var(--muted); display: flex; gap: 10px; flex-wrap: wrap; }
    .chip { background: var(--chip); border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; }
    .card {
      margin-top: 14px;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 8px 24px rgba(16, 42, 67, 0.08);
      animation: rise .22s ease;
    }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .qtext { font-size: 1.06rem; line-height: 1.45; white-space: pre-wrap; }
    .source a { color: #0f4c81; }
    .opts { display: grid; gap: 10px; margin-top: 14px; }
    .opts .opt span { white-space: normal; overflow-wrap: anywhere; word-break: break-word; }
    label.opt {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      background: #fffdf7;
      cursor: pointer;
    }
    .images { margin-top: 12px; display: grid; gap: 10px; }
    .images img {
      width: 100%;
      max-width: 760px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: #fff;
      display: block;
    }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
    button {
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 9px 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .primary { background: var(--accent); color: #fff; }
    .ghost { background: #fff; border-color: var(--line); }
    .warn { background: #fff2f0; border-color: #f5c4be; color: var(--danger); }
    .feedback {
      margin-top: 14px;
      border-radius: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      background: #fff;
      display: none;
    }
    .ok { color: var(--ok); font-weight: 700; }
    .bad { color: var(--danger); font-weight: 700; }
    .info { color: #0f4c81; font-weight: 700; }
    .summary {
      margin-top: 16px;
      display: none;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
      background: #fff;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
    .muted { color: var(--muted); }
    .hidden { display: none; }
    @media (max-width: 680px) {
      .shell { padding: 12px; }
      .card { padding: 14px; }
    }
  </style>
</head>
<body>
  <div class=\"shell\">
    <div class=\"top\">
      <h1 class=\"title\" id=\"examTitle\">Quiz</h1>
      <div class=\"meta\">
        <span class=\"chip\" id=\"progressChip\">Question 0/0</span>
        <span class=\"chip\" id=\"topicChip\">Topic</span>
        <span class=\"chip\" id=\"domainChip\">Domain</span>
        <span class=\"chip\" id=\"aiChip\">Option source: Original</span>
      </div>
      <div class=\"muted\" id=\"modeInfo\">Web mode</div>
    </div>

    <div class=\"card\" id=\"questionCard\">
      <div class=\"qtext\" id=\"questionText\"></div>
      <div class=\"source muted\" id=\"sourceBox\"></div>
      <div class=\"images\" id=\"questionImages\"></div>
      <div class=\"opts\" id=\"optionsBox\"></div>

      <div class=\"actions\">
        <button class=\"primary\" id=\"submitBtn\">Submit</button>
        <button class=\"ghost\" id=\"skipBtn\">Skip</button>
        <button class=\"warn\" id=\"quitBtn\">Quit Session</button>
        <button class=\"ghost\" id=\"stopBtn\">Stop Server</button>
      </div>

      <div class=\"feedback\" id=\"feedbackBox\"></div>
      <div class=\"actions hidden\" id=\"nextWrap\">
        <button class=\"primary\" id=\"nextBtn\">Next Question</button>
      </div>
    </div>

    <div class=\"summary\" id=\"summaryBox\"></div>
  </div>

  <script>
    const el = (id) => document.getElementById(id);
    let state = null;
    let pendingNext = null;

    async function fetchState() {
      const res = await fetch('/api/state');
      state = await res.json();
      renderState();
    }

    function esc(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function isPlaceholderText(value) {
      const t = String(value || '').toLowerCase();
      return t.includes('[inline placeholder');
    }

    function extractOptionLetter(opt, idx) {
      const text = String(opt || '');
      const m = text.match(/^\s*([A-F])\./i);
      if (m) return m[1].toUpperCase();
      return String.fromCharCode(65 + idx);
    }

    function renderImages(containerId, urls) {
      const box = el(containerId);
      box.innerHTML = '';
      (urls || []).forEach((u, i) => {
        const wrap = document.createElement('div');
        const a = document.createElement('a');
        a.href = u;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Open image ' + (i + 1);
        const img = document.createElement('img');
        img.src = u;
        img.alt = 'question image ' + (i + 1);
        wrap.appendChild(img);
        wrap.appendChild(a);
        box.appendChild(wrap);
      });
    }

    function setFeedback(feedback) {
      const box = el('feedbackBox');
      if (!feedback) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
      }

      let verdictClass = 'info';
      if (feedback.verdict === 'correct') verdictClass = 'ok';
      else if (feedback.verdict === 'wrong') verdictClass = 'bad';

      let html = `<div class="${verdictClass}">${esc(feedback.title)}</div>`;
      if (feedback.userAnswer) html += `<div><b>Your answer:</b> ${esc(feedback.userAnswer)}</div>`;
      if (feedback.correctAnswer) html += `<div><b>Correct:</b> ${esc(feedback.correctAnswer)}</div>`;
      if (feedback.explanation) html += `<div style="margin-top:8px"><b>Explanation:</b> ${esc(feedback.explanation)}</div>`;
      box.innerHTML = html;
      box.style.display = 'block';
      renderImages('questionImages', (feedback.questionImages || []));
      if (feedback.answerImages && feedback.answerImages.length) {
        const sec = document.createElement('div');
        sec.style.marginTop = '10px';
        sec.innerHTML = '<b>Answer images</b>';
        box.appendChild(sec);
        feedback.answerImages.forEach((u, i) => {
          const img = document.createElement('img');
          img.src = u;
          img.alt = 'answer image ' + (i + 1);
          img.style.maxWidth = '100%';
          img.style.border = '1px solid var(--line)';
          img.style.borderRadius = '8px';
          img.style.marginTop = '8px';
          box.appendChild(img);
        });
      }
    }

    function renderQuestion(q) {
      el('progressChip').textContent = `Question ${state.index + 1}/${state.total}`;
      el('topicChip').textContent = q.topic || 'Topic N/A';
      el('domainChip').textContent = q.domainName || 'Domain N/A';
      el('aiChip').textContent = q.optionsAgentGenerated ? 'Option source: AI-generated' : 'Option source: Original';
      el('questionText').textContent = q.displayQuestion || q.question || '';
      el('sourceBox').innerHTML = q.sourceUrl ? `<a href="${q.sourceUrl}" target="_blank" rel="noopener">Source discussion</a>` : '';
      renderImages('questionImages', q.questionImages || []);

      const box = el('optionsBox');
      box.innerHTML = '';

      const hasPlaceholderOptions =
        (q.options || []).some(isPlaceholderText) ||
        (q.dropdowns || []).some(dd => (dd.options || []).some(isPlaceholderText));

      if (q.optionsAgentGenerated) {
        const warn = (q.optionGenerationMeta && q.optionGenerationMeta.warning)
          ? q.optionGenerationMeta.warning
          : 'Options were agent-generated and may be incorrect.';
        box.insertAdjacentHTML(
          'beforeend',
          `<div class="muted" style="margin-bottom:8px"><b>Agent-generated options:</b> ${esc(warn)}</div>`
        );
      }

      if (hasPlaceholderOptions) {
        box.insertAdjacentHTML(
          'beforeend',
          '<div class="muted" style="margin-bottom:8px"><b>Image-backed options:</b> option text is in the image/source. Select by letter/choice number after reviewing the image.</div>'
        );
      }

      if (!q.gradable) {
        if (q.ambiguousPlaceholder) {
          box.insertAdjacentHTML('beforeend', '<div class="muted"><b>Review-only item:</b> option text is missing in the dataset (placeholder-only), so this question is not graded. Use image/source to learn, then continue.</div>');
        } else {
          box.insertAdjacentHTML('beforeend', '<div class="muted">Review-only item. No structured answer key for auto-grading.</div>');
        }
      } else if (q.type === 'mc') {
        (q.options || []).forEach((opt, i) => {
          const id = 'opt_' + i;
          const letter = extractOptionLetter(opt, i);
          const display = isPlaceholderText(opt)
            ? `${letter}. (see image/source for full option text)`
            : String(opt);
          box.insertAdjacentHTML('beforeend', `<label class="opt" for="${id}"><input type="radio" id="${id}" name="mc" value="${esc(letter)}"><span>${esc(display)}</span></label>`);
        });
      } else if (q.type === 'multi') {
        (q.options || []).forEach((opt, i) => {
          const id = 'opt_' + i;
          const letter = extractOptionLetter(opt, i);
          const display = isPlaceholderText(opt)
            ? `${letter}. (see image/source for full option text)`
            : String(opt);
          box.insertAdjacentHTML('beforeend', `<label class="opt" for="${id}"><input type="checkbox" id="${id}" name="multi" value="${esc(letter)}"><span>${esc(display)}</span></label>`);
        });
      } else if (q.type === 'dropdown') {
        (q.dropdowns || []).forEach((dd, i) => {
          const wrap = document.createElement('div');
          wrap.className = 'opt';
          const label = document.createElement('div');
          label.innerHTML = `<b>${esc(dd.label || ('Slot ' + (i + 1)))}</b>`;
          const sel = document.createElement('select');
          sel.name = 'dropdown_' + i;
          (dd.options || []).forEach((opt, oi) => {
            const o = document.createElement('option');
            o.value = String(oi);
            o.textContent = isPlaceholderText(opt)
              ? `Choice ${oi + 1} (see image/source)`
              : String(opt);
            sel.appendChild(o);
          });
          wrap.appendChild(label);
          wrap.appendChild(sel);
          box.appendChild(wrap);
        });
      } else if (q.type === 'yesno') {
        (q.statements || []).forEach((stmt, i) => {
          const row = document.createElement('div');
          row.className = 'opt';
          row.innerHTML = `<div><b>Statement ${i + 1}:</b> ${esc(stmt)}</div>
            <div>
              <label><input type="radio" name="yn_${i}" value="Yes" checked> Yes</label>
              <label style="margin-left:12px"><input type="radio" name="yn_${i}" value="No"> No</label>
            </div>`;
          box.appendChild(row);
        });
      }
    }

    function readAnswerPayload(q) {
      if (!q.gradable) return { answer: null };
      if (q.type === 'mc') {
        const selected = document.querySelector('input[name="mc"]:checked');
        return { answer: selected ? selected.value : null };
      }
      if (q.type === 'multi') {
        const vals = Array.from(document.querySelectorAll('input[name="multi"]:checked')).map(x => x.value);
        return { answer: vals };
      }
      if (q.type === 'dropdown') {
        const vals = Array.from(document.querySelectorAll('select[name^="dropdown_"]')).map(s => Number(s.value));
        return { answer: vals };
      }
      if (q.type === 'yesno') {
        const vals = (q.statements || []).map((_, i) => {
          const selected = document.querySelector(`input[name="yn_${i}"]:checked`);
          return selected ? selected.value : 'Yes';
        });
        return { answer: vals };
      }
      return { answer: null };
    }

    function renderState() {
      el('examTitle').textContent = state.examName || 'Quiz';
      el('modeInfo').textContent = state.mode || 'Web mode';
      setFeedback(null);
      el('nextWrap').classList.add('hidden');

      if (state.completed) {
        renderSummary(state.summary);
        el('questionCard').classList.add('hidden');
        return;
      }

      el('questionCard').classList.remove('hidden');
      renderQuestion(state.question);
    }

    function renderSummary(s) {
      const box = el('summaryBox');
      const pct = s && s.accuracy != null ? s.accuracy : 0;
      box.style.display = 'block';
      box.innerHTML = `
        <h2>Session Complete</h2>
        <div class="grid">
          <div class="chip">Total: ${s.totalQuestions}</div>
          <div class="chip">Graded: ${s.gradedQuestions}</div>
          <div class="chip">Correct: ${s.correct}</div>
          <div class="chip">Wrong: ${s.wrong}</div>
          <div class="chip">Skipped: ${s.skipped}</div>
          <div class="chip">Accuracy: ${pct}%</div>
        </div>
        <p class="muted" style="margin-top:12px">Results saved to: ${esc(state.outputPath || 'session-results.json')}</p>
      `;
    }

    async function submitAnswer(skipped) {
      if (state.completed) return;
      const payload = skipped ? { skipped: true } : readAnswerPayload(state.question);
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      setFeedback(data.feedback);
      pendingNext = data.nextState || null;
      if (data.completed) {
        state = data.nextState;
        renderState();
      } else {
        el('nextWrap').classList.remove('hidden');
      }
    }

    async function quitSession() {
      const res = await fetch('/api/quit', { method: 'POST' });
      state = await res.json();
      renderState();
    }

    async function stopServer() {
      const res = await fetch('/api/shutdown', { method: 'POST' });
      state = await res.json();
      renderState();
    }

    function goNext() {
      if (pendingNext) {
        state = pendingNext;
        pendingNext = null;
        setFeedback(null);
        el('nextWrap').classList.add('hidden');
        renderState();
      }
    }

    el('submitBtn').addEventListener('click', () => submitAnswer(false));
    el('skipBtn').addEventListener('click', () => submitAnswer(true));
    el('quitBtn').addEventListener('click', quitSession);
    el('stopBtn').addEventListener('click', stopServer);
    el('nextBtn').addEventListener('click', goNext);

    fetchState();
  </script>
</body>
</html>
"""


def _summary_from_results(results, total_time_sec):
    """Build compact summary payload for the frontend."""
    total = len(results)
    graded = sum(1 for r in results if r.get("gradable", True) and not r.get("skipped"))
    correct = sum(1 for r in results if r.get("correct"))
    skipped = sum(1 for r in results if r.get("skipped"))
    wrong = max(0, graded - correct)
    return {
        "totalQuestions": total,
        "gradedQuestions": graded,
        "correct": correct,
        "wrong": wrong,
        "skipped": skipped,
        "accuracy": round((correct / graded * 100), 1) if graded else 0,
        "timeSeconds": round(total_time_sec, 1),
    }


def _question_payload(q):
    """Return browser-safe question payload."""
    return {
        "id": q.get("id", ""),
        "question": q.get("question", ""),
        "displayQuestion": q.get("displayQuestion", q.get("question", "")),
        "topic": q.get("topic", ""),
        "domainName": q.get("domainName", ""),
        "domainId": q.get("domainId", ""),
        "difficulty": q.get("difficulty", ""),
        "sourceUrl": q.get("sourceUrl", ""),
        "type": q.get("type", "mc"),
        "options": q.get("options", []),
        "dropdowns": q.get("dropdowns", []),
        "statements": q.get("statements", []),
        "questionImages": q.get("questionImages", []),
        "answerImages": q.get("answerImages", []),
        "explanation": q.get("explanation", ""),
        "gradable": bool(q.get("_gradable", False)),
        "ambiguousPlaceholder": bool(q.get("_ambiguousPlaceholder", False)),
        "optionsAgentGenerated": bool(q.get("optionsAgentGenerated", False)),
        "optionGenerationMeta": q.get("optionGenerationMeta", {}),
    }


def _is_placeholder_text(value):
    """Return True when option text is an inline placeholder instead of real content."""
    token = str(value or "").strip().lower()
    return "[inline placeholder" in token


def _is_ambiguous_placeholder_question(q):
    """
    Detect questions that cannot be answered fairly from dataset text alone.

    A question is ambiguous when all visible options are placeholder stubs and the
    real answer choices are only present in image/source content.
    """
    qtype = q.get("type", "mc")

    if q.get("optionsAgentGenerated"):
        return False

    if qtype in ("mc", "multi"):
        options = q.get("options", []) or []
        if options and all(_is_placeholder_text(opt) for opt in options):
            return True

    if qtype == "dropdown":
        dropdowns = q.get("dropdowns", []) or []
        if dropdowns and all(
            (slot.get("options") or []) and all(_is_placeholder_text(opt) for opt in (slot.get("options") or []))
            for slot in dropdowns
        ):
            return True

    return False


def _find_free_port(host, preferred):
    """Return preferred port if free; otherwise first free port in small window."""
    for port in range(preferred, preferred + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if sock.connect_ex((host, port)) != 0:
                return port
    raise RuntimeError("No free port found in range")


def run_web_quiz(questions, data, output_path, port, helpers):
    """Run browser-hosted quiz session and persist result JSON when complete."""
    check_correct = helpers["check_correct"]
    get_correct_display = helpers["get_correct_display"]
    get_user_display = helpers["get_user_display"]
    has_answer_key = helpers["has_answer_key"]
    save_results = helpers["save_results"]

    for q in questions:
      base_gradable = has_answer_key(q)
      ambiguous = _is_ambiguous_placeholder_question(q)
      q["_ambiguousPlaceholder"] = ambiguous
      q["_gradable"] = base_gradable and not ambiguous

    state = {
        "index": 0,
        "startTime": time.time(),
        "results": [],
        "completed": False,
        "outputPath": output_path,
        "savedPath": None,
        "shutdownRequested": False,
    }

    def current_question():
        if state["index"] >= len(questions):
            return None
        return questions[state["index"]]

    def build_state_payload():
        if state["completed"]:
            elapsed = time.time() - state["startTime"]
            return {
                "completed": True,
                "examName": data.get("examName", "Certification Prep"),
                "total": len(questions),
                "index": len(questions),
                "summary": _summary_from_results(state["results"], elapsed),
                "outputPath": state.get("savedPath") or state.get("outputPath"),
                "mode": "Web quiz mode",
            }

        q = current_question()
        return {
            "completed": False,
            "examName": data.get("examName", "Certification Prep"),
            "total": len(questions),
            "index": state["index"],
            "question": _question_payload(q),
            "mode": "Web quiz mode",
        }

    def finalize_session():
        if state["completed"]:
            return
        elapsed = time.time() - state["startTime"]
        if state["results"]:
            state["savedPath"] = save_results(state["results"], data, elapsed, output_path=state["outputPath"])
        state["completed"] = True

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format_str, *args):
            return

        def _send_json(self, payload, status=200):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _read_json(self):
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b"{}"
            try:
                return json.loads(raw.decode("utf-8"))
            except Exception:
                return {}

        def do_GET(self):
            if self.path == "/":
                body = HTML_PAGE.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return

            if self.path == "/api/state":
                self._send_json(build_state_payload())
                return

            self.send_response(404)
            self.end_headers()

        def do_POST(self):
            if self.path == "/api/quit":
                finalize_session()
                self._send_json(build_state_payload())
                return

            if self.path == "/api/shutdown":
                finalize_session()
                state["shutdownRequested"] = True
                self._send_json(build_state_payload())
                return

            if self.path != "/api/answer":
                self.send_response(404)
                self.end_headers()
                return

            if state["completed"]:
                self._send_json(build_state_payload())
                return

            q = current_question()
            if q is None:
                finalize_session()
                self._send_json(build_state_payload())
                return

            payload = self._read_json()
            skipped = bool(payload.get("skipped", False))
            user_answer = payload.get("answer")

            qtype = q.get("type", "mc")
            if qtype == "mc" and isinstance(user_answer, str):
                user_answer = user_answer.strip().upper()
            elif qtype == "multi" and isinstance(user_answer, list):
                user_answer = sorted(set(str(x).strip().upper() for x in user_answer if str(x).strip()))
            elif qtype == "dropdown" and isinstance(user_answer, list):
                try:
                    user_answer = [int(x) for x in user_answer]
                except Exception:
                    user_answer = []
            elif qtype == "yesno" and isinstance(user_answer, list):
                normalized = []
                for item in user_answer:
                    token = str(item).strip().lower()
                    normalized.append("Yes" if token in ("yes", "y", "true", "1") else "No")
                user_answer = normalized

            if not q.get("_gradable", False):
                user_answer = None
                skipped = False

            verdict = check_correct(q, user_answer) if not skipped else None
            is_correct = verdict is True

            row = {
                "questionId": q.get("id", ""),
                "question": q.get("question", ""),
                "userAnswer": get_user_display(q, user_answer) if not skipped else None,
                "correctAnswer": get_correct_display(q),
                "correct": is_correct,
                "gradable": q.get("_gradable", False),
                "skipped": skipped,
                "topic": q.get("topic", ""),
                "domainName": q.get("domainName", ""),
                "domainId": q.get("domainId", ""),
                "difficulty": q.get("difficulty", ""),
                "explanation": q.get("explanation", ""),
                "questionImages": q.get("questionImages", []),
                "answerImages": q.get("answerImages", []),
                "sourceUrl": q.get("sourceUrl", ""),
            }
            state["results"].append(row)
            state["index"] += 1

            if skipped:
                title = "Skipped"
                verdict_key = "skipped"
            elif verdict is None:
                title = "Review item"
                verdict_key = "info"
            elif verdict:
                title = "Correct"
                verdict_key = "correct"
            else:
                title = "Wrong"
                verdict_key = "wrong"

            feedback = {
                "title": title,
                "verdict": verdict_key,
                "userAnswer": row["userAnswer"],
                "correctAnswer": row["correctAnswer"],
                "explanation": row.get("explanation", ""),
                "questionImages": row.get("questionImages", []),
                "answerImages": row.get("answerImages", []),
            }

            if state["index"] >= len(questions):
                finalize_session()
                self._send_json({
                    "completed": True,
                    "feedback": feedback,
                    "nextState": build_state_payload(),
                })
                return

            self._send_json({
                "completed": False,
                "feedback": feedback,
                "nextState": build_state_payload(),
            })

    host = "127.0.0.1"
    bound_port = _find_free_port(host, int(port or 8765))
    server = HTTPServer((host, bound_port), Handler)

    print(f"Web quiz started at http://{host}:{bound_port}")
    print("Press Ctrl+C in terminal to stop server at any time.")
    try:
        webbrowser.open_new_tab(f"http://{host}:{bound_port}")
    except Exception:
        pass

    try:
        while True:
            server.handle_request()
            if state["completed"] or state.get("shutdownRequested"):
                break
    except KeyboardInterrupt:
        finalize_session()
        print("Web session interrupted by user.")
    finally:
        server.server_close()

    if state.get("savedPath"):
        return state.get("savedPath")

    return output_path
