// src/pages/ViewLogs.jsx
import React, { useEffect, useState } from "react";

export default function ViewLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://localhost:8000/api/accounts/logs/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Failed to fetch logs");
        return;
      }

      const data = await response.json();

      // ✅ Limit to 15 most recent logs
      setLogs(data.slice(0, 15));
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  const toggleBlockUser = async (username, currentStatus) => {
    const action = currentStatus === "Blocked" ? "unblock" : "block";
    if (!window.confirm(`Are you sure you want to ${action} ${username}?`)) return;

    try {
      const token = localStorage.getItem("access");
      const response = await fetch(
        `http://localhost:8000/api/accounts/block-user/${username}/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || `Failed to ${action} user.`);
        return;
      }

      alert(`${username} has been ${action === "block" ? "blocked" : "unblocked"}.`);

      // ✅ Refresh logs to get correct status
      fetchLogs();
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Login Activity Logs</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border">Username</th>
              <th className="py-2 px-4 border">Date & Time Logged In</th>
              <th className="py-2 px-4 border">Role</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="text-center">
                  <td className="py-2 px-4 border">{log.username}</td>
                  <td className="py-2 px-4 border">
                    {new Date(log.login_time).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border">{log.role}</td>
                  <td className="py-2 px-4 border">{log.status}</td>
                  <td className="py-2 px-4 border">
                    <button
                      onClick={() => toggleBlockUser(log.username, log.status)}
                      className={`px-2 py-1 rounded ${
                        log.status === "Blocked"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {log.status === "Blocked" ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
