import axios from "axios";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AuthContext from "../context/AuthContext";

const AddRecord = () => {
  const navigate = useNavigate();
  const { authTokens, updateToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address: "", city: "", state: "", country: "", zipcode: "",
    company_name: "", date_of_purchase: new Date().toISOString().split('T')[0],
    billing_amount: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check required fields
    if (!formData.first_name || !formData.last_name || !formData.email) {
      Swal.fire({ title: "Error", text: "Fill required fields", icon: "error", timer: 3000 });
      return;
    }
    
    if (!formData.company_name) {
      Swal.fire({ title: "Error", text: "Please select a company", icon: "error", timer: 3000 });
      return;
    }
    
    if (!formData.billing_amount) {
      Swal.fire({ title: "Error", text: "Please enter a billing amount", icon: "error", timer: 3000 });
      return;
    }

    setIsLoading(true);
    try {
      let token = authTokens.access;
      
      // Try initial request
      let response = await axios.post("http://127.0.0.1:8000/api/customers/", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.status === 201) {
        Swal.fire({ title: "Success", text: "Customer added!", icon: "success", timer: 2000 });
        setFormData({
          first_name: "", last_name: "", email: "", phone: "",
          address: "", city: "", state: "", country: "", zipcode: "",
          company_name: "", date_of_purchase: new Date().toISOString().split('T')[0],
          billing_amount: "",
        });
        setTimeout(() => navigate("/records"), 1000);
      }
    } catch (error) {
      console.error("Customer creation error:", error);
      
      // Check if error is due to invalid token
      if (error.response?.status === 401) {
        try {
          // Try to refresh token
          const newToken = await updateToken();
          if (newToken) {
            // Retry with new token
            const retryResponse = await axios.post("http://127.0.0.1:8000/api/customers/", formData, {
              headers: { 
                Authorization: `Bearer ${newToken}`,
                "Content-Type": "application/json"
              },
            });
            if (retryResponse.status === 201) {
              Swal.fire({ title: "Success", text: "Customer added!", icon: "success", timer: 2000 });
              setFormData({
                first_name: "", last_name: "", email: "", phone: "",
                address: "", city: "", state: "", country: "", zipcode: "",
                company_name: "", date_of_purchase: new Date().toISOString().split('T')[0],
                billing_amount: "",
              });
              setTimeout(() => navigate("/records"), 1000);
            }
          } else {
            Swal.fire({ 
              title: "Session Expired", 
              text: "Please login again", 
              icon: "error", 
              timer: 3000 
            });
            navigate("/login");
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          Swal.fire({ 
            title: "Session Error", 
            text: "Please login again", 
            icon: "error", 
            timer: 3000 
          });
          navigate("/login");
        }
      } else {
        const errorMessage = error.response?.data?.email?.[0] || 
                            error.response?.data?.detail || 
                            "Failed to create customer";
        Swal.fire({ 
          title: "Error", 
          text: errorMessage, 
          icon: "error", 
          timer: 3000 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Add New Customer</h1>
        <p className="text-gray-600 mb-8">Fill in customer details below.</p>

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
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-white ${
                isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Creating..." : "Create Customer"}
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
      </div>
    </div>
  );
};

export default AddRecord;
