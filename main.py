"""
AI Interview System — v10 Full Stack
════════════════════════════════════
Setup:
  1. pip install -r requirements.txt
  2. cp .env.example .env  →  fill in values
  3. python init_db.py
  4. uvicorn main:app --port 8081 --reload
 
Routes:
  GET  /              → candidate interview page (reads ?token=xxx from URL)
  GET  /recruiter     → recruiter portal
  POST /transcribe    → Groq Whisper STT
  POST /speak         → edge-tts TTS
  POST /evaluate      → scoring (cosine + cross-encoder → LLM → 1 result)
  POST /complete      → mark session done, notify Upply backend
 
  POST /recruiter/create-bulk       → generate + email N candidates (questions personalised per CV)
  GET  /recruiter/sessions          → list all sessions (optional ?job_id=)
  GET  /recruiter/session/{token}/results → per-question results

  GET  /proxy/applications/{applicationId}/resume/download → stream candidate CV PDF from Upply
"""
 
import os, json, re, io, secrets, smtplib, uuid, httpx
import psycopg2
import psycopg2.extras
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv
import pypdf
load_dotenv()
 
import numpy as np
from groq import Groq
import edge_tts
from sentence_transformers import SentenceTransformer, CrossEncoder
from sklearn.metrics.pairwise import cosine_similarity
 
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Request
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
 
# ── Config ────────────────────────────────────────────────────────────────────
DATABASE_URL       = os.getenv("DATABASE_URL",        "")
UPPLY_API_BASE     = os.getenv("UPPLY_BASE",         "https://api.upply.tech/api/v1")
INTERVIEW_BASE_URL = os.getenv("INTERVIEW_BASE_URL", "http://localhost:8001")
EMAIL_FROM         = os.getenv("EMAIL_FROM",         "noreply@upply.tech")
SMTP_HOST          = os.getenv("SMTP_HOST",          "smtp.gmail.com")
SMTP_PORT          = int(os.getenv("SMTP_PORT",      "587"))
SMTP_USER          = os.getenv("SMTP_USER",          "")
SMTP_PASS          = os.getenv("SMTP_PASS",          "")
 
# ── Groq ──────────────────────────────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
 
CANDIDATE_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "llama3-8b-8192",
]
WHISPER_MODEL = "whisper-large-v3-turbo"
 
 
def find_active_model():
    for name in CANDIDATE_MODELS:
        try:
            client.chat.completions.create(model=name,
                messages=[{"role":"user","content":"hi"}], max_tokens=5)
            print(f"✅ Active LLM: {name}")
            return name
        except Exception as e:
            print(f"⚠️  {name}: {e}")
    print("❌ No Groq LLM — check GROQ_API_KEY")
    return None
 
ACTIVE_MODEL = find_active_model()
 
# ── Embedding models ──────────────────────────────────────────────────────────
print("⏳ Loading embedding models…")
bi_encoder    = SentenceTransformer("all-MiniLM-L6-v2")
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
print("✅ Embedding models ready")
 
# ── DB helpers (PostgreSQL) ───────────────────────────────────────────────────
def get_db():
    return psycopg2.connect(DATABASE_URL)

def db_get(q, p=()):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(q, p)
            return cur.fetchone()
    finally:
        conn.close()

def db_all(q, p=()):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(q, p)
            return cur.fetchall()
    finally:
        conn.close()

def db_run(q, p=()):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(q, p)
        conn.commit()
    finally:
        conn.close()

def init_db():
    db_run("""CREATE TABLE IF NOT EXISTS interview_sessions (
        id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL,
        job_id TEXT, application_id TEXT,
        job_title TEXT, company TEXT, jd TEXT NOT NULL,
        num_questions INTEGER DEFAULT 5,
        questions_json TEXT,
        status TEXT DEFAULT 'PENDING',
        candidate_email TEXT, candidate_name TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TEXT)""")
    db_run("""CREATE TABLE IF NOT EXISTS interview_results (
        id SERIAL PRIMARY KEY,
        session_token TEXT NOT NULL,
        question_index INTEGER NOT NULL,
        question TEXT, score INTEGER, feedback TEXT,
        tip TEXT, transcript TEXT,
        submitted_at TIMESTAMP DEFAULT NOW())""")
    print("✅ DB ready")
 
