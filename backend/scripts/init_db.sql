-- Create the poker database
CREATE DATABASE IF NOT EXISTS poker_db;

-- Use the poker database
\c poker_db;

-- Create hands table
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
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_hands_created_at ON hands(created_at DESC);

-- Insert sample data
INSERT INTO hands (id, stack_size, dealer_position, small_blind_position, big_blind_position, player_hands, action_sequence, winnings, created_at)
VALUES 
    ('39b5999a-cdc1-4469-947e-649d30aa6158', 10000, 2, 3, 4, 'Player 1: Tc2c; Player 2: 5d4c; Player 3: Ah4s; Player 4: QcTd', 'f.f.f.r300.c.f.3hKdQs.x.b100.c.Ac.x.x.Th.b80.r160.c', 'Player 1: -40; Player 2: 0; Player 3: -560; Player 4: +600', NOW()),
    ('20136838-db93-4328-bfc7-dde223ef14d2', 10000, 2, 3, 4, 'Player 1: Tc2c; Player 2: 5d4c; Player 3: Ah4s; Player 4: QcTd', 'f.f.f.r300.c.f.3hKdQs.x.b100.c.Ac.x.x.Th.b80.r160.c', 'Player 1: -40; Player 2: 0; Player 3: -560; Player 4: +600', NOW())
ON CONFLICT (id) DO NOTHING;
