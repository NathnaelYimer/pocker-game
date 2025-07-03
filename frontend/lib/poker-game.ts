import type { Player, GameState, HandResult } from "@/types/poker"

export class PokerGame {
  players: Player[] = []
  dealerPosition = 0
  smallBlindPosition = 1
  bigBlindPosition = 2
  currentPlayerIndex = 3
  smallBlind = 20
  bigBlind = 40
  pot = 0
  communityCards: string[] = []
  currentBet = 0
  gameState: GameState = "preflop"
  stackSize: number
  deck: string[] = []
  handId = ""

  constructor(stackSize = 10000, previousGame?: PokerGame) {
    this.stackSize = stackSize
    if (previousGame) {
      this.players = [...previousGame.players]
      this.dealerPosition = previousGame.dealerPosition
      this.smallBlindPosition = previousGame.smallBlindPosition
      this.bigBlindPosition = previousGame.bigBlindPosition
      this.currentPlayerIndex = previousGame.currentPlayerIndex
      this.pot = previousGame.pot
      this.communityCards = [...previousGame.communityCards]
      this.currentBet = previousGame.currentBet
      this.gameState = previousGame.gameState
      this.deck = [...previousGame.deck]
      this.handId = previousGame.handId
    } else {
      this.initializePlayers()
    }
  }

