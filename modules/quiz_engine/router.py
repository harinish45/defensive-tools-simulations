from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Quiz question database
quiz_questions: List[Dict[str, Any]] = [
    # Networking
    {
        "id": 1,
        "category": "networking",
        "difficulty": "beginner",
        "question": "What does TCP stand for?",
        "options": ["Transmission Control Protocol", "Transfer Control Protocol", "Technical Communication Protocol", "Transmission Connection Protocol"],
        "correct_answer": 0,
        "explanation": "TCP (Transmission Control Protocol) is a core protocol of the Internet Protocol suite that provides reliable, ordered delivery of data streams."
    },
    {
        "id": 2,
        "category": "networking",
        "difficulty": "intermediate",
        "question": "Which port does HTTPS use by default?",
        "options": ["80", "443", "8080", "22"],
        "correct_answer": 1,
        "explanation": "HTTPS uses port 443 by default for secure web communications over SSL/TLS."
    },
    {
        "id": 3,
        "category": "networking",
        "difficulty": "advanced",
        "question": "What is the purpose of ARP (Address Resolution Protocol)?",
        "options": ["Resolve domain names to IP addresses", "Resolve IP addresses to MAC addresses", "Route packets between networks", "Encrypt network traffic"],
        "correct_answer": 1,
        "explanation": "ARP resolves IP addresses to MAC addresses, allowing devices to communicate on a local network."
    },
    
    # Cryptography
    {
        "id": 4,
        "category": "cryptography",
        "difficulty": "beginner",
        "question": "What does AES stand for?",
        "options": ["Advanced Encryption Standard", "Applied Encryption System", "Automated Encoding Standard", "Advanced Encoding System"],
        "correct_answer": 0,
        "explanation": "AES (Advanced Encryption Standard) is a symmetric encryption algorithm widely used worldwide."
    },
    {
        "id": 5,
        "category": "cryptography",
        "difficulty": "intermediate",
        "question": "Which cryptographic concept ensures that a message has not been altered?",
        "options": ["Confidentiality", "Integrity", "Availability", "Non-repudiation"],
        "correct_answer": 1,
        "explanation": "Integrity ensures that data has not been modified or tampered with during transmission or storage."
    },
    {
        "id": 6,
        "category": "cryptography",
        "difficulty": "advanced",
        "question": "What is the key size of SHA-256?",
        "options": ["128 bits", "256 bits", "512 bits", "It produces a 256-bit hash"],
        "correct_answer": 3,
        "explanation": "SHA-256 produces a 256-bit (32-byte) hash value. It's not a key size but an output size."
    },
    
    # Malware
    {
        "id": 7,
        "category": "malware",
        "difficulty": "beginner",
        "question": "What type of malware encrypts files and demands payment?",
        "options": ["Virus", "Worm", "Ransomware", "Spyware"],
        "correct_answer": 2,
        "explanation": "Ransomware encrypts victim files and demands ransom payment for decryption keys."
    },
    {
        "id": 8,
        "category": "malware",
        "difficulty": "intermediate",
        "question": "What is a rootkit?",
        "options": ["A type of virus", "Malware that hides its presence", "A network scanning tool", "A password cracking tool"],
        "correct_answer": 1,
        "explanation": "A rootkit is malware designed to hide its existence and provide privileged access to attackers."
    },
    {
        "id": 9,
        "category": "malware",
        "difficulty": "advanced",
        "question": "What is the difference between a worm and a virus?",
        "options": ["Worms are more dangerous", "Worms self-replicate without user action", "Viruses are older", "There is no difference"],
        "correct_answer": 1,
        "explanation": "Worms can self-replicate and spread independently, while viruses require user action to execute."
    },
    
    # Web Security
    {
        "id": 10,
        "category": "web_security",
        "difficulty": "beginner",
        "question": "What does XSS stand for?",
        "options": ["XML Security Service", "Cross-Site Scripting", "Extended Security Standard", "Cross-Server Sync"],
        "correct_answer": 1,
        "explanation": "XSS (Cross-Site Scripting) is a vulnerability that allows attackers to inject malicious scripts into web pages."
    },
    {
        "id": 11,
        "category": "web_security",
        "difficulty": "intermediate",
        "question": "Which HTTP header helps prevent clickjacking attacks?",
        "options": ["Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security", "X-XSS-Protection"],
        "correct_answer": 1,
        "explanation": "X-Frame-Options prevents a page from being embedded in an iframe, mitigating clickjacking attacks."
    },
    {
        "id": 12,
        "category": "web_security",
        "difficulty": "advanced",
        "question": "What is CSRF protection primarily designed to prevent?",
        "options": ["SQL injection", "Unauthorized commands from trusted users", "Cross-site scripting", "Directory traversal"],
        "correct_answer": 1,
        "explanation": "CSRF (Cross-Site Request Forgery) protection prevents unauthorized commands from authenticated users."
    },
    
    # Cloud Security
    {
        "id": 13,
        "category": "cloud_security",
        "difficulty": "beginner",
        "question": "What does IAM stand for in cloud security?",
        "options": ["Internet Access Management", "Identity and Access Management", "Internal Authentication Module", "Integrated Account Manager"],
        "correct_answer": 1,
        "explanation": "IAM (Identity and Access Management) controls who can access what resources in cloud environments."
    },
    {
        "id": 14,
        "category": "cloud_security",
        "difficulty": "intermediate",
        "question": "Which AWS service provides DDoS protection?",
        "options": ["CloudFront", "AWS Shield", "WAF", "Inspector"],
        "correct_answer": 1,
        "explanation": "AWS Shield provides managed DDoS protection for applications running on AWS."
    },
    {
        "id": 15,
        "category": "cloud_security",
        "difficulty": "advanced",
        "question": "What is the principle of least privilege?",
        "options": ["Give users minimal necessary permissions", "Use only free tier services", "Minimize cloud costs", "Limit API calls"],
        "correct_answer": 0,
        "explanation": "Least privilege means granting users only the minimum permissions needed to perform their tasks."
    },
    
    # Incident Response
    {
        "id": 16,
        "category": "incident_response",
        "difficulty": "beginner",
        "question": "What is the first step in incident response?",
        "options": ["Containment", "Identification", "Eradication", "Recovery"],
        "correct_answer": 1,
        "explanation": "Identification is the first step - you must identify that an incident has occurred before responding."
    },
    {
        "id": 17,
        "category": "incident_response",
        "difficulty": "intermediate",
        "question": "What is containment in incident response?",
        "options": ["Deleting malware", "Limiting the spread of an incident", "Writing reports", "Installing patches"],
        "correct_answer": 1,
        "explanation": "Containment involves isolating affected systems to prevent further damage or spread."
    },
    {
        "id": 18,
        "category": "incident_response",
        "difficulty": "advanced",
        "question": "What should be preserved during incident response for potential legal proceedings?",
        "options": ["Only logs", "Chain of custody", "System backups", "Network diagrams"],
        "correct_answer": 1,
        "explanation": "Chain of custody ensures evidence is properly documented and preserved for legal admissibility."
    },
    
    # Digital Forensics
    {
        "id": 19,
        "category": "digital_forensics",
        "difficulty": "beginner",
        "question": "What is a forensic image?",
        "options": ["A screenshot", "A bit-by-bit copy of storage media", "A photo of evidence", "A network diagram"],
        "correct_answer": 1,
        "explanation": "A forensic image is an exact bit-by-bit copy of storage media that preserves all data including deleted files."
    },
    {
        "id": 20,
        "category": "digital_forensics",
        "difficulty": "intermediate",
        "question": "Why is write-blocking important in forensics?",
        "options": ["To speed up analysis", "To prevent modification of evidence", "To compress data", "To encrypt files"],
        "correct_answer": 1,
        "explanation": "Write-blocking prevents any modifications to the original evidence during acquisition and analysis."
    },
    {
        "id": 21,
        "category": "digital_forensics",
        "difficulty": "advanced",
        "question": "What is volatile data?",
        "options": ["Encrypted data", "Data lost when power is removed", "Corrupted files", "Compressed archives"],
        "correct_answer": 1,
        "explanation": "Volatile data (like RAM contents) is lost when power is removed and should be collected first."
    }
]

