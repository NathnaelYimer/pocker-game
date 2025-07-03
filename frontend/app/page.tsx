"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PokerGame } from "@/lib/poker-game"
import type { HandHistory } from "@/types/poker"
import { Plus, Minus } from "lucide-react"

export default function PokerApp() {
  const [game, setGame] = useState<PokerGame | null>(null)
  const [stackSize, setStackSize] = useState(10000)
  const [betAmount, setBetAmount] = useState(40)
  const [raiseAmount, setRaiseAmount] = useState(40)
  const [playLog, setPlayLog] = useState<string[]>([])
  const [handHistory, setHandHistory] = useState<HandHistory[]>([])
  const [isGameStarted, setIsGameStarted] = useState(false)


  // Use backend API URL from env or fallback
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchHandHistory()
  }, [])

  const fetchHandHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hands`)
      if (response.ok) {
        const history = await response.json()
        setHandHistory(history)
      }
    } catch (error) {
      console.error("Failed to fetch hand history:", error)
    }
  }

  const applyStacks = () => {
    const newGame = new PokerGame(stackSize)
    setGame(newGame)
    setPlayLog([])
  }

  const resetGame = () => {
    if (game) {
      game.reset()
      setGame(new PokerGame(stackSize))
      setPlayLog([])
      setIsGameStarted(false)
    } else {
      applyStacks()
    }
  }

  const startHand = () => {
    if (!game) return

    game.startNewHand()
    setIsGameStarted(true)

    // Log initial state
    const logs = [
      ...game.players.map((player, index) => `Player ${index + 1} is dealt ${player.holeCards.join("")}`),
      "",
      `Player ${game.dealerPosition + 1} is the dealer`,
      `Player ${game.smallBlindPosition + 1} posts small blind - ${game.smallBlind} chips`,
      `Player ${game.bigBlindPosition + 1} posts big blind - ${game.bigBlind} chips`,
      "",
    ]
    setPlayLog(logs)
  }

  const handleAction = (action: string, amount?: number) => {
    if (!game || !isGameStarted) return

    const currentPlayer = game.getCurrentPlayer()
    if (!currentPlayer) return

    let actionResult = ""

    switch (action) {
      case "fold":
        actionResult = game.fold()
        break
      case "check":
        actionResult = game.check()
        break
      case "call":
        actionResult = game.call()
        break
      case "bet":
        actionResult = game.bet(amount || betAmount)
        break
      case "raise":
        actionResult = game.raise(amount || raiseAmount)
        break
      case "allin":
        actionResult = game.allIn()
        break
    }

    if (actionResult) {
      setPlayLog((prev) => [...prev, actionResult])
    }

    // Check if hand is complete
    if (game.isHandComplete()) {
      const handResult = game.getHandResult()
      setPlayLog((prev) => [...prev, "", handResult.summary, `Final pot was ${handResult.totalPot}`])

      // Save hand to database
      saveHandToDatabase(handResult)
      setIsGameStarted(false)
    }

    // Check if new betting round started
    if (game.shouldDealCommunityCards()) {
      const communityCards = game.dealCommunityCards()
      if (communityCards) {
        setPlayLog((prev) => [...prev, communityCards])
      }
    }

    setGame(new PokerGame(game.stackSize, game))
  }

  const saveHandToDatabase = async (handResult: any) => {
    try {
      await fetch(`${API_URL}/api/hands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(handResult),
      })
      fetchHandHistory()
    } catch (error) {
      console.error("Failed to save hand:", error)
    }
  }

  const getValidActions = () => {
    if (!game || !isGameStarted) return []
    return game.getValidActions()
  }

  const validActions = getValidActions()
  const currentPlayer = game?.getCurrentPlayer()

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Texas Hold'em Poker</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Game Controls and Play Log */}
          <div className="space-y-6">
            {/* Setup Section */}
            <Card>
              <CardHeader>
                <CardTitle>Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Stacks</label>
                  <Input
                    type="number"
                    value={stackSize}
                    onChange={(e) => setStackSize(Number(e.target.value))}
                    className="w-24"
                    disabled={isGameStarted}
                  />
                  <Button onClick={applyStacks} disabled={isGameStarted} variant="outline">
                    Apply
                  </Button>
                  <Button onClick={resetGame} variant="destructive">
                    {isGameStarted ? "Reset" : "Start"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions Section */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleAction("fold")}
                      disabled={!validActions.includes("fold")}
                      variant="secondary"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Fold
                    </Button>
                    <Button
                      onClick={() => handleAction("check")}
                      disabled={!validActions.includes("check")}
                      variant="secondary"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Check
                    </Button>
                    <Button
                      onClick={() => handleAction("call")}
                      disabled={!validActions.includes("call")}
                      variant="secondary"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Call
                    </Button>
                    <Button
                      onClick={() => handleAction("allin")}
                      disabled={!validActions.includes("allin")}
                      variant="destructive"
                    >
                      ALL IN
                    </Button>
                  </div>

                  {/* Bet Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBetAmount(Math.max(40, betAmount - 40))}
                      disabled={!validActions.includes("bet")}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleAction("bet")}
                      disabled={!validActions.includes("bet")}
                      variant="secondary"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Bet {betAmount}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBetAmount(betAmount + 40)}
                      disabled={!validActions.includes("bet")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Raise Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRaiseAmount(Math.max(40, raiseAmount - 40))}
                      disabled={!validActions.includes("raise")}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleAction("raise")}
                      disabled={!validActions.includes("raise")}
                      variant="secondary"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Raise {raiseAmount}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRaiseAmount(raiseAmount + 40)}
                      disabled={!validActions.includes("raise")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {!isGameStarted && game && (
                    <Button onClick={startHand} className="w-full" variant="default">
                      Deal Cards
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Play Log */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Playing field log</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-1 text-sm font-mono">
                    {playLog.map((log, index) => (
                      <div key={index} className="text-gray-600">
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Hand History */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Hand History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {handHistory.map((hand, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg space-y-1 text-sm">
                        <div className="font-mono">Hand #{hand.id}</div>
                        <div>
                          Stack {hand.stackSize}; Dealer: Player {hand.dealerPosition + 1}; Player{" "}
                          {hand.smallBlindPosition + 1} Small blind; Player {hand.bigBlindPosition + 1}
                        </div>
                        <div>Hands: {hand.playerHands}</div>
                        <div>Actions: {hand.actionSequence}</div>
                        <div>Winnings: {hand.winnings}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
