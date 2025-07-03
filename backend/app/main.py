from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import psycopg2
import logging
from psycopg2.extras import RealDictCursor
from dataclasses import dataclass
from pokerkit import NoLimitTexasHoldem, Automation
from contextlib import asynccontextmanager
from datetime import datetime


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Lifespan event handler for FastAPI
@asynccontextmanager
async def lifespan(app):
    hand_repository.create_tables()
    yield


# FastAPI app instance
app = FastAPI(title="Poker Game API", version="1.0.0", lifespan=lifespan)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@dataclass
class HandRecord:
    id: str
    stack_size: int
    dealer_position: int
    small_blind_position: int
    big_blind_position: int
    player_hands: str
    action_sequence: str
    winnings: str
    created_at: str


class HandRequest(BaseModel):
    id: str
    stackSize: int
    dealerPosition: int
    smallBlindPosition: int
    bigBlindPosition: int
    playerHands: str
    actionSequence: str
    winnings: str


class HandRepository:
    def __init__(self):
        # Use DATABASE_URL if set, else auto-detect test environment
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            self.connection_string = db_url
        else:
            # Detect if running under pytest or unittest
            import sys

            is_testing = (
                os.getenv("RUNNING_TESTS") == "1"
                or "pytest" in sys.modules
                or "unittest" in sys.modules
            )
            if is_testing:
                self.connection_string = (
                    "postgresql://postgres:password@localhost:5432/" "poker_db"
                )
            else:
                self.connection_string = (
                    "postgresql://postgres:password@db:5432/poker_db"
                )

    def get_connection(self):
        try:
            return psycopg2.connect(
                self.connection_string, cursor_factory=RealDictCursor
            )
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise

    def create_tables(self):
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        CREATE TABLE IF NOT EXISTS hands (
                            id VARCHAR(255) PRIMARY KEY,
                            stack_size INTEGER NOT NULL,
                            dealer_position INTEGER NOT NULL,
                            small_blind_position INTEGER NOT NULL,
                            big_blind_position INTEGER NOT NULL,
                            player_hands TEXT NOT NULL,
                            action_sequence TEXT NOT NULL,
                            winnings TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                        """
                    )
                    conn.commit()
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            raise

    def save_hand(self, hand: HandRecord) -> HandRecord:
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO hands (
                            id, stack_size, dealer_position,
                            small_blind_position, big_blind_position,
                            player_hands, action_sequence, winnings,
                            created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            hand.id,
                            hand.stack_size,
                            hand.dealer_position,
                            hand.small_blind_position,
                            hand.big_blind_position,
                            hand.player_hands,
                            hand.action_sequence,
                            hand.winnings,
                            hand.created_at,
                        ),
                    )
                    conn.commit()
            return hand
        except Exception as e:
            logger.error(f"Error saving hand: {e}")
            raise

    def get_all_hands(self) -> List[HandRecord]:
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT * FROM hands ORDER BY created_at DESC")
                    rows = cur.fetchall()
                    return [HandRecord(**row) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching hands: {e}")
            raise


# Initialize repository
hand_repository = HandRepository()


@app.get("/")
async def root():
    return {"message": "Poker Game API"}


@app.get("/api/hands", response_model=List[dict])
async def get_hands():
    try:
        hands = hand_repository.get_all_hands()
        return [
            {
                "id": hand.id,
                "stackSize": hand.stack_size,
                "dealerPosition": hand.dealer_position,
                "smallBlindPosition": hand.small_blind_position,
                "bigBlindPosition": hand.big_blind_position,
                "playerHands": hand.player_hands,
                "actionSequence": hand.action_sequence,
                "winnings": hand.winnings,
                "createdAt": hand.created_at,
            }
            for hand in hands
        ]
    except Exception as e:
        logger.error(f"/api/hands error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def parse_player_hands(player_hands_str):
    hands = []
    for part in player_hands_str.split(";"):
        part = part.strip()
        if not part:
            continue
        _, cards = part.split(":")
        hands.append(cards.strip())
    return hands


def parse_action_sequence(action_sequence_str):
    # Split by '.' and filter out empty
    return [a for a in action_sequence_str.split(".") if a]


def calculate_winnings_with_pokerkit(stack_size, player_hands_str, action_sequence_str):
    player_hands = parse_player_hands(player_hands_str)
    actions = parse_action_sequence(action_sequence_str)
    stacks = [stack_size] * 6

    # Use Automation enum values, not strings, for automations tuple
    automations: tuple[Automation, ...] = (
        Automation.ANTE_POSTING,
        Automation.BET_COLLECTION,
        Automation.BLIND_OR_STRADDLE_POSTING,
        Automation.HOLE_CARDS_SHOWING_OR_MUCKING,
        Automation.HAND_KILLING,
        Automation.CHIPS_PUSHING,
        Automation.CHIPS_PULLING,
    )
    state = NoLimitTexasHoldem.create_state(
        automations,
        False,  # Uniform antes?
        0,  # Antes
        (20, 40),  # Blinds
        40,  # Min-bet
        tuple(stacks),
        6,
    )

    # Deal hole cards
    for hand in player_hands:
        state.deal_hole(hand)

    # Replay actions (with burn card before each board card)
    for action in actions:
        if action == "f":
            state.fold()
        elif action == "x":
            state.check_or_call()
        elif action == "c":
            state.check_or_call()
        elif action.startswith("b"):
            amount = int(action[1:])
            state.complete_bet_or_raise_to(amount)
        elif action.startswith("r"):
            amount = int(action[1:])
            state.complete_bet_or_raise_to(amount)
        elif action == "allin":
            # Not directly supported; treat as bet/raise to player's stack
            # This may need to be improved for edge cases
            state.check_or_call()
        elif len(action) in [6, 8, 10]:  # Board cards, e.g. '3hKdQs'
            state.burn_card()
            state.deal_board(action)
        # Add more parsing as needed

    # At the end, get payoffs
    return list(state.payoffs)


@app.post("/api/hands", response_model=dict)
async def create_hand(hand_request: HandRequest):
    try:
        winnings_list = calculate_winnings_with_pokerkit(
            hand_request.stackSize,
            hand_request.playerHands,
            hand_request.actionSequence,
        )
        winnings_str = "; ".join(
            [f"Player {i+1}: {w:+d}" for i, w in enumerate(winnings_list)]
        )

        hand_record = HandRecord(
            id=hand_request.id,
            stack_size=hand_request.stackSize,
            dealer_position=hand_request.dealerPosition,
            small_blind_position=hand_request.smallBlindPosition,
            big_blind_position=hand_request.bigBlindPosition,
            player_hands=hand_request.playerHands,
            action_sequence=hand_request.actionSequence,
            winnings=winnings_str,
            created_at=datetime.now().isoformat(),
        )

        saved_hand = hand_repository.save_hand(hand_record)

        return {
            "id": saved_hand.id,
            "stackSize": saved_hand.stack_size,
            "dealerPosition": saved_hand.dealer_position,
            "smallBlindPosition": saved_hand.small_blind_position,
            "bigBlindPosition": saved_hand.big_blind_position,
            "playerHands": saved_hand.player_hands,
            "actionSequence": saved_hand.action_sequence,
            "winnings": saved_hand.winnings,
            "createdAt": saved_hand.created_at,
        }
    except Exception as e:
        logger.error(f"/api/hands POST error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
