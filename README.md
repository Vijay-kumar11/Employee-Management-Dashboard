# Employee Management Dashboard

A full-stack employee management application built with React, Node.js, Express.js, JWT authentication, and MySQL.

## Overview

This project provides a practical employee management dashboard for managing employee records, user authentication, and admin-led record operations. It combines a React frontend with a Node.js backend and MySQL database to demonstrate full-stack application development.

## Problem It Solves

The application helps manage employee records in a structured way by enabling authenticated users to view employee data and allowing administrators to add, edit, and delete employees. It also demonstrates key backend concepts such as authentication, authorization, and database-driven CRUD operations.

## Features

### Authentication
- User registration
- User login
- JWT-based authentication
- Protected routes on the frontend
- Admin-only access checks for write operations

### Employee Management
- View employee list
- Search employees by name, email, or position
- Filter employees by department
- Add new employee records
- Edit employee records
- Delete employee records
- View employee status summary and department analytics in the dashboard

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- React Router

### Backend
- Node.js
- Express.js
- MySQL2
- JWT
- bcrypt
- CORS
- dotenv

### Database
- MySQL

## Project Structure

```text
Employee-Management-Dashboard/
├── backend/
│   ├── db.js
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── Components/
│   ├── Pages/
│   ├── Styles/
│   ├── assets/
│   ├── index.css
│   ├── main.jsx
│   └── ...
├── .gitignore
├── README.md
├── index.html
├── package-lock.json
├── package.json
├── vite.config.js
└── eslint.config.js
```

## How It Works

The frontend uses React Router to navigate between login, registration, and a protected dashboard. The dashboard fetches employee data from the backend using JWT-protected API calls. The backend verifies the token, checks the user's role, and allows admin-only operations for creating, updating, and deleting employees.

## Backend API

The backend exposes the following verified endpoints in `backend/server.js`:

```text
POST   /api/register
POST   /api/login
GET    /api/auth/me
GET    /api/employees
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id
```

## Environment Variables

Create a `.env` file in the `backend` directory with variables like:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
PORT=5000
```

> Keep secrets in environment variables and never commit real credentials.

## Frontend Environment Variable

The frontend reads the backend base URL from:

```env
VITE_API_URL=http://localhost:5000/api
```

This value is used in `src/Pages/Dashboard.jsx` when calling the API.

## Database Setup

### 1. Create a MySQL database
Use MySQL to create a database that matches the value in `DB_NAME`.

### 2. Configure the backend database connection
The backend connection is created in `backend/db.js` using `mysql2/promise`.

### 3. Start the backend server
In the `backend` directory:

```bash
npm install
node server.js
```

You can also use nodemon if installed:

```bash
npx nodemon server.js
```

## Frontend Setup

From the project root:

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Prerequisites

- Node.js and npm
- MySQL Server
- A local database instance
- A configured `.env` file in `backend`

## Security Notes

- JWT secret values should remain in environment variables.
- Database credentials should never be committed to GitHub.
- Admin-only actions are checked server-side in `backend/server.js`.

## Technical Concepts Demonstrated

- React application structure
- React Router navigation
- Protected routes
- JWT authentication
- Password hashing with bcrypt
- Express.js API design
- MySQL database integration
- CRUD operations
- Role-based authorization
- Frontend-backend integration

## Learning Outcome

This project helped reinforce full-stack application development by combining a React frontend, Express API, JWT-based authentication, and MySQL database operations into a practical employee management workflow.

## Author

Vijay Kumar

GitHub: https://github.com/Vijay-kumar11
LinkedIn: https://linkedin.com/in/vijaykumar-k-875826295

## Project Status

Completed as a full-stack practice project focused on employee management, authentication, CRUD operations, and database integration.
