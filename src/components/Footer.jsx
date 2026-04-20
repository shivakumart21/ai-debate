import React from 'react';

const Footer = () => {
  return (
    <footer style={{ padding: '2rem 1rem' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text)' }}>Developed By</h3>
      <div className="contact-info" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '3rem', borderTop: 'none', padding: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="contact-name" style={{ fontSize: '1.1rem', fontWeight: 600 }}>1. Shivakumar T</div>
          <div className="contact-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.8rem', alignItems: 'center' }}>
            <span>📞 63632111415</span>
            <span>✉️ shivut212121@gmail.com</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="contact-name" style={{ fontSize: '1.1rem', fontWeight: 600 }}>2. Namratha K B</div>
          <div className="contact-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.8rem', alignItems: 'center' }}>
            <span>📞 7483337155</span>
            <span>✉️ namrathakb72@gmail.com</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="contact-name" style={{ fontSize: '1.1rem', fontWeight: 600 }}>3. Hemalatha N K</div>
          <div className="contact-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.8rem', alignItems: 'center' }}>
            <span>📞 6361057647</span>
            <span>✉️ hemag1026@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
