
# Employee Management Dashboard

A full-stack web application for managing employee records with role-based access and secure authentication.

## Overview

The Employee Management Dashboard provides a centralized interface for managing employee information. It combines a React frontend with a Node.js and Express backend connected to a MySQL database.

## Features

- User registration and login
- Authentication using JSON Web Tokens
- Password hashing with bcrypt
- Role-based access for administrators and users
- Employee record management
- REST API integration
- MySQL database connectivity

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- REST APIs
- JSON Web Tokens
- bcrypt

**Database**
- MySQL

## Project Structure

- `src/` - Frontend application
- `backend/` - Backend application and API routes

Check the actual folders in your repository and update these paths if necessary.

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL

### Installation

Clone the repository:

```bash
git clone https://github.com/Vijay-kumar11/Employee-Management-Dashboard.git
cd Employee-Management-Dashboard
```

Install the frontend dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

### Backend Setup

Navigate to the backend directory if your project contains a separate backend:

```bash
cd backend
npm install
```

Configure the required environment variables and MySQL database using the instructions and configuration supported by your actual backend. Then start the backend using the appropriate script defined in its `package.json`.

## Security

- Keep database credentials and JWT secrets in environment variables.
- Do not commit `.env` files or other sensitive credentials.
- Use environment variables appropriate to your deployment environment.

## Author

**Vijay Kumar**

- GitHub: [Vijay-kumar11](https://github.com/Vijay-kumar11)
- LinkedIn: [Connect with me](https://linkedin.com/in/vijaykumar-k-875826295)

---

Built as a full-stack development project to practice frontend development, backend APIs, authentication, and database integration.
