import { useEffect, useMemo, useState } from "react";
import "../Styles/dashboard.css";

const API_URL = "http://localhost:5000/api/employees";

const EMPTY_EMPLOYEE = {
  name: "",
  email: "",
  department: "",
  position: "",
  status: "Active",
};

function Dashboard() {
  // =====================================
  // STATE
  // =====================================

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loggedInUser, setLoggedInUser] =
    useState(null);

  const [newEmployee, setNewEmployee] =
    useState(EMPTY_EMPLOYEE);

  const employeesPerPage = 5;

  // =====================================
  // GET TOKEN
  // =====================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================
  // AUTHENTICATED REQUEST
  // =====================================

  const authenticatedFetch = async (
    url,
    options = {}
  ) => {
    const token = getToken();

    if (!token) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      return null;
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // JWT expired / invalid
    if (
      response.status === 401
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return null;
    }

    return response;
  };

  // =====================================
  // GET LOGGED-IN USER
  // =====================================

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {
        setLoggedInUser(
          JSON.parse(storedUser)
        );
      } else {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error(
        "Error reading user:",
        err
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }
  }, []);

  // =====================================
  // ROLE
  // =====================================

  const isAdmin =
    loggedInUser?.role ===
    "Administrator";

  // =====================================
  // FETCH EMPLOYEES
  // =====================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await authenticatedFetch(
          API_URL
        );

      if (!response) {
        return;
      }

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch employees"
        );
      }

      setEmployees(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Error loading employees:",
        err
      );

      setError(
        err.message ||
          "Unable to load employees from server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInUser) {
      fetchEmployees();
    }
  }, [loggedInUser]);

  // =====================================
  // SUCCESS MESSAGE
  // =====================================

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  // =====================================
  // FORM INPUT
  // =====================================

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setNewEmployee(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // =====================================
  // SEARCH
  // =====================================

  const handleSearchChange = (
    event
  ) => {
    setSearchTerm(
      event.target.value
    );

    setCurrentPage(1);
  };

  // =====================================
  // DEPARTMENT FILTER
  // =====================================

  const handleDepartmentChange = (
    event
  ) => {
    setDepartmentFilter(
      event.target.value
    );

    setCurrentPage(1);
  };

  // =====================================
  // DEPARTMENT NAMES
  // =====================================

  const departmentNames = useMemo(() => {
    return [
      ...new Set(
        employees
          .map(
            (employee) =>
              employee.department
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [employees]);

  // =====================================
  // FILTER EMPLOYEES
  // =====================================

  const filteredEmployees = useMemo(() => {
    const search =
      searchTerm
        .toLowerCase()
        .trim();

    return employees.filter(
      (employee) => {
        const name =
          employee.name
            ?.toLowerCase() || "";

        const email =
          employee.email
            ?.toLowerCase() || "";

        const position =
          employee.position
            ?.toLowerCase() || "";

        const department =
          employee.department
            ?.toLowerCase() || "";

        const matchesSearch =
          name.includes(search) ||
          email.includes(search) ||
          position.includes(search) ||
          department.includes(search);

        const matchesDepartment =
          departmentFilter === "" ||
          employee.department ===
            departmentFilter;

        return (
          matchesSearch &&
          matchesDepartment
        );
      }
    );
  }, [
    employees,
    searchTerm,
    departmentFilter,
  ]);

  // =====================================
  // PAGINATION
  // =====================================

  const totalPages = Math.ceil(
    filteredEmployees.length /
      employeesPerPage
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(
          currentPage,
          totalPages
        )
      : 1;

  const startIndex =
    (safeCurrentPage - 1) *
    employeesPerPage;

  const endIndex =
    startIndex +
    employeesPerPage;

  const currentEmployees =
    filteredEmployees.slice(
      startIndex,
      endIndex
    );

  const goToPage = (page) => {
    if (
      page >= 1 &&
      page <= totalPages
    ) {
      setCurrentPage(page);
    }
  };

  // =====================================
  // ADD EMPLOYEE MODAL
  // =====================================

  const openAddModal = () => {
    if (!isAdmin) {
      setError(
        "Administrator access required."
      );
      return;
    }

    setEditingEmployee(null);
    setNewEmployee(
      EMPTY_EMPLOYEE
    );
    setError("");
    setShowModal(true);
  };

  // =====================================
  // EDIT EMPLOYEE MODAL
  // =====================================

  const openEditModal = (
    employee
  ) => {
    if (!isAdmin) {
      setError(
        "Administrator access required."
      );
      return;
    }

    setEditingEmployee(employee);

    setNewEmployee({
      name:
        employee.name || "",
      email:
        employee.email || "",
      department:
        employee.department || "",
      position:
        employee.position || "",
      status:
        employee.status ||
        "Active",
    });

    setError("");
    setShowModal(true);
  };

  // =====================================
  // CLOSE MODAL
  // =====================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingEmployee(null);
    setNewEmployee(
      EMPTY_EMPLOYEE
    );
  };

  // =====================================
  // ADD / UPDATE EMPLOYEE
  // =====================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "Administrator access required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const employeeData = {
        name:
          newEmployee.name.trim(),
        email:
          newEmployee.email.trim(),
        department:
          newEmployee.department,
        position:
          newEmployee.position.trim(),
        status:
          newEmployee.status,
      };

      const isEditing =
        editingEmployee !== null;

      const url = isEditing
        ? `${API_URL}/${editingEmployee.id}`
        : API_URL;

      const response =
        await authenticatedFetch(
          url,
          {
            method: isEditing
              ? "PUT"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              employeeData
            ),
          }
        );

      if (!response) {
        return;
      }

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save employee"
        );
      }

      closeModal();

      await fetchEmployees();

      setCurrentPage(1);

      showSuccess(
        isEditing
          ? "Employee updated successfully."
          : "Employee added successfully."
      );
    } catch (err) {
      console.error(
        "Error saving employee:",
        err
      );

      setError(
        err.message ||
          "Failed to save employee."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // DELETE EMPLOYEE
  // =====================================

  const handleDelete = async (
    id
  ) => {
    if (!isAdmin) {
      setError(
        "Administrator access required."
      );
      return;
    }

    const employee =
      employees.find(
        (item) =>
          item.id === id
      );

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${
          employee?.name ||
          "this employee"
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response =
        await authenticatedFetch(
          `${API_URL}/${id}`,
          {
            method: "DELETE",
          }
        );

      if (!response) {
        return;
      }

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete employee"
        );
      }

      await fetchEmployees();

      showSuccess(
        "Employee deleted successfully."
      );

      if (
        currentEmployees.length ===
          1 &&
        safeCurrentPage > 1
      ) {
        setCurrentPage(
          safeCurrentPage - 1
        );
      }
    } catch (err) {
      console.error(
        "Error deleting employee:",
        err
      );

      setError(
        err.message ||
          "Failed to delete employee."
      );
    }
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    window.location.href =
      "/login";
  };

  // =====================================
  // STATISTICS
  // =====================================

  const totalEmployees =
    employees.length;

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.status ===
        "Active"
    ).length;

  const inactiveEmployees =
    employees.filter(
      (employee) =>
        employee.status ===
        "Inactive"
    ).length;

  const departments =
    departmentNames.length;

  // =====================================
  // DEPARTMENT COUNTS
  // =====================================

  const departmentCounts =
    departmentNames.map(
      (department) => {
        const count =
          employees.filter(
            (employee) =>
              employee.department ===
              department
          ).length;

        const percentage =
          totalEmployees > 0
            ? Math.round(
                (count /
                  totalEmployees) *
                  100
              )
            : 0;

        return {
          name: department,
          count,
          percentage,
        };
      }
    );

  // =====================================
  // STATUS PERCENTAGES
  // =====================================

  const activePercentage =
    totalEmployees > 0
      ? Math.round(
          (activeEmployees /
            totalEmployees) *
            100
        )
      : 0;

  const inactivePercentage =
    totalEmployees > 0
      ? Math.round(
          (inactiveEmployees /
            totalEmployees) *
            100
        )
      : 0;

  // =====================================
  // RECENT EMPLOYEES
  // =====================================

  const recentEmployees =
    [...employees]
      .sort((a, b) => {
        if (
          a.created_at &&
          b.created_at
        ) {
          return (
            new Date(
              b.created_at
            ) -
            new Date(
              a.created_at
            )
          );
        }

        return (
          Number(b.id) -
          Number(a.id)
        );
      })
      .slice(0, 5);

  // =====================================
  // USER INFORMATION
  // =====================================

  const userName =
    loggedInUser?.name ||
    "User";

  const userEmail =
    loggedInUser?.email ||
    "";

  const userRole =
    loggedInUser?.role ||
    "user";

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="dashboard-page">

      {/* TOAST */}

      {successMessage && (
        <div className="toast success-toast">
          <span>✓</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="toast error-toast">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="brand-mark">
            E
          </div>

          <div>
            <h2>
              Employee
            </h2>

            <span>
              Management
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <a
            href="#top"
            className="nav-item active"
          >
            <span className="nav-icon">
              ⌂
            </span>

            Dashboard
          </a>

          <a
            href="#employees"
            className="nav-item"
          >
            <span className="nav-icon">
              👥
            </span>

            Employees
          </a>

          <a
            href="#departments"
            className="nav-item"
          >
            <span className="nav-icon">
              ▦
            </span>

            Departments
          </a>

          <a
            href="#settings"
            className="nav-item"
          >
            <span className="nav-icon">
              ⚙
            </span>

            Settings
          </a>

        </nav>

        <button
          type="button"
          className="logout-button"
          onClick={
            handleLogout
          }
        >
          <span>↪</span>
          Logout
        </button>

      </aside>

      {/* MAIN */}

      <main
        className="dashboard-main"
        id="top"
      >

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <span className="eyebrow">
              {isAdmin
                ? "ADMINISTRATION"
                : "EMPLOYEE PORTAL"}
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Welcome back,{" "}
              {userName}! Here's
              what's happening
              today.
            </p>

          </div>

          <div className="header-user">

            <div className="header-avatar">
              {userInitial}
            </div>

            <div>
              <strong>
                {userName}
              </strong>

              <span>
                {isAdmin
                  ? "Administrator"
                  : "View Only"}
              </span>
            </div>

          </div>

        </header>

        {/* USER ACCESS NOTICE */}

        {!isAdmin && (
          <div
            className="card"
            style={{
              marginBottom:
                "20px",
            }}
          >
            <strong>
              View Only Access
            </strong>

            <p>
              You can view and
              search employees,
              but only
              Administrators can
              add, edit, or delete
              employee records.
            </p>
          </div>
        )}

        {/* STATISTICS */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon blue">
              👥
            </div>

            <div>
              <span>
                Total Employees
              </span>

              <h2>
                {totalEmployees}
              </h2>

              <small>
                All employees
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              ✓
            </div>

            <div>
              <span>
                Active Employees
              </span>

              <h2>
                {activeEmployees}
              </h2>

              <small>
                {activePercentage}%
                of workforce
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              !
            </div>

            <div>
              <span>
                Inactive Employees
              </span>

              <h2>
                {inactiveEmployees}
              </h2>

              <small>
                {inactivePercentage}%
                of workforce
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              #
            </div>

            <div>
              <span>
                Departments
              </span>

              <h2>
                {departments}
              </h2>

              <small>
                Active departments
              </small>
            </div>
          </div>

        </section>

        {/* ANALYTICS */}

        <section className="two-column-grid">

          {/* DEPARTMENT ANALYTICS */}

          <div className="card">

            <div className="card-header">
              <h2>
                Department Analytics
              </h2>

              <p>
                Employee
                distribution by
                department
              </p>
            </div>

            {departmentCounts.length ===
            0 ? (
              <div className="empty-state">
                No department data
                available.
              </div>
            ) : (
              <div className="analytics-list">

                {departmentCounts.map(
                  (department) => (
                    <div
                      className="analytics-item"
                      key={
                        department.name
                      }
                    >

                      <div className="analytics-info">

                        <div>
                          <strong>
                            {
                              department.name
                            }
                          </strong>

                          <span>
                            {
                              department.count
                            }{" "}
                            {department.count ===
                            1
                              ? "Employee"
                              : "Employees"}
                          </span>
                        </div>

                        <strong>
                          {
                            department.percentage
                          }%
                        </strong>

                      </div>

                      <div className="progress-track">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${department.percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* EMPLOYEE STATUS */}

          <div className="card">

            <div className="card-header">

              <h2>
                Employee Status
              </h2>

              <p>
                Current employee
                status distribution
              </p>

            </div>

            <div className="status-list">

              <div className="status-item">

                <div className="status-heading">

                  <div>

                    <strong>
                      Active Employees
                    </strong>

                    <span className="active-label">
                      Active
                    </span>

                  </div>

                  <strong>
                    {activeEmployees}
                  </strong>

                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill active-fill"
                    style={{
                      width: `${activePercentage}%`,
                    }}
                  />

                </div>

                <small>
                  {activePercentage}%
                  of total
                </small>

              </div>

              <div className="status-item">

                <div className="status-heading">

                  <div>

                    <strong>
                      Inactive Employees
                    </strong>

                    <span className="inactive-label">
                      Inactive
                    </span>

                  </div>

                  <strong>
                    {inactiveEmployees}
                  </strong>

                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill inactive-fill"
                    style={{
                      width: `${inactivePercentage}%`,
                    }}
                  />

                </div>

                <small>
                  {inactivePercentage}%
                  of total
                </small>

              </div>

            </div>

          </div>

        </section>

        {/* RECENT EMPLOYEES */}

        <section className="card recent-card">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                OVERVIEW
              </span>

              <h2>
                Recent Employees
              </h2>

              <p>
                Latest employees
                added to the system
              </p>

            </div>

            <a href="#employees">
              View All Employees →
            </a>

          </div>

          {loading ? (
            <div className="empty-state">
              Loading recent
              employees...
            </div>
          ) : recentEmployees.length ===
            0 ? (
            <div className="empty-state">
              No employees
              available.
            </div>
          ) : (
            <div className="table-wrapper">

              <table className="data-table recent-table">

                <thead>
                  <tr>
                    <th>
                      Employee
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Position
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {recentEmployees.map(
                    (employee) => (
                      <tr
                        key={
                          employee.id
                        }
                      >

                        <td>

                          <div className="employee-info">

                            <div className="employee-avatar">
                              {employee.name
                                ?.charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {
                                  employee.name
                                }
                              </strong>

                              <span>
                                {
                                  employee.email
                                }
                              </span>

                            </div>

                          </div>

                        </td>

                        <td>
                          <span className="department-badge">
                            {
                              employee.department
                            }
                          </span>
                        </td>

                        <td>
                          {
                            employee.position
                          }
                        </td>

                        <td>

                          <span
                            className={
                              employee.status ===
                              "Active"
                                ? "status-badge active"
                                : "status-badge inactive"
                            }
                          >
                            {
                              employee.status
                            }
                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* EMPLOYEE MANAGEMENT */}

        <section
          className="card employee-section"
          id="employees"
        >

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                MANAGEMENT
              </span>

              <h2>
                Employees
              </h2>

              <p>
                {isAdmin
                  ? "Manage your employees"
                  : "View and search employees"}
              </p>

            </div>

            {/* ADMIN ONLY */}

            {isAdmin && (
              <button
                type="button"
                className="primary-button"
                onClick={
                  openAddModal
                }
              >
                + Add Employee
              </button>
            )}

          </div>

          {/* FILTERS */}

          <div className="filters">

            <div className="search-box">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search by name, email or position..."
                value={
                  searchTerm
                }
                onChange={
                  handleSearchChange
                }
              />

            </div>

            <select
              value={
                departmentFilter
              }
              onChange={
                handleDepartmentChange
              }
            >

              <option value="">
                All Departments
              </option>

              {departmentNames.map(
                (department) => (
                  <option
                    key={
                      department
                    }
                    value={
                      department
                    }
                  >
                    {department}
                  </option>
                )
              )}

            </select>

          </div>

          {!loading && (
            <div className="results-info">

              Showing{" "}

              <strong>
                {filteredEmployees.length ===
                0
                  ? 0
                  : startIndex + 1}
              </strong>

              {" - "}

              <strong>
                {Math.min(
                  endIndex,
                  filteredEmployees.length
                )}
              </strong>

              {" of "}

              <strong>
                {
                  filteredEmployees.length
                }
              </strong>

              {" employees"}

            </div>
          )}

          {/* EMPLOYEE TABLE */}

          <div className="table-wrapper">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Position
                  </th>

                  <th>
                    Status
                  </th>

                  {/* ADMIN ONLY */}

                  {isAdmin && (
                    <th>
                      Action
                    </th>
                  )}

                </tr>

              </thead>

              <tbody>

                {loading ? (
                  <tr>

                    <td
                      colSpan={
                        isAdmin
                          ? "6"
                          : "5"
                      }
                      className="empty-cell"
                    >
                      Loading
                      employees...
                    </td>

                  </tr>
                ) : currentEmployees.length >
                  0 ? (
                  currentEmployees.map(
                    (employee) => (
                      <tr
                        key={
                          employee.id
                        }
                      >

                        <td>

                          <div className="table-employee">

                            <div className="table-avatar">
                              {employee.name
                                ?.charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <strong>
                              {
                                employee.name
                              }
                            </strong>

                          </div>

                        </td>

                        <td>
                          {
                            employee.email
                          }
                        </td>

                        <td>

                          <span className="department-badge">
                            {
                              employee.department
                            }
                          </span>

                        </td>

                        <td>
                          {
                            employee.position
                          }
                        </td>

                        <td>

                          <span
                            className={
                              employee.status ===
                              "Active"
                                ? "status-badge active"
                                : "status-badge inactive"
                            }
                          >
                            {
                              employee.status
                            }
                          </span>

                        </td>

                        {/* ADMIN ONLY */}

                        {isAdmin && (
                          <td>

                            <div className="action-buttons">

                              <button
                                type="button"
                                className="edit-button"
                                onClick={() =>
                                  openEditModal(
                                    employee
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleDelete(
                                    employee.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>
                        )}

                      </tr>
                    )
                  )
                ) : (
                  <tr>

                    <td
                      colSpan={
                        isAdmin
                          ? "6"
                          : "5"
                      }
                      className="empty-cell"
                    >
                      No employees
                      found.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          {totalPages > 1 && (
            <div className="pagination">

              <button
                type="button"
                onClick={() =>
                  goToPage(
                    safeCurrentPage -
                      1
                  )
                }
                disabled={
                  safeCurrentPage ===
                  1
                }
              >
                Previous
              </button>

              <div className="page-numbers">

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={
                      safeCurrentPage ===
                      page
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      goToPage(
                        page
                      )
                    }
                  >
                    {page}
                  </button>
                ))}

              </div>

              <button
                type="button"
                onClick={() =>
                  goToPage(
                    safeCurrentPage +
                      1
                  )
                }
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
              >
                Next
              </button>

            </div>
          )}

        </section>

        {/* DEPARTMENT OVERVIEW */}

        <section
          className="card department-section"
          id="departments"
        >

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                ANALYTICS
              </span>

              <h2>
                Department Overview
              </h2>

              <p>
                Employee
                distribution by
                department
              </p>

            </div>

          </div>

          {departmentCounts.length ===
          0 ? (
            <div className="empty-state">
              No department data
              available.
            </div>
          ) : (
            <div className="department-grid">

              {departmentCounts.map(
                (department) => (
                  <div
                    className="department-card"
                    key={
                      department.name
                    }
                  >

                    <div className="department-top">

                      <div className="department-avatar">
                        {department.name
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </div>

                      <span>
                        {
                          department.percentage
                        }%
                      </span>

                    </div>

                    <h3>
                      {
                        department.name
                      }
                    </h3>

                    <strong>
                      {
                        department.count
                      }
                    </strong>

                    <p>
                      {department.count ===
                      1
                        ? "Employee"
                        : "Employees"}
                    </p>

                    <div className="progress-track">

                      <div
                        className="progress-fill"
                        style={{
                          width: `${department.percentage}%`,
                        }}
                      />

                    </div>

                    <small>
                      {
                        department.percentage
                      }% of
                      workforce
                    </small>

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* SETTINGS */}

        <section
          className="card settings-section"
          id="settings"
        >

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                ACCOUNT
              </span>

              <h2>
                Settings
              </h2>

              <p>
                Account information
              </p>

            </div>

          </div>

          <div className="settings-content">

            <div className="settings-avatar">
              {userInitial}
            </div>

            <div className="settings-details">

              <div>
                <span>
                  Name
                </span>

                <strong>
                  {userName}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {userEmail}
                </strong>
              </div>

              <div>
                <span>
                  Role
                </span>

                <strong>
                  {isAdmin
                    ? "Administrator"
                    : "View Only User"}
                </strong>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* ADD / EDIT MODAL */}

      {showModal &&
        isAdmin && (
          <div
            className="modal-overlay"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                  event.currentTarget &&
                !saving
              ) {
                closeModal();
              }
            }}
          >

            <div className="employee-modal">

              <div className="modal-header">

                <div>

                  <span className="eyebrow">
                    EMPLOYEE MANAGEMENT
                  </span>

                  <h2>
                    {editingEmployee
                      ? "Edit Employee"
                      : "Add New Employee"}
                  </h2>

                  <p>
                    {editingEmployee
                      ? "Update employee information"
                      : "Enter employee information below"}
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleSubmit
                }
              >

                <div className="form-group">

                  <label htmlFor="name">
                    Full Name
                  </label>

                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter full name"
                    value={
                      newEmployee.name
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="employee-email">
                    Email Address
                  </label>

                  <input
                    type="email"
                    id="employee-email"
                    name="email"
                    placeholder="Enter email address"
                    value={
                      newEmployee.email
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="department">
                    Department
                  </label>

                  <select
                    id="department"
                    name="department"
                    value={
                      newEmployee.department
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >

                    <option value="">
                      Select department
                    </option>

                    {departmentNames.map(
                      (
                        department
                      ) => (
                        <option
                          key={
                            department
                          }
                          value={
                            department
                          }
                        >
                          {
                            department
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label htmlFor="position">
                    Position
                  </label>

                  <input
                    type="text"
                    id="position"
                    name="position"
                    placeholder="Enter position"
                    value={
                      newEmployee.position
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="status">
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={
                      newEmployee.status
                    }
                    onChange={
                      handleInputChange
                    }
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-button"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Saving..."
                      : editingEmployee
                      ? "Update Employee"
                      : "Add Employee"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}

export default Dashboard;