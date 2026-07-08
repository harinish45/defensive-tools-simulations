from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Mock process database
mock_processes: List[Dict[str, Any]] = [
    {
        "pid": 1001,
        "name": "explorer.exe",
        "path": "C:\\Windows\\explorer.exe",
        "signature": "Microsoft Windows",
        "reputation": "trusted",
        "behaviors": []
    },
    {
        "pid": 1002,
        "name": "chrome.exe",
        "path": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "signature": "Google LLC",
        "reputation": "trusted",
        "behaviors": []
    },
    {
        "pid": 1003,
        "name": "notepad.exe",
        "path": "C:\\Windows\\notepad.exe",
        "signature": "Microsoft Windows",
        "reputation": "trusted",
        "behaviors": []
    },
    {
        "pid": 2001,
        "name": "svchost.exe",
        "path": "C:\\Windows\\System32\\svchost.exe",
        "signature": "Microsoft Windows",
        "reputation": "trusted",
        "behaviors": []
    },
    {
        "pid": 3001,
        "name": "keylog.exe",
        "path": "C:\\Users\\Temp\\AppData\\Local\\Temp\\keylog.exe",
        "signature": None,
        "reputation": "unknown",
        "behaviors": ["keyboard_hook", "file_write"]
    },
    {
        "pid": 3002,
        "name": "system_update.exe",
        "path": "C:\\Users\\Public\\system_update.exe",
        "signature": None,
        "reputation": "suspicious",
        "behaviors": ["keyboard_hook", "network_send", "registry_modify"]
    }
]

# Detection signatures
KEYLOGGER_SIGNATURES = [
    {"name": "keyboard_hook", "severity": "high", "description": "Process is using keyboard hooks"},
    {"name": "raw_input_capture", "severity": "high", "description": "Process capturing raw input data"},
    {"name": "get_async_key_state", "severity": "medium", "description": "Frequent GetAsyncKeyState calls detected"},
    {"name": "set_windows_hook_ex", "severity": "high", "description": "Using SetWindowsHookEx with WH_KEYBOARD"},
    {"name": "file_write_logs", "severity": "medium", "description": "Writing keystroke logs to file"},
    {"name": "network_send_keystrokes", "severity": "critical", "description": "Sending captured keystrokes over network"},
    {"name": "clipboard_monitor", "severity": "medium", "description": "Monitoring clipboard for passwords"},
    {"name": "screen_capture", "severity": "low", "description": "Taking screenshots at regular intervals"}
]

# Suspicious paths
SUSPICIOUS_PATHS = [
    "AppData\\Local\\Temp",
    "AppData\\Roaming",
    "Users\\Public",
    "ProgramData"
]

class ProcessScan(BaseModel):
    pid: int
    name: str
    path: str
    behaviors: List[str]

class DetectionResult(BaseModel):
    is_suspicious: bool
    risk_score: int
    risk_level: str
    detections: List[Dict[str, Any]]
    recommendations: List[str]

def calculate_risk_score(process: Dict[str, Any]) -> DetectionResult:
    """Calculate risk score for a process"""
    detections = []
    risk_score = 0
    recommendations = []
    
    # Check signature
    if not process.get("signature"):
        risk_score += 20
        detections.append({
            "type": "unsigned_executable",
            "severity": "medium",
            "description": "Process lacks valid digital signature"
        })
        recommendations.append("Verify the authenticity of this executable")
    
    # Check reputation
    if process.get("reputation") == "suspicious":
        risk_score += 30
        detections.append({
            "type": "poor_reputation",
            "severity": "high",
            "description": "Process has poor reputation in threat intelligence"
        })
        recommendations.append("Investigate this process immediately")
    elif process.get("reputation") == "unknown":
        risk_score += 15
        detections.append({
            "type": "unknown_reputation",
            "severity": "low",
            "description": "Process has no known reputation"
        })
    
    # Check behaviors
    for behavior in process.get("behaviors", []):
        for sig in KEYLOGGER_SIGNATURES:
            if sig["name"] == behavior:
                risk_score += {"critical": 40, "high": 30, "medium": 20, "low": 10}.get(sig["severity"], 10)
                detections.append({
                    "type": behavior,
                    "severity": sig["severity"],
                    "description": sig["description"]
                })
                recommendations.append(f"Investigate {behavior} behavior")
    
    # Check suspicious paths
    for suspicious_path in SUSPICIOUS_PATHS:
        if suspicious_path.lower() in process.get("path", "").lower():
            risk_score += 10
            detections.append({
                "type": "suspicious_location",
                "severity": "low",
                "description": f"Executable running from suspicious location: {suspicious_path}"
            })
            break
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = "critical"
    elif risk_score >= 50:
        risk_level = "high"
    elif risk_score >= 30:
        risk_level = "medium"
    elif risk_score > 0:
        risk_level = "low"
    else:
        risk_level = "safe"
    
    return DetectionResult(
        is_suspicious=risk_score > 0,
        risk_score=min(risk_score, 100),
        risk_level=risk_level,
        detections=detections,
        recommendations=list(set(recommendations))
    )

