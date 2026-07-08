from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import csv
import io
import re
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Store analyzed logs
analyzed_logs: List[Dict[str, Any]] = []

class LogEntry(BaseModel):
    timestamp: str
    level: str
    source: str
    message: str
    metadata: Optional[Dict[str, Any]] = None

class AnalysisResult(BaseModel):
    total_entries: int
    by_level: Dict[str, int]
    anomalies: List[Dict[str, Any]]
    time_range: Dict[str, str]
    top_sources: List[Dict[str, Any]]

def parse_json_logs(content: str) -> List[Dict[str, Any]]:
    """Parse JSON formatted logs"""
    entries = []
    try:
        # Try parsing as JSON array
        data = json.loads(content)
        if isinstance(data, list):
            for item in data:
                entries.append({
                    "timestamp": item.get("timestamp", item.get("time", "")),
                    "level": item.get("level", item.get("severity", "info")),
                    "source": item.get("source", item.get("logger", "unknown")),
                    "message": item.get("message", item.get("msg", "")),
                    "metadata": {k: v for k, v in item.items() if k not in ["timestamp", "time", "level", "severity", "source", "logger", "message", "msg"]}
                })
        else:
            # Single JSON object
            entries.append({
                "timestamp": data.get("timestamp", data.get("time", "")),
                "level": data.get("level", data.get("severity", "info")),
                "source": data.get("source", data.get("logger", "unknown")),
                "message": data.get("message", data.get("msg", "")),
                "metadata": {k: v for k, v in data.items() if k not in ["timestamp", "time", "level", "severity", "source", "logger", "message", "msg"]}
            })
    except json.JSONDecodeError:
        # Try line-by-line JSON
        for line in content.strip().split("\n"):
            if line.strip():
                try:
                    item = json.loads(line)
                    entries.append({
                        "timestamp": item.get("timestamp", item.get("time", "")),
                        "level": item.get("level", item.get("severity", "info")),
                        "source": item.get("source", item.get("logger", "unknown")),
                        "message": item.get("message", item.get("msg", "")),
                        "metadata": {k: v for k, v in item.items() if k not in ["timestamp", "time", "level", "severity", "source", "logger", "message", "msg"]}
                    })
                except json.JSONDecodeError:
                    continue
    return entries

def parse_csv_logs(content: str) -> List[Dict[str, Any]]:
    """Parse CSV formatted logs"""
    entries = []
    try:
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            entries.append({
                "timestamp": row.get("timestamp", row.get("time", "")),
                "level": row.get("level", row.get("severity", "info")),
                "source": row.get("source", row.get("logger", "unknown")),
                "message": row.get("message", row.get("msg", "")),
                "metadata": {k: v for k, v in row.items() if k not in ["timestamp", "time", "level", "severity", "source", "logger", "message", "msg"]}
            })
    except Exception as e:
        logger.error(f"CSV parsing error: {e}")
    return entries

def parse_syslog(content: str) -> List[Dict[str, Any]]:
    """Parse syslog formatted logs"""
    entries = []
    # Basic syslog pattern: <priority>timestamp hostname process[pid]: message
    syslog_pattern = r'^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[\d+\])?:\s*(.*)$'
    
    for line in content.strip().split("\n"):
        if line.strip():
            match = re.match(syslog_pattern, line)
            if match:
                timestamp, hostname, source, message = match.groups()
                
                # Determine level from message content
                level = "info"
                msg_lower = message.lower()
                if "error" in msg_lower or "fail" in msg_lower:
                    level = "error"
                elif "warn" in msg_lower:
                    level = "warning"
                elif "crit" in msg_lower or "alert" in msg_lower:
                    level = "critical"
                elif "debug" in msg_lower:
                    level = "debug"
                
                entries.append({
                    "timestamp": timestamp,
                    "level": level,
                    "source": f"{hostname}:{source}",
                    "message": message,
                    "metadata": {"hostname": hostname}
                })
            else:
                # Try to extract something meaningful
                entries.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "info",
                    "source": "unknown",
                    "message": line,
                    "metadata": {}
                })
    return entries