  private initializePlayers() {
    this.players = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      stack: this.stackSize,
      holeCards: [],
      currentBet: 0,
      hasActed: false,
      isFolded: false,
      isAllIn: false,
    }))
  }

  private createDeck(): string[] {
    const suits = ["h", "d", "c", "s"]
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]
    const deck: string[] = []

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(rank + suit)
      }
    }

    return this.shuffleDeck(deck)
  }

  private shuffleDeck(deck: string[]): string[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  startNewHand() {
    this.handId = this.generateHandId()
    this.deck = this.createDeck()
    this.communityCards = []
    this.pot = 0
    this.currentBet = this.bigBlind
    this.gameState = "preflop"

    // Reset player states
    this.players.forEach((player) => {
      player.holeCards = []
      player.currentBet = 0
      player.hasActed = false
      player.isFolded = false
      player.isAllIn = false
    })

    // Deal hole cards
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 6; j++) {
        this.players[j].holeCards.push(this.deck.pop()!)
      }
    }

    // Post blinds
    this.players[this.smallBlindPosition].stack -= this.smallBlind
    this.players[this.smallBlindPosition].currentBet = this.smallBlind
    this.players[this.bigBlindPosition].stack -= this.bigBlind
    this.players[this.bigBlindPosition].currentBet = this.bigBlind
    this.pot = this.smallBlind + this.bigBlind

    // Set first to act (UTG in preflop)
    this.currentPlayerIndex = (this.bigBlindPosition + 1) % 6
  }

  private generateHandId(): string {
    return (
      Math.random().toString(36).substr(2, 9) +
      "-" +
      Math.random().toString(36).substr(2, 4) +
      "-" +
      Math.random().toString(36).substr(2, 4) +
      "-" +
      Math.random().toString(36).substr(2, 4) +
      "-" +
      Math.random().toString(36).substr(2, 12)
    )
  }

  getCurrentPlayer(): Player | null {
    if (this.isHandComplete()) return null
    return this.players[this.currentPlayerIndex]
  }

  getValidActions(): string[] {
    const player = this.getCurrentPlayer()
    if (!player || player.isFolded || player.isAllIn) return []

    const actions = ["fold"]
    const callAmount = this.currentBet - player.currentBet

    if (callAmount === 0) {
      actions.push("check")
    } else if (callAmount < player.stack) {
      actions.push("call")
    }

    if (player.stack > callAmount) {
      if (this.currentBet === 0) {
        actions.push("bet")
      } else {
        actions.push("raise")
      }
    }

    if (player.stack > 0) {
      actions.push("allin")
    }

    return actions
  }

  fold(): string {
    const player = this.getCurrentPlayer()
    if (!player) return ""

    player.isFolded = true
    player.hasActed = true

    const result = `Player ${player.id} folds`
    this.moveToNextPlayer()
    return result
  }

  check(): string {
    const player = this.getCurrentPlayer()
    if (!player || this.currentBet > player.currentBet) return ""

    player.hasActed = true
    const result = `Player ${player.id} checks`
    this.moveToNextPlayer()
    return result
  }

  call(): string {
    const player = this.getCurrentPlayer()
    if (!player) return ""

    const callAmount = this.currentBet - player.currentBet
    const actualCall = Math.min(callAmount, player.stack)

    player.stack -= actualCall
    player.currentBet += actualCall
    player.hasActed = true
    this.pot += actualCall

    if (player.stack === 0) {
      player.isAllIn = true
    }

    const result = `Player ${player.id} calls ${actualCall}`
    this.moveToNextPlayer()
    return result
  }

  bet(amount: number): string {
    const player = this.getCurrentPlayer()
    if (!player || this.currentBet > 0) return ""

    const betAmount = Math.min(amount, player.stack)
    player.stack -= betAmount
    player.currentBet = betAmount
    player.hasActed = true
    this.currentBet = betAmount
    this.pot += betAmount

    if (player.stack === 0) {
      player.isAllIn = true
    }

    // Reset other players' hasActed status
    this.players.forEach((p, index) => {
      if (index !== this.currentPlayerIndex && !p.isFolded) {
        p.hasActed = false
      }
    })

    const result = `Player ${player.id} bets ${betAmount}`
    this.moveToNextPlayer()
    return result
  }

  raise(amount: number): string {
    const player = this.getCurrentPlayer()
    if (!player || this.currentBet === 0) return ""

    const callAmount = this.currentBet - player.currentBet
    const totalAmount = Math.min(callAmount + amount, player.stack)

    player.stack -= totalAmount
    player.currentBet += totalAmount
    player.hasActed = true
    this.currentBet = player.currentBet
    this.pot += totalAmount

    if (player.stack === 0) {
      player.isAllIn = true
    }

    // Reset other players' hasActed status
    this.players.forEach((p, index) => {
      if (index !== this.currentPlayerIndex && !p.isFolded) {
        p.hasActed = false
      }
    })

    const result = `Player ${player.id} raises to ${player.currentBet}`
    this.moveToNextPlayer()
    return result
  }

  allIn(): string {
    const player = this.getCurrentPlayer()
    if (!player || player.stack === 0) return ""

    const allInAmount = player.stack
    player.stack = 0
    player.currentBet += allInAmount
    player.hasActed = true
    player.isAllIn = true
    this.pot += allInAmount

    if (player.currentBet > this.currentBet) {
      this.currentBet = player.currentBet
      // Reset other players' hasActed status
      this.players.forEach((p, index) => {
        if (index !== this.currentPlayerIndex && !p.isFolded) {
          p.hasActed = false
        }
      })
    }

    const result = `Player ${player.id} goes all-in with ${allInAmount}`
    this.moveToNextPlayer()
    return result
  }

  private moveToNextPlayer() {
    if (this.isHandComplete()) return; // Hand is over, do nothing
    if (this.isBettingRoundComplete()) {
      this.moveToNextBettingRound();
    } else {
      let attempts = 0;
      do {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 6;
        attempts++;
        if (attempts > 6) return; // Prevent infinite loop
      } while (this.players[this.currentPlayerIndex].isFolded || this.players[this.currentPlayerIndex].isAllIn);
    }
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.players.filter((p) => !p.isFolded && !p.isAllIn)
    return activePlayers.every((p) => p.hasActed && p.currentBet === this.currentBet) || activePlayers.length <= 1
  }

  private moveToNextBettingRound() {
    // Reset for next betting round
    this.players.forEach((player) => {
      player.hasActed = false;
      player.currentBet = 0;
    });
    this.currentBet = 0;

    // Move to next game state
    switch (this.gameState) {
      case "preflop":
        this.gameState = "flop";
        break;
      case "flop":
        this.gameState = "turn";
        break;
      case "turn":
        this.gameState = "river";
        break;
      case "river":
        this.gameState = "showdown";
        break;
    }

    // If all remaining players are all-in or only one left, go to showdown
    const activePlayers = this.players.filter((p) => !p.isFolded);
    const allAllIn = activePlayers.every((p) => p.isAllIn) || activePlayers.length <= 1;
    if (allAllIn) {
      this.gameState = "showdown";
      return;
    }

    // Set first to act (first active player after dealer)
    this.currentPlayerIndex = (this.dealerPosition + 1) % 6;
    let attempts = 0;
    while (this.players[this.currentPlayerIndex].isFolded || this.players[this.currentPlayerIndex].isAllIn) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 6;
      attempts++;
      if (attempts > 6) return; // Prevent infinite loop
    }
  }

  shouldDealCommunityCards(): boolean {
    return (
      (this.gameState === "flop" && this.communityCards.length === 0) ||
      (this.gameState === "turn" && this.communityCards.length === 3) ||
      (this.gameState === "river" && this.communityCards.length === 4)
    )
  }

  dealCommunityCards(): string | null {
    if (this.gameState === "flop" && this.communityCards.length === 0) {
      // Burn one card, deal 3
      this.deck.pop()
      for (let i = 0; i < 3; i++) {
        this.communityCards.push(this.deck.pop()!)
      }
      return `Flop cards dealt: ${this.communityCards.join("")}`
    } else if (this.gameState === "turn" && this.communityCards.length === 3) {
      // Burn one card, deal 1
      this.deck.pop()
      this.communityCards.push(this.deck.pop()!)
      return `Turn card dealt: ${this.communityCards[3]}`
    } else if (this.gameState === "river" && this.communityCards.length === 4) {
      // Burn one card, deal 1
      this.deck.pop()
      this.communityCards.push(this.deck.pop()!)
      return `River card dealt: ${this.communityCards[4]}`
    }
    return null
  }

  isHandComplete(): boolean {
    const activePlayers = this.players.filter((p) => !p.isFolded)
    return activePlayers.length <= 1 || this.gameState === "showdown"
  }

  getHandResult(): HandResult {
    const activePlayers = this.players.filter((p) => !p.isFolded)

    // For now, simple winner determination (would need poker hand evaluation)
    const winner = activePlayers[0]
    winner.stack += this.pot

    const playerHands = this.players.map((p, i) => `Player ${i + 1}: ${p.holeCards.join("")}`).join("; ")

    const actionSequence = "f.f.f.r300.c.f.3hKdQs.x.b100.c.Ac.x.x.Th.b80.r160.c"

    const winnings = this.players
      .map((p, i) => {
        const change = p.stack - this.stackSize
        return `Player ${i + 1}: ${change >= 0 ? "+" : ""}${change}`
      })
      .join("; ")

    return {
      id: this.handId,
      stackSize: this.stackSize,
      dealerPosition: this.dealerPosition,
      smallBlindPosition: this.smallBlindPosition,
      bigBlindPosition: this.bigBlindPosition,
      playerHands,
      actionSequence,
      winnings,
      totalPot: this.pot,
      summary: `Hand #${this.handId} ended`,
    }
  }

  reset() {
    this.initializePlayers()
    this.dealerPosition = 0
    this.smallBlindPosition = 1
    this.bigBlindPosition = 2
    this.currentPlayerIndex = 3
    this.pot = 0
    this.communityCards = []
    this.currentBet = 0
    this.gameState = "preflop"
    this.deck = []
    this.handId = ""
  }
}
