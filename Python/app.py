

from __future__ import annotations

import io
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from PIL import Image

from chatbot_engine import SimpleChatbot, ChatRequest, ChatResponse
from quality_scorer import CropQualityScorer, CropAIScoreResponse


# =========================
# Configuration
# =========================

class Settings(BaseModel):
    """Application-level configuration."""
    max_image_size_bytes: int = 5 * 1024 * 1024   # 5 MB
    allowed_image_types: List[str] = Field(default_factory=lambda: [
        "image/jpeg",
        "image/png",
        "image/webp",
    ])
    # This path is shown as an example if you want to load a real model.
    crop_model_path: Optional[str] = None


settings = Settings()


class ImageScoreRequest(BaseModel):
    """
    Request model used by the existing React frontend helper `apiPythonScore`.

    The frontend sends a JSON body: { "image": "<data-url>" }
    where image is a Data URL (e.g. "data:image/jpeg;base64,...").
    """
    image: str


class FrontendChatRequest(BaseModel):
    question: str
    userId: Optional[int] = None
    crops: Optional[List[Dict[str, Any]]] = None


# Initialize shared services
crop_scorer = CropQualityScorer(model_path=settings.crop_model_path)
chatbot = SimpleChatbot()


# =========================
# FastAPI Application Setup
# =========================

app = FastAPI(
    title="Agri AI Backend",
    description=(
        "Backend service for farmer crop image AI scoring and consumer dashboard chatbot."
    ),
    version="1.0.0",
)

# CORS configuration so your web front-ends (farmer portal and consumer dashboard)
# can call these APIs from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your actual front-end domains.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Farmer: Upload Crop Image
# =========================

@app.post(
    "/farmer/upload-crop-image",
    response_model=CropAIScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload crop image and get AI score",
    tags=["Farmer"],
)
async def upload_crop_image(
    file: UploadFile = File(..., description="Crop image file (JPEG/PNG/WEBP)."),
    farmer_id: Optional[str] = Form(
        default=None,
        description="Optional farmer identifier, if you want to log/link scores."
    ),
) -> CropAIScoreResponse:
    """
    Endpoint to upload a crop image and receive an AI quality/health score.

    This is intended to be used from the 'Farmers Upload Crop' section of your UI.
    """
    # Validate file type
    if file.content_type not in settings.allowed_image_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Allowed types: {settings.allowed_image_types}",
        )

    # Validate file size
    data = await file.read()
    if len(data) > settings.max_image_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size is {settings.max_image_size_bytes // (1024 * 1024)} MB.",
        )

    # Load image
    try:
        image = Image.open(io.BytesIO(data))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file. Error: {exc}",
        ) from exc

    # Compute AI score
    score_response = crop_scorer.score_image(image)

    # You can store farmer_id and score_response in your database here if needed.

    return score_response


# =========================
# Frontend Integration: /score (JSON, base64 image)
# =========================

@app.post(
    "/score",
    status_code=status.HTTP_200_OK,
    tags=["Python-Frontend"],
)
async def score_image_frontend(payload: ImageScoreRequest) -> Dict[str, Any]:
    """
    Endpoint that matches the existing React helper `apiPythonScore`:

    Frontend sends:
        POST { PYTHON_API_BASE_URL }/score
        Body: { "image": "<data-url-base64>" }

    We:
    - Decode the Data URL
    - Run the AI scorer
    - Return { ai_score, quality_label, details }
    """
    if not payload.image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'image' is required.",
        )

    # Expect a Data URL: "data:image/xxx;base64,AAAA..."
    if "," in payload.image:
        header, b64_data = payload.image.split(",", 1)
    else:
        # If frontend sends only raw base64, still try to decode
        b64_data = payload.image

    try:
        import base64

        binary = base64.b64decode(b64_data)
        image = Image.open(io.BytesIO(binary))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid base64 image data: {exc}",
        ) from exc

    score = crop_scorer.score_image(image)

    return {
        "ai_score": score.score,
        "quality_label": score.quality_label,
        "details": score.details,
    }


# =========================
# Consumer: Chatbot Endpoint
# =========================

@app.post(
    "/consumer/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with agriculture assistant chatbot",
    tags=["Consumer"],
)
async def consumer_chat(
    payload: ChatRequest,
) -> ChatResponse:
    """
    Endpoint used by the consumer dashboard chatbot.

    The frontend should maintain and send back `session_id` to preserve context.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message must not be empty.",
        )

    response = chatbot.handle_message(session_id=payload.session_id, message=payload.message)
    return response


# =========================
# Frontend Integration: /chat (JSON, question + userId)
# =========================

@app.post(
    "/chat",
    status_code=status.HTTP_200_OK,
    tags=["Python-Frontend"],
)
async def chat_frontend(
    payload: FrontendChatRequest,
) -> Dict[str, Any]:
    """
    Endpoint that matches the existing React helper `apiPythonChat`.

    Frontend sends:
        POST { PYTHON_API_BASE_URL }/chat
        Body: { "question": "...", "userId": 123 }

    We call the internal chatbot and adapt the response shape:
        { "reply": "...", "products": [] }
    """
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'question' must not be empty.",
        )

    # Use userId to create a stable session, if provided
    session_id: Optional[str]
    if payload.userId is not None:
        session_id = f"user_{payload.userId}"
    else:
        session_id = None

    chat_resp = chatbot.handle_message(session_id=session_id, message=question)

    # Optional: search crops by AI score when user asks for products above a threshold
    products: List[Dict[str, Any]] = []
    crops_payload = payload.crops or []
    text = question.lower()

    if "ai score" in text and any(word in text for word in ["above", "greater than", "more than", "higher than"]):
        import re

        match = re.search(r"(\d+)", text)
        threshold = float(match.group(1)) if match else 85.0

        for item in crops_payload:
            try:
                score = float(item.get("aiScore", 0))
            except (TypeError, ValueError):
                continue

            if score >= threshold:
                products.append(
                    {
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "location": item.get("location"),
                        "aiScore": score,
                        "aiVerdict": item.get("aiVerdict"),
                        "harvestDate": item.get("harvestDate"),
                        "invCode": item.get("invCode"),
                    }
                )

        if products:
            names = ", ".join(p.get("name") for p in products if p.get("name"))
            chat_reply = (
                f"Here are the products with AI score above {int(threshold)}: {names}."
            )
        else:
            chat_reply = (
                f"I could not find any products with AI score above {int(threshold)}."
            )
    else:
        chat_reply = chat_resp.reply

    return {
        "reply": chat_reply,
        "products": products,
    }


# =========================
# Health Check & Root
# =========================

@app.get("/", tags=["System"])
async def root() -> JSONResponse:
    return JSONResponse(
        content={
            "status": "ok",
            "service": "Agri AI Backend",
            "message": "Use /docs for API documentation.",
        }
    )


@app.get("/health", tags=["System"])
async def health_check() -> JSONResponse:
    return JSONResponse(
        content={
            "status": "healthy",
            "uptime": "unknown (no stateful uptime stored)",
        }
    )


# =========================
# Optional: Entry Point
# =========================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
    )