@router.get("/processes")
async def get_processes():
    """Get list of mock processes"""
    return {"processes": mock_processes}

@router.post("/scan/{pid}")
async def scan_process(pid: int):
    """Scan a specific process for keylogger behavior"""
    process = next((p for p in mock_processes if p["pid"] == pid), None)
    
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    
    result = calculate_risk_score(process)
    logger.info(f"Process scan: PID {pid}, risk_level={result.risk_level}")
    
    return {
        "process": process,
        "scan_result": result.dict(),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/scan-all")
async def scan_all_processes():
    """Scan all processes for keylogger behavior"""
    results = []
    
    for process in mock_processes:
        result = calculate_risk_score(process)
        if result.is_suspicious:
            results.append({
                "process": process,
                "scan_result": result.dict()
            })
    
    logger.info(f"Full scan complete: {len(results)} suspicious processes found")
    
    return {
        "total_processes": len(mock_processes),
        "suspicious_count": len(results),
        "results": results,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/signatures")
async def get_signatures():
    """Get list of detection signatures"""
    return {"signatures": KEYLOGGER_SIGNATURES}

@router.post("/add-process")
async def add_process(process: ProcessScan):
    """Add a new process to monitor"""
    new_process = {
        "pid": process.pid,
        "name": process.name,
        "path": process.path,
        "signature": None,
        "reputation": "unknown",
        "behaviors": process.behaviors
    }
    
    mock_processes.append(new_process)
    logger.info(f"New process added for monitoring: {process.name}")
    
    return {"message": "Process added successfully", "process": new_process}

@router.get("/false-positives")
async def get_false_positive_examples():
    """Get examples of common false positives"""
    return {
        "examples": [
            {
                "name": "AutoHotkey.exe",
                "description": "Legitimate automation tool that uses keyboard hooks",
                "why_flagged": "Uses keyboard hooks for macro functionality",
                "how_to_verify": "Check digital signature and installation path"
            },
            {
                "name": "Gaming Software",
                "description": "Gaming peripherals software with macro support",
                "why_flagged": "Monitors keyboard for custom macros",
                "how_to_verify": "Verify it's from known gaming peripheral manufacturer"
            },
            {
                "name": "Accessibility Tools",
                "description": "Screen readers and accessibility utilities",
                "why_flagged": "Capture input for accessibility features",
                "how_to_verify": "Check if it's a recognized accessibility tool"
            }
        ]
    }

@router.get("/best-practices")
async def get_best_practices():
    """Get keylogger detection best practices"""
    return {
        "practices": [
            {
                "title": "Monitor Keyboard Hooks",
                "description": "Watch for processes installing keyboard hooks via SetWindowsHookEx"
            },
            {
                "title": "Check Digital Signatures",
                "description": "Verify executables have valid signatures from trusted publishers"
            },
            {
                "title": "Analyze File Locations",
                "description": "Be suspicious of executables running from temp directories"
            },
            {
                "title": "Network Monitoring",
                "description": "Detect unusual outbound traffic that may contain keystroke data"
            },
            {
                "title": "Behavioral Analysis",
                "description": "Look for patterns like frequent file writes after keystrokes"
            },
            {
                "title": "Memory Scanning",
                "description": "Scan process memory for known keylogger code patterns"
            }
        ]
    }

@router.get("/stats")
async def get_detection_stats():
    """Get detection statistics"""
    total = len(mock_processes)
    suspicious = sum(1 for p in mock_processes if calculate_risk_score(p).is_suspicious)
    
    return {
        "total_processes": total,
        "clean_processes": total - suspicious,
        "suspicious_processes": suspicious,
        "detection_rate": round(suspicious / total * 100, 2) if total > 0 else 0
    }
