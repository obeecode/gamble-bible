import { useState } from 'react';
import { X, CreditCard, Building, Wallet, Globe } from 'lucide-react';

interface PaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentInfo: {
    fullName: string;
    paymentMethod: 'bank_transfer' | 'opay' | 'palmpay' | 'paypal';
    accountNumber: string;
    bankName: string;
  }) => void;
  prizeAmount: number;
  prizeDescription: string;
  isSubmitting: boolean;
}

const PaymentInfoModal = ({
  isOpen,
  onClose,
  onSubmit,
  prizeAmount,
  prizeDescription,
  isSubmitting,
}: PaymentInfoModalProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'opay' | 'palmpay' | 'paypal',
    accountNumber: '',
    bankName: '',
  });

  const [errors, setErrors] = useState<{
    fullName?: string;
    accountNumber?: string;
    bankName?: string;
  }>({});

  const paymentMethods = [
    { value: 'bank_transfer' as const, label: 'Bank Transfer', icon: Building },
    { value: 'opay' as const, label: 'OPay', icon: Wallet },
    { value: 'palmpay' as const, label: 'PalmPay', icon: Wallet },
    { value: 'paypal' as const, label: 'PayPal (International)', icon: Globe },
  ];

  const validateForm = (): boolean => {
    const newErrors: {
      fullName?: string;
      accountNumber?: string;
      bankName?: string;
    } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.trim().length < 5) {
      newErrors.accountNumber = 'Please enter a valid account number';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank/Provider name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | typeof formData.paymentMethod) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
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
        background: 'linear-gradient(to bottom, #1f2937, #111827)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid #374151',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{ 
              color: '#f9fafb', 
              fontSize: '1.5rem', 
              fontWeight: '700',
              marginBottom: '0.5rem'
            }}>
              Claim Your Prize
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              {prizeDescription} - ${prizeAmount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#374151';
                e.currentTarget.style.color = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{ color: '#60a5fa', fontSize: '0.875rem', lineHeight: '1.5' }}>
            <strong>Important:</strong> Please ensure your information is correct. 
            The name must match your bank account to process payment successfully.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#f9fafb', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              Full Legal Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="John Doe"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#111827',
                border: `1px solid ${errors.fullName ? '#ef4444' : '#374151'}`,
                color: '#f9fafb',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                if (!errors.fullName) {
                  e.target.style.borderColor = '#9333ea';
                }
              }}
              onBlur={(e) => {
                if (!errors.fullName) {
                  e.target.style.borderColor = '#374151';
                }
              }}
            />
            {errors.fullName && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.fullName}
              </p>
            )}
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Must match your bank account name
            </p>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#f9fafb', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              Payment Method *
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = formData.paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => handleChange('paymentMethod', method.value)}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #9333ea, #c026d3)' 
                        : '#111827',
                      border: `1px solid ${isSelected ? 'transparent' : '#374151'}`,
                      color: '#f9fafb',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={16} />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Number */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#f9fafb', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              Account Number / Wallet ID *
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              placeholder="1234567890"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#111827',
                border: `1px solid ${errors.accountNumber ? '#ef4444' : '#374151'}`,
                color: '#f9fafb',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                if (!errors.accountNumber) {
                  e.target.style.borderColor = '#9333ea';
                }
              }}
              onBlur={(e) => {
                if (!errors.accountNumber) {
                  e.target.style.borderColor = '#374151';
                }
              }}
            />
            {errors.accountNumber && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.accountNumber}
              </p>
            )}
          </div>

          {/* Bank Name */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#f9fafb', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              Bank Name / Provider *
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="e.g., GTBank, Access Bank, OPay"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#111827',
                border: `1px solid ${errors.bankName ? '#ef4444' : '#374151'}`,
                color: '#f9fafb',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                if (!errors.bankName) {
                  e.target.style.borderColor = '#9333ea';
                }
              }}
              onBlur={(e) => {
                if (!errors.bankName) {
                  e.target.style.borderColor = '#374151';
                }
              }}
            />
            {errors.bankName && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.bankName}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #374151',
                color: '#f9fafb',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: isSubmitting 
                  ? '#6b7280' 
                  : 'linear-gradient(135deg, #9333ea, #c026d3)',
                border: 'none',
                color: 'white',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Submit Claim
                </>
              )}
            </button>
          </div>
        </form>

        {/* Add spinning animation */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentInfoModal;