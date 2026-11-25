
import { useState } from "react";
import Auth from "./auth";
import Dashboard from "./Dashboard";
import "./App.css";

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  function handleLogin(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  }

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <Dashboard />

      <button className="logout-button" onClick={handleLogout}>
        Logout{user?.name ? ` (${user.name})` : ""}
      </button>
    </>
  );
}
