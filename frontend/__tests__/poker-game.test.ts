import { PokerGame } from "@/lib/poker-game"

describe("PokerGame", () => {
  let game: PokerGame

  beforeEach(() => {
    game = new PokerGame(10000)
  })

  it("should initialize with correct stack size", () => {
    expect(game.players.length).toBe(6)
    expect(game.players[0].stack).toBe(10000)
  })

  test("should start new hand correctly", () => {
    game.startNewHand()

    expect(game.pot).toBe(60) // Small blind + big blind
    expect(game.players[1].stack).toBe(9980) // Small blind posted
    expect(game.players[2].stack).toBe(9960) // Big blind posted
    expect(game.players[0].holeCards).toHaveLength(2)
  })

  test("should handle fold action", () => {
    game.startNewHand()
    const result = game.fold()

    expect(result).toContain("Player 4 folds")
    expect(game.players[3].isFolded).toBe(true)
  })

  test("should handle check action when no bet", () => {
    game.startNewHand()
    game.currentBet = 0
    game.currentPlayerIndex = 0

    const result = game.check()
    expect(result).toContain("Player 1 checks")
  })

  test("should validate actions correctly", () => {
    game.startNewHand()
    const validActions = game.getValidActions()

    expect(validActions).toContain("fold")
    expect(validActions).toContain("call")
    expect(validActions).toContain("raise")
    expect(validActions).toContain("allin")
  })
})
