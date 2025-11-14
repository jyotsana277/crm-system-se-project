// frontend/src/components/ReadRecords.js
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { FaRegEdit } from "react-icons/fa";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const ReadRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const { authTokens } = useContext(AuthContext);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      if (!authTokens || !authTokens.access) {
        console.error("No access token available");
        return;
      }

      const response = await axios.get("http://127.0.0.1:8000/api/customers/", {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
      console.log("Customers fetched:", response.data);
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authTokens) {
      fetchRecords();
    }
  }, [authTokens]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">All Records</h2>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Existing Amount (₹)</th>
              <th className="px-4 py-2 border">Added Billings (₹)</th>
              <th className="px-4 py-2 border">Total Amount (₹)</th>
              <th className="px-4 py-2 border">Loyalty Tier</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              // Calculate totals
              const existingAmount = parseFloat(record.billing_amount || 0);
              const addedAmount = (record.billing_transactions || []).reduce(
                (sum, tx) => sum + parseFloat(tx.amount || 0),
                0
              );
              const totalAmount = existingAmount + addedAmount;
              
              // Determine tier based on total
              let tier = "Bronze";
              let tierColor = "text-orange-600";
              if (totalAmount >= 50000) {
                tier = "Platinum 💎";
                tierColor = "text-purple-600 font-bold";
              } else if (totalAmount >= 20000) {
                tier = "Gold 🥇";
                tierColor = "text-yellow-600 font-bold";
              } else if (totalAmount >= 5000) {
                tier = "Silver 🥈";
                tierColor = "text-gray-500 font-bold";
              } else {
                tier = "Bronze 🥉";
                tierColor = "text-orange-600";
              }

              return (
                <tr key={record.id} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">{record.first_name} {record.last_name}</td>
                  <td className="border px-4 py-2">{record.email}</td>
                  <td className="border px-4 py-2 text-right font-semibold">₹{existingAmount.toFixed(2)}</td>
                  <td className="border px-4 py-2 text-right font-semibold">₹{addedAmount.toFixed(2)}</td>
                  <td className="border px-4 py-2 text-right font-bold text-blue-600">₹{totalAmount.toFixed(2)}</td>
                  <td className={`border px-4 py-2 text-center ${tierColor}`}>{tier}</td>
                  <td className="border px-4 py-2 space-y-2">
                    <Link
                      to={`/dashboard/edit-record/${record.id}`}
                      className="w-full flex justify-center items-center bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded"
                    >
                      <FaRegEdit />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReadRecords;
