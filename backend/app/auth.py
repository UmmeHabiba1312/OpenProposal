import os
from dataclasses import dataclass
from typing import Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

BETTER_AUTH_URL = os.getenv("BETTER_AUTH_URL", "http://localhost:3000")

security = HTTPBearer()
_jwks_cache: dict = {}


@dataclass
class CurrentUser:
    id: str
    email: str
    name: Optional[str] = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if not _jwks_cache:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{BETTER_AUTH_URL}/api/auth/jwks")
            res.raise_for_status()
            _jwks_cache = res.json()
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    token = credentials.credentials

    try:
        jwks = await _get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key_data:
            raise ValueError("Signing key not found in JWKS")

        signing_key = jwt.PyJWK.from_json(__import__("json").dumps(key_data)).key
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["EdDSA", "RS256", "ES256"],
            audience=BETTER_AUTH_URL,
            issuer=BETTER_AUTH_URL,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired session. Please log in again."
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload.")

    return CurrentUser(id=user_id, email=payload.get("email", ""), name=payload.get("name"))