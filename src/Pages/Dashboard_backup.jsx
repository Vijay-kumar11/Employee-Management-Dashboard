import { useEffect, useState } from "react";
import "../Styles/dashboard.css";

const API_URL = "http://localhost:5000/api/employees";

function Dashboard() {
  // =====================================
  // STATES
  // =====================================

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loggedInUser, setLoggedInUser] = useState(null);

  const employeesPerPage = 5;

  // =====================================
  // FORM DATA
  // =====================================

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    status: "Active",
  });

  // =====================================
  // GET LOGGED-IN USER
  // =====================================

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);

        console.log("Logged-in user:", user);

        setLoggedInUser(user);
      }
    } catch (error) {
      console.error("Error reading logged-in user:", error);
    }
  }, []);

  // =====================================
  // FETCH EMPLOYEES
  // =====================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();

      console.log("Employees loaded from MySQL:", data);

      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);

      setError("Unable to load employees from server.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // LOAD EMPLOYEES
  // =====================================

  useEffect(() => {
    fetchEmployees();
  }, []);

  // =====================================
  // SUCCESS MESSAGE
  // =====================================

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  // =====================================
  // FORM INPUT
  // =====================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setNewEmployee((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================
  // SEARCH
  // =====================================

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  // =====================================
  // DEPARTMENT FILTER
  // =====================================

  const handleDepartmentChange = (event) => {
    setDepartmentFilter(event.target.value);
    setCurrentPage(1);
  };

  // =====================================
  // FILTER EMPLOYEES
  // =====================================

  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.toLowerCase().trim();

    const name = employee.name?.toLowerCase() || "";
    const email = employee.email?.toLowerCase() || "";
    const position = employee.position?.toLowerCase() || "";

    const matchesSearch =
      name.includes(search) ||
      email.includes(search) ||
      position.includes(search);

    const matchesDepartment =
      departmentFilter === "" ||
      employee.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  // =====================================
  // PAGINATION
  // =====================================

  const totalPages = Math.ceil(
    filteredEmployees.length / employeesPerPage
  );

  const startIndex = (currentPage - 1) * employeesPerPage;
  const endIndex = startIndex + employeesPerPage;

  const currentEmployees = filteredEmployees.slice(
    startIndex,
    endIndex
  );

  // =====================================
  // OPEN ADD MODAL
  // =====================================

  const openAddModal = () => {
    setEditingEmployee(null);
    setError("");

    setNewEmployee({
      name: "",
      email: "",
      department: "",
      position: "",
      status: "Active",
    });

    setShowModal(true);
  };

  // =====================================
  // OPEN EDIT MODAL
  // =====================================

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setError("");

    setNewEmployee({
      name: employee.name || "",
      email: employee.email || "",
      department: employee.department || "",
      position: employee.position || "",
      status: employee.status || "Active",
    });

    setShowModal(true);
  };

  // =====================================
  // ADD / UPDATE
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const employeeData = {
        name: newEmployee.name.trim(),
        email: newEmployee.email.trim(),
        department: newEmployee.department,
        position: newEmployee.position.trim(),
        status: newEmployee.status,
      };

      const isEditing = editingEmployee !== null;

      const url = isEditing
        ? `${API_URL}/${editingEmployee.id}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save employee"
        );
      }

      console.log(
        isEditing
          ? "Employee updated successfully:"
          : "Employee added successfully:",
        data
      );

      closeModal();

      await fetchEmployees();

      setCurrentPage(1);

      showSuccess(
        isEditing
          ? "Employee updated successfully!"
          : "Employee added successfully!"
      );
    } catch (error) {
      console.error("Error saving employee:", error);

      setError(
        error.message || "Failed to save employee."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // DELETE
  // =====================================

  const handleDelete = async (id) => {
    const employee = employees.find(
      (item) => item.id === id
    );

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${
        employee?.name || "this employee"
      }?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete employee"
        );
      }

      await fetchEmployees();

      showSuccess("Employee deleted successfully!");

      if (
        currentEmployees.length === 1 &&
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);

      setError(
        error.message || "Failed to delete employee."
      );
    }
  };

  // =====================================
  // CLOSE MODAL
  // =====================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingEmployee(null);

    setNewEmployee({
      name: "",
      email: "",
      department: "",
      position: "",
      status: "Active",
    });
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // =====================================
  // DASHBOARD STATISTICS
  // =====================================

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "Inactive"
  ).length;

  // =====================================
  // DEPARTMENTS
  // =====================================

  const departmentNames = [
    ...new Set(
      employees
        .map((employee) => employee.department)
        .filter(Boolean)
    ),
  ];

  const departments = departmentNames.length;

  const departmentCounts = departmentNames.map(
    (department) => {
      const count = employees.filter(
        (employee) =>
          employee.department === department
      ).length;

      const percentage =
        totalEmployees > 0
          ? Math.round(
              (count / totalEmployees) * 100
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
          (activeEmployees / totalEmployees) * 100
        )
      : 0;

  const inactivePercentage =
    totalEmployees > 0
      ? Math.round(
          (inactiveEmployees / totalEmployees) * 100
        )
      : 0;

  // =====================================
  // RECENT EMPLOYEES
  // =====================================

  const recentEmployees = [...employees]
    .sort((a, b) => {
      if (a.created_at && b.created_at) {
        return (
          new Date(b.created_at) -
          new Date(a.created_at)
        );
      }

      return Number(b.id) - Number(a.id);
    })
    .slice(0, 5);

  // =====================================
  // PAGE CHANGE
  // =====================================

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // =====================================
  // USER INFORMATION
  // =====================================

  const userName =
    loggedInUser?.name || "Vijay";

  const userEmail =
    loggedInUser?.email ||
    "admin@example.com";

  const userRole =
    loggedInUser?.role ||
    "Administrator";

  const userInitial =
    userName.charAt(0).toUpperCase();

  // =====================================
  // JSX
  // =====================================

  return (
    <div className="dashboard-page">

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "25px",
            right: "25px",
            zIndex: 9999,
            backgroundColor: "#198754",
            color: "#ffffff",
            padding: "15px 25px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.2)",
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          style={{
            position: "fixed",
            top: "25px",
            right: "25px",
            zIndex: 9999,
            backgroundColor: "#dc3545",
            color: "#ffffff",
            padding: "15px 25px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.2)",
          }}
        >
          ✕ {error}

          <button
            type="button"
            onClick={() => setError("")}
            style={{
              marginLeft: "15px",
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-logo">
          <h2>Employee</h2>
          <span>Management</span>
        </div>

        <nav className="sidebar-menu">

          <a
            href="/dashboard"
            className="menu-item active"
          >
            Dashboard
          </a>

          <a
            href="#employees"
            className="menu-item"
          >
            Employees
          </a>

          <a
            href="#departments"
            className="menu-item"
          >
            Departments
          </a>

          <a
            href="#settings"
            className="menu-item"
          >
            Settings
          </a>

        </nav>

        <div className="sidebar-bottom">

          <button
            type="button"
            className="menu-item logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>
            <h1>Dashboard</h1>

            <p>
              Welcome back, {userName}! Here's
              what's happening today.
            </p>
          </div>

          <div className="user-info">

            <div className="user-avatar">
              {userInitial}
            </div>

            <div>
              <strong>{userName}</strong>

              <span>{userRole}</span>
            </div>

          </div>

        </header>

        {/* STATISTICS */}

        <section className="stats-container">

          <div className="stat-card">
            <div className="stat-content">
              <span>Total Employees</span>
              <h2>{totalEmployees}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span>Active Employees</span>
              <h2>{activeEmployees}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span>Inactive Employees</span>
              <h2>{inactiveEmployees}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <span>Departments</span>
              <h2>{departments}</h2>
            </div>
          </div>

        </section>

        {/* ANALYTICS */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "25px",
            marginTop: "30px",
          }}
        >

          {/* DEPARTMENT ANALYTICS */}

          <div
            style={{
              background: "#ffffff",
              padding: "25px",
              borderRadius: "12px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >

            <h2
              style={{
                marginBottom: "5px",
              }}
            >
              Department Analytics
            </h2>

            <p
              style={{
                color: "#6b7280",
                marginBottom: "25px",
              }}
            >
              Employee distribution by department
            </p>

            {departmentCounts.length === 0 ? (
              <p>No department data available.</p>
            ) : (
              departmentCounts.map(
                (department) => (
                  <div
                    key={department.name}
                    style={{
                      marginBottom: "20px",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginBottom: "7px",
                      }}
                    >
                      <strong>
                        {department.name}
                      </strong>

                      <span>
                        {department.count}{" "}
                        {department.count === 1
                          ? "Employee"
                          : "Employees"}
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "9px",
                        background: "#e5e7eb",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >

                      <div
                        style={{
                          width: `${department.percentage}%`,
                          height: "100%",
                          background: "#4f46e5",
                          borderRadius: "10px",
                          transition:
                            "width 0.4s ease",
                        }}
                      />

                    </div>

                    <small
                      style={{
                        color: "#6b7280",
                      }}
                    >
                      {department.percentage}%
                      of workforce
                    </small>

                  </div>
                )
              )
            )}

          </div>

          {/* STATUS ANALYTICS */}

          <div
            style={{
              background: "#ffffff",
              padding: "25px",
              borderRadius: "12px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >

            <h2
              style={{
                marginBottom: "5px",
              }}
            >
              Employee Status
            </h2>

            <p
              style={{
                color: "#6b7280",
                marginBottom: "25px",
              }}
            >
              Current employee status distribution
            </p>

            {/* ACTIVE */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "8px",
                }}
              >

                <strong>
                  Active Employees
                </strong>

                <strong>
                  {activeEmployees}
                </strong>

              </div>

              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    width: `${activePercentage}%`,
                    height: "100%",
                    background: "#198754",
                    borderRadius: "10px",
                  }}
                />

              </div>

              <small
                style={{
                  color: "#6b7280",
                }}
              >
                {activePercentage}% of total
              </small>

            </div>

            {/* INACTIVE */}

            <div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "8px",
                }}
              >

                <strong>
                  Inactive Employees
                </strong>

                <strong>
                  {inactiveEmployees}
                </strong>

              </div>

              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    width: `${inactivePercentage}%`,
                    height: "100%",
                    background: "#dc3545",
                    borderRadius: "10px",
                  }}
                />

              </div>

              <small
                style={{
                  color: "#6b7280",
                }}
              >
                {inactivePercentage}% of total
              </small>

            </div>

          </div>

        </section>

        {/* RECENT EMPLOYEES */}

        <section
          style={{
            marginTop: "30px",
            padding: "25px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >

            <div>
              <h2
                style={{
                  marginBottom: "5px",
                }}
              >
                Recent Employees
              </h2>

              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Latest employees added to the system
              </p>
            </div>

          </div>

          {loading ? (
            <p>Loading recent employees...</p>
          ) : recentEmployees.length === 0 ? (
            <p>No employees available.</p>
          ) : (

            <div
              style={{
                overflowX: "auto",
              }}
            >

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >

                <thead>
                  <tr>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      Employee
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      Department
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      Position
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        borderBottom:
                          "1px solid #e5e7eb",
                      }}
                    >
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {recentEmployees.map(
                    (employee) => (
                      <tr key={employee.id}>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <strong>
                            {employee.name}
                          </strong>

                          <br />

                          <small
                            style={{
                              color: "#6b7280",
                            }}
                          >
                            {employee.email}
                          </small>
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          {employee.department}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          {employee.position}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >

                          <span
                            className={
                              employee.status ===
                              "Active"
                                ? "status active-status"
                                : "status inactive-status"
                            }
                          >
                            {employee.status}
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

        {/* EMPLOYEE SECTION */}

        <section
          className="employee-section"
          id="employees"
        >

          <div className="section-header">

            <div>
              <h2>Employees</h2>

              <p>
                Manage your employees
              </p>
            </div>

            <button
              type="button"
              className="add-employee-button"
              onClick={openAddModal}
            >
              + Add Employee
            </button>

          </div>

          {/* SEARCH */}

          <div className="search-container">

            <input
              type="text"
              placeholder="Search by name, email or position..."
              value={searchTerm}
              onChange={handleSearchChange}
            />

            <select
              value={departmentFilter}
              onChange={handleDepartmentChange}
            >

              <option value="">
                All Departments
              </option>

              {departmentNames.map(
                (department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                )
              )}

            </select>

          </div>

          {/* RESULTS */}

          {!loading && (
            <div className="results-info">

              Showing{" "}

              <strong>
                {filteredEmployees.length === 0
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
                {filteredEmployees.length}
              </strong>

              {" employees"}

            </div>
          )}

          {/* TABLE */}

          <div className="table-container">

            <table>

              <thead>

                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="no-results"
                    >
                      Loading employees...
                    </td>
                  </tr>

                ) : currentEmployees.length > 0 ? (

                  currentEmployees.map(
                    (employee) => (

                      <tr
                        key={employee.id}
                      >

                        <td>
                          {employee.name}
                        </td>

                        <td>
                          {employee.email}
                        </td>

                        <td>
                          {employee.department}
                        </td>

                        <td>
                          {employee.position}
                        </td>

                        <td>

                          <span
                            className={
                              employee.status ===
                              "Active"
                                ? "status active-status"
                                : "status inactive-status"
                            }
                          >
                            {employee.status}
                          </span>

                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              type="button"
                              className="action-button edit-button"
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
                              className="action-button delete-button"
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

                      </tr>

                    )
                  )

                ) : (

                  <tr>
                    <td
                      colSpan="6"
                      className="no-results"
                    >
                      No employees found.
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
                    currentPage - 1
                  )
                }
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="page-numbers">

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map((page) => (

                  <button
                    type="button"
                    key={page}
                    onClick={() =>
                      goToPage(page)
                    }
                    className={
                      currentPage === page
                        ? "page-number active-page"
                        : "page-number"
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
                    currentPage + 1
                  )
                }
                disabled={
                  currentPage === totalPages
                }
              >
                Next
              </button>

            </div>

          )}

        </section>

        {/* DEPARTMENT OVERVIEW */}

        <section
          id="departments"
          style={{
            marginTop: "30px",
            padding: "25px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >

          <h2>Department Overview</h2>

          <p>
            Employee distribution by department
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginTop: "25px",
            }}
          >

            {departmentCounts.map(
              (department) => (

                <div
                  key={department.name}
                  style={{
                    padding: "20px",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: "10px",
                  }}
                >

                  <h3>
                    {department.name}
                  </h3>

                  <h2>
                    {department.count}
                  </h2>

                  <p>
                    {department.count === 1
                      ? "Employee"
                      : "Employees"}
                  </p>

                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "#e5e7eb",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >

                    <div
                      style={{
                        width: `${department.percentage}%`,
                        height: "100%",
                        background: "#4f46e5",
                        borderRadius: "10px",
                      }}
                    />

                  </div>

                  <small>
                    {department.percentage}%
                    {" of workforce"}
                  </small>

                </div>

              )
            )}

          </div>

        </section>

        {/* SETTINGS */}

        <section
          id="settings"
          style={{
            marginTop: "30px",
            marginBottom: "30px",
            padding: "25px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >

          <h2>Settings</h2>

          <p>Account information</p>

          <div
            style={{
              marginTop: "20px",
              lineHeight: "1.8",
            }}
          >

            <p>
              <strong>Name:</strong>{" "}
              {userName}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {userEmail}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {userRole}
            </p>

          </div>

        </section>

      </main>

      {/* ADD / EDIT MODAL */}

      {showModal && (

        <div className="modal-overlay">

          <div className="employee-modal">

            <div className="modal-header">

              <div>

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
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {/* NAME */}

              <div className="modal-form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter full name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="modal-form-group">

                <label htmlFor="employee-email">
                  Email Address
                </label>

                <input
                  type="email"
                  id="employee-email"
                  name="email"
                  placeholder="Enter email address"
                  value={newEmployee.email}
                  onChange={handleInputChange}
                  required
                />

              </div>

              {/* DEPARTMENT */}

              <div className="modal-form-group">

                <label htmlFor="department">
                  Department
                </label>

                <select
                  id="department"
                  name="department"
                  value={newEmployee.department}
                  onChange={handleInputChange}
                  required
                >

                  <option value="">
                    Select department
                  </option>

                  {departmentNames.map(
                    (department) => (
                      <option
                        key={department}
                        value={department}
                      >
                        {department}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* POSITION */}

              <div className="modal-form-group">

                <label htmlFor="position">
                  Position
                </label>

                <input
                  type="text"
                  id="position"
                  name="position"
                  placeholder="Enter position"
                  value={newEmployee.position}
                  onChange={handleInputChange}
                  required
                />

              </div>

              {/* STATUS */}

              <div className="modal-form-group">

                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={newEmployee.status}
                  onChange={handleInputChange}
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={saving}
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