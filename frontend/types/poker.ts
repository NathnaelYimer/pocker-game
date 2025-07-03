export interface Player {
  id: number
  name: string
  stack: number
  holeCards: string[]
  currentBet: number
  hasActed: boolean
  isFolded: boolean
  isAllIn: boolean
}

export type GameState = "preflop" | "flop" | "turn" | "river" | "showdown"

export interface HandResult {
  id: string
  stackSize: number
  dealerPosition: number
  smallBlindPosition: number
  bigBlindPosition: number
  playerHands: string
  actionSequence: string
  winnings: string
  totalPot: number
  summary: string
}

export interface HandHistory {
  id: string
  stackSize: number
  dealerPosition: number
  smallBlindPosition: number
  bigBlindPosition: number
  playerHands: string
  actionSequence: string
  winnings: string
  createdAt: string
}
