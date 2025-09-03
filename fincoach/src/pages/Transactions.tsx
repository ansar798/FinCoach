// src/pages/Transactions.tsx
import { useAuth } from "../hooks/useAuth";
import { useTransactions } from "../hooks/useTransactions";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { getCategoryColor } from "../pages/Dashboard";

export default function Transactions() {
  const { user } = useAuth();
  const txs = useTransactions(user?.uid);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter and sort transactions by date (newest first)
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = txs;
    
    // Filter by search term (merchant name)
    if (searchTerm.trim()) {
      filtered = txs.filter(tx => 
        tx.merchant.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [txs, searchTerm]);

  // Group transactions by month for better organization
  const transactionsByMonth = useMemo(() => {
    const grouped = filteredAndSortedTransactions.reduce((acc, tx) => {
      const monthKey = dayjs(tx.date).format('MMMM YYYY');
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(tx);
      return acc;
    }, {} as Record<string, typeof filteredAndSortedTransactions>);

    return grouped;
  }, [filteredAndSortedTransactions]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #2c3e50, #34495e)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              💰 All Transactions
            </h1>
            <div style={{
              fontSize: '1rem',
              color: '#666',
              fontWeight: '500'
            }}>
              {filteredAndSortedTransactions.length} transactions
            </div>
          </div>
          
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            maxWidth: '400px'
          }}>
            <input
              type="text"
              placeholder="Search by merchant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3498db';
                e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              fontSize: '1.1rem'
            }}>
              🔍
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#666';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#999';
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Transactions by Month */}
        {Object.keys(transactionsByMonth).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {searchTerm ? '🔍' : '📊'}
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
              {searchTerm ? 'No Transactions Found' : 'No Transactions Found'}
            </h3>
            <p style={{ margin: 0 }}>
              {searchTerm 
                ? `No transactions found matching "${searchTerm}". Try a different search term.`
                : 'Import your CSV data to see transactions here.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Object.entries(transactionsByMonth).map(([month, transactions]) => (
              <div key={month}>
                {/* Month Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: '#3498db'
                  }}>
                    {month}
                  </h3>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    fontWeight: '500'
                  }}>
                    {transactions.length} transactions
                  </div>
                </div>

                {/* Transactions List */}
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {transactions.map((tx, idx) => (
                    <div key={`${tx.date}-${tx.merchant}-${idx}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: getCategoryColor(tx.category)
                        }}></div>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: '#333',
                            fontSize: '1rem',
                            marginBottom: '0.25rem'
                          }}>
                            {tx.merchant}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center'
                          }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: '#f8f9fa',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {tx.category}
                            </span>
                            <span>•</span>
                            <span>{dayjs(tx.date).format('MMM D, YYYY')}</span>
                            {tx.memo && (
                              <>
                                <span>•</span>
                                <span style={{ fontStyle: 'italic' }}>{tx.memo}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '0.25rem'
                      }}>
                        <div style={{
                          fontWeight: '700',
                          color: tx.amount < 0 ? '#E74C3C' : '#27AE60',
                          fontSize: '1.1rem'
                        }}>
                          {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          fontWeight: '500'
                        }}>
                          {tx.source}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: 0 }}>
            💡 Tip: Use the browser's back button to return to the dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
