from __future__ import annotations
from typing import Any

ROLES = {
    "planner": {
        "id": "planner",
        "name": "Operations Planner",
        "email": "planner@projectx.local",
        "permissions": ["plan:optimise", "plan:submit", "event:inject", "ml:view", "registers:view"],
    },
    "commander": {
        "id": "commander",
        "name": "Air Commander",
        "email": "commander@projectx.local",
        "permissions": ["plan:approve", "plan:publish", "retask:order", "ml:view", "all:view"],
    },
    "auditor": {
        "id": "auditor",
        "name": "Independent Auditor",
        "email": "auditor@projectx.local",
        "permissions": ["plan:cosign", "audit:verify", "audit:view", "all:view"],
    },
    "fleet": {
        "id": "fleet",
        "name": "Fleet Engineering Officer",
        "email": "fleet@projectx.local",
        "permissions": ["fleet:update", "maintenance:view", "stores:view"],
    },
    "crew": {
        "id": "crew",
        "name": "Aircrew Roster Officer",
        "email": "crew@projectx.local",
        "permissions": ["crew:update", "crew:rest", "crew:view"],
    },
    "analyst": {
        "id": "analyst",
        "name": "Tactical Intel Analyst",
        "email": "analyst@projectx.local",
        "permissions": ["threats:view", "intel:view", "ml:view", "copilot:query"],
    },
    "admin": {
        "id": "admin",
        "name": "Platform Administrator",
        "email": "admin@projectx.local",
        "permissions": ["*"],
    },
}

def check_permission(user_role: str, required_perm: str) -> bool:
    role_info = ROLES.get(user_role)
    if not role_info:
        return False
    perms = role_info["permissions"]
    return "*" in perms or required_perm in perms