# User quiz sessions
quiz_sessions: Dict[str, Dict[str, Any]] = {}

class QuizQuestion(BaseModel):
    category: Optional[str] = None
    difficulty: Optional[str] = None
    limit: Optional[int] = None

class AnswerSubmission(BaseModel):
    question_id: int
    selected_answer: int

class QuizSession(BaseModel):
    session_id: str
    questions: List[int]
    answers: Dict[int, int]
    start_time: str
    completed: bool

@router.get("/categories")
async def get_categories():
    """Get available quiz categories"""
    categories = list(set(q["category"] for q in quiz_questions))
    return {
        "categories": [
            {"id": cat, "name": cat.replace("_", " ").title(), "count": sum(1 for q in quiz_questions if q["category"] == cat)}
            for cat in categories
        ]
    }

@router.get("/difficulties")
async def get_difficulties():
    """Get available difficulty levels"""
    difficulties = ["beginner", "intermediate", "advanced"]
    return {
        "difficulties": [
            {"id": diff, "name": diff.title(), "count": sum(1 for q in quiz_questions if q["difficulty"] == diff)}
            for diff in difficulties
        ]
    }

@router.post("/start")
async def start_quiz(config: QuizQuestion):
    """Start a new quiz session"""
    session_id = f"quiz_{datetime.utcnow().timestamp()}_{random.randint(1000, 9999)}"
    
    # Filter questions based on config
    filtered = quiz_questions
    
    if config.category:
        filtered = [q for q in filtered if q["category"] == config.category]
    
    if config.difficulty:
        filtered = [q for q in filtered if q["difficulty"] == config.difficulty]
    
    # Randomize and limit
    random.shuffle(filtered)
    limit = config.limit or min(10, len(filtered))
    selected = filtered[:limit]
    
    # Create session
    quiz_sessions[session_id] = {
        "session_id": session_id,
        "questions": [q["id"] for q in selected],
        "answers": {},
        "start_time": datetime.utcnow().isoformat(),
        "completed": False,
        "config": {
            "category": config.category,
            "difficulty": config.difficulty
        }
    }
    
    logger.info(f"Quiz session started: {session_id} with {len(selected)} questions")
    
    # Return questions without correct answers
    questions_for_user = [
        {
            "id": q["id"],
            "category": q["category"],
            "difficulty": q["difficulty"],
            "question": q["question"],
            "options": q["options"]
        }
        for q in selected
    ]
    
    return {
        "session_id": session_id,
        "questions": questions_for_user,
        "total_questions": len(questions_for_user),
        "start_time": quiz_sessions[session_id]["start_time"]
    }

