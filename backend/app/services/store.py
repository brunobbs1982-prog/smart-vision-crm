"""
Store em memória para desenvolvimento.
Trocar por SQLAlchemy + PostgreSQL em produção.
"""

from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Any
from copy import deepcopy

from app.core.security import hash_password, verify_password


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


# --- Seed user ---
USERS: dict[str, dict[str, Any]] = {
    "brunobbs1982@gmail.com": {
        "id": "user-bruno-001",
        "email": "brunobbs1982@gmail.com",
        "name": "Bruno Salomão",
        "role": "admin",
        "phone": "+55 19 99999-0001",
        "password_hash": hash_password("123456"),
        "isActive": True,
        "createdAt": "2025-01-01T00:00:00+00:00",
    }
}

ACCOUNTS: dict[str, dict[str, Any]] = {}
CONNECTIONS: dict[str, dict[str, Any]] = {}
# Gmail tokens por userId
GMAIL_TOKENS: dict[str, dict[str, Any]] = {}


def authenticate(email: str, password: str) -> dict[str, Any] | None:
    user = USERS.get(email.lower())
    if not user or not user.get("isActive"):
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    public = {k: v for k, v in user.items() if k != "password_hash"}
    return public


def list_accounts(owner_email: str | None = None) -> list[dict[str, Any]]:
    items = list(ACCOUNTS.values())
    if owner_email:
        items = [a for a in items if a.get("ownerEmail") == owner_email]
    return sorted(items, key=lambda a: a.get("updatedAt", ""), reverse=True)


def get_account(account_id: str) -> dict[str, Any] | None:
    return deepcopy(ACCOUNTS.get(account_id))


def create_account(data: dict[str, Any], owner: dict[str, Any]) -> dict[str, Any]:
    aid = _id("acc")
    now = _now()
    account = {
        **data,
        "id": aid,
        "ownerEmail": data.get("ownerEmail") or owner["email"],
        "ownerName": data.get("ownerName") or owner["name"],
        "contacts": data.get("contacts") or [],
        "tasks": data.get("tasks") or [],
        "interactions": data.get("interactions") or [],
        "agentEnabled": data.get("agentEnabled", True),
        "agentStatus": data.get("agentStatus", "idle"),
        "createdAt": now,
        "updatedAt": now,
    }
    # ensure contact/task ids
    for c in account["contacts"]:
        c.setdefault("id", _id("ct"))
    for t in account["tasks"]:
        t.setdefault("id", _id("task"))
    for i in account["interactions"]:
        i.setdefault("id", _id("int"))
    ACCOUNTS[aid] = account
    return deepcopy(account)