def detect_anomalies(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Detect anomalies in log entries"""
    anomalies = []
    
    # Count by level
    level_counts = {}
    source_counts = {}
    
    for entry in entries:
        level = entry["level"]
        source = entry["source"]
        
        level_counts[level] = level_counts.get(level, 0) + 1
        source_counts[source] = source_counts.get(source, 0) + 1
    
    # Detect high error rate
    total = len(entries)
    error_count = level_counts.get("error", 0) + level_counts.get("critical", 0)
    
    if total > 0 and error_count / total > 0.3:
        anomalies.append({
            "type": "high_error_rate",
            "severity": "high",
            "description": f"High error rate detected: {error_count}/{total} ({round(error_count/total*100, 1)}%)",
            "recommendation": "Investigate error sources immediately"
        })
    
    # Detect single source dominating
    for source, count in source_counts.items():
        if total > 10 and count / total > 0.5:
            anomalies.append({
                "type": "source_dominance",
                "severity": "medium",
                "description": f"Single source '{source}' generating {round(count/total*100, 1)}% of logs",
                "recommendation": "Review if this is expected behavior"
            })
    
    # Look for security-related keywords
    security_keywords = ["unauthorized", "failed login", "access denied", "permission", "authentication", "brute force", "injection", "malware"]
    security_events = []
    
    for entry in entries:
        msg_lower = entry["message"].lower()
        for keyword in security_keywords:
            if keyword in msg_lower:
                security_events.append(entry)
                break
    
    if security_events:
        anomalies.append({
            "type": "security_events",
            "severity": "high",
            "description": f"Found {len(security_events)} security-related log entries",
            "events": security_events[:10],  # First 10
            "recommendation": "Review security events for potential threats"
        })
    
    return anomalies

@router.post("/parse")
async def parse_logs(file: UploadFile = File(...)):
    """Parse uploaded log file"""
    content = await file.read()
    content_str = content.decode("utf-8")
    
    # Determine format and parse
    entries = []
    format_detected = "unknown"
    
    filename = file.filename.lower() if file.filename else ""
    
    # Try based on extension first
    if filename.endswith(".json"):
        entries = parse_json_logs(content_str)
        format_detected = "json"
    elif filename.endswith(".csv"):
        entries = parse_csv_logs(content_str)
        format_detected = "csv"
    elif filename.endswith(".log") or filename.endswith(".syslog"):
        entries = parse_syslog(content_str)
        format_detected = "syslog"
    else:
        # Auto-detect format
        content_stripped = content_str.strip()
        
        # Try JSON
        if content_stripped.startswith("[") or content_stripped.startswith("{"):
            entries = parse_json_logs(content_str)
            if entries:
                format_detected = "json"
        
        # Try CSV (has header with commas)
        if not entries and "," in content_stripped.split("\n")[0]:
            entries = parse_csv_logs(content_str)
            if entries:
                format_detected = "csv"
        
        # Default to syslog
        if not entries:
            entries = parse_syslog(content_str)
            format_detected = "syslog"
    
    # Store for later retrieval
    log_id = f"log_{datetime.utcnow().timestamp()}_{len(analyzed_logs)}"
    log_data = {
        "id": log_id,
        "entries": entries,
        "format": format_detected,
        "uploaded_at": datetime.utcnow().isoformat(),
        "filename": file.filename
    }
    analyzed_logs.append(log_data)
    
    logger.info(f"Parsed {len(entries)} log entries from {file.filename} (format: {format_detected})")
    
    return {
        "log_id": log_id,
        "entries_count": len(entries),
        "format_detected": format_detected,
        "sample_entries": entries[:5]
    }

@router.post("/analyze/{log_id}")
async def analyze_logs(log_id: str):
    """Analyze parsed logs for anomalies"""
    log_data = next((l for l in analyzed_logs if l["id"] == log_id), None)
    
    if not log_data:
        raise HTTPException(status_code=404, detail="Log not found")
    
    entries = log_data["entries"]
    
    # Calculate statistics
    by_level = {}
    source_counts = {}
    timestamps = []
    
    for entry in entries:
        level = entry["level"]
        source = entry["source"]
        
        by_level[level] = by_level.get(level, 0) + 1
        source_counts[source] = source_counts.get(source, 0) + 1
        
        if entry["timestamp"]:
            timestamps.append(entry["timestamp"])
    
    # Top sources
    top_sources = sorted(
        [{"source": src, "count": count} for src, count in source_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]
    
    # Detect anomalies
    anomalies = detect_anomalies(entries)
    
    result = {
        "log_id": log_id,
        "total_entries": len(entries),
        "by_level": by_level,
        "anomalies": anomalies,
        "time_range": {
            "start": min(timestamps) if timestamps else None,
            "end": max(timestamps) if timestamps else None
        },
        "top_sources": top_sources
    }
    
    logger.info(f"Analysis complete for {log_id}: {len(anomalies)} anomalies detected")
    
    return result

@router.get("/logs")
async def get_parsed_logs():
    """Get list of all parsed logs"""
    return {
        "logs": [
            {
                "id": log["id"],
                "filename": log["filename"],
                "format": log["format"],
                "entries_count": len(log["entries"]),
                "uploaded_at": log["uploaded_at"]
            }
            for log in analyzed_logs
        ]
    }

@router.get("/logs/{log_id}")
async def get_log_entries(log_id: str, limit: int = 100):
    """Get entries from a specific log"""
    log_data = next((l for l in analyzed_logs if l["id"] == log_id), None)
    
    if not log_data:
        raise HTTPException(status_code=404, detail="Log not found")
    
    return {
        "log_id": log_id,
        "entries": log_data["entries"][:limit],
        "total": len(log_data["entries"])
    }

@router.delete("/logs/{log_id}")
async def delete_log(log_id: str):
    """Delete a parsed log"""
    global analyzed_logs
    initial_count = len(analyzed_logs)
    analyzed_logs = [l for l in analyzed_logs if l["id"] != log_id]
    
    if len(analyzed_logs) == initial_count:
        raise HTTPException(status_code=404, detail="Log not found")
    
    logger.info(f"Deleted log: {log_id}")
    return {"message": "Log deleted successfully"}

@router.post("/analyze-content")
async def analyze_content(entries: List[LogEntry]):
    """Analyze log entries provided directly"""
    entries_dict = [e.dict() for e in entries]
    anomalies = detect_anomalies(entries_dict)
    
    by_level = {}
    for entry in entries_dict:
        level = entry["level"]
        by_level[level] = by_level.get(level, 0) + 1
    
    return {
        "total_entries": len(entries),
        "by_level": by_level,
        "anomalies": anomalies
    }

@router.get("/patterns")
async def get_common_patterns():
    """Get common log patterns to look for"""
    return {
        "patterns": [
            {
                "name": "Failed Authentication",
                "regex": r"(failed|invalid|incorrect).*(login|password|auth)",
                "severity": "medium",
                "description": "Indicates potential brute force or credential stuffing"
            },
            {
                "name": "SQL Injection Attempt",
                "regex": r"(union|select|insert|drop|delete|update).*('|--|;)",
                "severity": "critical",
                "description": "Potential SQL injection attack"
            },
            {
                "name": "Path Traversal",
                "regex": r"\.\./|\.\.\\",
                "severity": "high",
                "description": "Attempted directory traversal attack"
            },
            {
                "name": "Privilege Escalation",
                "regex": r"(sudo|su|root|admin).*(failed|denied)",
                "severity": "high",
                "description": "Attempted privilege escalation"
            },
            {
                "name": "Service Failure",
                "regex": r"(service|daemon|process).*(crashed|stopped|failed)",
                "severity": "medium",
                "description": "Critical service failure"
            }
        ]
    }
