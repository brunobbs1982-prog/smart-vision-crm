"""
Gmail OAuth + helpers.
Configure no .env:
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/channels/gmail/oauth/callback
"""

from __future__ import annotations
from urllib.parse import urlencode
from typing import Any
import httpx

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
]


def build_auth_url(client_id: str, redirect_uri: str, state: str) -> str:
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def exchange_code_for_tokens(
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> dict[str, Any]:
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    with httpx.Client(timeout=30) as client:
        r = client.post("https://oauth2.googleapis.com/token", data=data)
        r.raise_for_status()
        return r.json()


def get_gmail_profile(access_token: str) -> dict[str, Any]:
    with httpx.Client(timeout=20) as client:
        r = client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        r.raise_for_status()
        return r.json()


def send_gmail(
    access_token: str,
    to: str,
    subject: str,
    body: str,
    from_email: str,
) -> str:
    """Envia e-mail via Gmail API. Retorna message id."""
    import base64
    from email.mime.text import MIMEText

    message = MIMEText(body, "plain", "utf-8")
    message["to"] = to
    message["from"] = from_email
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

    with httpx.Client(timeout=30) as client:
        r = client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={"raw": raw},
        )
        r.raise_for_status()
        return r.json().get("id", "")
