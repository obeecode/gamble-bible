import { useState, useEffect } from 'react';
import { Gift, Calendar, CheckCircle, Clock, XCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { prizeAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import PaymentInfoModal from '../components/PaymentInfoModal';
import { trackPrizeClaim } from '../services/analytics'; // ← ADD THIS

interface Prize {
  _id: string;
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

const Prizes = () => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Only redirect if auth is done loading AND user is null
    if (!user) {
      navigate('/login');
      return;
    }

    fetchPrizes();
  }, [user, filter, navigate, authLoading]);

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await prizeAPI.getUserPrizes(params);
      
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

  const handleClaimClick = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (paymentInfo: {
    fullName: string;
    paymentMethod: 'bank_transfer' | 'opay' | 'palmpay' | 'paypal';
    accountNumber: string;
    bankName: string;
  }) => {
    if (!selectedPrize) return;

    try {
      setIsSubmitting(true);
      const response = await prizeAPI.claimPrize(selectedPrize._id, paymentInfo);
      
      if (response.success) {
      
        // ✅ ADD THIS: Track the prize claim in Google Analytics
        trackPrizeClaim(selectedPrize.amount, paymentInfo.paymentMethod);

        toast.success('Prize claim submitted! Check your email for confirmation.');
        setIsModalOpen(false);
        setSelectedPrize(null);
        fetchPrizes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unclaimed':
        return <Gift size={20} style={{ color: '#3b82f6' }} />;
      case 'processing':
        return <AlertCircle size={20} style={{ color: '#eab308' }} />;
      case 'paid':
        return <CheckCircle size={20} style={{ color: '#10b981' }} />;
      case 'expired':
        return <XCircle size={20} style={{ color: '#ef4444' }} />;
      default:
        return <Clock size={20} style={{ color: '#9ca3af' }} />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'unclaimed':
        return {
          background: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3b82f6',
          color: '#3b82f6',
        };
      case 'processing':
        return {
          background: 'rgba(234, 179, 8, 0.1)',
          borderColor: '#eab308',
          color: '#eab308',
        };
      case 'paid':
        return {
          background: 'rgba(16, 185, 129, 0.1)',
          borderColor: '#10b981',
          color: '#10b981',
        };
      case 'expired':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#ef4444',
          color: '#ef4444',
        };
      default:
        return {
          background: 'rgba(156, 163, 175, 0.1)',
          borderColor: '#9ca3af',
          color: '#9ca3af',
        };
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'unclaimed':
        return 'Click "Claim Prize" to submit your payment details';
      case 'processing':
        return 'Your claim is being verified and processed';
      case 'paid':
        return 'Payment has been sent to your account';
      case 'expired':
        return 'Prize claim period has expired';
      default:
        return '';
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div style={{ 
        minHeight: 'calc(100vh - 5rem)', 
        background: '#080911',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '1.125rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 5rem)', 
      background: '#080911',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '2.25rem', 
            fontWeight: '800',
            marginBottom: '0.5rem',
            background: 'linear-gradient(to right, #c084fc, #db2777)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            My Prizes
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
            View and manage your won prizes
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {['all', 'unclaimed', 'processing', 'paid', 'expired'].map((status) => (
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

        {/* Prizes List */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 1rem',
            color: '#9ca3af' 
          }}>
            Loading prizes...
          </div>
        ) : prizes.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 1rem' 
          }}>
            <Gift size={64} style={{ 
              color: '#9ca3af', 
              margin: '0 auto 1rem' 
            }} />
            <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
              No prizes found
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
          }}>
            {prizes.map((prize) => (
              <div 
                key={prize._id}
                style={{
                  background: 'linear-gradient(to bottom, #151a29, #10131e)',
                  border: '1px solid rgba(71, 77, 98, 0.5)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      borderRadius: '0.75rem', 
                      background: 'linear-gradient(135deg, #9333ea, #c026d3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Gift size={24} color="white" />
                    </div>
                    <div>
                      <h3 style={{ color: 'white', fontWeight: '700', fontSize: '1.125rem' }}>
                        {prize.description}
                      </h3>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        ${prize.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(prize.status)}
                </div>

                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Reference Number
                  </p>
                  <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {prize.referenceNumber}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                    <Calendar size={16} />
                    <span>Won: {formatDate(prize.createdAt)}</span>
                  </div>
                  {prize.expiresAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                      <Clock size={16} />
                      <span>Expires: {formatDate(prize.expiresAt)}</span>
                    </div>
                  )}
                  {prize.paidAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
                      <DollarSign size={16} />
                      <span>Paid: {formatDate(prize.paidAt)}</span>
                    </div>
                  )}
                </div>

                {/* Status description */}
                <p style={{ 
                  color: '#9ca3af', 
                  fontSize: '0.75rem', 
                  marginBottom: '1rem',
                  fontStyle: 'italic'
                }}>
                  {getStatusDescription(prize.status)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    border: '1px solid',
                    ...getStatusStyles(prize.status)
                  }}>
                    {prize.status}
                  </span>
                  
                  {prize.status === 'unclaimed' && (
                    <button
                      onClick={() => handleClaimClick(prize)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg, #9333ea, #c026d3)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Claim Prize
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Info Modal */}
      {selectedPrize && (
        <PaymentInfoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPrize(null);
          }}
          onSubmit={handlePaymentSubmit}
          prizeAmount={selectedPrize.amount}
          prizeDescription={selectedPrize.description}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default Prizes;