from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Any
import uuid

from app.services import store


def _id() -> str:
    return f"dec-{uuid.uuid4().hex[:8]}"


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def plan_next_action(acc: dict[str, Any]) -> dict[str, Any] | None:
    if not acc.get("agentEnabled"):
        return None
    if acc.get("agentStatus") in ("handoff_ready", "paused", "completed"):
        return None
    if acc.get("status") in ("ativo", "desativado"):
        return None

    contacts = acc.get("contacts") or []
    contact = contacts[0] if contacts else None
    interactions = acc.get("interactions") or []
    today = _today()

    positive = any(
        any(k in f"{i.get('outcome','')} {i.get('summary','')}".lower() for k in
            ("interessad", "reuni", "proposta", "demo", "agendar"))
        for i in interactions
    )

    if positive and acc.get("stage") != "fechamento":
        return {
            "accountId": acc["id"],
            "newStatus": "handoff_ready",
            "handoffNotes": (
                f"Interesse detectado em {acc['name']}. "
                f"Contato: {(contact or {}).get('name', '—')}. "
                "Sugerido: agendar conversa e enviar pauta."
            ),
            "decisions": [{
                "id": _id(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reasoning": "Sinal de interesse nas interações.",
                "action": "request_handoff",
                "executed": True,
            }],
        }

    next_date = acc.get("nextDate") or ""
    at_risk = (acc.get("status") in ("lead", "prospect")) and (not next_date or next_date <= today)

    if at_risk and contact:
        channel = "WhatsApp" if contact.get("phone") else ("E-mail" if contact.get("email") else "LinkedIn")
        draft = (
            f"Olá {contact.get('name','').split(' ')[0] or ''}, "
            f"retomando nosso contato sobre {acc.get('product') or 'nossa solução'} "
            f"para {acc['name']}. Posso te enviar um resumo objetivo?"
        )
        return {
            "accountId": acc["id"],
            "newStatus": "messaging",
            "interaction": {
                "channel": channel,
                "outcome": "Follow-up automático enviado",
                "summary": draft,
                "date": today,
                "createdByAgent": True,
            },
            "decisions": [{
                "id": _id(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reasoning": f"Conta em risco. Follow-up via {channel}.",
                "action": "send_message",
                "channel": channel,
                "messageDraft": draft,
                "executed": True,
            }],
        }

    if not interactions and contact:
        channel = "E-mail" if contact.get("email") else ("WhatsApp" if contact.get("phone") else "LinkedIn")
        draft = (
            f"Olá {contact.get('name','').split(' ')[0]}, sou Bruno da Ciamakers. "
            f"Vi a {acc['name']} e acredito que {acc.get('product') or 'nossa solução'} "
            f"pode ajudar o time comercial. Faz sentido uma conversa rápida?"
        )
        return {
            "accountId": acc["id"],
            "newStatus": "waiting_response",
            "interaction": {
                "channel": channel,
                "outcome": "1º Contato Enviado",
                "summary": draft,
                "date": today,
                "createdByAgent": True,
            },
            "decisions": [{
                "id": _id(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reasoning": f"Sem histórico. 1º contato via {channel}.",
                "action": "send_message",
                "channel": channel,
                "messageDraft": draft,
                "executed": True,
            }],
        }

    return {
        "accountId": acc["id"],
        "newStatus": "waiting_response",
        "decisions": [{
            "id": _id(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reasoning": "Nenhuma ação urgente.",
            "action": "wait",
            "executed": True,
        }],
    }


def run_cycle() -> list[dict[str, Any]]:
    results = []
    for acc in list(store.ACCOUNTS.values()):
        if not acc.get("agentEnabled"):
            continue
        if acc.get("status") not in ("lead", "prospect"):
            continue
        plan = plan_next_action(acc)
        if not plan:
            continue

        if plan.get("newStatus") == "handoff_ready":
            store.update_account(acc["id"], {
                "agentStatus": "handoff_ready",
                "handoffRequestedAt": datetime.now(timezone.utc).isoformat(),
                "handoffNotes": plan.get("handoffNotes"),
                "lastAgentRunAt": datetime.now(timezone.utc).isoformat(),
            })
        else:
            patch: dict[str, Any] = {
                "agentStatus": plan.get("newStatus", "waiting_response"),
                "lastAgentRunAt": datetime.now(timezone.utc).isoformat(),
            }
            if plan.get("interaction"):
                store.add_interaction(acc["id"], plan["interaction"])
                nxt = datetime.now(timezone.utc).date() + timedelta(days=2)
                patch["nextAction"] = plan["interaction"]["outcome"]
                patch["nextDate"] = nxt.isoformat()
            store.update_account(acc["id"], patch)

        results.append(plan)
    return results
