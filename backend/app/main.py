"""
SMART V.I.S.I.O.N. Backend API
"""

from __future__ import annotations
from typing import Any
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.core.security import create_access_token
from app.models.schemas import (
    LoginRequest,
    TokenResponse,
    AccountIn,
    AccountOut,
    TaskIn,
    InteractionIn,
    ContactIn,
    ChannelConnectionIn,
    AgentRunResponse,
)
from app.api.deps import get_current_user
from app.services import store
from app.services import agent as agent_service
from app.services.gmail_oauth import build_auth_url, exchange_code_for_tokens, get_gmail_profile

app = FastAPI(title="SMART V.I.S.I.O.N. API", version="4.0.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    # seed demo accounts for Bruno
    user = store.USERS.get("brunobbs1982@gmail.com")
    if user:
        store.seed_demo_accounts(user)


@app.get("/health")
def health():
    return {"status": "ok", "service": "smart-vision-crm"}


# ---------- Auth ----------
@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = store.authenticate(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    token = create_access_token(user["email"], {"role": user["role"], "uid": user["id"]})
    return TokenResponse(access_token=token, user=user)


@app.get("/api/v1/me")
def me(user: dict = Depends(get_current_user)):
    return user


# ---------- Accounts ----------
@app.get("/api/v1/accounts")
def list_accounts(user: dict = Depends(get_current_user)):
    return store.list_accounts()


@app.get("/api/v1/accounts/{account_id}")
def get_account(account_id: str, user: dict = Depends(get_current_user)):
    acc = store.get_account(account_id)
    if not acc:
        raise HTTPException(404, "Conta não encontrada")
    return acc


@app.post("/api/v1/accounts")
def create_account(body: AccountIn, user: dict = Depends(get_current_user)):
    return store.create_account(body.model_dump(), user)


@app.patch("/api/v1/accounts/{account_id}")
def patch_account(account_id: str, body: dict[str, Any], user: dict = Depends(get_current_user)):
    acc = store.update_account(account_id, body)
    if not acc:
        raise HTTPException(404, "Conta não encontrada")
    return acc


@app.delete("/api/v1/accounts/{account_id}")
def remove_account(account_id: str, user: dict = Depends(get_current_user)):
    if not store.delete_account(account_id):
        raise HTTPException(404, "Conta não encontrada")
    return {"ok": True}


@app.post("/api/v1/accounts/{account_id}/tasks")
def add_task(account_id: str, body: TaskIn, user: dict = Depends(get_current_user)):
    data = body.model_dump()
    data["ownerEmail"] = data.get("ownerEmail") or user["email"]
    data["ownerName"] = data.get("ownerName") or user["name"]
    acc = store.add_task(account_id, data)
    if not acc:
        raise HTTPException(404, "Conta não encontrada")
    return acc


@app.post("/api/v1/accounts/{account_id}/tasks/{task_id}/toggle")
def toggle_task(account_id: str, task_id: str, user: dict = Depends(get_current_user)):
    acc = store.toggle_task(account_id, task_id)
    if not acc:
        raise HTTPException(404, "Conta/tarefa não encontrada")
    return acc


@app.post("/api/v1/accounts/{account_id}/interactions")
def add_interaction(account_id: str, body: InteractionIn, user: dict = Depends(get_current_user)):
    acc = store.add_interaction(account_id, body.model_dump())
    if not acc:
        raise HTTPException(404, "Conta não encontrada")
    return acc


@app.post("/api/v1/accounts/{account_id}/contacts")
def add_contact(account_id: str, body: ContactIn, user: dict = Depends(get_current_user)):
    acc = store.add_contact(account_id, body.model_dump())
    if not acc:
        raise HTTPException(404, "Conta não encontrada")
    return acc


# ---------- Channels ----------
@app.get("/api/v1/channels")
def list_channels(user: dict = Depends(get_current_user)):
    return store.list_connections(user["id"])


@app.post("/api/v1/channels")
def create_channel(body: ChannelConnectionIn, user: dict = Depends(get_current_user)):
    return store.upsert_connection(user["id"], body.model_dump())


@app.delete("/api/v1/channels/{conn_id}")
def delete_channel(conn_id: str, user: dict = Depends(get_current_user)):
    if not store.remove_connection(conn_id, user["id"]):
        raise HTTPException(404, "Conexão não encontrada")
    return {"ok": True}


# ---------- Gmail OAuth ----------
@app.get("/api/v1/channels/gmail/oauth/start")
def gmail_oauth_start(user: dict = Depends(get_current_user)):
    """
    Inicia OAuth Google. Se GOOGLE_CLIENT_ID não estiver configurado,
    registra conexão demo e devolve mode=demo.
    """
    if not settings.google_client_id or not settings.google_client_secret:
        conn = store.upsert_connection(
            user["id"],
            {
                "channel": "gmail",
                "provider": "api",
                "displayName": user["email"],
                "metadata": {"mode": "demo", "email": user["email"]},
            },
        )
        return {
            "mode": "demo",
            "message": "GOOGLE_CLIENT_ID não configurado. Conexão demo criada para brunobbs1982@gmail.com.",
            "connection": conn,
            "authUrl": None,
        }

    url = build_auth_url(
        client_id=settings.google_client_id,
        redirect_uri=settings.google_redirect_uri,
        state=user["id"],
    )
    return {"mode": "oauth", "authUrl": url}


@app.get("/api/v1/channels/gmail/oauth/callback")
def gmail_oauth_callback(code: str = Query(...), state: str = Query(...)):
    """Callback do Google. state = userId."""
    if not settings.google_client_id:
        return RedirectResponse(f"{settings.frontend_url}?gmail=error&reason=not_configured")

    try:
        tokens = exchange_code_for_tokens(
            code=code,
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            redirect_uri=settings.google_redirect_uri,
        )
        profile = get_gmail_profile(tokens.get("access_token", ""))
        email = profile.get("email", "brunobbs1982@gmail.com")
        store.GMAIL_TOKENS[state] = tokens
        store.upsert_connection(
            state,
            {
                "channel": "gmail",
                "provider": "api",
                "displayName": email,
                "metadata": {
                    "email": email,
                    "has_refresh": bool(tokens.get("refresh_token")),
                },
            },
        )
        return RedirectResponse(f"{settings.frontend_url}?gmail=connected")
    except Exception as e:
        return RedirectResponse(f"{settings.frontend_url}?gmail=error&reason={str(e)[:80]}")


# ---------- Agent ----------
@app.post("/api/v1/agent/run-cycle", response_model=AgentRunResponse)
def run_agent_cycle(user: dict = Depends(get_current_user)):
    results = agent_service.run_cycle()
    return AgentRunResponse(processed=len(results), results=results)


@app.post("/api/v1/agent/handoff/{account_id}/accept")
def accept_handoff(account_id: str, user: dict = Depends(get_current_user)):
    acc = store.update_account(
        account_id,
        {"agentStatus": "paused", "agentEnabled": False},
    )
    if not acc:
        raise HTTPException(404, "Conta não encontrada")
    return acc


@app.post("/api/v1/agent/handoff/{account_id}/continue")
def continue_agent(account_id: str, user: dict = Depends(get_current_user)):
    acc = store.update_account(
        account_id,
        {
            "agentStatus": "follow_up",
            "agentEnabled": True,
            "handoffNotes": None,
            "handoffRequestedAt": None,
        },
    )
    if not acc:
        raise HTTPException(404, "Conta não encontrada")
    return acc
