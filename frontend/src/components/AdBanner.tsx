import React from 'react';

interface AdBannerProps {
  text?: string;
  height?: string | number;
  backgroundColor?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({
  text = "Place Ad Here",
  height = "75px",
  backgroundColor = "#2a2e3b",
}) => {
  return (
    <div 
      className="ad-banner-simple" 
      style={{ 
        height: typeof height === 'number' ? `${height}px` : height,
        background: backgroundColor 
      }}
    >
      <p className="ad-banner-simple-text">{text}</p>
    </div>
  );
};

export default AdBanner;