import { useEffect, useState } from "react";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Plus,
  Search,
  CalendarDays,
  ArrowUpRight,
  Utensils,
  Car,
  ShoppingBag,
  House,
  HeartPulse,
  Film,
  MoreHorizontal,
  Trash2,
  Pencil,
  CircleDollarSign,
  Coffee,
  Zap,
  Plane,
  Tag
} from "lucide-react";
import "./App.css";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Housing",
  "Travel",
  "Other"
];

const categoryStyles = {
  Food: { icon: Utensils, color: "orange" },
  Transport: { icon: Car, color: "blue" },
  Shopping: { icon: ShoppingBag, color: "purple" },
  Bills: { icon: Zap, color: "yellow" },
  Entertainment: { icon: Film, color: "pink" },
  Health: { icon: HeartPulse, color: "red" },
  Housing: { icon: House, color: "green" },
  Travel: { icon: Plane, color: "cyan" },
  Other: { icon: Tag, color: "gray" }
};

const currency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCategoryStyle(category) {
  return categoryStyles[category] || categoryStyles.Other;
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: getLocalDateString(),
    note: ""
  });

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const now = new Date();

  const monthlyExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const monthlyTotal = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const filteredExpenses = expenses.filter((expense) => {
    const searchText = search.toLowerCase();

    return (
      expense.title.toLowerCase().includes(searchText) ||
      expense.category.toLowerCase().includes(searchText)
    );
  });

  // Build a simple spending chart for the last 7 days.
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));

    const dateKey = getLocalDateString(day);

    const amount = expenses
      .filter(
        (expense) =>
          getLocalDateString(new Date(expense.date)) === dateKey
      )
      .reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
      );

    return {
      label: day.toLocaleDateString("en-IN", {
        weekday: "short"
      }),
      amount
    };
  });

  const maxWeeklyAmount = Math.max(
    ...weeklyData.map((day) => day.amount),
    1
  );

  async function fetchExpenses() {
    try {
      setError("");

      const response = await fetch("/api/expenses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error("Could not load expenses");
      }

      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleCancelEdit() {
    setEditingId(null);

    setForm({
      title: "",
      amount: "",
      category: "Food",
      date: getLocalDateString(),
      note: ""
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `/api/expenses/${editingId}`
          : "/api/expenses",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            ...form,
            amount: Number(form.amount)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not save expense"
        );
      }

      if (isEditing) {
        // Update the existing expense in the dashboard.
        setExpenses((previous) =>
          previous.map((expense) =>
            expense._id === editingId ? data : expense
          )
        );
      } else {
        // Add the new expense to the top of the list.
        setExpenses((previous) => [data, ...previous]);
      }

      handleCancelEdit();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(expense) {
    setEditingId(expense._id);

    setForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "Other",
      date: getLocalDateString(new Date(expense.date)),
      note: expense.note || ""
    });

    document
      .getElementById("add-expense")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this expense?"
      )
    ) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not delete expense"
        );
      }

      setExpenses((previous) =>
        previous.filter((expense) => expense._id !== id)
      );

      if (editingId === id) {
        handleCancelEdit();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-icon">
            <Wallet size={21} />
          </span>

          <span>
            pocket<span className="brand-dot">.</span>
          </span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <a className="nav-link active" href="#overview">
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </a>

          <a className="nav-link" href="#transactions">
            <Receipt size={18} />
            <span>Transactions</span>
          </a>

          <a className="nav-link" href="#analytics">
            <TrendingUp size={18} />
            <span>Analytics</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">
              <CircleDollarSign size={19} />
            </div>

            <p>
              Small steps today, stronger savings tomorrow.
            </p>
          </div>

          <div className="profile">
            <div className="profile-avatar">S</div>

            <div>
              <strong>Sujan</strong>
              <span>Personal account</span>
            </div>

            <MoreHorizontal
              size={18}
              className="profile-more"
            />
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Workspace / <strong>Overview</strong>
            </p>

            <h1>
              Your finances, <span>in focus.</span>
            </h1>

            <p className="page-subtitle">
              Here's what's happening with your money.
            </p>
          </div>

          <a className="topbar-date" href="#transactions">
            <CalendarDays size={16} />

            <span>
              {now.toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric"
              })}
            </span>
          </a>
        </header>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card total-stat">
            <div className="stat-top">
              <span className="stat-label">
                Total expenses
              </span>

              <span className="stat-icon green-icon">
                <Wallet size={18} />
              </span>
            </div>

            <h2>{currency(totalExpenses)}</h2>

            <div className="stat-foot">
              <span className="stat-foot-icon">
                <ArrowUpRight size={14} />
              </span>
              All-time spending
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                This month
              </span>

              <span className="stat-icon purple-icon">
                <CalendarDays size={18} />
              </span>
            </div>

            <h2>{currency(monthlyTotal)}</h2>

            <div className="stat-foot">
              <span className="stat-muted">
                {monthlyExpenses.length} transactions
              </span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-label">
                Transactions
              </span>

              <span className="stat-icon orange-icon">
                <Receipt size={18} />
              </span>
            </div>

            <h2>{expenses.length}</h2>

            <div className="stat-foot">
              <span className="stat-muted">
                Expenses recorded
              </span>
            </div>
          </article>
        </section>

        <section className="middle-grid">
          <article
            className="dashboard-card chart-card"
            id="analytics"
          >
            <div className="card-heading">
              <div>
                <h2>Spending activity</h2>
                <p>Your expenses over the last 7 days</p>
              </div>

              <span className="heading-icon">
                <TrendingUp size={17} />
              </span>
            </div>

            <div className="chart-total">
              <strong>
                {currency(
                  weeklyData.reduce(
                    (sum, day) => sum + day.amount,
                    0
                  )
                )}
              </strong>

              <span>Last 7 days</span>
            </div>

            <div className="bar-chart">
              {weeklyData.map((day, index) => (
                <div
                  className="chart-column"
                  key={`${day.label}-${index}`}
                >
                  <div className="bar-track">
                    <div
                      className={`chart-bar ${
                        index === 6 ? "today-bar" : ""
                      }`}
                      style={{
                        height: `${Math.max(
                          day.amount === 0
                            ? 4
                            : 10,
                          (day.amount / maxWeeklyAmount) * 100
                        )}%`
                      }}
                      title={currency(day.amount)}
                    />
                  </div>

                  <span className="chart-day">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article
            className="dashboard-card add-card"
            id="add-expense"
          >
            <div className="card-heading">
              <div>
                <h2>
                  {editingId
                    ? "Edit expense"
                    : "Add expense"}
                </h2>

                <p>
                  {editingId
                    ? "Update your transaction details"
                    : "Record a new transaction"}
                </p>
              </div>

              <span className="heading-icon add-heading-icon">
                {editingId ? (
                  <Pencil size={18} />
                ) : (
                  <Plus size={18} />
                )}
              </span>
            </div>

            <form
              className="expense-form"
              onSubmit={handleSubmit}
            >
              <div className="form-row">
                <label>
                  Expense name

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Coffee with friends"
                    required
                  />
                </label>
              </div>

              <div className="form-row two-fields">
                <label>
                  Amount (₹)

                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </label>

                <label>
                  Category

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row two-fields">
                <label>
                  Date

                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Note

                  <input
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="expense-form-actions">
                <button
                  className="submit-button"
                  type="submit"
                >
                  {editingId ? (
                    <Pencil size={17} />
                  ) : (
                    <Plus size={17} />
                  )}

                  {editingId
                    ? "Save changes"
                    : "Add transaction"}
                </button>

                {editingId && (
                  <button
                    className="cancel-edit-button"
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </article>
        </section>

        <section
          className="dashboard-card transactions-card"
          id="transactions"
        >
          <div className="transactions-heading">
            <div>
              <h2>Recent transactions</h2>
              <p>Your latest expense activity</p>
            </div>

            <div className="transaction-search">
              <Search size={16} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search expenses..."
              />
            </div>
          </div>

          <div className="transaction-table">
            <div className="table-header">
              <span>Transaction</span>
              <span>Category</span>
              <span>Date</span>
              <span className="amount-heading">
                Amount
              </span>
              <span></span>
            </div>

            {loading ? (
              <div className="table-empty">
                Loading transactions...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="table-empty">
                {search
                  ? "No matching expenses found."
                  : "No expenses yet. Add your first one above!"}
              </div>
            ) : (
              filteredExpenses.map((expense) => {
                const style = getCategoryStyle(
                  expense.category
                );

                const CategoryIcon = style.icon;

                return (
                  <div
                    className="transaction-row"
                    key={expense._id}
                  >
                    <div className="transaction-name">
                      <span
                        className={`category-icon ${style.color}`}
                      >
                        <CategoryIcon size={17} />
                      </span>

                      <div>
                        <strong>{expense.title}</strong>

                        {expense.note && (
                          <small>{expense.note}</small>
                        )}
                      </div>
                    </div>

                    <div>
                      <span
                        className={`category-pill ${style.color}`}
                      >
                        {expense.category}
                      </span>
                    </div>

                    <span className="transaction-date">
                      {new Date(
                        expense.date
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>

                    <strong className="transaction-amount">
                      {currency(expense.amount)}
                    </strong>

                    <div className="transaction-actions">
                      <button
                        className="edit-transaction"
                        onClick={() => handleEdit(expense)}
                        aria-label={`Edit ${expense.title}`}
                        title="Edit transaction"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-transaction"
                        onClick={() =>
                          handleDelete(expense._id)
                        }
                        aria-label={`Delete ${expense.title}`}
                        title="Delete transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="transactions-footer">
            <span>
              {filteredExpenses.length} transaction
              {filteredExpenses.length !== 1 ? "s" : ""}
            </span>

            <span>Amounts in INR (₹)</span>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>Made with care</span>
          <span>Personal finance dashboard</span>
        </footer>
      </main>
    </div>
  );
}

export default App;