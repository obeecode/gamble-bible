import { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, Clock, AlertCircle, User, DollarSign, Eye, CreditCard } from 'lucide-react';
import { prizeAPI } from '../../services/api';
import { toast } from 'react-toastify';

interface Prize {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  type: string;
  amount: number;
  description: string;
  referenceNumber: string;
  status: 'unclaimed' | 'processing' | 'paid' | 'expired';
  paymentInfo?: {
    fullName: string;
    paymentMethod: string;
    accountNumber: string;
    bankName: string;
    submittedAt: string;
  };
  expiresAt?: string;
  claimedAt?: string;
  paidAt?: string;
  createdAt: string;
}

const AdminPrizeManagement = () => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('processing');
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchPrizes();
  }, [filter]);

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await prizeAPI.getAllPrizes(params);
      
      if (response.success) {
        setPrizes(response.data.prizes);
      }
    } catch (error) {
      console.error('Error fetching prizes:', error);
      toast.error('Failed to load prizes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (prizeId: string) => {
    if (!window.confirm('Are you sure you want to mark this prize as paid? The user will receive a confirmation email.')) {
      return;
    }

    try {
      const response = await prizeAPI.markPrizeAsPaid(prizeId);
      
      if (response.success) {
        toast.success('Prize marked as paid! User has been notified via email.');
        fetchPrizes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark prize as paid');
    }
  };

  const handleViewPaymentInfo = (prize: Prize) => {
    setSelectedPrize(prize);
    setShowPaymentModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      unclaimed: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', color: '#3b82f6' },
      processing: { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', color: '#eab308' },
      paid: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', color: '#10b981' },
      expired: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', color: '#ef4444' },
    };

    const style = styles[status] || styles.unclaimed;

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'capitalize',
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}>
        {status}
      </span>
    );
  };

  const stats = {
    total: prizes.length,
    processing: prizes.filter(p => p.status === 'processing').length,
    paid: prizes.filter(p => p.status === 'paid').length,
    totalAmount: prizes.reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          color: '#f9fafb', 
          fontSize: '2rem', 
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          Prize Management
        </h1>
        <p style={{ color: '#9ca3af' }}>
          View payment info and mark prizes as paid
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid #374151'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Gift size={20} color="#9ca3af" />
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Total Prizes</span>
          </div>
          <p style={{ color: '#f9fafb', fontSize: '2rem', fontWeight: '700' }}>{stats.total}</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid #374151'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={20} color="#eab308" />
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Processing</span>
          </div>
          <p style={{ color: '#eab308', fontSize: '2rem', fontWeight: '700' }}>{stats.processing}</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid #374151'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="#10b981" />
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Paid</span>
          </div>
          <p style={{ color: '#10b981', fontSize: '2rem', fontWeight: '700' }}>{stats.paid}</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid #374151'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <DollarSign size={20} color="#9ca3af" />
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Total Value</span>
          </div>
          <p style={{ color: '#f9fafb', fontSize: '2rem', fontWeight: '700' }}>${stats.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {['all', 'processing', 'unclaimed', 'paid', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              background: filter === status 
                ? 'linear-gradient(135deg, #9333ea, #c026d3)' 
                : 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Prizes Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          Loading prizes...
        </div>
      ) : prizes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Gift size={64} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
          <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
            No prizes found
          </p>
        </div>
      ) : (
        <div style={{ 
          background: '#1f2937',
          borderRadius: '1rem',
          border: '1px solid #374151',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111827', borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600', fontSize: '0.875rem' }}>User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600', fontSize: '0.875rem' }}>Prize</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600', fontSize: '0.875rem' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600', fontSize: '0.875rem' }}>Reference</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600', fontSize: '0.875rem' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600', fontSize: '0.875rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((prize) => (
                  <tr key={prize._id} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="#9ca3af" />
                        <div>
                          <p style={{ color: '#f9fafb', fontWeight: '500' }}>{prize.user.name}</p>
                          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{prize.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#f9fafb' }}>{prize.description}</td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: '600' }}>${prize.amount.toFixed(2)}</td>
                    <td style={{ padding: '1rem', color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.875rem' }}>{prize.referenceNumber}</td>
                    <td style={{ padding: '1rem' }}>{getStatusBadge(prize.status)}</td>
                    <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>{formatDate(prize.createdAt)}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {prize.status === 'processing' && prize.paymentInfo && (
                          <>
                            <button
                              onClick={() => handleViewPaymentInfo(prize)}
                              style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Eye size={16} />
                              View Info
                            </button>
                            <button
                              onClick={() => handleMarkAsPaid(prize._id)}
                              style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <CheckCircle size={16} />
                              Mark Paid
                            </button>
                          </>
                        )}
                        {prize.status === 'paid' && (
                          <span style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={16} />
                            Payment Sent
                          </span>
                        )}
                        {(prize.status === 'unclaimed' || prize.status === 'expired') && (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Info Modal */}
      {showPaymentModal && selectedPrize && selectedPrize.paymentInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid #374151',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#f9fafb', fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={24} />
                Payment Information
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ background: '#111827', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>User</p>
                <p style={{ color: '#f9fafb', fontWeight: '500' }}>{selectedPrize.user.name}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{selectedPrize.user.email}</p>
              </div>

              <div style={{ background: '#111827', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Prize Details</p>
                <p style={{ color: '#f9fafb', fontWeight: '500' }}>{selectedPrize.description}</p>
                <p style={{ color: '#10b981', fontWeight: '600' }}>${selectedPrize.amount.toFixed(2)}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontFamily: 'monospace' }}>{selectedPrize.referenceNumber}</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #9333ea, #c026d3)', padding: '1rem', borderRadius: '0.5rem' }}>
                <h4 style={{ color: 'white', fontWeight: '600', marginBottom: '0.75rem' }}>Payment Details</h4>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Full Name</p>
                  <p style={{ color: 'white', fontWeight: '500' }}>{selectedPrize.paymentInfo.fullName}</p>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Payment Method</p>
                  <p style={{ color: 'white', fontWeight: '500', textTransform: 'uppercase' }}>
                    {selectedPrize.paymentInfo.paymentMethod.replace('_', ' ')}
                  </p>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Account Number</p>
                  <p style={{ color: 'white', fontWeight: '500', fontFamily: 'monospace' }}>
                    {selectedPrize.paymentInfo.accountNumber}
                  </p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Bank/Provider</p>
                  <p style={{ color: 'white', fontWeight: '500' }}>{selectedPrize.paymentInfo.bankName}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid #374151',
                  color: '#f9fafb',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleMarkAsPaid(selectedPrize._id);
                  setShowPaymentModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle size={16} />
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrizeManagement;