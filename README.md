Here is a **polished, professional README.md** for your Fullstack Poker Coding Exercise, including your provided screenshots and all best practices:

---

```markdown
# Texas Hold'em Poker Game – Fullstack Coding Exercise

## Overview

This project is a fullstack web application for simulating and logging 6-player Texas Hold'em poker hands. It demonstrates modern web development, backend design, and end-to-end testing.

- **Frontend:** Next.js, React, TypeScript, shadcn/ui
- **Backend:** FastAPI, Python, PostgreSQL, PokerKit, Poetry
- **Testing:** Jest, Playwright, Pytest
- **Deployment:** Docker Compose

---

## Features

- Play a full 6-player Texas Hold'em hand with all standard actions (Fold, Check, Call, Bet, Raise, Allin)
- All actions are logged and displayed in real time
- Hand history is saved to a PostgreSQL database and displayed in the UI
- RESTful API with repository pattern and raw SQL (no ORM)
- PokerKit used for hand evaluation and win/loss calculation
- Modern, responsive UI using shadcn/ui
- End-to-end and unit tests for both frontend and backend
- Fully containerized with Docker Compose

---

## Screenshots
```

![image](https://github.com/user-attachments/assets/5f48b848-6128-44f8-a39d-709b0e418c5c)
![image](https://github.com/user-attachments/assets/a96a6f81-70ef-4f6e-a9bd-f55e938c6d01)
![image](https://github.com/user-attachments/assets/96deaa34-ccd1-44da-9659-825923a60d97)
![image](https://github.com/user-attachments/assets/7d571ee0-f047-414d-9824-27ab8f46c308)

---

## Project Structure

```

poker-game/
  backend/      # FastAPI backend, PokerKit, PostgreSQL access, API, tests
  frontend/     # Next.js frontend, React, shadcn/ui, tests
  docker-compose.yml
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- (For local dev) [Node.js](https://nodejs.org/) and [Poetry](https://python-poetry.org/)

---

### 1. Clone the Repository

```sh
git clone https://github.com/NathnaelYimer/pocker-game.git
cd pocker-game
```

---

### 2. Environment Variables

#### Frontend

Create a `.env` file in the `frontend/` directory:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend

No special environment variables are required for local Docker Compose.  
If running backend locally, ensure your `DATABASE_URL` is set (see `backend/app/main.py` for default).

---

### 3. Start the Application

```sh
docker compose up -d
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

---

### 4. Usage

- Set player stacks and start a new hand.
- Use the action buttons (Fold, Check, Call, Bet, Raise, Allin) to play through a hand.
- All actions are logged in the play log.
- When the hand is complete, it is saved to the database and appears in the hand history.

---

## Testing

### Backend

```sh
cd backend
poetry install
poetry run pytest
poetry run flake8 app/
```

### Frontend

```sh
cd frontend
npm install
npm run test         # Unit tests
npx playwright install
npm run test:e2e     # End-to-end tests
```

---

## Development

### Frontend (local dev)

```sh
cd frontend
npm install
npm run dev
```

### Backend (local dev)

```sh
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

- Make sure PostgreSQL is running and accessible.

---

## Deployment

- The app is fully containerized.  
- To deploy, run:
  ```sh
  docker compose up -d
  ```
- No manual configuration is required after startup.

---

## Cleaning Up Before Submission

- Remove all build artifacts:
  - `frontend/node_modules`
  - `backend/.venv`
  - `backend/__pycache__`
  - `backend/.pytest_cache`
  - Any `.env` files (but keep `.env.example`)
- Ensure `.gitignore` includes all of the above.

---

## Troubleshooting

- **Frontend not connecting to backend?**
  - Ensure `.env` in `frontend/` points to the correct backend URL.
  - Make sure `frontend/app/api/hands/route.ts` does NOT exist.
- **Database errors?**
  - Check Docker Compose logs: `docker compose logs db`
- **Tests failing?**
  - Ensure all dependencies are installed and services are running.

---

## Acceptance Criteria Checklist

- [x] Users can play hands to completion
- [x] Hands are saved in the database and loaded after completion
- [x] Hand history is shown by fetching from the backend via RESTful API
- [x] RESTful API follows best practices
- [x] At least one integration/E2E test for frontend
- [x] Game logic is implemented on client-side and matches server validation
- [x] Game logic is separated from UI logic
- [x] Entities use @dataclass
- [x] Repository pattern for data storage/retrieval
- [x] Win/loss is calculated correctly
- [x] PEP8 compliance
- [x] Docker Compose works from the root

---

## License

This project is for educational and evaluation purposes only.

---

## Author

- [Nathnael Yimer](https://github.com/NathnaelYimer)

---

## Acknowledgements

- [PokerKit](https://github.com/uoftcprg/pokerkit)
- [shadcn/ui](https://ui.shadcn.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)




