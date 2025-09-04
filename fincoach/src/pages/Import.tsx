// src/pages/Import.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useImportHistory } from "../hooks/useImportHistory";
import { importCsv } from "../lib/importCsv";
import { parseCreditCardStatement } from "../lib/ai";
import { useState } from "react";

export default function Import() {
  const { user } = useAuth();
  const { imports, loading: historyLoading, addImportRecord } = useImportHistory(user?.uid);
  const [file, setFile] = useState<File|null>(null);
  const [statementText, setStatementText] = useState('');
  const [generatedCsv, setGeneratedCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!user || !file) {
      setError("Please choose a CSV file first.");
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await importCsv(user.uid, file, addImportRecord);
      setSuccess('CSV imported successfully!');
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Navigate to dashboard after successful import
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const handleGenerateCsv = () => {
    if (!statementText.trim()) {
      setError("Please enter credit card statement text first.");
      return;
    }
    
    try {
      const csv = parseCreditCardStatement(statementText);
      setGeneratedCsv(csv);
      setError('');
      setSuccess('CSV generated successfully!');
    } catch (err: any) {
      setError('Failed to generate CSV: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDownloadCsv = () => {
    if (!generatedCsv) return;
    
    const blob = new Blob([generatedCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credit_card_transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImportGeneratedCsv = async () => {
    if (!user || !generatedCsv) {
      setError("Please generate a CSV first.");
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Create a temporary file from the generated CSV
      const blob = new Blob([generatedCsv], { type: 'text/csv' });
      const tempFile = new File([blob], 'credit_card_transactions.csv', { type: 'text/csv' });
      
      await importCsv(user.uid, tempFile, addImportRecord);
      setSuccess('Generated CSV imported successfully!');
      setGeneratedCsv('');
      setStatementText('');
      
      // Navigate to dashboard after successful import
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to import generated CSV');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="login-container">
      {/* FinCoach Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: 'white',
          boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)'
        }}>
          FC
        </div>
        <h2 style={{margin: 0, color: '#333', fontSize: '2.5rem', fontWeight: '700'}}>FinCoach</h2>
      </div>

      <h3 style={{marginBottom: '1rem', color: '#666', fontWeight: '400'}}>Import Your Financial Data</h3>
      <p style={{marginBottom: '2rem', color: '#666', lineHeight: '1.6'}}>
        Upload your CSV file or paste credit card statement text to start analyzing your spending patterns and get personalized financial insights.
      </p>

      <div className="file-input-container">
        <input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="file-input"
        />
        <button 
          className="btn" 
          onClick={handleImport}
          disabled={loading || !file}
          style={{
            background: loading || !file ? '#ccc' : 'linear-gradient(135deg, #1e3a8a, #1e40af)',
            cursor: loading || !file ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Importing...' : 'Import CSV'}
        </button>
      </div>

      {file && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <p style={{margin: 0, color: '#495057', fontSize: '0.9rem'}}>
            <strong>Selected file:</strong> {file.name} ({formatFileSize(file.size)})
          </p>
        </div>
      )}

      {error && (
        <div className="error-message" style={{marginTop: '1rem'}}>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{marginTop: '1rem'}}>
          {success}
        </div>
      )}

      {/* Credit Card Statement Text Input Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{margin: '0 0 1rem 0', color: '#333', fontSize: '1.2rem'}}>Generate CSV from Credit Card Statement</h4>
        <p style={{marginBottom: '1rem', color: '#666', fontSize: '0.9rem', lineHeight: '1.5'}}>
          Paste your raw credit card statement text below. We'll automatically parse it and generate a clean CSV file.
        </p>
        
        <textarea
          value={statementText}
          onChange={(e) => setStatementText(e.target.value)}
          placeholder="Paste your credit card statement text here..."
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '1rem',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontFamily: 'monospace',
            resize: 'vertical',
            marginBottom: '1rem'
          }}
        />
        
        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <button 
            className="btn" 
            onClick={handleGenerateCsv}
            disabled={!statementText.trim()}
            style={{
              background: !statementText.trim() ? '#ccc' : 'linear-gradient(135deg, #1e3a8a, #1e40af)',
              cursor: !statementText.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            Generate CSV
          </button>
          
          {generatedCsv && (
            <>
              <button 
                className="btn" 
                onClick={handleDownloadCsv}
                style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: 'white'
                }}
              >
                Download CSV
              </button>
              
              <button 
                className="btn" 
                onClick={handleImportGeneratedCsv}
                disabled={loading}
                style={{
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'white'
                }}
              >
                {loading ? 'Importing...' : 'Import to FinCoach'}
              </button>
            </>
          )}
        </div>
        
        {generatedCsv && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h5 style={{margin: '0 0 0.5rem 0', color: '#333', fontSize: '1rem'}}>Generated CSV Preview:</h5>
            <pre style={{
              margin: 0,
              fontSize: '0.8rem',
              color: '#495057',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {generatedCsv}
            </pre>
          </div>
        )}
      </div>

      {/* Import History Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{margin: '0 0 1rem 0', color: '#333', fontSize: '1.2rem'}}>Import History</h4>
        
        {historyLoading ? (
          <p style={{color: '#666', textAlign: 'center', padding: '1rem'}}>Loading import history...</p>
        ) : imports.length === 0 ? (
          <p style={{color: '#666', textAlign: 'center', padding: '1rem'}}>No imports yet. Upload your first CSV file to get started!</p>
        ) : (
          <div style={{maxHeight: '300px', overflowY: 'auto'}}>
            {imports.map((importRecord) => (
              <div key={importRecord.id} style={{
                padding: '1rem',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                background: '#f8f9fa'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                  <div>
                    <strong style={{color: '#333', fontSize: '0.95rem'}}>{importRecord.fileName}</strong>
                    <p style={{margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.85rem'}}>
                      {formatFileSize(importRecord.fileSize)} • {importRecord.transactionCount} transactions
                    </p>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p style={{margin: 0, color: '#666', fontSize: '0.85rem'}}>
                      {formatDate(importRecord.importDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        background: 'rgba(30, 58, 138, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(30, 58, 138, 0.1)'
      }}>
        <h4 style={{margin: '0 0 1rem 0', color: '#1e3a8a', fontSize: '1.1rem'}}>Import Options</h4>
        
        <div style={{marginBottom: '1rem'}}>
          <h5 style={{margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '1rem'}}>Option 1: Upload CSV File</h5>
          <ul style={{margin: 0, paddingLeft: '1.5rem', color: '#666', lineHeight: '1.6'}}>
            <li>File must be in CSV format (.csv)</li>
            <li>Include columns: date, amount, merchant, category, source, memo</li>
            <li>Date format: MM/DD/YYYY or YYYY-MM-DD</li>
            <li>Amount should be numeric (positive for expenses)</li>
          </ul>
        </div>
        
        <div>
          <h5 style={{margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '1rem'}}>Option 2: Credit Card Statement Text</h5>
          <ul style={{margin: 0, paddingLeft: '1.5rem', color: '#666', lineHeight: '1.6'}}>
            <li>Paste raw credit card statement text</li>
            <li>Format: MM/DD  MERCHANT NAME    AMOUNT</li>
            <li>Automatically categorizes transactions</li>
            <li>Excludes payments, refunds, and credits</li>
            <li>Generates clean CSV for download or import</li>
          </ul>
        </div>
      </div>

      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center'
      }}>
        <button
          className="btn"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'transparent',
            color: '#1e3a8a',
            border: '2px solid #1e3a8a',
            padding: '0.75rem 1.5rem'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}