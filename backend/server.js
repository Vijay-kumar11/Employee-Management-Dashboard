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
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
    console.error("JWT verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please login again.",
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
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.user.role !== "Administrator") {
    return res.status(403).json({
      message: "Administrator access required",
    });
  }

  next();
}

// =====================================
// LOGIN
// =====================================

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Login request:", email);

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const sql = `
    SELECT
      id,
      name,
      email,
      password,
      role
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email.trim()], async (err, results) => {
    if (err) {
      console.error("Login database error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    }

    if (results.length === 0) {
      console.log("Login failed:", email);

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    try {
      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        console.log("Login failed:", email);

        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // =====================================
      // CREATE JWT
      // =====================================

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: "2h",
        }
      );

      // Never send password to frontend
      delete user.password;

      console.log(
        `Login successful: ${email} (${user.role})`
      );

      return res.json({
        message: "Login successful",
        token,
        user,
      });
    } catch (error) {
      console.error("Login authentication error:", error);

      return res.status(500).json({
        message: "Authentication error",
      });
    }
  });
});

// =====================================
// REGISTER NEW USER
// =====================================

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  console.log("Registration request:", email);

  // Validate fields
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required",
    });
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  // =====================================
  // CHECK EXISTING EMAIL
  // =====================================

  const checkSql = `
    SELECT id
    FROM users
    WHERE email = ?
  `;

  db.query(
    checkSql,
    [cleanEmail],
    async (err, results) => {
      if (err) {
        console.error(
          "Registration database error:",
          err
        );

        return res.status(500).json({
          message: "Database error",
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          message: "Email is already registered",
        });
      }

      try {
        // =====================================
        // HASH PASSWORD
        // =====================================

        const hashedPassword = await bcrypt.hash(
          password,
          10
        );

        // IMPORTANT:
        // Every registered account is a normal user.
        // Administrator accounts should be created/managed separately.
        const role = "user";

        const insertSql = `
          INSERT INTO users
          (name, email, password, role)
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [
            cleanName,
            cleanEmail,
            hashedPassword,
            role,
          ],
          (err, result) => {
            if (err) {
              console.error(
                "Error creating user:",
                err
              );

              return res.status(500).json({
                message: "Failed to create account",
              });
            }

            console.log(
              "User registered successfully:",
              cleanEmail
            );

            return res.status(201).json({
              message:
                "Account created successfully",
              userId: result.insertId,
            });
          }
        );
      } catch (error) {
        console.error(
          "Password hashing error:",
          error
        );

        return res.status(500).json({
          message: "Failed to create account",
        });
      }
    }
  );
});

// =====================================
// GET CURRENT AUTHENTICATED USER
// =====================================

app.get(
  "/api/auth/me",
  authenticateToken,
  (req, res) => {
    res.json({
      message: "Authenticated user",
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

// =====================================
// GET ALL EMPLOYEES
// AUTHENTICATED USERS ONLY
// =====================================

app.get(
  "/api/employees",
  authenticateToken,
  (req, res) => {
    console.log(
      `Fetching employees for ${req.user.email} (${req.user.role})`
    );

    const sql = `
      SELECT
        id,
        name,
        email,
        department,
        position,
        status,
        created_at
      FROM employees
      ORDER BY id ASC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(
          "Error fetching employees:",
          err
        );

        return res.status(500).json({
          message: "Failed to fetch employees",
        });
      }

      console.log(
        `Employees fetched successfully. Count: ${results.length}`
      );

      return res.json(results);
    });
  }
);

// =====================================
// GET SINGLE EMPLOYEE
// AUTHENTICATED USERS ONLY
// =====================================

app.get(
  "/api/employees/:id",
  authenticateToken,
  (req, res) => {
    const { id } = req.params;

    const sql = `
      SELECT
        id,
        name,
        email,
        department,
        position,
        status,
        created_at
      FROM employees
      WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {
      if (err) {
        console.error(
          "Error fetching employee:",
          err
        );

        return res.status(500).json({
          message: "Failed to fetch employee",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      return res.json(results[0]);
    });
  }
);

// =====================================
// ADD EMPLOYEE
// ADMINISTRATOR ONLY
// =====================================

app.post(
  "/api/employees",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const {
      name,
      email,
      department,
      position,
      status,
    } = req.body;

    console.log(
      "Add employee request by:",
      req.user.email
    );

    console.log("Request body:", req.body);

    if (
      !name ||
      !email ||
      !department ||
      !position ||
      !status
    ) {
      return res.status(400).json({
        message:
          "All employee fields are required",
      });
    }

    const sql = `
      INSERT INTO employees
      (name, email, department, position, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      name.trim(),
      email.trim(),
      department,
      position,
      status,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(
          "Error adding employee:",
          err
        );

        return res.status(500).json({
          message: "Failed to add employee",
        });
      }

      console.log(
        "Employee added successfully. ID:",
        result.insertId
      );

      return res.status(201).json({
        message:
          "Employee added successfully",
        id: result.insertId,
        name,
        email,
        department,
        position,
        status,
      });
    });
  }
);

// =====================================
// UPDATE EMPLOYEE
// ADMINISTRATOR ONLY
// =====================================

app.put(
  "/api/employees/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const { id } = req.params;

    const {
      name,
      email,
      department,
      position,
      status,
    } = req.body;

    console.log(
      `Update employee ID ${id} by ${req.user.email}`
    );

    console.log("Request body:", req.body);

    if (
      !name ||
      !email ||
      !department ||
      !position ||
      !status
    ) {
      return res.status(400).json({
        message:
          "All employee fields are required",
      });
    }

    const sql = `
      UPDATE employees
      SET
        name = ?,
        email = ?,
        department = ?,
        position = ?,
        status = ?
      WHERE id = ?
    `;

    const values = [
      name.trim(),
      email.trim(),
      department,
      position,
      status,
      id,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(
          "Error updating employee:",
          err
        );

        return res.status(500).json({
          message: "Failed to update employee",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      console.log(
        "Employee updated successfully. ID:",
        id
      );

      return res.json({
        message:
          "Employee updated successfully",
        id: Number(id),
        name,
        email,
        department,
        position,
        status,
      });
    });
  }
);

// =====================================
// DELETE EMPLOYEE
// ADMINISTRATOR ONLY
// =====================================

app.delete(
  "/api/employees/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const { id } = req.params;

    console.log(
      `Delete employee ID ${id} by ${req.user.email}`
    );

    const sql = `
      DELETE FROM employees
      WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error(
          "Error deleting employee:",
          err
        );

        return res.status(500).json({
          message: "Failed to delete employee",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      console.log(
        "Employee deleted successfully. ID:",
        id
      );

      return res.json({
        message:
          "Employee deleted successfully",
      });
    });
  }
);

// =====================================
// 404 ROUTE
// =====================================

app.use((req, res) => {
  console.log(
    "404 - Route not found:",
    req.method,
    req.url
  );

  res.status(404).json({
    message: "Route not found",
    method: req.method,
    path: req.url,
  });
});

// =====================================
// ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    message: "Internal server error",
  });
});

// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {
  console.log("=====================================");
  console.log("Employee Management Backend");
  console.log(
    `Server running on http://localhost:${PORT}`
  );
  console.log("POST /api/login is ready");
  console.log("POST /api/register is ready");
  console.log("GET /api/auth/me is ready");
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
  console.log("=====================================");
});