from pydantic import BaseModel, Field, EmailStr
from typing import Any, Optional, Literal
from datetime import date

OperationUnitCode = Literal["OP1", "OP2", "OP3"]
AccountStatus = Literal["lead", "prospect", "ativo", "desativado"]
FunnelStageId = Literal[
    "nutricao", "mapeamento", "abordagem", "apresentacao", "negociacao", "fechamento"
]
AgentStatus = Literal[
    "idle", "researching", "messaging", "waiting_response",
    "follow_up", "handoff_ready", "paused", "completed",
]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


class ContactIn(BaseModel):
    id: Optional[str] = None
    name: str
    role: str = ""
    decisionRole: str = "Não definido"
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    instagram: str = ""
    notes: str = ""


class TaskIn(BaseModel):
    id: Optional[str] = None
    title: str
    type: str = "Follow-up"
    dueDate: str
    contactName: str = ""
    ownerEmail: str = ""
    ownerName: str = ""
    notes: str = ""
    done: bool = False
    completedAt: Optional[str] = None
    createdByAgent: bool = False


class InteractionIn(BaseModel):
    id: Optional[str] = None
    channel: str
    outcome: str
    date: str
    summary: str = ""
    nextAction: Optional[str] = None
    nextDate: Optional[str] = None
    done: Optional[bool] = None
    createdByAgent: bool = False
    messageContent: Optional[str] = None
    externalId: Optional[str] = None


class AccountIn(BaseModel):
    name: str
    cityState: str = ""
    cnpj: Optional[str] = None
    website: Optional[str] = None
    operation: OperationUnitCode = "OP1"
    status: AccountStatus = "lead"
    stage: FunnelStageId = "nutricao"
    product: str = ""
    value: float = 0
    ownerEmail: str = ""
    ownerName: str = ""
    origin: str = "Executivo"
    nextAction: str = ""
    nextDate: str = ""
    notes: str = ""
    contacts: list[ContactIn] = Field(default_factory=list)
    tasks: list[TaskIn] = Field(default_factory=list)
    interactions: list[InteractionIn] = Field(default_factory=list)
    agentEnabled: bool = True
    agentStatus: AgentStatus = "idle"
    linkedinProfileUrl: Optional[str] = None


class AccountOut(AccountIn):
    id: str
    createdAt: str
    updatedAt: str
    lastAgentRunAt: Optional[str] = None
    nextAgentCheckAt: Optional[str] = None
    handoffRequestedAt: Optional[str] = None
    handoffNotes: Optional[str] = None


class ChannelConnectionIn(BaseModel):
    channel: Literal["gmail", "whatsapp", "linkedin"]
    provider: Literal["api", "browser", "connector", "manual"] = "api"
    displayName: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChannelConnectionOut(ChannelConnectionIn):
    id: str
    userId: str
    status: str
    createdAt: str
    updatedAt: str
    lastUsedAt: Optional[str] = None


class AgentRunResponse(BaseModel):
    processed: int
    results: list[dict[str, Any]]
