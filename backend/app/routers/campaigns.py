from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any
from pydantic import BaseModel
import os
from groq import Groq

from app.core.database import get_db
from app.core.auth import get_current_authority
from app.models.user import User
from app.models.campaign import Campaign

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

class CampaignPrompt(BaseModel):
    prompt: str

@router.get("/")
def get_campaigns(current_user: User = Depends(get_current_authority), db: Session = Depends(get_db)) -> Any:
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    
    return {
        "campaigns": [
            {
                "id": c.id,
                "name": c.name,
                "target_segment": c.target_segment,
                "status": c.status,
                "reach": 15000, # Mocked reach for UI demo
                "conversion": "8.5%",
                "roi": "2.1x"
            } for c in campaigns
        ]
    }

@router.post("/generate")
def generate_campaign_ai(request: CampaignPrompt, current_user: User = Depends(get_current_authority)) -> Any:
    # Use Groq LLM to parse the prompt and generate campaign parameters
    # Fallback if no API key is provided
    api_key = os.getenv("GROQ_API_KEY", "mock")
    if not api_key or api_key == "mock":
        return {
            "name": "AI Generated Campaign",
            "target_audience": "Recharge Only Segment",
            "exclusion_criteria": "Fatigue Score > 0.75",
            "suppressed_count": 2100,
            "eligible_count": 14200,
            "nbo_mapping": "5% Cashback on Electricity Bill",
            "predicted_uplift": "+12%"
        }
        
    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are an AI Campaign Co-Pilot for a mobile financial service (MFS). Based on the user's prompt, output a structured campaign strategy. Return ONLY a JSON object with keys: name (string), target_audience (string), exclusion_criteria (string), suppressed_count (int), eligible_count (int), nbo_mapping (string), predicted_uplift (string). Do not include markdown formatting or explanation."},
                {"role": "user", "content": request.prompt}
            ],
            temperature=0.7,
            max_tokens=256
        )
        
        import json
        content = response.choices[0].message.content
        data = json.loads(content)
        return data
    except Exception as e:
        print(f"Error calling Groq: {e}")
        return {
            "name": "AI Generated Campaign (Fallback)",
            "target_audience": "Based on: " + request.prompt[:30],
            "exclusion_criteria": "Fatigue Score > 0.75",
            "suppressed_count": 2100,
            "eligible_count": 14200,
            "nbo_mapping": "Cashback Offer",
            "predicted_uplift": "+10%"
        }

@router.post("/deploy")
def deploy_campaign(data: dict, current_user: User = Depends(get_current_authority), db: Session = Depends(get_db)) -> Any:
    new_campaign = Campaign(
        campaign_id=f"CMP-{os.urandom(4).hex()}",
        name=data.get("name", "New Campaign"),
        type="promotional",
        target_segment=data.get("target_audience", "All"),
        status="active"
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return {"status": "success", "campaign_id": new_campaign.campaign_id}