init_db()
 
# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Upply AI Interview v10")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/assets", StaticFiles(directory="static/dist/assets"), name="assets")
app.mount("/recruiter-portal/dist/assets", StaticFiles(directory="static/recruiter-portal/dist/assets"), name="recruiter-assets")
# ── Utilities ─────────────────────────────────────────────────────────────────
FILLER_RE = re.compile(
    r"\b(um+|uh+|like|you know|i mean|basically|actually|"
    r"literally|right\b|so\b|well\b|hmm+|err+|ah\b|oh\b)\b",
    re.IGNORECASE)
 
def clean_transcript(text):
    text = FILLER_RE.sub("", text)
    return re.sub(r"\s{2,}", " ", text).strip()
 
def groq_call(prompt, temperature=0.3, max_tokens=1024):
    models = ([ACTIVE_MODEL] + [m for m in CANDIDATE_MODELS if m != ACTIVE_MODEL]
              if ACTIVE_MODEL else CANDIDATE_MODELS)
    for model in models:
        try:
            r = client.chat.completions.create(
                model=model, messages=[{"role":"user","content":prompt}],
                temperature=temperature, max_tokens=max_tokens)
            return r.choices[0].message.content.strip()
        except Exception as e:
            print(f"⚠️ {model}: {e}")
    return ""
 
def compute_composite(model_answer, user_answer):
    e1 = bi_encoder.encode([model_answer])
    e2 = bi_encoder.encode([user_answer])
    cos = float(max(0., min(1., cosine_similarity(e1, e2)[0][0])))
    ce  = float(cross_encoder.predict([[model_answer, user_answer]]))
    sig = float(1. / (1. + np.exp(-ce)))
    comp = round(0.35*cos + 0.65*sig, 4)
    if comp >= 0.75: hint = "very high — answer closely matches expected"
    elif comp >= 0.55: hint = "moderate-to-high — most key points covered"
    elif comp >= 0.35: hint = "moderate — partially addresses question"
    else: hint = "low — largely off-topic or missing core concepts"
    return {"composite": comp, "hint": hint}
 
def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract plain text from a PDF given its raw bytes."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages  = [page.extract_text() or "" for page in reader.pages]
        text   = "\n".join(pages).strip()
        # Truncate to ~6 000 chars so we don't blow the LLM context
        return text[:6000]
    except Exception as e:
        print(f"⚠️ PDF extraction failed: {e}")
        return ""


async def fetch_candidate_cv(application_id: str, auth_header: str) -> str:
    """
    Download the candidate's CV PDF from Upply and return extracted text.
    Uses GET /applications/{applicationId}/resume/download.
    Returns empty string on any failure (question generation still proceeds with JD only).
    """
    if not application_id:
        return ""
    url = f"{UPPLY_API_BASE}/applications/{application_id}/resume/download"
    try:
        async with httpx.AsyncClient(timeout=30) as hc:
            r = await hc.get(url, headers={"Authorization": auth_header})
        if r.status_code == 200:
            cv_text = extract_pdf_text(r.content)
            print(f"📄 CV fetched for application {application_id} "
                  f"({len(cv_text)} chars extracted)")
            return cv_text
        else:
            print(f"⚠️ CV download failed for {application_id}: HTTP {r.status_code}")
            return ""
    except Exception as e:
        print(f"⚠️ CV fetch exception for {application_id}: {e}")
        return ""


