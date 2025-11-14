import React, { useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ReadRecords from "./ReadRecord";
import AuthContext from "../context/AuthContext";

const Dashboard = () => {
  const [response, setResponse] = useState("");
  const [decode, setDecode] = useState("");
  const [stats, setStats] = useState({
    customers: 0,
    loyalty: 0,
    campaigns: 0,
    tickets: 0,
  });
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);

  useEffect(() => {
    if (!authTokens) {
      navigate("/login");
    } else {
      try {
        const data = jwtDecode(authTokens.access);
        setDecode(data);
      } catch (error) {
        console.error("Error decoding token:", error);
        navigate("/login");
      }
    }
  }, [authTokens, navigate]);

  let username = decode.full_name;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/test/");
        setResponse(response.data.response);
      } catch (error) {
        console.log("New Error:", error);
        setResponse("Something Went Wrong");
      }
    };

    fetchData();
  }, []);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      if (!authTokens || !authTokens.access) {
        console.error("No access token available");
        return;
      }
      
      console.log("Fetching stats...");
      const headers = { Authorization: `Bearer ${authTokens.access}` };
      
      const [customersRes, loyaltyRes, campaignsRes, ticketsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/customers/", { headers }).catch(() => ({ data: [] })),
        axios.get("http://127.0.0.1:8000/api/loyalty-programs/", { headers }).catch(() => ({ data: [] })),
        axios.get("http://127.0.0.1:8000/api/campaigns/", { headers }).catch(() => ({ data: [] })),
        axios.get("http://127.0.0.1:8000/api/support-tickets/", { headers }).catch(() => ({ data: [] })),
      ]);

      console.log("Customers response:", customersRes.data);
      console.log("Stats counts:", {
        customers: customersRes.data.length,
        loyalty: loyaltyRes.data.length,
        campaigns: campaignsRes.data.length,
        tickets: ticketsRes.data.length,
      });

      setStats({
        customers: customersRes.data.length || 0,
        loyalty: loyaltyRes.data.length || 0,
        campaigns: campaignsRes.data.length || 0,
        tickets: ticketsRes.data.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (authTokens) {
      fetchStats();
    }
  }, [authTokens]);

  const actionButtons = [
    {
      title: "Add Customer",
      description: "Create a new customer",
      color: "bg-blue-500 hover:bg-blue-600",
      link: "/dashboard/add-record",
      icon: "👤",
    },
    {
      title: "Add Loyalty Program",
      description: "Create a new loyalty program",
      color: "bg-green-500 hover:bg-green-600",
      link: "/loyalty",
      icon: "🎁",
    },
    {
      title: "Add Campaign",
      description: "Create a new campaign",
      color: "bg-purple-500 hover:bg-purple-600",
      link: "/campaigns",
      icon: "📢",
    },
    {
      title: "Add Support Ticket",
      description: "Create a new support ticket",
      color: "bg-red-500 hover:bg-red-600",
      link: "/support-tickets",
      icon: "🎫",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {username || "User"}! 👋</h1>
            <p className="text-gray-600">Here's your CRM dashboard. Get started by adding your first record.</p>
          </div>
          <button
            onClick={fetchStats}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            🔄 Refresh Stats
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.customers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Loyalty Programs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.loyalty}</p>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Campaigns</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.campaigns}</p>
              </div>
              <div className="text-4xl">📢</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Support Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.tickets}</p>
              </div>
              <div className="text-4xl">🎫</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actionButtons.map((button, index) => (
              <Link
                key={index}
                to={button.link}
                className={`${button.color} text-white rounded-lg shadow-md p-6 text-center font-bold hover:shadow-lg transition transform hover:scale-105`}
              >
                <div className="text-4xl mb-3">{button.icon}</div>
                <div className="text-lg mb-1">{button.title}</div>
                <div className="text-sm opacity-90">{button.description}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Records Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Records</h2>
          <ReadRecords />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
