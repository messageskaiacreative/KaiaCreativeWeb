# ============================================================
# PDF-to-Text Extraction Worker — FastAPI
# Phase 2: Processing Engine
# ============================================================

import os
import io
import logging
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client, Client

# ============================================================
# Configuration
# ============================================================
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")
STORAGE_BUCKET = "documents"

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pdf-worker")

# ============================================================
# FastAPI App
# ============================================================
app = FastAPI(
    title="PDF Extraction Worker",
    description="Async PDF-to-Markdown extraction microservice",
    version="1.0.0",
)

security = HTTPBearer()


# ============================================================
# Supabase Client (Service Role — full access)
# ============================================================
def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ============================================================
# Auth Dependency — Verify Bearer Token
# ============================================================
async def verify_webhook_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if credentials.credentials != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
    return credentials


# ============================================================
# Request Schema
# ============================================================
class WebhookPayload(BaseModel):
    id: str
    user_id: str
    file_path: str


# ============================================================
# Extraction Logic
# ============================================================
def extract_pdf_to_markdown(pdf_bytes: bytes, filename: str) -> str:
    """
    Extract PDF to Markdown. Tries Docling first, falls back to PyMuPDF.
    """
    markdown = ""

    # --- Strategy 1: Docling (best quality) ---
    try:
        from docling.document_converter import DocumentConverter

        logger.info(f"[{filename}] Attempting extraction with Docling...")

        # Write to temp file (Docling requires file path)
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        try:
            converter = DocumentConverter()
            result = converter.convert(tmp_path)
            markdown = result.document.export_to_markdown()

            if markdown and len(markdown.strip()) > 10:
                logger.info(f"[{filename}] Docling extraction success: {len(markdown)} chars")
                return markdown
            else:
                logger.warning(f"[{filename}] Docling returned empty/short result, trying fallback")
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    except ImportError:
        logger.warning("Docling not installed, using PyMuPDF fallback")
    except Exception as e:
        logger.warning(f"[{filename}] Docling failed: {e}, trying fallback")

    # --- Strategy 2: PyMuPDF (fitz) Fallback ---
    try:
        import fitz  # PyMuPDF

        logger.info(f"[{filename}] Extracting with PyMuPDF...")

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = []

        for page_num, page in enumerate(doc, 1):
            text = page.get_text("text")
            if text.strip():
                pages.append(f"## Page {page_num}\n\n{text.strip()}")

            # Extract tables if available
            try:
                tables = page.find_tables()
                for table in tables:
                    df = table.to_pandas()
                    if not df.empty:
                        # Convert DataFrame to Markdown table
                        md_table = df.to_markdown(index=False)
                        pages.append(f"\n{md_table}\n")
            except Exception:
                pass  # Table extraction not critical

        doc.close()
        markdown = "\n\n---\n\n".join(pages)

        if markdown:
            logger.info(f"[{filename}] PyMuPDF extraction success: {len(markdown)} chars")
            return markdown

    except ImportError:
        logger.error("Neither Docling nor PyMuPDF available!")
    except Exception as e:
        logger.error(f"[{filename}] PyMuPDF failed: {e}")

    if not markdown:
        raise RuntimeError(f"All extraction methods failed for {filename}")

    return markdown


# ============================================================
# Background Task — Process Extraction Job
# ============================================================
async def process_extraction_job(payload: WebhookPayload):
    """
    Background task that:
    1. Updates status to 'processing'
    2. Downloads PDF from Supabase Storage
    3. Extracts text to Markdown
    4. Updates status to 'completed' with result
    5. On error, updates status to 'failed'
    """
    supabase = get_supabase()
    extraction_id = payload.id

    try:
        # Step 1: Mark as processing
        logger.info(f"[{extraction_id}] Starting extraction...")
        supabase.table("extractions").update(
            {"status": "processing"}
        ).eq("id", extraction_id).execute()

        # Step 2: Download PDF from Storage
        logger.info(f"[{extraction_id}] Downloading: {payload.file_path}")
        file_response = supabase.storage.from_(STORAGE_BUCKET).download(payload.file_path)

        if not file_response:
            raise RuntimeError(f"Failed to download file: {payload.file_path}")

        pdf_bytes = file_response
        filename = Path(payload.file_path).name
        logger.info(f"[{extraction_id}] Downloaded {len(pdf_bytes)} bytes")

        # Step 3: Extract PDF to Markdown
        markdown = extract_pdf_to_markdown(pdf_bytes, filename)

        # Step 4: Update as completed
        supabase.table("extractions").update({
            "status": "completed",
            "extracted_markdown": markdown,
        }).eq("id", extraction_id).execute()

        logger.info(f"[{extraction_id}] ✅ Extraction completed ({len(markdown)} chars)")

    except Exception as e:
        # Step 5: Mark as failed
        error_msg = str(e)[:500]  # Truncate long errors
        logger.error(f"[{extraction_id}] ❌ Extraction failed: {error_msg}")

        try:
            supabase.table("extractions").update({
                "status": "failed",
                "error_message": error_msg,
            }).eq("id", extraction_id).execute()
        except Exception as update_err:
            logger.error(f"[{extraction_id}] Failed to update error status: {update_err}")


# ============================================================
# API Endpoints
# ============================================================
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "ok", "service": "pdf-extraction-worker"}


@app.post("/process-webhook")
async def receive_webhook(
    payload: WebhookPayload,
    background_tasks: BackgroundTasks,
    _: HTTPAuthorizationCredentials = Depends(verify_webhook_token),
):
    """
    Receive extraction webhook from Supabase.
    Returns 200 immediately, processes in background.
    """
    logger.info(f"Received webhook for extraction: {payload.id}")

    # Validate payload
    if not payload.id or not payload.file_path:
        raise HTTPException(status_code=400, detail="Missing id or file_path")

    # Queue background processing
    background_tasks.add_task(process_extraction_job, payload)

    return {
        "status": "accepted",
        "extraction_id": payload.id,
        "message": "Processing queued",
    }


# ============================================================
# Startup / Shutdown Events
# ============================================================
@app.on_event("startup")
async def startup():
    logger.info("🚀 PDF Extraction Worker started")
    if not SUPABASE_URL:
        logger.warning("⚠️  SUPABASE_URL not set!")
    if not WEBHOOK_SECRET:
        logger.warning("⚠️  WEBHOOK_SECRET not set!")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
