import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companySales, setCompanySales] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaign_type: "email",
    status: "draft",
    subject_line: "",
    content: "",
    target_company: "",
  });
  const { authTokens } = useContext(AuthContext);

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      campaign_type: "email",
      status: "draft",
      subject_line: "",
      content: "",
      target_company: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const companies = ["Reliance Digital", "Titan", "Peter England", "Bata"];

  useEffect(() => {
    if (authTokens) {
      fetchCampaigns();
      fetchCustomers();
    }
  }, [authTokens]);

  useEffect(() => {
    if (customers.length > 0) {
      calculateCompanySales();
    }
  }, [customers]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/campaigns/", {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
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

  const calculateCompanySales = () => {
    const sales = {};
    companies.forEach(company => {
      sales[company] = 0;
    });

    customers.forEach(customer => {
      if (customer.company_name && sales.hasOwnProperty(customer.company_name)) {
        sales[customer.company_name] += parseFloat(customer.billing_amount) || 0;
      }
    });

    setCompanySales(sales);
  };

  const getSortedCompanies = () => {
    return companies
      .map(company => ({
        name: company,
        sales: companySales[company] || 0,
        budget: Math.floor((companySales[company] || 0) * 0.08),
      }))
      .sort((a, b) => b.sales - a.sales);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (campaign) => {
    console.log("Editing campaign:", campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      campaign_type: campaign.campaign_type,
      status: campaign.status,
      subject_line: campaign.subject_line,
      content: campaign.content,
      target_company: campaign.target_company || "",
    });
    setEditingId(campaign.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/campaigns/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });

      if (response.status === 204) {
        alert("✅ Campaign deleted successfully!");
        fetchCampaigns();
      } else {
        alert("❌ Error deleting campaign");
      }
    } catch (error) {
      alert("❌ Error: " + error);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleOpenForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId
        ? `http://127.0.0.1:8000/api/campaigns/${editingId}/`
        : "http://127.0.0.1:8000/api/campaigns/";
      
      const method = editingId ? "PUT" : "POST";
      const successCode = editingId ? 200 : 201;

      console.log(`${method} request to ${url}:`, formData);

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (response.status === successCode) {
        alert(`✅ Campaign ${editingId ? "updated" : "created"} successfully!`);
        resetForm();
        fetchCampaigns();
      } else {
        alert(`❌ Error ${editingId ? "updating" : "creating"} campaign: ${JSON.stringify(responseData)}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedCompanies = getSortedCompanies();
  const totalRevenue = sortedCompanies.reduce((sum, c) => sum + c.sales, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Marketing Campaigns</h1>
          <button
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                handleOpenForm();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            {showForm ? "Cancel" : "+ New Campaign"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">{editingId ? "Edit Campaign" : "Create Campaign"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Campaign Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full border rounded-md px-3 py-2"
              />
              <input
                type="text"
                name="subject_line"
                placeholder="Subject Line (for email campaigns)"
                value={formData.subject_line}
                onChange={handleInputChange}
                required
                className="w-full border rounded-md px-3 py-2"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-2"
              />
              <textarea
                name="content"
                placeholder="Campaign Content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows="4"
                className="w-full border rounded-md px-3 py-2"
              />
              <select
                name="campaign_type"
                value={formData.campaign_type}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push Notification</option>
                <option value="social">Social Media</option>
                <option value="discount">Discount Offer</option>
                <option value="event">Event</option>
              </select>

              <select
                name="target_company"
                value={formData.target_company}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Select Target Company (Optional)</option>
                <option value="Reliance Digital">Reliance Digital</option>
                <option value="Titan">Titan</option>
                <option value="Peter England">Peter England</option>
                <option value="Bata">Bata</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded-lg font-bold text-white ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
              >
                {loading ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Campaign" : "Create Campaign")}
              </button>
            </form>
          </div>
        )}

        {/* Company Sales & Budget Allocation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Company Sales & Budget Allocation</h2>
          <p className="text-gray-600 mb-4">Budget allocation: 8% of monthly revenue</p>
          
          <div className="space-y-4">
            {sortedCompanies.map((company, index) => (
              <div key={company.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-lg font-bold">#{index + 1} - {company.name}</h3>
                    <p className="text-gray-600">Total Revenue: ₹{company.sales.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Allocated Budget (8%)</p>
                    <p className="text-2xl font-bold text-green-600">₹{company.budget.toFixed(2)}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: totalRevenue > 0 ? `${(company.sales / totalRevenue) * 100}%` : "0%" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-2">Monthly Summary</h3>
            <p>Total Revenue: <span className="font-bold">₹{totalRevenue.toFixed(2)}</span></p>
            <p>Total Budget (8%): <span className="font-bold text-green-600">₹{(totalRevenue * 0.08).toFixed(2)}</span></p>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">{campaign.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                  {campaign.target_company && (
                    <p className="text-sm text-blue-600 font-medium mb-2">📌 {campaign.target_company}</p>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      campaign.status === "active" ? "bg-green-100 text-green-800" :
                      campaign.status === "draft" ? "bg-gray-100 text-gray-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {campaign.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full">No campaigns yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
