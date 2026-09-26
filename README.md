# Task Manager App

This is a simple task management web app I built as part of an assignment.
Users can log in with their Google account, create tasks, assign tasks to
other users, and get an email when a task is created for them or when a
task they created gets completed.

## Tech Stack

- Frontend: Next.js (with TypeScript)
- Backend: Flask (Python)
- Database: Supabase (Postgres)
- Login: Google OAuth (using Supabase Auth)
- Email: Gmail API
- Frontend hosted on: Vercel
- Backend hosted on: Render

## Live Links

- Frontend : https://frontend-eight-omega-66.vercel.app
- Backend API: https://task-manager-app-crl9.onrender.com

## What the app can do

1. Login/Signup using Google account (no separate signup form needed,
   Supabase handles this using Google OAuth)
2. Create a task with a title and description
3. Assign a task to any other user who has logged into the app before
4. Get an email when:
   - a task is assigned to you
   - a task you created gets marked as completed

## How I built it (Architecture)

**Login part:**
The frontend uses Supabase's built in Google login. When a user clicks
"Sign in with Google", Supabase handles the whole Google OAuth thing for
me, so I didn't have to write OAuth from scratch. Once logged in, Supabase
gives the browser a token (JWT). This token proves who the user is.

**Frontend talking to backend:**
Whenever the frontend needs to create a task or fetch tasks, it calls my
Flask backend and sends this token in the request header. My backend
checks if the token is valid by asking Supabase "is this a real logged in
user?" If yes, it goes ahead and does the task (create/fetch/complete).


**Backend talking to database:**
My Flask backend uses Supabase's Python client to directly read/write to
the Postgres database (profiles table and tasks table). I used the
service role key on the backend since the backend already knows who the
user is (from the token check), so it doesn't need row level security to
double check again.

**Emails:**
When a task is created with someone assigned, or a task gets marked
complete, my backend calls the Gmail API and sends a plain email to the
right person. I generated a refresh token one time locally to allow my
backend to send emails using my own Gmail account.

Simple flow diagram:

```
User -> Login with Google (Supabase handles this) -> gets a token

Frontend -> sends token with every request -> Flask Backend
Flask Backend -> checks token is valid using Supabase
Flask Backend -> reads/writes tasks in Supabase database
Flask Backend -> sends email using Gmail API when needed
```

## Folder Structure

```
task-manager-app/
├── backend/          -> Flask app (API)
├── frontend/         -> Next.js app (what user sees)
├── migrations/       -> SQL files for the database tables
└── README.md
```

## Database

I made 2 tables:

- **profiles** - stores basic user info (id, email, name). This gets
  filled automatically when someone logs in for the first time, using a
  Postgres trigger.
- **tasks** - stores the actual tasks (title, description, status,
  who created it, who it's assigned to)

I also turned on Row Level Security (RLS) on both tables so that even if
someone gets the public key, they can't just read everyone's data.

To set up the database, just go to Supabase SQL Editor and run the 3
files inside `/migrations` folder in order (001, 002, 003).

## How to run this on your own machine

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate        (on windows)
pip install -r requirements.txt
```

Now copy `.env.example` to `.env` and fill in your own values (Supabase
url/keys, gmail credentials etc)

```
python app.py
```

This will start the backend on http://localhost:5000

### Frontend

```
cd frontend
npm install
```

Copy `.env.example` to `.env.local` and fill in your values.

```
npm run dev
```

This will start the frontend on http://localhost:3000


## What I'd improve if I had more time

- Add ability to delete a task
- Add pagination if there are too many tasks
- Better error messages shown on the UI instead of just console errors
- Use a proper transactional email service instead of personal gmail