require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("./db");

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// =====================================
// CHECK ENVIRONMENT
// =====================================

if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing in .env");
  process.exit(1);
}

// =====================================
// MIDDLEWARE
// =====================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

// Log every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// =====================================
// TEST ROUTE
// =====================================

app.get("/", (req, res) => {
  res.json({
    message: "Employee Management Backend is running!",
  });
});

// =====================================
// JWT AUTHENTICATION MIDDLEWARE
// =====================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Invalid authorization format",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error(
      "JWT verification error:",
      error.message
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message:
          "Session expired. Please login again.",
      });
    }

    return res.status(401).json({
      message: "Invalid authentication token",
    });
  }
}

// =====================================
// ADMIN AUTHORIZATION MIDDLEWARE
// =====================================

function requireAdmin(req, res, next) {
  if (req.user?.role !== "Administrator") {
    return res.status(403).json({
      message:
        "Administrator access required.",
    });
  }

  next();
}

// =====================================
// REGISTER
// =====================================

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must contain at least 6 characters.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const [existingUsers] =
      await db.query(
        "SELECT id FROM users WHERE email = ?",
        [normalizedEmail]
      );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const [result] =
      await db.query(
        `INSERT INTO users
        (name, email, password, role)
        VALUES (?, ?, ?, ?)`,
        [
          name.trim(),
          normalizedEmail,
          hashedPassword,
          "User",
        ]
      );

    return res.status(201).json({
      message:
        "Account created successfully.",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role: "User",
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error during registration.",
    });
  }
});

// =====================================
// LOGIN
// =====================================

app.post("/api/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const [users] =
      await db.query(
        "SELECT * FROM users WHERE email = ?",
        [normalizedEmail]
      );

    if (users.length === 0) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    const user = users[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error during login.",
    });
  }
});

// =====================================
// GET CURRENT USER
// =====================================

app.get(
  "/api/auth/me",
  authenticateToken,
  async (req, res) => {
    try {
      const [users] =
        await db.query(
          `SELECT id, name, email, role
           FROM users
           WHERE id = ?`,
          [req.user.id]
        );

      if (users.length === 0) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      return res.json({
        user: users[0],
      });
    } catch (error) {
      console.error(
        "Get user error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while fetching user.",
      });
    }
  }
);

// =====================================
// GET ALL EMPLOYEES
// AUTHENTICATED USERS
// =====================================

app.get(
  "/api/employees",
  authenticateToken,
  async (req, res) => {
    try {
      const [employees] =
        await db.query(
          `SELECT *
           FROM employees
           ORDER BY id DESC`
        );

      return res.json(employees);
    } catch (error) {
      console.error(
        "Get employees error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while fetching employees.",
      });
    }
  }
);

// =====================================
// ADD EMPLOYEE
// ADMIN ONLY
// =====================================

app.post(
  "/api/employees",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        email,
        department,
        position,
        status,
      } = req.body;

      if (
        !name ||
        !email ||
        !department ||
        !position
      ) {
        return res.status(400).json({
          message:
            "Name, email, department and position are required.",
        });
      }

      const [result] =
        await db.query(
          `INSERT INTO employees
          (name, email, department, position, status)
          VALUES (?, ?, ?, ?, ?)`,
          [
            name.trim(),
            email.trim(),
            department,
            position.trim(),
            status || "Active",
          ]
        );

      const [employees] =
        await db.query(
          "SELECT * FROM employees WHERE id = ?",
          [result.insertId]
        );

      return res.status(201).json({
        message:
          "Employee added successfully.",
        employee: employees[0],
      });
    } catch (error) {
      console.error(
        "Add employee error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while adding employee.",
      });
    }
  }
);

// =====================================
// UPDATE EMPLOYEE
// ADMIN ONLY
// =====================================

app.put(
  "/api/employees/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        email,
        department,
        position,
        status,
      } = req.body;

      if (
        !name ||
        !email ||
        !department ||
        !position
      ) {
        return res.status(400).json({
          message:
            "Name, email, department and position are required.",
        });
      }

      const [result] =
        await db.query(
          `UPDATE employees
           SET name = ?,
               email = ?,
               department = ?,
               position = ?,
               status = ?
           WHERE id = ?`,
          [
            name.trim(),
            email.trim(),
            department,
            position.trim(),
            status || "Active",
            id,
          ]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message:
            "Employee not found.",
        });
      }

      const [employees] =
        await db.query(
          "SELECT * FROM employees WHERE id = ?",
          [id]
        );

      return res.json({
        message:
          "Employee updated successfully.",
        employee: employees[0],
      });
    } catch (error) {
      console.error(
        "Update employee error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while updating employee.",
      });
    }
  }
);

// =====================================
// DELETE EMPLOYEE
// ADMIN ONLY
// =====================================

app.delete(
  "/api/employees/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const [result] =
        await db.query(
          "DELETE FROM employees WHERE id = ?",
          [id]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message:
            "Employee not found.",
        });
      }

      return res.json({
        message:
          "Employee deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete employee error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while deleting employee.",
      });
    }
  }
);

// =====================================
// 404 ROUTE
// =====================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

// =====================================
// GLOBAL ERROR HANDLER
// =====================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled server error:",
      error
    );

    res.status(500).json({
      message:
        "Internal server error.",
    });
  }
);

// =====================================
// START SERVER
// =====================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    "====================================="
  );

  console.log(
    "Employee Management Backend"
  );

  console.log(
    `Server running on http://localhost:${PORT}`
  );

  console.log(
    "POST /api/login is ready"
  );

  console.log(
    "POST /api/register is ready"
  );

  console.log(
    "GET /api/auth/me is ready"
  );

  console.log(
    "GET /api/employees is ready - AUTHENTICATED USERS"
  );

  console.log(
    "POST /api/employees is ready - ADMIN ONLY"
  );

  console.log(
    "PUT /api/employees/:id is ready - ADMIN ONLY"
  );

  console.log(
    "DELETE /api/employees/:id is ready - ADMIN ONLY"
  );

  console.log(
    "====================================="
  );
});