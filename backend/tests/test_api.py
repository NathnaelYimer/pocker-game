import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Poker Game API"}

def test_get_hands():
    response = client.get("/api/hands")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_hand():
    hand_data = {
        "id": str(uuid.uuid4()),
        "stackSize": 10000,
        "dealerPosition": 0,
        "smallBlindPosition": 1,
        "bigBlindPosition": 2,
        "playerHands": "Player 1: AhKh; Player 2: QsQd; Player 3: 9c9d; Player 4: 8s8h; Player 5: 7c7d; Player 6: 6s6h",
        "actionSequence": "r100.c.c.c.c.c",
        "winnings": "Player 1: +0; Player 2: +0; Player 3: +0; Player 4: +0; Player 5: +0; Player 6: +0"
    }
    
    response = client.post("/api/hands", json=hand_data)
    assert response.status_code == 200
    
    result = response.json()
    assert result["id"] == hand_data["id"]
    assert result["stackSize"] == hand_data["stackSize"]
