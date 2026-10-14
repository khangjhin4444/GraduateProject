# KeyboardShop

KeyboardShop is a web application for browsing and purchasing keyboards. The project has a React and TypeScript frontend and a Node.js and Express backend.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, and TanStack Query
- Backend: Node.js and Express
- Database: PostgreSQL hosted on Neon
- Authentication: JSON Web Tokens (JWT)
- Deployment: Docker and Docker Compose

## Key Features

- Browse and search the keyboard product catalog
- View relevant product recommendations
- Register, sign in, sign out, and refresh authentication sessions
- Manage a shopping cart, including item quantities
- Place and manage orders
- Update user profile information
- Administer products and manage order status
- Upload product images through ImgBB

## Prerequisites

- Node.js 22 or later and npm
- A PostgreSQL-compatible database. The backend is configured to use Neon.
- Docker Engine and the Docker Compose plugin, if you want to use Docker

## Configuration

Init database:

Open Neon SQL Editor, copy all content from `be/database/init.sql` and press Run to create ENUMs and Tables

The backend needs database credentials and authentication secrets. From the project root, create its environment file:

```powershell
Copy-Item .\be\.env.example .\be\.env
```

Edit `be/.env` and set the following values:

- `DATABASE_URL`: your PostgreSQL or Neon connection string
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: secure, private secrets
- `PORT`: keep this set to `8000` to match the Docker configuration
- `IMGBB_API_KEY`: an ImgBB API key, required for image uploads

The frontend needs the backend URL. Create `fe/.env` in the project root:

```powershell
Set-Content .\fe\.env 'VITE_BASE_URL=http://localhost:8000'
```

Do not commit environment files or share their secrets.

## Run from the terminal

Open two terminal windows from the project root.

In the first terminal, install backend dependencies and start the API:

```powershell
cd .\be
npm install
npm run dev
```

The backend listens on `http://localhost:8000`.

In the second terminal, install frontend dependencies and start the development server:

```powershell
cd .\fe
npm install
npm run dev
```

Open the frontend URL printed by Vite, usually `http://localhost:5173`.

## Run with Docker

After configuring `be/.env` and creating `fe/.env` as described above, run these commands from the project root:

```powershell
docker compose up --build
```

The frontend is available at `http://localhost:4173`, and the backend is available at `http://localhost:8000`.

To stop the containers, press `Ctrl+C` and run:

```powershell
docker compose down
```

## Run tests

Run backend tests from the `be` directory:

```powershell
npm test
```

Run frontend tests from the `fe` directory:

```powershell
npm test
```
