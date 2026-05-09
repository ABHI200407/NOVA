from pydantic import BaseModel
from typing import Literal, Optional

class ClientMessage(BaseModel):
    type: Literal["message", "approval", "setting_update"]
    content: str
    metadata: Optional[dict] = None

class AgentMessage(BaseModel):
    type: Literal["message", "thought", "tool_execution", "diff", "approval_request", "error"]
    content: str
    metadata: Optional[dict] = None