def update_account(account_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    acc = ACCOUNTS.get(account_id)
    if not acc:
        return None
    for k, v in patch.items():
        if k in ("id", "createdAt"):
            continue
        if v is not None:
            acc[k] = v
    acc["updatedAt"] = _now()
    return deepcopy(acc)


def delete_account(account_id: str) -> bool:
    return ACCOUNTS.pop(account_id, None) is not None


def add_task(account_id: str, task: dict[str, Any]) -> dict[str, Any] | None:
    acc = ACCOUNTS.get(account_id)
    if not acc:
        return None
    task = {**task, "id": task.get("id") or _id("task")}
    acc["tasks"].append(task)
    pending = sorted([t for t in acc["tasks"] if not t.get("done")], key=lambda t: t.get("dueDate", ""))
    if pending:
        acc["nextAction"] = pending[0]["title"]
        acc["nextDate"] = pending[0]["dueDate"]
    acc["updatedAt"] = _now()
    return deepcopy(acc)


def toggle_task(account_id: str, task_id: str) -> dict[str, Any] | None:
    acc = ACCOUNTS.get(account_id)
    if not acc:
        return None
    for t in acc["tasks"]:
        if t["id"] == task_id:
            t["done"] = not t.get("done", False)
            t["completedAt"] = _now() if t["done"] else None
            break
    pending = sorted([t for t in acc["tasks"] if not t.get("done")], key=lambda t: t.get("dueDate", ""))
    if pending:
        acc["nextAction"] = pending[0]["title"]
        acc["nextDate"] = pending[0]["dueDate"]
    acc["updatedAt"] = _now()
    return deepcopy(acc)


def add_interaction(account_id: str, interaction: dict[str, Any]) -> dict[str, Any] | None:
    acc = ACCOUNTS.get(account_id)
    if not acc:
        return None
    interaction = {**interaction, "id": interaction.get("id") or _id("int")}
    acc["interactions"].insert(0, interaction)
    acc["updatedAt"] = _now()
    return deepcopy(acc)


def add_contact(account_id: str, contact: dict[str, Any]) -> dict[str, Any] | None:
    acc = ACCOUNTS.get(account_id)
    if not acc:
        return None
    contact = {**contact, "id": contact.get("id") or _id("ct")}
    acc["contacts"].append(contact)
    acc["updatedAt"] = _now()
    return deepcopy(acc)


def upsert_connection(user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    existing = next(
        (
            c
            for c in CONNECTIONS.values()
            if c["userId"] == user_id and c["channel"] == data["channel"]
        ),
        None,
    )
    now = _now()
    if existing:
        existing.update({**data, "updatedAt": now, "lastUsedAt": now, "status": "connected"})
        return deepcopy(existing)
    cid = _id("ch")
    conn = {
        "id": cid,
        "userId": user_id,
        "status": "connected",
        "createdAt": now,
        "updatedAt": now,
        "lastUsedAt": now,
        **data,
    }
    CONNECTIONS[cid] = conn
    return deepcopy(conn)


def list_connections(user_id: str) -> list[dict[str, Any]]:
    return [deepcopy(c) for c in CONNECTIONS.values() if c["userId"] == user_id]


def remove_connection(conn_id: str, user_id: str) -> bool:
    c = CONNECTIONS.get(conn_id)
    if not c or c["userId"] != user_id:
        return False
    CONNECTIONS.pop(conn_id)
    return True


def seed_demo_accounts(owner: dict[str, Any]) -> None:
    """Popula 3 contas demo se vazio."""
    if ACCOUNTS:
        return
    demos = [
        {
            "name": "TechNova Soluções",
            "cityState": "São Paulo, SP",
            "operation": "OP1",
            "status": "prospect",
            "stage": "abordagem",
            "product": "Treinamento SPIN Selling Intensivo",
            "value": 8500,
            "origin": "LinkedIn Insight",
            "nextAction": "Enviar proposta de treinamento",
            "nextDate": datetime.now(timezone.utc).date().isoformat(),
            "notes": "Decisor: Maria Silva",
            "contacts": [
                {
                    "id": _id("ct"),
                    "name": "Maria Silva",
                    "role": "Head de Vendas",
                    "decisionRole": "Decisor",
                    "email": "maria.silva@technova.example.com",
                    "phone": "11987654321",
                    "linkedin": "https://linkedin.com/in/mariasilva",
                    "instagram": "",
                    "notes": "",
                }
            ],
            "tasks": [
                {
                    "id": _id("task"),
                    "title": "Enviar proposta de treinamento",
                    "type": "E-mail",
                    "dueDate": datetime.now(timezone.utc).date().isoformat(),
                    "contactName": "Maria Silva",
                    "ownerEmail": owner["email"],
                    "ownerName": owner["name"],
                    "notes": "",
                    "done": False,
                }
            ],
            "interactions": [],
            "agentEnabled": True,
            "agentStatus": "waiting_response",
        },
        {
            "name": "Grupo Horizonte",
            "cityState": "Campinas, SP",
            "operation": "OP2",
            "status": "lead",
            "stage": "mapeamento",
            "product": "Consultoria de Funil Comercial",
            "value": 12000,
            "origin": "Indicação",
            "nextAction": "Mapear decisores",
            "nextDate": datetime.now(timezone.utc).date().isoformat(),
            "notes": "",
            "contacts": [
                {
                    "id": _id("ct"),
                    "name": "Carlos Mendes",
                    "role": "Diretor Comercial",
                    "decisionRole": "Decisor",
                    "email": "carlos@horizonte.example.com",
                    "phone": "19998887766",
                    "linkedin": "https://linkedin.com/in/carlosmendes",
                    "instagram": "",
                    "notes": "",
                }
            ],
            "tasks": [],
            "interactions": [],
            "agentEnabled": True,
            "agentStatus": "idle",
        },
    ]
    for d in demos:
        create_account(d, owner)
