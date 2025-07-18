import React from 'react';

const Footer: React.FC = () => (
  <footer style={{ marginTop: '2em', textAlign: 'center' }}>
    <div style={{ display: 'flex', gap: '1.5em', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5em' }}>
      <a href="https://forms.gle/3Ryn3fEPAGQ5C4DF7" className="nav-button" style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5em', padding: '0.8em 2em 0.8em 1.5em', borderRadius: '1.8em', fontSize: '1.1em', textDecoration: 'none', boxShadow: '0 2px 8px rgba(255,107,107,0.10)' }}><span style={{ fontSize: '1.2em' }}>✉️</span> メルマガ登録</a>
      <a href="https://www.instagram.com/mc.square_official/" target="_blank" rel="noopener noreferrer" className="nav-button" style={{ background: '#fff', color: '#E1306C', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5em', padding: '0.8em 1.5em', borderRadius: '1.8em', fontSize: '1.1em', textDecoration: 'none', border: '2px solid #E1306C' }}><span style={{ fontSize: '1.2em' }}>📸</span> Instagram</a>
    </div>
    <div style={{ display: 'flex', gap: '1.5em', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.2em' }}>
      <a href="/legal_notice" className="nav-button" style={{ background: 'var(--color-background)', color: 'var(--color-primary)', fontWeight: 600, border: '1.5px solid var(--color-primary)', borderRadius: '1.5em', padding: '0.7em 1.5em', fontSize: '1em', textDecoration: 'none' }}>特定商取引法に基づく表記</a>
      <a href="/privacy_policy" className="nav-button" style={{ background: 'var(--color-background)', color: 'var(--color-primary)', fontWeight: 600, border: '1.5px solid var(--color-primary)', borderRadius: '1.5em', padding: '0.7em 1.5em', fontSize: '1em', textDecoration: 'none' }}>プライバシーポリシー</a>
      <a href="/terms_of_service" className="nav-button" style={{ background: 'var(--color-background)', color: 'var(--color-primary)', fontWeight: 600, border: '1.5px solid var(--color-primary)', borderRadius: '1.5em', padding: '0.7em 1.5em', fontSize: '1em', textDecoration: 'none' }}>利用規約</a>
    </div>
    <div style={{ color: 'var(--color-text-light)', fontSize: '0.98em', marginTop: '0.5em' }}>© 2025 エムシースクエア. すべての権利を留保します。</div>
  </footer>
);

export default Footer; 