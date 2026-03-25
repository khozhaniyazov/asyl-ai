import { useState, useEffect } from 'react';
import { api } from '../api';
import type { PendingVerification, PendingPayout, AdminStats } from '../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [activeTab, setActiveTab] = useState<'verifications' | 'payouts'>('verifications');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, verificationsData, payoutsData] = await Promise.all([
        api.adminGetStats(),
        api.adminGetPendingVerifications(),
        api.adminGetPendingPayouts(),
      ]);
      setStats(statsData);
      setVerifications(verificationsData);
      setPayouts(payoutsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (profileId: number) => {
    if (!confirm('Approve this verification?')) return;
    try {
      await api.adminApproveVerification(profileId);
      await loadData();
    } catch (error) {
      alert('Failed to approve verification');
    }
  };

  const handleRejectVerification = async (profileId: number) => {
    const notes = prompt('Rejection reason:');
    if (!notes) return;
    try {
      await api.adminRejectVerification(profileId, notes);
      await loadData();
    } catch (error) {
      alert('Failed to reject verification');
    }
  };

  const handleApprovePayout = async (payoutId: number) => {
    if (!confirm('Approve this payout?')) return;
    try {
      await api.adminApprovePayout(payoutId);
      await loadData();
    } catch (error) {
      alert('Failed to approve payout');
    }
  };

  const handleMarkPaid = async (payoutId: number) => {
    if (!confirm('Mark this payout as paid?')) return;
    try {
      await api.adminMarkPayoutPaid(payoutId);
      await loadData();
    } catch (error) {
      alert('Failed to mark payout as paid');
    }
  };

  const handleRejectPayout = async (payoutId: number) => {
    const notes = prompt('Rejection reason:');
    if (!notes) return;
    try {
      await api.adminRejectPayout(payoutId, notes);
      await loadData();
    } catch (error) {
      alert('Failed to reject payout');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Pending Verifications</div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.pending_verifications}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Pending Payouts</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.pending_payouts}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Total Commission Earned</div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.total_commission_earned.toLocaleString()} ₸
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-2 ${activeTab === 'verifications' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
        >
          Verifications ({verifications.length})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 ${activeTab === 'payouts' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-600'}`}
        >
          Payouts ({payouts.length})
        </button>
      </div>

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-lg border">
          {verifications.length === 0 ? (
            <div className="p-6 text-gray-500">No pending verifications</div>
          ) : (
            <div className="divide-y">
              {verifications.map((v) => (
                <div key={v.profile_id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{v.therapist_name}</h3>
                      <div className="text-sm text-gray-600">{v.therapist_email}</div>
                      <div className="text-sm text-gray-500">
                        Submitted: {v.submitted_at ? new Date(v.submitted_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveVerification(v.profile_id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectVerification(v.profile_id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">License:</span> {v.license_number || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">City:</span> {v.city || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Specializations:</span> {v.specializations?.join(', ') || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Documents:</span> {v.credential_documents?.length || 0} files
                    </div>
                  </div>
                  {v.credential_documents && v.credential_documents.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium mb-1">Credential Documents:</div>
                      <div className="flex flex-wrap gap-2">
                        {v.credential_documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Document {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-lg border">
          {payouts.length === 0 ? (
            <div className="p-6 text-gray-500">No pending payouts</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4">Therapist</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Commission</th>
                    <th className="text-left p-4">Net</th>
                    <th className="text-left p-4">Requested</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-4">
                        <div className="font-medium">{p.therapist_name}</div>
                        <div className="text-sm text-gray-600">{p.therapist_email}</div>
                      </td>
                      <td className="p-4">{p.amount.toLocaleString()} ₸</td>
                      <td className="p-4 text-gray-500">{p.commission_amount.toLocaleString()} ₸</td>
                      <td className="p-4 font-medium">{p.net_amount.toLocaleString()} ₸</td>
                      <td className="p-4 text-sm">
                        {p.requested_at ? new Date(p.requested_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprovePayout(p.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectPayout(p.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button
                              onClick={() => handleMarkPaid(p.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
