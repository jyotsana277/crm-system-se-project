import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: "",
    subject: "",
    description: "",
    category: "general",
    priority: "medium",
    status: "open",
  });
  const [comment, setComment] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { authTokens } = useContext(AuthContext);

  useEffect(() => {
    if (authTokens) {
      fetchTickets();
      fetchCustomers();
    }
  }, [authTokens]);

  useEffect(() => {
    if (selectedTicket) {
      setStatusUpdate(selectedTicket.status);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/support-tickets/", {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/customers/", {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/support-tickets/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 201) {
        alert("✅ Support ticket created successfully!");
        setFormData({
          customer: "",
          subject: "",
          description: "",
          category: "general",
          priority: "medium",
          status: "open",
        });
        setShowForm(false);
        fetchTickets();
      } else {
        const errorData = await response.json();
        alert("❌ Error: " + JSON.stringify(errorData));
      }
    } catch (error) {
      alert("❌ Error creating ticket: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !comment.trim()) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ticket-comments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({
          ticket: selectedTicket.id,
          comment_text: comment,
        }),
      });

      if (response.ok) {
        alert("✅ Comment added successfully!");
        setComment("");
        fetchTickets();
        const ticket = tickets.find(t => t.id === selectedTicket.id);
        if (ticket) setSelectedTicket(ticket);
      } else {
        alert("❌ Error adding comment");
      }
    } catch (error) {
      alert("❌ Error adding comment: " + error);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket || statusUpdate === selectedTicket.status) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/support-tickets/${selectedTicket.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({
          status: statusUpdate,
        }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        alert(`✅ Ticket status updated to ${statusUpdate.toUpperCase()}!`);
        setSelectedTicket(updatedTicket);
        setStatusUpdate(updatedTicket.status);
        fetchTickets();
      } else {
        alert("❌ Error updating ticket status");
      }
    } catch (error) {
      alert("❌ Error updating status: " + error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Delete this support ticket? This cannot be undone.")) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/support-tickets/${ticketId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });

      if (response.status === 204) {
        alert("✅ Ticket deleted successfully");
        setTickets(tickets.filter((t) => t.id !== ticketId));
      } else {
        alert("❌ Failed to delete ticket");
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("❌ Error deleting ticket: " + error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-2">Manage customer support issues</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSelectedTicket(null);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            {showForm ? "Cancel" : "+ New Ticket"}
          </button>
        </div>

        {/* Form */}
        {showForm && !selectedTicket && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="general">General Inquiry</option>
                    <option value="complaint">Complaint</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Issue subject"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Detailed description..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-bold text-white ${
                  loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Creating..." : "Create Ticket"}
              </button>
            </form>
          </div>
        )}

        {/* Selected Ticket Details */}
        {selectedTicket && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedTicket.subject}</h2>
                <p className="text-gray-600">Ticket #{selectedTicket.id}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className={`px-2 py-1 rounded text-sm font-medium w-fit ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Priority</p>
                <p className={`px-2 py-1 rounded text-sm font-medium w-fit ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Created</p>
                <p className="text-sm">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Customer</p>
                <p className="text-sm">{selectedTicket.customer_name || "N/A"}</p>
              </div>
            </div>

            {/* Status Update Section */}
            <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-bold mb-3 text-blue-900">Update Ticket Status</h3>
              {selectedTicket.status === 'resolved' ? (
                <div className="p-3 bg-yellow-100 border border-yellow-400 rounded mb-3">
                  <p className="text-yellow-800 font-bold">⏸️ Ticket is RESOLVED</p>
                  <p className="text-yellow-700 text-sm">Once resolved, you can only close it to finalize. No other changes allowed.</p>
                </div>
              ) : null}
              
              <form onSubmit={handleUpdateStatus} className="flex gap-2 flex-wrap items-center">
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  disabled={selectedTicket.status === "closed" || (selectedTicket.status === "resolved" && statusUpdate !== "closed")}
                  className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed (Final - No Further Changes)</option>
                </select>
                <button
                  type="submit"
                  disabled={updatingStatus || selectedTicket.status === "closed" || statusUpdate === selectedTicket.status}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </form>
              {selectedTicket.status === "closed" && (
                <p className="text-red-600 font-bold mt-2">⛔ This ticket is CLOSED and cannot be modified</p>
              )}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-bold mb-2">Description</h3>
              <p className="text-gray-700">{selectedTicket.description}</p>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4">Comments & Notes</h3>

              <div className="space-y-4 mb-6">
                {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                  selectedTicket.comments.map((comment, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded">
                      <div className="flex justify-between mb-2">
                        <p className="font-semibold text-sm">Support Team</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-gray-700">{comment.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No comments yet</p>
                )}
              </div>

              {selectedTicket.status === "closed" ? (
                <div className="p-4 bg-red-50 rounded border border-red-200">
                  <p className="text-red-700 font-bold">🔒 This ticket is CLOSED. No comments can be added.</p>
                </div>
              ) : selectedTicket.status === "resolved" ? (
                <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-yellow-700 font-bold">⏸️ This ticket is RESOLVED. No new comments can be added.</p>
                  <p className="text-yellow-600 text-sm">Close the ticket to archive it permanently.</p>
                </div>
              ) : (
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment or update note..."
                    rows="3"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  ></textarea>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                  >
                    Add Comment
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tickets Table */}
        {!selectedTicket && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">All Tickets</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Ticket ID</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Subject</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Customer</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Priority</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Created</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-bold">#{ticket.id}</td>
                        <td className="px-4 py-2">{ticket.subject}</td>
                        <td className="px-4 py-2">{ticket.customer_name || "N/A"}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{new Date(ticket.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2 space-x-3">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-2 text-center text-gray-500">
                        No support tickets yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketsPage;