@router.post("/{session_id}/submit")
async def submit_answer(session_id: str, submission: AnswerSubmission):
    """Submit an answer for a question"""
    if session_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = quiz_sessions[session_id]
    
    if submission.question_id not in session["questions"]:
        raise HTTPException(status_code=400, detail="Question not in this quiz")
    
    session["answers"][submission.question_id] = submission.selected_answer
    
    # Check if all questions answered
    if len(session["answers"]) == len(session["questions"]):
        session["completed"] = True
    
    logger.info(f"Answer submitted for session {session_id}, question {submission.question_id}")
    
    return {
        "message": "Answer recorded",
        "answered_count": len(session["answers"]),
        "total_count": len(session["questions"]),
        "completed": session["completed"]
    }

@router.get("/{session_id}/results")
async def get_results(session_id: str):
    """Get quiz results"""
    if session_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = quiz_sessions[session_id]
    
    if not session["completed"]:
        raise HTTPException(status_code=400, detail="Quiz not completed yet")
    
    # Calculate score
    correct = 0
    total = len(session["questions"])
    detailed_results = []
    
    for q_id in session["questions"]:
        question = next((q for q in quiz_questions if q["id"] == q_id), None)
        if question:
            user_answer = session["answers"].get(q_id)
            is_correct = user_answer == question["correct_answer"]
            if is_correct:
                correct += 1
            
            detailed_results.append({
                "question_id": q_id,
                "question": question["question"],
                "correct_answer": question["correct_answer"],
                "user_answer": user_answer,
                "is_correct": is_correct,
                "explanation": question["explanation"]
            })
    
    score = round(correct / total * 100, 2) if total > 0 else 0
    
    # Determine achievement
    achievement = None
    if score == 100:
        achievement = "Perfect Score! 🏆"
    elif score >= 80:
        achievement = "Excellent! 🌟"
    elif score >= 60:
        achievement = "Good Job! 👍"
    elif score >= 40:
        achievement = "Keep Learning! 📚"
    else:
        achievement = "Practice Makes Perfect! 💪"
    
    logger.info(f"Quiz results for session {session_id}: score={score}%")
    
    return {
        "session_id": session_id,
        "score": score,
        "correct_answers": correct,
        "total_questions": total,
        "achievement": achievement,
        "time_taken": "N/A",  # Could calculate from timestamps
        "detailed_results": detailed_results
    }

@router.get("/question/{question_id}")
async def get_question(question_id: int):
    """Get a specific question (for practice mode)"""
    question = next((q for q in quiz_questions if q["id"] == question_id), None)
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {
        "id": question["id"],
        "category": question["category"],
        "difficulty": question["difficulty"],
        "question": question["question"],
        "options": question["options"],
        "correct_answer": question["correct_answer"],
        "explanation": question["explanation"]
    }

@router.get("/stats")
async def get_quiz_stats():
    """Get overall quiz statistics"""
    total_questions = len(quiz_questions)
    categories = {}
    difficulties = {}
    
    for q in quiz_questions:
        cat = q["category"]
        diff = q["difficulty"]
        
        categories[cat] = categories.get(cat, 0) + 1
        difficulties[diff] = difficulties.get(diff, 0) + 1
    
    active_sessions = sum(1 for s in quiz_sessions.values() if not s["completed"])
    completed_sessions = sum(1 for s in quiz_sessions.values() if s["completed"])
    
    return {
        "total_questions": total_questions,
        "by_category": categories,
        "by_difficulty": difficulties,
        "active_sessions": active_sessions,
        "completed_sessions": completed_sessions
    }

@router.delete("/session/{session_id}")
async def end_session(session_id: str):
    """End and clear a quiz session"""
    if session_id not in quiz_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del quiz_sessions[session_id]
    logger.info(f"Quiz session ended: {session_id}")
    
    return {"message": "Session cleared"}
