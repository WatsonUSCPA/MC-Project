import React from 'react';
import { Link } from 'react-router-dom';

const INSTAGRAM_URL = 'https://www.instagram.com/mc.square_official/';

const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'var(--color-background-alt)',
      padding: '2rem 0',
      marginTop: '3rem',
      borderTop: '1px solid var(--color-border)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* 会社情報 */}
          <div>
            <h3 style={{
              color: 'var(--color-primary)',
              fontSize: '1.2rem',
              marginBottom: '1rem',
              fontWeight: 600
            }}>
              エムシースクエア
            </h3>
            <p style={{
              color: 'var(--color-text-light)',
              lineHeight: 1.6,
              marginBottom: '0.5rem'
            }}>
              〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階
            </p>
            <p style={{
              color: 'var(--color-text-light)',
              lineHeight: 1.6,
              marginBottom: '0.5rem'
            }}>
              TEL：045-410-7023
            </p>
            <p style={{
              color: 'var(--color-text-light)',
              lineHeight: 1.6
            }}>
              E-mail：<a href="mailto:retail@mcsquareofficials.com" style={{
                color: 'var(--color-primary)',
                textDecoration: 'none'
              }}>
                retail@mcsquareofficials.com
              </a>
            </p>
            <p style={{
              color: 'var(--color-text-light)',
              lineHeight: 1.6,
              marginTop: '0.5rem'
            }}>
              Instagram：<a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{
                color: 'var(--color-primary)',
                textDecoration: 'none'
              }}>
                @mc.square_official
              </a>
            </p>
          </div>

          {/* サービス */}
          <div>
            <h3 style={{
              color: 'var(--color-primary)',
              fontSize: '1.2rem',
              marginBottom: '1rem',
              fontWeight: 600
            }}>
              サービス
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/all-products" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  生地販売
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/kits" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  キット販売
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/subscription" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  サブスクリプション
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/gallery" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  クラフトキッチン レシピ
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 style={{
              color: 'var(--color-primary)',
              fontSize: '1.2rem',
              marginBottom: '1rem',
              fontWeight: 600
            }}>
              サポート
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/terms" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  利用規約
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/privacy" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  プライバシーポリシー
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/legal" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  特定商取引法
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/contact" style={{
                  color: 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}>
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライト */}
        <div style={{
          textAlign: 'center',
          paddingTop: '2rem',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-light)',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: 0 }}>
            © 2024 エムシースクエア. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 