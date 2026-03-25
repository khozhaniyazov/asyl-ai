import { useState, useEffect } from 'react';
import { api } from '../api';
import type { EarningsSummary, PayoutData, BankAccountData } from '../types';

export default function PayoutDashboard() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccountData | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [earningsData, payoutsData] = await Promise.all([
        api.getEarnings(),
        api.getPayouts(),
      ]);
      setEarnings(earningsData);
      setPayouts(payoutsData);
      
      try {
        const bankData = await api.getBankAccount();
        setBankAccount(bankData);
      } catch {
        // No bank account yet
      }
    } catch (error) {
      console.error('Failed to load payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.createBankAccount({
        bank_name: formData.get('bank_name'),
        account_holder: formData.get('account_holder'),
        account_number: formData.get('account_number'),
        kaspi_phone: formData.get('kaspi_phone'),
      });
      await loadData();
      setShowBankForm(false);
    } catch (error) {
      alert('Failed to save bank account');
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    try {
      await api.requestPayout(amount);
      await loadData();
      setShowPayoutForm(false);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to request payout');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payouts</h1>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Available Balance</div>
          <div className="text-2xl font-bold text-green-600">
            {earnings?.available_balance.toLocaleString()} ₸
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Pending Payout</div>
          <div className="text-2xl font-bold text-yellow-600">
            {earnings?.pending_payout.toLocaleString()} ₸
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Earned</div>
          <div className="text-2xl font-bold">
            {earnings?.total_earned.toLocaleString()} ₸
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Commission</div>
          <div className="text-2xl font-bold text-gray-500">
            {earnings?.total_commission.toLocaleString()} ₸
          </div>
        </div>
      </div>

      {/* Bank Account */}
      <div className="bg-white p-6 rounded-lg border mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bank Account</h2>
          {!bankAccount && (
            <button
              onClick={() => setShowBankForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Bank Account
            </button>
          )}
        </div>

        {bankAccount ? (
          <div className="space-y-2">
            <div><span className="font-medium">Bank:</span> {bankAccount.bank_name}</div>
            <div><span className="font-medium">Account Holder:</span> {bankAccount.account_holder}</div>
            <div><span className="font-medium">Account Number:</span> {bankAccount.account_number}</div>
            {bankAccount.kaspi_phone && (
              <div><span className="font-medium">Kaspi Phone:</span> {bankAccount.kaspi_phone}</div>
            )}
            <button
              onClick={() => setShowBankForm(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              Edit
            </button>
          </div>
        ) : showBankForm ? (
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <input name="bank_name" placeholder="Bank Name" required className="w-full p-2 border rounded" />
            <input name="account_holder" placeholder="Account Holder" required className="w-full p-2 border rounded" />
            <input name="account_number" placeholder="Account Number" required className="w-full p-2 border rounded" />
            <input name="kaspi_phone" placeholder="Kaspi Phone (optional)" className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
              <button type="button" onClick={() => setShowBankForm(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="text-gray-500">No bank account added yet</div>
        )}
      </div>

      {/* Request Payout */}
      {bankAccount && earnings && earnings.available_balance > 0 && (
        <div className="bg-white p-6 rounded-lg border mb-6">
          <h2 className="text-lg font-semibold mb-4">Request Payout</h2>
          {!showPayoutForm ? (
            <button
              onClick={() => setShowPayoutForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Request Payout
            </button>
          ) : (
            <form onSubmit={handlePayoutRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₸)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  max={earnings.available_balance}
                  required
                  className="w-full p-2 border rounded"
                  placeholder={`Max: ${earnings.available_balance.toLocaleString()}`}
                />
                <div className="text-sm text-gray-500 mt-1">
                  Commission: 7.5% will be deducted
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowPayoutForm(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Payout History */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <div className="text-gray-500">No payouts yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Commission</th>
                  <th className="text-left p-2">Net</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b">
                    <td className="p-2">{new Date(payout.requested_at).toLocaleDateString()}</td>
                    <td className="p-2">{payout.amount.toLocaleString()} ₸</td>
                    <td className="p-2 text-gray-500">{payout.commission_amount.toLocaleString()} ₸</td>
                    <td className="p-2 font-medium">{payout.net_amount.toLocaleString()} ₸</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        payout.status === 'paid' ? 'bg-green-100 text-green-800' :
                        payout.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
