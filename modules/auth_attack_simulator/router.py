from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
import logging
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter()

# Mock user database
mock_users: Dict[str, Dict[str, Any]] = {
    "admin": {
        "password_hash": hashlib.sha256("SecureP@ss123".encode()).hexdigest(),
        "role": "administrator",
        "mfa_enabled": True,
        "failed_attempts": 0,
        "locked_until": None
    },
    "user1": {
        "password_hash": hashlib.sha256("WeakPass".encode()).hexdigest(),
        "role": "user",
        "mfa_enabled": False,
        "failed_attempts": 0,
        "locked_until": None
    },
    "user2": {
        "password_hash": hashlib.sha256("Str0ng!Pass".encode()).hexdigest(),
        "role": "user",
        "mfa_enabled": True,
        "failed_attempts": 0,
        "locked_until": None
    }
}

# Simulation state
login_attempts: List[Dict[str, Any]] = []
lockout_events: List[Dict[str, Any]] = []
captcha_challenges: Dict[str, bool] = {}

# Configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
CAPTCHA_THRESHOLD = 3

class LoginAttempt(BaseModel):
    username: str
    password: str
    mfa_code: Optional[str] = None

class PasswordPolicy(BaseModel):
    min_length: int = 8
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_numbers: bool = True
    require_special: bool = True

class RiskScore(BaseModel):
    score: int
    level: str
    factors: List[str]

def check_password_strength(password: str, policy: PasswordPolicy) -> Dict[str, Any]:
    """Check password against security policy"""
    issues = []
    
    if len(password) < policy.min_length:
        issues.append(f"Password must be at least {policy.min_length} characters")
    
    if policy.require_uppercase and not any(c.isupper() for c in password):
        issues.append("Password must contain uppercase letters")
    
    if policy.require_lowercase and not any(c.islower() for c in password):
        issues.append("Password must contain lowercase letters")
    
    if policy.require_numbers and not any(c.isdigit() for c in password):
        issues.append("Password must contain numbers")
    
    if policy.require_special and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        issues.append("Password must contain special characters")
    
    return {
        "is_strong": len(issues) == 0,
        "issues": issues,
        "strength_score": max(0, 100 - len(issues) * 20)
    }

