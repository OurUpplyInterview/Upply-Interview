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
  POST /evaluate      → scoring (