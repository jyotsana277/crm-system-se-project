import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";

const LoyaltyPage = () => {
  const [loyaltyPrograms, setLoyaltyPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const { authTokens } = useContext(AuthContext);

  useEffect(() => {
    if (authTokens) {
      fetchLoyaltyPrograms();
      fetchCustomers();
    }
  }, [authTokens]);

  const fetchLoyaltyPrograms = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/loyalty-programs/", {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });
      const data = await response.json();
      setLoyaltyPrograms(data);
    } catch (error) {
      console.error("Error fetching loyalty programs:", error);
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

  const calculateTierAndPoints = (customer) => {
    // Calculate total billing from existing amount + all transactions
    const existingAmount = parseFloat(customer.billing_amount || 0);
    const addedAmount = (customer.billing_transactions || []).reduce(
      (sum, tx) => sum + parseFloat(tx.amount || 0),
      0
    );
    const totalBilling = existingAmount + addedAmount;
    const points = Math.floor(totalBilling * 0.15);
    
    let tier = "bronze";
    if (totalBilling >= 50000) tier = "platinum";
    else if (totalBilling >= 20000) tier = "gold";
    else if (totalBilling >= 5000) tier = "silver";
    
    return { points, tier, totalBilling };
  };

  // Tier thresholds based on billing amount
  const getTierThresholds = () => {
    return {
      bronze: { minAmount: 0, maxAmount: 5000, label: "Bronze", color: "bg-amber-100" },
      silver: { minAmount: 5000, maxAmount: 20000, label: "Silver", color: "bg-gray-100" },
      gold: { minAmount: 20000, maxAmount: 50000, label: "Gold", color: "bg-yellow-100" },
      platinum: { minAmount: 50000, maxAmount: Infinity, label: "Platinum", color: "bg-purple-100" },
    };
  };

  // Get next tier info for a customer
  const getNextTierInfo = (customer) => {
    const thresholds = getTierThresholds();
    const { tier: currentTier, totalBilling } = calculateTierAndPoints(customer);

    const tierOrder = ["bronze", "silver", "gold", "platinum"];
    const currentTierIndex = tierOrder.indexOf(currentTier);

    if (currentTierIndex === -1 || currentTierIndex === 3) {
      // Already at platinum
      return null;
    }

    const nextTierName = tierOrder[currentTierIndex + 1];
    const nextTierInfo = thresholds[nextTierName];
    const amountNeeded = nextTierInfo.minAmount - totalBilling;

    return {
      currentTier,
      nextTier: nextTierName,
      currentAmount: totalBilling,
      nextTierMinAmount: nextTierInfo.minAmount,
      amountNeeded: Math.max(0, amountNeeded),
      progressPercentage: Math.min(100, (totalBilling / nextTierInfo.minAmount) * 100),
    };
  };;

  const handleEditBillingAmount = async (customerId, newAmount) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/customers/${customerId}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authTokens.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ billing_amount: parseFloat(newAmount) }),
      });

      if (response.ok) {
        // Refresh data to get updated tier
        await fetchCustomers();
        await fetchLoyaltyPrograms();
      } else {
        alert("Failed to update billing amount");
      }
    } catch (error) {
      console.error("Error updating billing amount:", error);
      alert("Error updating billing amount");
    }
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    const customer = customers.find(c => c.id === parseInt(selectedCustomerId));
    if (!customer) return;

    // Check if customer already has a loyalty program
    const existingProgram = loyaltyPrograms.find(p => p.customer === parseInt(selectedCustomerId));
    if (existingProgram) {
      alert("❌ This customer already has a loyalty program assigned. Points cannot be reassigned.");
      return;
    }

    const { points, tier } = calculateTierAndPoints(customer);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/loyalty-programs/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokens.access}`,
        },
        body: JSON.stringify({
          customer: selectedCustomerId,
          tier: tier,
          total_points: points,
          points_balance: points,
        }),
      });

      if (response.status === 201) {
        alert(`✅ Created! Tier: ${tier.toUpperCase()}, Points: ${points}`);
        setSelectedCustomerId("");
        setShowForm(false);
        fetchLoyaltyPrograms();
      } else if (response.status === 400) {
        const errorData = await response.json();
        alert(`❌ ${errorData.customer ? errorData.customer[0] : "Error creating loyalty program"}`);
      } else {
        alert("❌ Error creating loyalty program");
      }
    } catch (error) {
      alert("❌ Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Loyalty Programs</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            {showForm ? "Cancel" : "+ New Program"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create Loyalty Program</h2>
            <p className="text-gray-600 mb-4">Tier and points calculated automatically from billing amount (15% points).</p>
            <form onSubmit={handleCreateProgram} className="space-y-4">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select a customer</option>
                {customers
                  .filter(c => !loyaltyPrograms.some(p => p.customer === c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} - ${c.billing_amount}
                    </option>
                  ))}
              </select>

              {selectedCustomerId && (() => {
                const customer = customers.find(c => c.id === parseInt(selectedCustomerId));
                const { points, tier } = calculateTierAndPoints(customer);
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tier</label>
                      <input type="text" value={tier.toUpperCase()} readOnly className="w-full mt-1 bg-gray-100 border rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Points (15%)</label>
                      <input type="text" value={points} readOnly className="w-full mt-1 bg-gray-100 border rounded px-3 py-2" />
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={loading || !selectedCustomerId}
                className={`w-full py-2 rounded-lg font-bold text-white ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loyaltyPrograms.length > 0 ? (
            loyaltyPrograms.map((program) => {
              const customer = customers.find(c => c.id === program.customer);
              const nextTierInfo = customer ? getNextTierInfo(customer) : null;
              const thresholds = getTierThresholds();
              const tierInfo = thresholds[program.tier];

              return (
                <div key={program.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600 overflow-hidden">
                  <h3 className="text-lg font-bold mb-2 text-blue-600">{program.customer_name || "Program"}</h3>
                  <p className="text-sm text-gray-500 mb-4">{program.customer_email}</p>
                  
                  {/* Current Tier Section */}
                  <div className={`${tierInfo.color} rounded-lg p-4 mb-4`}>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-gray-700 font-semibold">Current Tier:</span><span className="font-bold text-lg">{program.tier?.toUpperCase()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-700">Total Points:</span><span className="font-bold text-lg">{program.total_points || 0}</span></div>
                      <div className="flex justify-between"><span className="text-gray-700">Balance:</span><span className="font-bold text-lg text-green-600">{program.points_balance || 0}</span></div>
                      {customer && (
                        <>
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-gray-700 font-semibold">Billing Amount:</span>
                            <input
                              type="number"
                              defaultValue={customer.billing_amount}
                              onBlur={(e) => {
                                if (e.target.value !== customer.billing_amount.toString()) {
                                  handleEditBillingAmount(customer.id, e.target.value);
                                }
                              }}
                              className="w-32 px-2 py-1 border border-blue-300 rounded font-bold text-right bg-blue-50"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 text-sm">Total Billing (₹):</span>
                            <span className="font-bold text-lg text-blue-600">₹{calculateTierAndPoints(customer).totalBilling.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tier Progression Section */}
                  {nextTierInfo && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm mb-3 text-gray-800">📈 Upgrade Path</h4>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="text-gray-600">Progress to {nextTierInfo.nextTier.toUpperCase()}</span>
                          <span className="font-semibold text-gray-700">{Math.round(nextTierInfo.progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${nextTierInfo.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Tier Requirements */}
                      <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Current: <span className="font-semibold">₹{nextTierInfo.currentAmount.toFixed(2)}</span></span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Need: <span className="font-semibold text-blue-600">₹{nextTierInfo.nextTierMinAmount}</span></span>
                        </div>
                        <div className="bg-yellow-100 rounded p-2 text-sm font-semibold text-yellow-800">
                          💰 ₹{nextTierInfo.amountNeeded.toFixed(2)} more to reach {nextTierInfo.nextTier.toUpperCase()}
                        </div>
                      </div>

                      {/* All Tier Options */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-gray-600 mb-2">ALL TIER LEVELS:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-amber-100 rounded p-2 text-center">
                            <p className="text-xs font-bold">BRONZE</p>
                            <p className="text-xs text-gray-600">₹0 - ₹5k</p>
                          </div>
                          <div className="bg-gray-100 rounded p-2 text-center">
                            <p className="text-xs font-bold">SILVER</p>
                            <p className="text-xs text-gray-600">₹5k - ₹20k</p>
                          </div>
                          <div className="bg-yellow-100 rounded p-2 text-center">
                            <p className="text-xs font-bold">GOLD</p>
                            <p className="text-xs text-gray-600">₹20k - ₹50k</p>
                          </div>
                          <div className="bg-purple-100 rounded p-2 text-center">
                            <p className="text-xs font-bold">PLATINUM</p>
                            <p className="text-xs text-gray-600">₹50k+</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Already at Platinum */}
                  {program.tier === "platinum" && (
                    <div className="border-t pt-4">
                      <div className="bg-purple-100 rounded-lg p-3 text-center">
                        <p className="text-sm font-bold text-purple-800">⭐ Maximum Tier Reached!</p>
                        <p className="text-xs text-purple-700">You're enjoying top-tier benefits</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 col-span-full text-center py-8">No programs yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPage;
