import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const ReadRecord = () => {
  const { authTokens } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authTokens) {
      fetchCustomers();
    }
  }, [authTokens]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/customers/", {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
      setCustomers(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch customers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await axios.delete(`http://localhost:8000/api/customers/${id}/`, {
          headers: {
            Authorization: `Bearer ${authTokens.access}`,
          },
        });
        setCustomers(customers.filter((c) => c.id !== id));
      } catch (err) {
        setError("Failed to delete customer");
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-5">Loading...</div>;

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold">Customer Records</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchCustomers}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
          <Link
            to="/add-record"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Add New Customer
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-5">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Phone</th>
              <th className="border p-2 text-left">Company</th>
              <th className="border p-2 text-left">Date of Purchase</th>
              <th className="border p-2 text-left">Billing Amount</th>
              <th className="border p-2 text-left">Country</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="8" className="border p-4 text-center">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const existingAmount = parseFloat(customer.billing_amount || 0);
                const addedAmount = (customer.billing_transactions || []).reduce(
                  (sum, tx) => sum + parseFloat(tx.amount || 0),
                  0
                );
                const totalAmount = existingAmount + addedAmount;

                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="border p-2">{`${customer.first_name} ${customer.last_name}`}</td>
                    <td className="border p-2">{customer.email}</td>
                    <td className="border p-2">{customer.phone}</td>
                    <td className="border p-2">{customer.company_name || "-"}</td>
                    <td className="border p-2">{customer.date_of_purchase || "-"}</td>
                    <td className="border p-2">₹{totalAmount.toFixed(2)}</td>
                    <td className="border p-2">{customer.country}</td>
                    <td className="border p-2 flex gap-2">
                      <Link
                        to={`/edit-record/${customer.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReadRecord;
