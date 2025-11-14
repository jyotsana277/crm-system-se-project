import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import AuthContext from "../context/AuthContext";

const EditRecord = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address: "", city: "", state: "", country: "", zipcode: "",
    company_name: "", date_of_purchase: "", billing_amount: "",
  });
  const [billingTransactions, setBillingTransactions] = useState([]);
  const [newBillingAmount, setNewBillingAmount] = useState("");
  const [billingDescription, setBillingDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/customers/${recordId}/`, {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        });
        setFormData(response.data);
        
        // Try to fetch billing transactions if available
        try {
          const billingResponse = await axios.get(
            `http://127.0.0.1:8000/api/billing-transactions/?customer=${recordId}`,
            { headers: { Authorization: `Bearer ${authTokens.access}` } }
          );
          setBillingTransactions(billingResponse.data || []);
        } catch (billingError) {
          console.log("Billing transactions not available yet");
          setBillingTransactions([]);
        }
      } catch (error) {
        console.error("Error loading customer:", error);
        Swal.fire({ title: "Error", text: "Failed to load customer", icon: "error" });
      }
    };

    if (authTokens && recordId) {
      fetchRecord();
    }
  }, [recordId, authTokens]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddBillingTransaction = async (e) => {
    e.preventDefault();
    
    if (!newBillingAmount) {
      Swal.fire({ title: "Error", text: "Enter billing amount", icon: "error" });
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/billing-transactions/",
        {
          customer: recordId,
          amount: parseFloat(newBillingAmount),
          description: billingDescription,
        },
        { headers: { Authorization: `Bearer ${authTokens.access}` } }
      );

      setBillingTransactions([response.data, ...billingTransactions]);
      setNewBillingAmount("");
      setBillingDescription("");
      setShowBillingForm(false);
      
      // Refresh customer data to show updated loyalty tier
      const customerResponse = await axios.get(
        `http://127.0.0.1:8000/api/customers/${recordId}/`,
        { headers: { Authorization: `Bearer ${authTokens.access}` } }
      );
      setFormData(customerResponse.data);
      
      Swal.fire({
        title: "Success",
        text: "Billing amount added! Loyalty tier updated.",
        icon: "success",
        timer: 2000,
      });
    } catch (error) {
      console.error("Error adding billing:", error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.amount?.[0] || error.message || "Failed to add billing";
      Swal.fire({ title: "Error", text: errorMessage, icon: "error" });
    }
  };

  const handleDeleteBillingTransaction = async (transactionId) => {
    if (!window.confirm("Delete this billing transaction?")) return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/billing-transactions/${transactionId}/`,
        { headers: { Authorization: `Bearer ${authTokens.access}` } }
      );

      setBillingTransactions(billingTransactions.filter(t => t.id !== transactionId));
      
      // Refresh customer data to show updated loyalty tier
      const customerResponse = await axios.get(
        `http://127.0.0.1:8000/api/customers/${recordId}/`,
        { headers: { Authorization: `Bearer ${authTokens.access}` } }
      );
      setFormData(customerResponse.data);
      
      Swal.fire({ title: "Success", text: "Billing deleted and loyalty tier updated!", icon: "success", timer: 2000 });
    } catch (error) {
      console.error("Error deleting billing:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to delete";
      Swal.fire({ title: "Error", text: errorMessage, icon: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      Swal.fire({ title: "Error", text: "Fill required fields", icon: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/customers/${recordId}/`, formData, {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      Swal.fire({
        title: "Success",
        text: "Customer updated!",
        icon: "success",
        timer: 2000,
      });
      navigate("/records");
    } catch (error) {
      Swal.fire({ title: "Error", text: "Failed to update", icon: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Edit Customer</h1>
        <p className="text-gray-600 mb-8">Update customer details below.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "First Name *", name: "first_name", type: "text" },
              { label: "Last Name *", name: "last_name", type: "text" },
              { label: "Email *", name: "email", type: "email" },
              { label: "Phone", name: "phone", type: "tel" },
              { label: "Address", name: "address", type: "text" },
              { label: "City", name: "city", type: "text" },
              { label: "State", name: "state", type: "text" },
              { label: "Country", name: "country", type: "text" },
              { label: "Zipcode", name: "zipcode", type: "text" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-2">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.label.includes("*")}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-2">Company *</label>
              <select
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select company</option>
                <option value="Reliance Digital">Reliance Digital</option>
                <option value="Titan">Titan</option>
                <option value="Peter England">Peter England</option>
                <option value="Bata">Bata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date of Purchase *</label>
              <input
                type="date"
                name="date_of_purchase"
                value={formData.date_of_purchase}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Billing Amount *</label>
              <input
                type="number"
                name="billing_amount"
                value={formData.billing_amount}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-white ${isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isLoading ? "Updating..." : "Update Customer"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/records")}
              className="flex-1 py-3 px-6 rounded-lg font-bold text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Billing Transactions Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Billing History</h2>
            <button
              onClick={() => setShowBillingForm(!showBillingForm)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              {showBillingForm ? "Cancel" : "+ Add Billing"}
            </button>
          </div>

          {showBillingForm && (
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Add New Billing Amount</h3>
              <form onSubmit={handleAddBillingTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (₹) *</label>
                  <input
                    type="number"
                    value={newBillingAmount}
                    onChange={(e) => setNewBillingAmount(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={billingDescription}
                    onChange={(e) => setBillingDescription(e.target.value)}
                    placeholder="e.g., Additional purchase, Monthly billing"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
                >
                  Add Billing
                </button>
              </form>
            </div>
          )}

          {/* Billing Transactions List */}
          <div className="space-y-3">
            {billingTransactions.length > 0 ? (
              billingTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">₹{parseFloat(transaction.amount).toFixed(2)}</p>
                    {transaction.description && (
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.transaction_date).toLocaleDateString()} 
                      {' '}{new Date(transaction.transaction_date).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBillingTransaction(transaction.id)}
                    className="ml-4 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No billing transactions yet. Add one using the button above.</p>
            )}
          </div>

          {/* Total Billing Breakdown */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-300">
            {(() => {
              const existingAmount = parseFloat(formData.billing_amount || 0);
              const addedAmount = billingTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
              const totalAmount = existingAmount + addedAmount;
              
              // Determine tier
              let tier = "Bronze 🥉";
              let tierColor = "text-orange-600";
              if (totalAmount >= 50000) {
                tier = "Platinum 💎";
                tierColor = "text-purple-600";
              } else if (totalAmount >= 20000) {
                tier = "Gold 🥇";
                tierColor = "text-yellow-600";
              } else if (totalAmount >= 5000) {
                tier = "Silver 🥈";
                tierColor = "text-gray-500";
              }
              
              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Existing Amount:</span>
                    <span className="text-lg font-bold">₹{existingAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Added Billings:</span>
                    <span className="text-lg font-bold">₹{addedAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-blue-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-blue-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Loyalty Tier:</span>
                    <span className={`text-xl font-bold ${tierColor}`}>{tier}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRecord;