def generate_questions(jd: str, n: int, cv_text: str = "") -> list:
    """
    Generate n interview questions tailored to the Job Description.
    When cv_text is provided the questions are further personalised to the
    candidate's own background, skills, and experience.
    """
    # Step 1 — extract JD requirements
    extract = groq_call(f"""Extract from this Job Description:
1. All technical skills
2. All tools/frameworks
3. All responsibilities

JD: {jd}

Plain bullet list, one per line. No JSON, no preamble.""", temperature=0.2, max_tokens=512)

    # Step 2 — build candidate context block (optional)
    candidate_block = ""
    if cv_text:
        candidate_block = f"""
Candidate CV (extracted text):
\"\"\"
{cv_text}
\"\"\"

Use the candidate's CV to:
- Reference specific technologies, projects, or roles they have worked on
- Probe gaps or depth in areas listed on their CV that are also required by the JD
- Do NOT ask about things that are completely absent from both the JD and the CV
"""

    ne = max(1, n // 3); nm = max(1, n // 3); nh = n - ne - nm

    raw = groq_call(f"""You are a senior technical interviewer.

Job requirements extracted from JD:
{extract}
{candidate_block}
Generate exactly {n} interview questions. RULES:
- Every question must reference a specific skill/tool/responsibility from the JD
- If a CV was provided, tailor at least half the questions to the candidate's actual background
- FORBIDDEN: "Tell me about yourself", strengths/weaknesses, generic "5 years" questions
- Difficulty: first {ne} easy, next {nm} medium, last {nh} hard
- Include a thorough model answer for each question (3-6 sentences)

Return ONLY a valid JSON array:
[{{"question":"...","model_answer":"..."}}]""", temperature=0.4, max_tokens=2048)

    raw = re.sub(r"^```(?:json)?", "", raw.strip(), flags=re.MULTILINE)
    raw = re.sub(r"```$",          "", raw.strip(), flags=re.MULTILINE)
    m = re.search(r"\[.*\]", raw.strip(), re.DOTALL)
    if m: raw = m.group(0)
    return json.loads(raw)


# ── Resolve candidate name from Upply applicant object ───────────────────────
def resolve_candidate_name(applicant: dict) -> str:
    """
    Upply applicant objects may use different field names.
    Try every known variant and fall back to email prefix if needed.
    """
    # Direct full-name fields
    for field in ("name", "fullName", "full_name", "candidateName",
                  "applicantName", "displayName"):
        val = applicant.get(field, "")
        if val and val.strip():
            return val.strip()

    # First + last name combination
    first = applicant.get("firstName", "") or applicant.get("first_name", "") or ""
    last  = applicant.get("lastName",  "") or applicant.get("last_name",  "") or ""
    combined = f"{first} {last}".strip()
    if combined:
        return combined

    # Fall back to email prefix (e.g. "john.doe@..." → "John Doe")
    email = applicant.get("email", "")
    if email and "@" in email:
        prefix = email.split("@")[0]
        # turn dots/underscores/dashes into spaces and title-case
        return prefix.replace(".", " ").replace("_", " ").replace("-", " ").title()

    return "Candidate"


# ── Email ─────────────────────────────────────────────────────────────────────
def send_email(to_email, candidate_name, job_title, company, link):
    if not SMTP_USER or not SMTP_PASS:
        print(f"📧 [DEV] Would send to {to_email}: {link}")
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your AI Interview — {job_title} at {company}"
        msg["From"] = EMAIL_FROM
        msg["To"]   = to_email
 
        html = f"""<!DOCTYPE html>
<html><body style="font-family:Inter,sans-serif;background:#F4F4F8;padding:40px 20px;margin:0">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E2EE;box-shadow:0 4px 20px rgba(0,0,0,.06)">
  <div style="background:#2D2B6B;padding:32px 36px">
    <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px">Up<span style="color:#3ECFA0">ply</span></div>
    <div style="font-size:13px;color:rgba(255,255,255,.4);margin-top:4px">AI Interview Invitation</div>
  </div>
  <div style="padding:32px 36px">
    <p style="font-size:15px;font-weight:600;color:#1E1C4A;margin:0 0 8px">Hi {candidate_name},</p>
    <p style="font-size:13px;color:#6B6A8E;line-height:1.65;margin:0 0 28px">
      Congratulations! You've been shortlisted for an AI interview for the
      <strong style="color:#2D2B6B">{job_title}</strong> position at <strong style="color:#2D2B6B">{company}</strong>.
      The interview is fully automated — answer verbally and get instant feedback.
    </p>
    <a href="{link}" style="display:inline-block;background:#2D2B6B;color:#fff;font-size:14px;font-weight:600;
       padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:-.2px">
      Begin My Interview →
    </a>
    <p style="font-size:11px;color:#9998B8;margin:24px 0 0;line-height:1.6">
      This link is unique to you — do not share it. It expires in 7 days.
    </p>
  </div>
  <div style="padding:14px 36px;border-top:1px solid #E2E2EE;font-size:11px;color:#9998B8">
    Powered by Upply Team · AI Interview System
  </div>
</div></body></html>"""
 
        msg.attach(MIMEText(html, "html", "utf-8"))
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as s:
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(EMAIL_FROM, to_email, msg.as_string())
        print(f"✅ Email → {to_email} (name: {candidate_name})")
        return True
    except Exception as e:
        print(f"❌ Email failed {to_email}: {e}")
        return False
 
# ════════════════════════════════════════════════════════
#  CANDIDATE ROUTES
# ════════════════════════════════════════════════════════
 
@app.get("/", response_class=HTMLResponse)
def candidate_index():
    with open("static/dist/index.html", encoding="utf-8") as f: return f.read()
 
@app.get("/health")
def health():
    return {"status": "ok" if ACTIVE_MODEL else "no_model", "llm": ACTIVE_MODEL}
 
@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:
        b = await audio.read()
        if len(b) < 1000:
            return JSONResponse({"ok":False,"transcript":"","error":"Audio too short."})
        t = client.audio.transcriptions.create(
            model=WHISPER_MODEL, file=(audio.filename or "rec.webm", b),
            response_format="text", language="en", temperature=0.0)
        raw = t if isinstance(t, str) else t.text
        return {"ok": True, "transcript": clean_transcript(raw)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"ok":False,"transcript":"","error":str(e)})
 
