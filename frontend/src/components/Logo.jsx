import React from 'react';

const Logo = ({ size = 'medium' }) => {
  const sizes = {
    small: { fontSize: '1.5rem', padding: '8px 16px' },
    medium: { fontSize: '2rem', padding: '12px 24px' },
    large: { fontSize: '2.5rem', padding: '16px 32px' }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #8c54bc 0%, #4fd1c5 100%)',
        borderRadius: '12px',
        padding: currentSize.padding,
        cursor: 'pointer'
      }}
    >
      <span
        style={{
          fontSize: currentSize.fontSize,
          fontWeight: '700',
          color: '#fff',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          letterSpacing: '1px',
          fontFamily: 'ProductSans, sans-serif'
        }}
      >
        Smart
        <span style={{ color: '#ffd700' }}>Atlas</span>
      </span>
    </div>
  );
};

export default Logo;
