from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Mock SIEM data
threat_alerts: List[Dict[str, Any]] = [
    {
        "id": 1,
        "timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
        "severity": "critical",
        "type": "malware_detection",
        "source": "EDR Agent",
        "description": "Ransomware behavior detected on workstation",
        "source_ip": "192.168.1.105",
        "destination_ip": None,
        "status": "new"
    },
    {
        "id": 2,
        "timestamp": (datetime.utcnow() - timedelta(minutes=12)).isoformat(),
        "severity": "high",
        "type": "brute_force",
        "source": "Authentication System",
        "description": "Multiple failed login attempts detected",
        "source_ip": "10.0.0.55",
        "destination_ip": "192.168.1.10",
        "status": "investigating"
    },
    {
        "id": 3,
        "timestamp": (datetime.utcnow() - timedelta(minutes=25)).isoformat(),
        "severity": "medium",
        "type": "suspicious_traffic",
        "source": "Network IDS",
        "description": "Unusual outbound traffic pattern detected",
        "source_ip": "192.168.1.50",
        "destination_ip": "203.0.113.100",
        "status": "resolved"
    },
    {
        "id": 4,
        "timestamp": (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
        "severity": "low",
        "type": "policy_violation",
        "source": "DLP System",
        "description": "Attempted upload of sensitive file",
        "source_ip": "192.168.1.75",
        "destination_ip": None,
        "status": "new"
    },
    {
        "id": 5,
        "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "severity": "high",
        "type": "privilege_escalation",
        "source": "SIEM Correlation",
        "description": "User attempted to access admin resources",
        "source_ip": "192.168.1.200",
        "destination_ip": "192.168.1.1",
        "status": "investigating"
    },
    {
        "id": 6,
        "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "severity": "critical",
        "type": "data_exfiltration",
        "source": "Network DLP",
        "description": "Large data transfer to external IP",
        "source_ip": "192.168.1.150",
        "destination_ip": "198.51.100.50",
        "status": "new"
    }
]

incident_timeline: List[Dict[str, Any]] = [
    {
        "id": 101,
        "title": "Ransomware Incident",
        "created_at": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
        "severity": "critical",
        "status": "active",
        "affected_systems": 3,
        "events": [
            {"time": (datetime.utcnow() - timedelta(hours=3)).isoformat(), "description": "Initial infection detected"},
            {"time": (datetime.utcnow() - timedelta(hours=2, minutes=45)).isoformat(), "description": "Lateral movement observed"},
            {"time": (datetime.utcnow() - timedelta(hours=2)).isoformat(), "description": "Containment initiated"}
        ]
    },
    {
        "id": 102,
        "title": "Phishing Campaign",
        "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "severity": "medium",
        "status": "closed",
        "affected_systems": 12,
        "events": [
            {"time": (datetime.utcnow() - timedelta(days=1)).isoformat(), "description": "Phishing emails detected"},
            {"time": (datetime.utcnow() - timedelta(days=1, hours=6)).isoformat(), "description": "User reports received"},
            {"time": (datetime.utcnow() - timedelta(days=1, hours=12)).isoformat(), "description": "Campaign blocked"}
        ]
    }
]

class AlertFilter(BaseModel):
    severity: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    limit: int = 50

class CreateAlert(BaseModel):
    severity: str
    type: str
    description: str
    source: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None

@router.get("/alerts")
async def get_alerts(filter: AlertFilter = None):
    """Get threat alerts with optional filtering"""
    filtered = threat_alerts
    
    if filter:
        if filter.severity:
            filtered = [a for a in filtered if a["severity"] == filter.severity]
        if filter.type:
            filtered = [a for a in filtered if a["type"] == filter.type]
        if filter.status:
            filtered = [a for a in filtered if a["status"] == filter.status]
    
    # Sort by timestamp descending
    filtered = sorted(filtered, key=lambda x: x["timestamp"], reverse=True)
    
    return {"alerts": filtered[:filter.limit if filter else 50]}

@router.post("/alerts")
async def create_alert(alert: CreateAlert):
    """Create a new threat alert"""
    if alert.severity not in ["low", "medium", "high", "critical"]:
        raise HTTPException(status_code=400, detail="Invalid severity level")
    
    new_id = max((a["id"] for a in threat_alerts), default=0) + 1
    
    new_alert = {
        "id": new_id,
        "timestamp": datetime.utcnow().isoformat(),
        "severity": alert.severity,
        "type": alert.type,
        "source": alert.source,
        "description": alert.description,
        "source_ip": alert.source_ip,
        "destination_ip": alert.destination_ip,
        "status": "new"
    }
    
    threat_alerts.append(new_alert)
    logger.info(f"New alert created: ID {new_id}, severity {alert.severity}")
    
    return {"message": "Alert created", "alert": new_alert}

@router.put("/alerts/{alert_id}/status")
async def update_alert_status(alert_id: int, status: str):
    """Update alert status"""
    alert = next((a for a in threat_alerts if a["id"] == alert_id), None)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if status not in ["new", "investigating", "resolved", "false_positive"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    alert["status"] = status
    logger.info(f"Alert {alert_id} status updated to {status}")
    
    return {"message": "Status updated", "alert": alert}

@router.get("/incidents")
async def get_incidents():
    """Get all incidents"""
    return {"incidents": incident_timeline}

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: int):
    """Get specific incident details"""
    incident = next((i for i in incident_timeline if i["id"] == incident_id), None)
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return {"incident": incident}

@router.get("/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    total_alerts = len(threat_alerts)
    
    by_severity = {
        "critical": sum(1 for a in threat_alerts if a["severity"] == "critical"),
        "high": sum(1 for a in threat_alerts if a["severity"] == "high"),
        "medium": sum(1 for a in threat_alerts if a["severity"] == "medium"),
        "low": sum(1 for a in threat_alerts if a["severity"] == "low")
    }
    
    by_status = {
        "new": sum(1 for a in threat_alerts if a["status"] == "new"),
        "investigating": sum(1 for a in threat_alerts if a["status"] == "investigating"),
        "resolved": sum(1 for a in threat_alerts if a["status"] == "resolved"),
        "false_positive": sum(1 for a in threat_alerts if a["status"] == "false_positive")
    }
    
    by_type = {}
    for alert in threat_alerts:
        t = alert["type"]
        by_type[t] = by_type.get(t, 0) + 1
    
    active_incidents = sum(1 for i in incident_timeline if i["status"] == "active")
    
    # Calculate threat score (0-100)
    threat_score = min(100, (
        by_severity["critical"] * 25 +
        by_severity["high"] * 15 +
        by_severity["medium"] * 5 +
        by_severity["low"] * 1
    ))
    
    return {
        "total_alerts": total_alerts,
        "by_severity": by_severity,
        "by_status": by_status,
        "by_type": by_type,
        "active_incidents": active_incidents,
        "threat_score": threat_score,
        "last_updated": datetime.utcnow().isoformat()
    }

@router.get("/timeline")
async def get_timeline(hours: int = 24):
    """Get alert timeline for the specified period"""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    timeline_data = []
    for hour in range(hours, -1, -1):
        hour_start = datetime.utcnow() - timedelta(hours=hour)
        hour_end = hour_start + timedelta(hours=1)
        
        count = sum(
            1 for a in threat_alerts
            if datetime.fromisoformat(a["timestamp"]) >= hour_start
            and datetime.fromisoformat(a["timestamp"]) < hour_end
        )
        
        timeline_data.append({
            "hour": hour_start.isoformat(),
            "count": count
        })
    
    return {"timeline": timeline_data}

@router.get("/top-sources")
async def get_top_sources(limit: int = 10):
    """Get top alert sources"""
    source_counts = {}
    
    for alert in threat_alerts:
        src = alert["source"]
        source_counts[src] = source_counts.get(src, 0) + 1
    
    sorted_sources = sorted(
        [{"source": src, "count": count} for src, count in source_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )
    
    return {"sources": sorted_sources[:limit]}

@router.get("/correlation/{alert_id}")
async def get_correlated_alerts(alert_id: int):
    """Find correlated alerts"""
    alert = next((a for a in threat_alerts if a["id"] == alert_id), None)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Find alerts with same source IP or type within 1 hour
    alert_time = datetime.fromisoformat(alert["timestamp"])
    correlated = []
    
    for other in threat_alerts:
        if other["id"] == alert_id:
            continue
        
        other_time = datetime.fromisoformat(other["timestamp"])
        time_diff = abs((alert_time - other_time).total_seconds())
        
        if time_diff <= 3600:  # Within 1 hour
            if (other["source_ip"] == alert["source_ip"] or 
                other["type"] == alert["type"]):
                correlated.append(other)
    
    return {
        "alert": alert,
        "correlated_alerts": correlated,
        "correlation_count": len(correlated)
    }

@router.post("/generate-mock-alerts")
async def generate_mock_alerts(count: int = 10):
    """Generate mock alerts for demonstration"""
    alert_types = [
        "malware_detection", "brute_force", "suspicious_traffic",
        "policy_violation", "privilege_escalation", "data_exfiltration",
        "port_scan", "sql_injection", "dns_tunneling", "c2_communication"
    ]
    
    severities = ["low", "medium", "high", "critical"]
    statuses = ["new", "investigating", "resolved"]
    
    generated = []
    for i in range(count):
        new_alert = {
            "id": max((a["id"] for a in threat_alerts), default=0) + i + 1,
            "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(0, 1440))).isoformat(),
            "severity": random.choice(severities),
            "type": random.choice(alert_types),
            "source": random.choice(["EDR Agent", "Network IDS", "Firewall", "SIEM"]),
            "description": f"Mock alert {i+1}: Suspicious activity detected",
            "source_ip": f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}",
            "destination_ip": f"10.0.{random.randint(1, 254)}.{random.randint(1, 254)}" if random.random() > 0.5 else None,
            "status": random.choice(statuses)
        }
        threat_alerts.append(new_alert)
        generated.append(new_alert)
    
    logger.info(f"Generated {count} mock alerts")
    
    return {"generated": generated, "count": len(generated)}