@app.post("/setup")
def setup(token: str = Form(...)):
    sess = db_get("SELECT * FROM interview_sessions WHERE token=%s", (token,))
    if not sess:
        return {"ok": False, "error": "Interview not found or expired."}
    if sess["status"] == "COMPLETED":
        return {"ok": False, "error": "This interview has already been completed."}
 
    if sess["questions_json"]:
        questions = json.loads(sess["questions_json"])
    else:
        try:
            questions = generate_questions(sess["jd"], sess["num_questions"])
            db_run("UPDATE interview_sessions SET questions_json=%s WHERE token=%s",
                   (json.dumps(questions), token))
        except Exception as e:
            return {"ok": False, "error": f"Question generation failed: {e}"}
 
    db_run("UPDATE interview_sessions SET status='IN_PROGRESS' WHERE token=%s", (token,))
    return {"ok": True, "questions": questions,
            "job_title": sess["job_title"] or "",
            "company":   sess["company"]   or ""}
 
@app.post("/speak")
async def speak(text: str = Form(...)):
    tts = edge_tts.Communicate(text, voice="en-US-JennyNeural")
    buf = io.BytesIO()
    async for chunk in tts.stream():
        if chunk["type"] == "audio": buf.write(chunk["data"])
    buf.seek(0)
    return StreamingResponse(buf, media_type="audio/mpeg",
                             headers={"Content-Disposition": "inline"})
 
@app.post("/evaluate")
def evaluate(question:str=Form(...), model_answer:str=Form(...),
             user_answer:str=Form(...), token:str=Form(""), q_index:int=Form(0)):
    cleaned = clean_transcript(user_answer)
    if not cleaned.strip():
        return {"score":"1","feedback":"No answer detected.","tip":"Speak clearly into your mic.","cleaned":cleaned}
 
    hint = compute_composite(model_answer, cleaned)["hint"]
 
    raw = groq_call(f"""Strict but fair technical interviewer evaluating a verbal answer.
 
Question: {question}
Expected: {model_answer}
Candidate (from Whisper): {cleaned}
Semantic similarity: {hint}
 
Use similarity as primary calibration. Score guide:
9-10 Complete accurate well-explained | 7-8 Mostly correct minor gaps
5-6 Partial, missing key points | 3-4 Mostly incorrect shallow | 1-2 Wrong/off-topic
 
Respond EXACTLY in 3 lines:
SCORE: [1-10]
FEEDBACK: [one sentence]
TIP: [one actionable improvement]""", temperature=0.2, max_tokens=256)
 
    parsed = {}
    for line in raw.splitlines():
        if ":" in line:
            k, _, v = line.partition(":"); parsed[k.strip().upper()] = v.strip()
 
    score    = parsed.get("SCORE", "5")
    feedback = parsed.get("FEEDBACK", "Answer received.")
    tip      = parsed.get("TIP", "Be more specific and structured.")
    try: score = str(max(1, min(10, int(score))))
    except: score = "5"
 
    if token:
        db_run("""INSERT INTO interview_results
                  (session_token,question_index,question,score,feedback,tip,transcript)
                  VALUES(%s,%s,%s,%s,%s,%s,%s)""",
               (token, q_index, question, int(score), feedback, tip, cleaned))
 
    return {"score": score, "feedback": feedback, "tip": tip, "cleaned": cleaned}
 
