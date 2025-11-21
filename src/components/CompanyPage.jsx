import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const CompanyPage = () => {
  const { authTokens } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!authTokens) return;
      setLoading(true);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/customers/", {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        });
        setCustomers(response.data || []);
        setError("");
      } catch (err) {
        console.error("Error fetching customers for company view:", err);
        setError("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [authTokens]);

  const companies = useMemo(() => {
    const names = customers
      .map((c) => c.company_name)
      .filter((name) => !!name);
    return Array.from(new Set(names));
  }, [customers]);

  const { tierCounts, companyCustomers } = useMemo(() => {
    if (!selectedCompany) {
      return {
        tierCounts: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        companyCustomers: [],
      };
    }

    const filtered = customers.filter((c) => c.company_name === selectedCompany);

    const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    const detailed = filtered.map((customer) => {
      const existingAmount = parseFloat(customer.billing_amount || 0);
      const addedAmount = (customer.billing_transactions || []).reduce(
        (sum, tx) => sum + parseFloat(tx.amount || 0),
        0
      );
      const totalBilling = existingAmount + addedAmount;

      let tier = "bronze";
      if (totalBilling >= 50000) {
        tier = "platinum";
        counts.platinum += 1;
      } else if (totalBilling >= 20000) {
        tier = "gold";
        counts.gold += 1;
      } else if (totalBilling >= 5000) {
        tier = "silver";
        counts.silver += 1;
      } else {
        counts.bronze += 1;
      }

      return {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        email: customer.email,
        totalBilling,
        tier,
      };
    });

    return { tierCounts: counts, companyCustomers: detailed };
  }, [customers, selectedCompany]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4">Company Loyalty Overview</h1>
        <p className="text-gray-600 mb-6">
          Select a company to see how many of its customers are in each loyalty tier.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Select Company</label>
          <select
            className="md:flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">-- Choose a company --</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500">Loading customers...</p>}

        {!loading && selectedCompany && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">
              Loyalty tiers for <span className="text-blue-600">{selectedCompany}</span>
            </h2>

            {/* Tier summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">BRONZE</p>
                <p className="text-xs text-gray-500 mb-1">₹0 - ₹5k</p>
                <p className="text-2xl font-bold text-amber-600">{tierCounts.bronze}</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">SILVER</p>
                <p className="text-xs text-gray-500 mb-1">₹5k - ₹20k</p>
                <p className="text-2xl font-bold text-gray-700">{tierCounts.silver}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">GOLD</p>
                <p className="text-xs text-gray-500 mb-1">₹20k - ₹50k</p>
                <p className="text-2xl font-bold text-yellow-600">{tierCounts.gold}</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">PLATINUM</p>
                <p className="text-xs text-gray-500 mb-1">₹50k+</p>
                <p className="text-2xl font-bold text-purple-700">{tierCounts.platinum}</p>
              </div>
            </div>

            {/* Customer details table */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Customers under this company</h3>
              {companyCustomers.length === 0 ? (
                <p className="text-gray-500 text-sm">No customers found for this company.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">Total Billing (₹)</th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-700">Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyCustomers.map((c) => (
                        <tr key={c.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2">{c.name || "-"}</td>
                          <td className="px-4 py-2">{c.email}</td>
                          <td className="px-4 py-2 text-right">₹{c.totalBilling.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center uppercase font-semibold">
                            {c.tier}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !selectedCompany && (
          <p className="text-gray-500 text-sm mt-4">
            Choose a company from the dropdown above to view its loyalty tier distribution.
          </p>
        )}
      </div>
    </div>
  );
};

export default CompanyPage;