def calculate_risk_score(username: str, ip_address: str = "192.168.1.1") -> RiskScore:
    """Calculate risk score for a login attempt"""
    factors = []
    score = 0
    
    user = mock_users.get(username)
    
    # Check if user exists
    if not user:
        score += 30
        factors.append("Unknown username")
    else:
        # Check failed attempts
        if user["failed_attempts"] > 0:
            score += user["failed_attempts"] * 10
            factors.append(f"{user['failed_attempts']} previous failed attempts")
        
        # Check MFA status
        if not user.get("mfa_enabled", False):
            score += 20
            factors.append("MFA not enabled")
    
    # Check for rapid attempts
    recent_attempts = [
        a for a in login_attempts 
        if a["timestamp"] > (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        and a["username"] == username
    ]
    
    if len(recent_attempts) > 3:
        score += 25
        factors.append("Rapid login attempts detected")
    
    # Determine risk level
    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"
    else:
        level = "low"
    
    return RiskScore(score=min(score, 100), level=level, factors=factors)

@router.get("/users")
async def get_mock_users():
    """Get list of mock users (without sensitive data)"""
    return {
        "users": [
            {
                "username": username,
                "role": data["role"],
                "mfa_enabled": data["mfa_enabled"]
            }
            for username, data in mock_users.items()
        ]
    }

@router.post("/login")
async def simulate_login(attempt: LoginAttempt):
    """Simulate a login attempt with security checks"""
    timestamp = datetime.utcnow().isoformat()
    user = mock_users.get(attempt.username)
    
    # Check if account is locked
    if user and user["locked_until"]:
        lock_time = datetime.fromisoformat(user["locked_until"])
        if datetime.utcnow() < lock_time:
            remaining = (lock_time - datetime.utcnow()).seconds // 60
            login_attempts.append({
                "username": attempt.username,
                "success": False,
                "reason": "account_locked",
                "timestamp": timestamp
            })
            raise HTTPException(
                status_code=423, 
                detail=f"Account locked. Try again in {remaining} minutes"
            )
        else:
            # Lockout expired
            user["locked_until"] = None
            user["failed_attempts"] = 0
    
    # Check if captcha is required
    if attempt.username in captcha_challenges and captcha_challenges[attempt.username]:
        raise HTTPException(
            status_code=403, 
            detail="CAPTCHA verification required"
        )
    
    # Validate credentials
    success = False
    reason = ""
    
    if not user:
        success = False
        reason = "invalid_username"
    else:
        password_hash = hashlib.sha256(attempt.password.encode()).hexdigest()
        if password_hash != user["password_hash"]:
            success = False
            reason = "invalid_password"
            user["failed_attempts"] += 1
            
            # Check for lockout
            if user["failed_attempts"] >= MAX_FAILED_ATTEMPTS:
                user["locked_until"] = (
                    datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                ).isoformat()
                lockout_events.append({
                    "username": attempt.username,
                    "timestamp": timestamp,
                    "failed_attempts": user["failed_attempts"]
                })
                reason = "account_locked"
        elif user.get("mfa_enabled") and not attempt.mfa_code:
            success = False
            reason = "mfa_required"
        elif user.get("mfa_enabled") and attempt.mfa_code != "123456":  # Mock MFA code
            success = False
            reason = "invalid_mfa"
            user["failed_attempts"] += 1
        else:
            success = True
            reason = "success"
            user["failed_attempts"] = 0
    
    login_attempts.append({
        "username": attempt.username,
        "success": success,
        "reason": reason,
        "timestamp": timestamp,
        "ip_address": "192.168.1.1"
    })
    
    logger.info(f"Login attempt: {attempt.username} - {reason}")
    
    return {
        "success": success,
        "reason": reason,
        "requires_mfa": user and user.get("mfa_enabled") if success else False,
        "risk_score": calculate_risk_score(attempt.username)
    }

@router.post("/password/check")
async def check_password(password: str, policy: Optional[PasswordPolicy] = None):
    """Check password strength against policy"""
    if policy is None:
        policy = PasswordPolicy()
    
    result = check_password_strength(password, policy)
    logger.info(f"Password strength check: strength_score={result['strength_score']}")
    
    return result

@router.get("/attempts")
async def get_login_attempts(limit: int = 50):
    """Get recent login attempts"""
    return {"attempts": login_attempts[-limit:]}

@router.get("/lockouts")
async def get_lockout_events():
    """Get account lockout events"""
    return {"events": lockout_events}

@router.post("/reset-user/{username}")
async def reset_user(username: str):
    """Reset user lockout status"""
    if username not in mock_users:
        raise HTTPException(status_code=404, detail="User not found")
    
    mock_users[username]["failed_attempts"] = 0
    mock_users[username]["locked_until"] = None
    
    logger.info(f"User reset: {username}")
    return {"message": f"User {username} reset successfully"}

@router.get("/risk/{username}")
async def get_risk_assessment(username: str):
    """Get risk assessment for a user"""
    return calculate_risk_score(username)

@router.post("/enable-mfa/{username}")
async def enable_mfa(username: str):
    """Enable MFA for a user"""
    if username not in mock_users:
        raise HTTPException(status_code=404, detail="User not found")
    
    mock_users[username]["mfa_enabled"] = True
    logger.info(f"MFA enabled for: {username}")
    
    return {"message": f"MFA enabled for {username}", "mfa_code": "123456"}

@router.post("/disable-mfa/{username}")
async def disable_mfa(username: str):
    """Disable MFA for a user"""
    if username not in mock_users:
        raise HTTPException(status_code=404, detail="User not found")
    
    mock_users[username]["mfa_enabled"] = False
    logger.info(f"MFA disabled for: {username}")
    
    return {"message": f"MFA disabled for {username}"}

@router.get("/stats")
async def get_simulation_stats():
    """Get simulation statistics"""
    total_attempts = len(login_attempts)
    successful = sum(1 for a in login_attempts if a["success"])
    failed = total_attempts - successful
    
    return {
        "total_attempts": total_attempts,
        "successful_logins": successful,
        "failed_logins": failed,
        "lockout_events": len(lockout_events),
        "success_rate": round(successful / total_attempts * 100, 2) if total_attempts > 0 else 0
    }