@app.post("/complete")
def complete(token: str = Form(...)):
    sess = db_get("SELECT * FROM interview_sessions WHERE token=%s", (token,))
    if not sess: return {"ok": False, "error": "Session not found."}
    db_run("UPDATE interview_sessions SET status='COMPLETED' WHERE token=%s", (token,))
    try:
        import httpx
        if sess["application_id"]:
            httpx.patch(f"{UPPLY_API_BASE}/applications/{sess['application_id']}/status",
                       json={"status":"INTERVIEWED"},
                       headers={"Content-Type":"application/json"}, timeout=8)
    except Exception as e:
        print(f"⚠️ Upply notify failed: {e}")
    return {"ok": True}
 
# ════════════════════════════════════════════════════════
#  RECRUITER ROUTES
# ════════════════════════════════════════════════════════
 
@app.get("/recruiter", response_class=HTMLResponse)
def recruiter_page():
    with open("static/recruiter.html", encoding="utf-8") as f: return f.read()
 
@app.post("/recruiter/create-bulk")
async def create_bulk(request: Request):
    body       = await request.json()
    jd         = body.get("jd", "").strip()
    applicants = body.get("applicants", [])
    job_title  = body.get("job_title", "")
    company    = body.get("company", "")
    job_id     = body.get("job_id", "")
    num_q      = int(body.get("num_questions", 5))

    if not jd or not applicants:
        raise HTTPException(400, "jd and applicants required")

    # Forward the recruiter's JWT so we can download each CV
    auth_header = request.headers.get("Authorization", "")

    results = []
    for applicant in applicants:
        token      = secrets.token_urlsafe(20)
        session_id = str(uuid.uuid4())
        expires    = (datetime.utcnow() + timedelta(days=7)).isoformat()

        candidate_name  = resolve_candidate_name(applicant)
        candidate_email = applicant.get("email", "")
        application_id  = applicant.get("application_id", "")

        print(f"📋 Applicant data keys: {list(applicant.keys())}")
        print(f"👤 Resolved name: {candidate_name} | email: {candidate_email}")

        # ── Fetch candidate CV and generate personalised questions ────────────
        cv_text = await fetch_candidate_cv(application_id, auth_header)
        if cv_text:
            print(f"🎯 Generating personalised questions for {candidate_name} (CV + JD)")
        else:
            print(f"⚠️  No CV available for {candidate_name} — generating from JD only")

        questions_json = None
        try:
            questions      = generate_questions(jd, num_q, cv_text=cv_text)
            questions_json = json.dumps(questions)
        except Exception as e:
            print(f"⚠️ Question generation failed for {candidate_name}: {e}")

        db_run("""INSERT INTO interview_sessions
                  (id,token,job_id,application_id,job_title,company,
                   jd,num_questions,questions_json,candidate_email,candidate_name,expires_at)
                  VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
               (session_id, token, job_id, application_id,
                job_title, company, jd, num_q, questions_json,
                candidate_email, candidate_name, expires))

        link = f"{INTERVIEW_BASE_URL}?token={token}"
        sent = send_email(candidate_email, candidate_name, job_title, company, link)
        results.append({"email": candidate_email, "token": token,
                        "interview_link": link, "email_sent": sent,
                        "cv_used": bool(cv_text)})

    return {"ok": True, "sent": len(results), "results": results}
 
# ── Upply proxy routes ────────────────────────────────────────────────────────
 
def _proxy_headers(request: Request):
    jwt = request.headers.get("Authorization", "")
    return {"Authorization": jwt, "Content-Type": "application/json"}
 
def _safe_json(r):
    try:
        data = r.json()
        print(f"🔵 Upply {r.url} → {r.status_code}")
        return data
    except Exception:
        print(f"❌ Upply {r.url} → {r.status_code} (non-JSON): {r.text[:200]}")
        return {"error": f"Upply returned non-JSON (status {r.status_code})", "body": r.text[:300]}
 
def _decode_jwt_payload(authorization: str) -> dict:
    """
    Decode the JWT payload (middle part) without verifying signature.
    Returns the claims dict, or {} on failure.
    """
    try:
        token = authorization.replace("Bearer ", "").strip()
        # JWT = header.payload.signature  — we only need the middle part
        payload_b64 = token.split(".")[1]
        # Fix base64 padding
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        import base64
        decoded = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
        claims = json.loads(decoded)
        print(f"🔑 JWT claims: {claims}")
        return claims
    except Exception as e:
        print(f"⚠️  JWT decode failed: {e}")
        return {}


@app.get("/proxy/user/me")
async def proxy_user_me(request: Request):
    """Return decoded JWT claims as user profile."""
    jwt_header = request.headers.get("Authorization", "")
    claims = _decode_jwt_payload(jwt_header)
    return JSONResponse(status_code=200, content=claims)


@app.get("/proxy/jobs")
async def proxy_jobs(request: Request):
    headers = _proxy_headers(request)
    jwt_header = request.headers.get("Authorization", "")

    # Step 1: decode org ID directly from the JWT (no extra API call needed)
    claims = _decode_jwt_payload(jwt_header)
    org_id = (
        claims.get("organizationId")
        or claims.get("organisation_id")
        or claims.get("orgId")
        or claims.get("org_id")
        or (claims.get("organization") or {}).get("id")
    )
    recruiter_email = claims.get("sub") or claims.get("email") or ""
    print(f"🔑 JWT → org_id={org_id}, email={recruiter_email}")

    async with httpx.AsyncClient(timeout=60) as hc:
        # Step 2a: org ID found in JWT — use the org-scoped endpoint
        if org_id:
            print(f"🏢 Fetching jobs for organization: {org_id}")
            all_jobs = []
            page = 0
            while True:
                r = await hc.get(
                    f"{UPPLY_API_BASE}/organizations/{org_id}/jobs?page={page}&size=10",
                    headers=headers,
                )
                data = _safe_json(r)
                content = data.get("content", [])
                all_jobs.extend(content)
                if data.get("last", True):
                    break
                page += 1
            print(f"✅ Returning {len(all_jobs)} jobs for org {org_id}")
            return JSONResponse(status_code=200, content=all_jobs)

        # Step 2b: no org ID in JWT — fetch all jobs and filter by email
        print(f"⚠️  No org ID in JWT — fetching all jobs, filtering by email: {recruiter_email}")
        all_jobs = []
        page = 0
        while True:
            r = await hc.get(
                f"{UPPLY_API_BASE}/jobs?page={page}&size=20",
                headers=headers,
            )
            data = _safe_json(r)
            content = data.get("content", [])
            all_jobs.extend(content)
            if data.get("last", True):
                break
            page += 1

        if all_jobs:
            print(f"🔍 Sample job fields: {list(all_jobs[0].keys())}")
            print(f"🔍 Sample job: {all_jobs[0]}")

        if recruiter_email:
            filtered = [
                j for j in all_jobs
                if j.get("recruiterEmail") == recruiter_email
                or j.get("postedBy") == recruiter_email
                or j.get("createdBy") == recruiter_email
                or (j.get("poster") or {}).get("email") == recruiter_email
            ]
            if filtered:
                print(f"✅ Filtered to {len(filtered)} jobs for {recruiter_email}")
                return JSONResponse(status_code=200, content=filtered)
            print(f"⚠️  Email filter matched 0 — returning all {len(all_jobs)} jobs")

        return JSONResponse(status_code=200, content=all_jobs)
 
@app.get("/proxy/jobs/{job_id}/applications")
async def proxy_applications(job_id: str, request: Request):
    async with httpx.AsyncClient(timeout=30) as hc:
        r = await hc.get(f"{UPPLY_API_BASE}/jobs/{job_id}/applications",
                         headers=_proxy_headers(request))
    return JSONResponse(status_code=r.status_code, content=_safe_json(r))
 
@app.get("/proxy/jobs/{job_id}")
async def proxy_job_detail(job_id: str, request: Request):
    async with httpx.AsyncClient(timeout=30) as hc:
        r = await hc.get(f"{UPPLY_API_BASE}/jobs/{job_id}", headers=_proxy_headers(request))
    return JSONResponse(status_code=r.status_code, content=_safe_json(r))


@app.get("/proxy/applications/{application_id}/resume/download")
async def proxy_application_resume(application_id: str, request: Request):
    """Stream the candidate's CV PDF from Upply to the caller."""
    async with httpx.AsyncClient(timeout=30) as hc:
        r = await hc.get(
            f"{UPPLY_API_BASE}/applications/{application_id}/resume/download",
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, f"Upply CV download failed: {r.status_code}")
    return StreamingResponse(
        io.BytesIO(r.content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=cv_{application_id}.pdf"},
    )
 
@app.post("/recruiter/notify-invited")
async def notify_invited(request: Request):
    body            = await request.json()
    upply_jwt       = body.get("token", "")
    application_ids = body.get("application_ids", [])
 
    if not application_ids:
        raise HTTPException(400, "application_ids required")
 
    results = []
    async with httpx.AsyncClient(timeout=10) as hc:
        headers = {
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {upply_jwt}",
        }
        for app_id in application_ids:
            entry = {"application_id": app_id, "status_patched": False, "email_triggered": False}
            try:
                r = await hc.patch(
                    f"{UPPLY_API_BASE}/applications/{app_id}/status",
                    json={"status": "INVITED"}, headers=headers)
                entry["status_patched"] = r.is_success
            except Exception as e:
                print(f"⚠️ PATCH INVITED {app_id} exception: {e}")
            try:
                r2 = await hc.post(
                    f"{UPPLY_API_BASE}/applications/{app_id}/send-interview",
                    json={}, headers=headers)
                entry["email_triggered"] = r2.is_success
            except Exception as e:
                print(f"⚠️ send-interview {app_id} exception: {e}")
            results.append(entry)
 
    return {"ok": True, "results": results}
 
@app.get("/recruiter/sessions")
def list_sessions(job_id: str = ""):
    if job_id:
        rows = db_all("SELECT * FROM interview_sessions WHERE job_id=%s ORDER BY created_at DESC", (job_id,))
    else:
        rows = db_all("SELECT * FROM interview_sessions ORDER BY created_at DESC")
    return {"ok": True, "sessions": [dict(r) for r in rows]}
 
@app.get("/recruiter/session/{token}/results")
def session_results(token: str):
    sess = db_get("SELECT * FROM interview_sessions WHERE token=%s", (token,))
    if not sess: raise HTTPException(404, "Session not found")
    rows   = db_all("SELECT * FROM interview_results WHERE session_token=%s ORDER BY question_index", (token,))
    scores = [r["score"] for r in rows if r["score"]]
    avg    = round(sum(scores)/len(scores), 1) if scores else 0
    return {"ok": True, "session": dict(sess), "results": [dict(r) for r in rows],
            "summary": {"avg_score": avg, "best": max(scores,default=0),
                        "worst": min(scores,default=0),
                        "strong": sum(1 for s in scores if s>=7), "total": len(rows)}}
 
@app.post("/recruiter/login")
async def recruiter_login(request: Request):
    body = await request.json()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                f"{UPPLY_API_BASE}/auth/login",
                json={"email": body.get("email"), "password": body.get("password")},
                headers={"Content-Type": "application/json"}
            )
        return JSONResponse(status_code=res.status_code, content=res.json())
    except Exception as e:
        raise HTTPException(500, str(e))
