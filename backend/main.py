from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import sqlite3
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# App configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(
    title="CyberVerse API",
    description="Educational Cybersecurity Demo Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database setup
def get_db():
    conn = sqlite3.connect("cyberverse.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create default admin user
    admin_hash = pwd_context.hash("admin123")
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            ("admin", admin_hash, "administrator")
        )
    except Exception:
        pass
    
    # Create default student user
    student_hash = pwd_context.hash("student123")
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            ("student", student_hash, "student")
        )
    except Exception:
        pass
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Pydantic models
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class FirewallRule(BaseModel):
    id: Optional[int] = None
    name: str
    action: str  # allow, deny
    protocol: Optional[str] = None
    port: Optional[int] = None
    ip: Optional[str] = None
    priority: int = 1

class Packet(BaseModel):
    src_ip: str
    dst_ip: str
    protocol: str
    port: int
    payload_size: int

class QuizQuestion(BaseModel):
    id: Optional[int] = None
    category: str
    difficulty: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str

class LogEntry(BaseModel):
    timestamp: str
    level: str
    source: str
    message: str
    metadata: Optional[Dict[str, Any]] = None

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user is None:
        raise credentials_exception
    
    return dict(user)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("CyberVerse API started")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Authentication endpoints
@app.post("/api/auth/register", response_model=Dict[str, Any])
async def register(user: UserCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        password_hash = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (user.username, password_hash, user.role)
        )
        conn.commit()
        logger.info(f"User registered: {user.username}")
        return {"message": "User registered successfully", "username": user.username}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
    finally:
        conn.close()

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["username"], "role": db_user["role"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": db_user["username"], "role": db_user["role"]}
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Import module routers
from modules.firewall_simulator.router import router as firewall_router
from modules.auth_attack_simulator.router import router as auth_sim_router
from modules.keylogger_detection.router import router as keylogger_router
from modules.quiz_engine.router import router as quiz_router
from modules.threat_dashboard.router import router as threat_router
from modules.log_analyzer.router import router as log_router

# Include routers
app.include_router(firewall_router, prefix="/api/firewall", tags=["Firewall Simulator"])
app.include_router(auth_sim_router, prefix="/api/auth-simulator", tags=["Auth Simulator"])
app.include_router(keylogger_router, prefix="/api/keylogger", tags=["Keylogger Detection"])
app.include_router(quiz_router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(threat_router, prefix="/api/threats", tags=["Threat Dashboard"])
app.include_router(log_router, prefix="/api/logs", tags=["Log Analyzer"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
