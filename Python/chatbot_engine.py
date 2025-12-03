from __future__ import annotations

import time
import uuid
from typing import List, Optional, Dict

from pydantic import BaseModel


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: float


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    context: List[ChatMessage]


class SimpleChatbot:
    """
    A simple rule-based chatbot with basic intent detection and context.

    You can later replace the intent logic with a more advanced NLP
    model or an external LLM API. The structure is designed to be
    easily replaceable without changing the API layer.
    """

    def __init__(self) -> None:
        # In-memory conversation storage: session_id -> list[ChatMessage]
        self.sessions: Dict[str, List[ChatMessage]] = {}

    def handle_message(self, session_id: Optional[str], message: str) -> ChatResponse:
        # Initialize or reuse session
        if not session_id:
            session_id = self._create_session_id()

        if session_id not in self.sessions:
            self.sessions[session_id] = []

        timestamp = time.time()
        user_msg = ChatMessage(role="user", content=message.strip(), timestamp=timestamp)
        self.sessions[session_id].append(user_msg)

        intent = self._detect_intent(message)
        reply_text = self._generate_reply(intent=intent, user_message=message, session_id=session_id)

        bot_msg = ChatMessage(role="assistant", content=reply_text, timestamp=time.time())
        self.sessions[session_id].append(bot_msg)

        return ChatResponse(
            session_id=session_id,
            reply=reply_text,
            context=self.sessions[session_id][-10:],  # return last N messages
        )

    def _create_session_id(self) -> str:
        return f"chat_{uuid.uuid4().hex}"

    @staticmethod
    def _detect_intent(message: str) -> str:
        """
        Very simple keyword-based intent detection.
        You can replace this with ML/NLP-based intent classification later.
        """
        text = message.lower()

        # Specific intents for FarmChainX
        if "farmchainx" in text and ("what is" in text or "about" in text):
            return "about_farmchainx"

        # Order of checks matters; more specific first.
        if any(word in text for word in ["price", "cost", "rate", "sell", "market"]):
            return "market_info"
        if any(word in text for word in ["disease", "pest", "infection", "spot", "leaf"]):
            return "crop_disease"
        if any(word in text for word in ["water", "irrigation", "rain", "drought"]):
            return "irrigation"
        if any(word in text for word in ["fertilizer", "nutrient", "manure", "urea"]):
            return "fertilizer"
        if any(word in text for word in ["hello", "hi", "hey"]):
            return "greeting"
        if any(word in text for word in ["thanks", "thank you"]):
            return "gratitude"

        return "general"

    def _generate_reply(self, intent: str, user_message: str, session_id: str) -> str:
        """
        Generate a reply based on intent and limited context.
        """
        context = self.sessions.get(session_id, [])

        if intent == "greeting":
            # Custom greeting as requested
            return "Hello , Welcome to FarmChainX"

        if intent == "about_farmchainx":
            return (
                "FarmChainX is a crop traceability platform used to track produce "
                "end-to-end across the supply chain."
            )

        if intent == "gratitude":
            return "You’re welcome! Let me know if you have any more questions."

        if intent == "market_info":
            return (
                "Market prices can vary based on location and season. "
                "For accurate rates, please check your local mandi or government agriculture portal. "
                "If you tell me the crop and your region, I can give more specific guidance."
            )

        if intent == "crop_disease":
            return (
                "To assess crop diseases, please closely inspect leaves and stems for spots, discoloration, "
                "or unusual patterns. If possible, upload a clear image via the farmer crop upload section "
                "so that the AI score and health analysis can help you decide the next steps."
            )

        if intent == "irrigation":
            return (
                "For irrigation, follow recommended schedules based on your crop type, soil, and climate. "
                "Avoid over-watering to prevent root rot, and use soil moisture checks where possible."
            )

        if intent == "fertilizer":
            return (
                "Fertilizer requirements depend on soil tests and crop stage. "
                "Use balanced NPK based on recommendations, and avoid overuse to protect soil health."
            )

        # Very simple context use: if last user message asked about 'score'
        if any("score" in m.content.lower() for m in context if m.role == "user"):
            return (
                "The AI score is a value between 0 and 100 that estimates crop quality or health. "
                "Higher scores mean healthier crops. It is calculated from visual features of the uploaded image."
            )

        # Default general fallback
        return (
            "I understand your question, but I don’t have a specific answer for that yet. "
            "You can ask me about crop health, market prices, irrigation, or fertilizer recommendations."
        )


