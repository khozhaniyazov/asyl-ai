import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import type { PendingVerification, AdminStats } from '../types';
import { toast } from 'sonner';

interface VerificationStats {
  total_profiles: number;
  pending: number;
  verified: number;
  rejected: number;
}

export default function AdminVerification() {
  const { t } = useTranslation();
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [verificationsData, statsData] = await Promise.all([
        statusFilter === 'pending'
          ? api.adminGetPendingVerifications()
          : api.adminGetAllVerifications(statusFilter),
        api.adminGetVerificationStats(),
      ]);
      setVerifications(verificationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileId: number) => {
    if (!confirm(t('admin.confirmApprove'))) return;
    try {
      await api.adminApproveVerification(profileId);
      toast.success(t('admin.approveSuccess'));
      await loadData();
    } catch (error) {
      toast.error(t('admin.approveFailed'));
    }
  };

  const handleReject = async (profileId: number) => {
    const reason = prompt(t('admin.rejectionReason'));
    if (!reason) return;
    try {
      await api.adminRejectVerification(profileId, reason);
      toast.success(t('admin.rejectSuccess'));
      await loadData();
    } catch (error) {
      toast.error(t('admin.rejectFailed'));
    }
  };

  if (loading) {
    return <div className="p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('admin.title')}</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">{t('admin.pendingVerifications')}</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">{t('marketplace.verified')}</div>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">{t('admin.reject')}</div>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">{t('common.all')}</div>
            <div className="text-2xl font-bold text-gray-700">{stats.total_profiles}</div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 border-b">
        {['pending', 'verified', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm ${
              statusFilter === s
                ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t(`marketplace.verStatus.${s}`)}
          </button>
        ))}
      </div>

      {/* Verification List */}
      <div className="bg-white rounded-lg border">
        {verifications.length === 0 ? (
          <div className="p-6 text-gray-500">{t('admin.noVerifications')}</div>
        ) : (
          <div className="divide-y">
            {verifications.map((v) => (
              <div key={v.profile_id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{v.therapist_name}</h3>
                    <div className="text-sm text-gray-600">{v.therapist_email}</div>
                    <div className="text-sm text-gray-500">
                      {t('admin.submitted')}: {v.submitted_at ? new Date(v.submitted_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  {statusFilter === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(v.profile_id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        {t('admin.approve')}
                      </button>
                      <button
                        onClick={() => handleReject(v.profile_id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        {t('admin.reject')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t('admin.license')}:</span>{' '}
                    {v.license_number || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">{t('admin.city')}:</span>{' '}
                    {v.city || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">{t('admin.specializations')}:</span>{' '}
                    {v.specializations?.map((s) => t(`marketplace.spec.${s}`, s)).join(', ') || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">{t('admin.documents')}:</span>{' '}
                    {v.credential_documents?.length || 0} {t('admin.documents').toLowerCase()}
                  </div>
                </div>

                {v.credential_documents && v.credential_documents.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">{t('admin.credentialDocs')}:</div>
                    <div className="flex flex-wrap gap-2">
                      {v.credential_documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {t('admin.document')} {idx + 1}
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
    </div>
  );
}
