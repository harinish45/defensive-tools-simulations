from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory storage for demo purposes
firewall_rules: List[Dict[str, Any]] = []
packet_log: List[Dict[str, Any]] = []
rule_id_counter = 1

class FirewallRule(BaseModel):
    name: str
    action: str  # "allow" or "deny"
    protocol: Optional[str] = None  # "tcp", "udp", "icmp", or None for any
    port: Optional[int] = None
    ip: Optional[str] = None  # Source or destination IP
    priority: int = 1

class Packet(BaseModel):
    src_ip: str
    dst_ip: str
    protocol: str
    port: int
    payload_size: int

class PacketResult(BaseModel):
    packet: Dict[str, Any]
    decision: str
    matched_rule: Optional[str]
    explanation: str

@router.get("/rules")
async def get_rules():
    """Get all firewall rules"""
    return {"rules": firewall_rules}

@router.post("/rules")
async def create_rule(rule: FirewallRule):
    """Create a new firewall rule"""
    global rule_id_counter
    
    if rule.action not in ["allow", "deny"]:
        raise HTTPException(status_code=400, detail="Action must be 'allow' or 'deny'")
    
    if rule.port and (rule.port < 1 or rule.port > 65535):
        raise HTTPException(status_code=400, detail="Port must be between 1 and 65535")
    
    new_rule = {
        "id": rule_id_counter,
        "name": rule.name,
        "action": rule.action,
        "protocol": rule.protocol,
        "port": rule.port,
        "ip": rule.ip,
        "priority": rule.priority,
        "created_at": datetime.utcnow().isoformat()
    }
    
    firewall_rules.append(new_rule)
    rule_id_counter += 1
    
    logger.info(f"Firewall rule created: {rule.name}")
    return {"message": "Rule created successfully", "rule": new_rule}

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: int):
    """Delete a firewall rule"""
    global firewall_rules
    initial_count = len(firewall_rules)
    firewall_rules = [r for r in firewall_rules if r["id"] != rule_id]
    
    if len(firewall_rules) == initial_count:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    logger.info(f"Firewall rule deleted: {rule_id}")
    return {"message": "Rule deleted successfully"}

@router.post("/simulate")
async def simulate_packet(packet: Packet):
    """Simulate a packet going through the firewall"""
    decision = "allow"
    matched_rule = None
    explanation = "No matching rules - default allow"
    
    # Sort rules by priority (lower number = higher priority)
    sorted_rules = sorted(firewall_rules, key=lambda x: x["priority"])
    
    for rule in sorted_rules:
        matches = True
        
        # Check protocol match
        if rule["protocol"] and rule["protocol"].lower() != packet.protocol.lower():
            matches = False
        
        # Check port match
        if rule["port"] and rule["port"] != packet.port:
            matches = False
        
        # Check IP match
        if rule["ip"] and rule["ip"] not in [packet.src_ip, packet.dst_ip]:
            matches = False
        
        if matches:
            decision = rule["action"]
            matched_rule = rule["name"]
            explanation = f"Matched rule '{rule['name']}' ({rule['action']})"
            break
    
    result = {
        "packet": {
            "src_ip": packet.src_ip,
            "dst_ip": packet.dst_ip,
            "protocol": packet.protocol,
            "port": packet.port,
            "payload_size": packet.payload_size
        },
        "decision": decision,
        "matched_rule": matched_rule,
        "explanation": explanation,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    packet_log.append(result)
    logger.info(f"Packet simulated: {packet.src_ip} -> {packet.dst_ip}:{packet.port} - {decision}")
    
    return result

@router.get("/analytics")
async def get_analytics():
    """Get firewall analytics"""
    total_packets = len(packet_log)
    allowed_packets = sum(1 for p in packet_log if p["decision"] == "allow")
    blocked_packets = sum(1 for p in packet_log if p["decision"] == "deny")
    
    # Count blocked ports
    port_counts: Dict[int, int] = {}
    for packet in packet_log:
        if packet["decision"] == "deny":
            port = packet["packet"]["port"]
            port_counts[port] = port_counts.get(port, 0) + 1
    
    top_blocked_ports = sorted(
        [{"port": port, "count": count} for port, count in port_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:5]
    
    return {
        "total_packets": total_packets,
        "allowed_packets": allowed_packets,
        "blocked_packets": blocked_packets,
        "block_rate": round(blocked_packets / total_packets * 100, 2) if total_packets > 0 else 0,
        "top_blocked_ports": top_blocked_ports,
        "total_rules": len(firewall_rules)
    }

@router.get("/logs")
async def get_logs(limit: int = 50):
    """Get recent packet logs"""
    return {"logs": packet_log[-limit:]}

@router.post("/generate-traffic")
async def generate_traffic(count: int = 10):
    """Generate mock traffic for demonstration"""
    protocols = ["tcp", "udp", "icmp"]
    common_ports = [22, 80, 443, 3306, 5432, 8080, 21, 25, 53, 110]
    
    generated = []
    for _ in range(count):
        packet = Packet(
            src_ip=f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}",
            dst_ip=f"10.0.{random.randint(1, 254)}.{random.randint(1, 254)}",
            protocol=random.choice(protocols),
            port=random.choice(common_ports),
            payload_size=random.randint(64, 1500)
        )
        result = await simulate_packet(packet)
        generated.append(result)
    
    logger.info(f"Generated {count} mock traffic packets")
    return {"generated": generated, "count": len(generated)}

@router.delete("/logs")
async def clear_logs():
    """Clear packet logs"""
    global packet_log
    packet_log = []
    logger.info("Packet logs cleared")
    return {"message": "Logs cleared successfully"}
