# Fitness Center Backend API

Node.js + Express + PostgreSQL backend for the Fitness Center application.

## Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Database Setup
Install PostgreSQL and create a database:
```bash
createdb fitness_center
```

### 3. Environment Variables
Create a `.env` file in the `server` directory:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and JWT secret.

### 4. Run Migrations
```bash
npm run db:migrate
```

### 5. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Exercises
- `GET /api/exercises` - Get all exercises (grouped by type)
- `GET /api/exercises/type/:type` - Get exercises by type
- `POST /api/exercises` - Create custom exercise
- `DELETE /api/exercises/:id` - Delete custom exercise

### Training Programs
- `GET /api/trainings` - Get all training programs
- `GET /api/trainings/:id` - Get program by ID
- `POST /api/trainings` - Create training program
- `PUT /api/trainings/:id` - Update training program
- `DELETE /api/trainings/:id` - Delete training program

### Training Sessions
- `GET /api/sessions` - Get all training sessions
- `GET /api/sessions/stats?period=week` - Get session statistics
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create training session
- `DELETE /api/sessions/:id` - Delete training session

## Database Schema

- **users** - User accounts
- **exercises** - Exercise library (custom + default)
- **training_programs** - User's training programs
- **program_exercises** - Exercises in programs with custom parameters
- **training_sessions** - Workout history
- **session_exercises** - Exercises performed in sessions

## Authentication

All endpoints except `/api/auth/*` require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <token>
```
