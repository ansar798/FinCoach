// src/pages/Dashboard.tsx
import { useAuth } from "../hooks/useAuth";
import { useUserData } from "../hooks/useUserData";
import { useTransactions } from "../hooks/useTransactions";
import { buildInsights, monthKey } from "../lib/ai";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  ArcElement, Tooltip, Legend,
} from "chart.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
ChartJS.register(CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend);

function groupBy<T, K extends string | number>(xs:T[], key:(x:T)=>K){
  return xs.reduce((m, x) => ((m[key(x)] ??= [] as T[]).push(x), m), {} as Record<K, T[]>);
}

// Color palette for categories - Vibrant and distinct colors
const categoryColors = {
  'Coffee': '#FF6B35',        // Coral Orange
  'Food Delivery': '#2ECC71', // Emerald Green
  'Groceries': '#3498DB',     // Bright Blue
  'Subscription': '#9B59B6',  // Purple
  'Gas': '#F39C12',           // Orange
  'Transportation': '#1ABC9C', // Turquoise
  'Shopping': '#E67E22',      // Carrot Orange
  'Electronics': '#34495E',   // Dark Blue-Gray
  'Clothing': '#E91E63',      // Pink
  'Entertainment': '#00BCD4', // Cyan
  'Dining': '#FF9800',        // Deep Orange
  'Utilities': '#4CAF50',     // Green
  'Fees': '#8E44AD',          // Dark Purple
  'Other': '#607D8B'          // Blue-Gray
};

export function getCategoryColor(category: string): string {
  return categoryColors[category as keyof typeof categoryColors] || '#17A2B8'; // Vibrant Teal for unknown categories
}

export default function Dashboard(){
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);
  const { txs } = useTransactions(user?.uid);
  const navigate = useNavigate();
  
  // Get user's display name from Firestore data
  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';
  
  // Log user data for debugging (can be removed in production)
  console.log('User data from Firestore:', userData);
  const [currentSavings, setCurrentSavings] = useState(500);      // demo values
  const [monthlyPace, setMonthlyPace] = useState(200);            // demo values
  const [targetAmount, setTargetAmount] = useState(3000);
  const [targetDate, setTargetDate] = useState(dayjs().add(10, "month").format("YYYY-MM-DD"));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const kpis = useMemo(()=> {
    const currentMonth = dayjs().format("YYYY-MM");
    const thisMonth = txs.filter(t => monthKey(t.date)===currentMonth);
    const totalThis = thisMonth.reduce((a,b)=>a+Math.abs(b.amount),0); // Use absolute value for spending
    
    // If no transactions this month, show total spending instead
    const totalSpending = txs.reduce((a,b)=>a+Math.abs(b.amount),0);
    const displayTotal = thisMonth.length > 0 ? totalThis : totalSpending;
    const displayLabel = thisMonth.length > 0 ? "Total This Month" : "Total Spending";
    
    // Calculate top category - use current month if available, otherwise use all transactions
    const transactionsForTopCat = thisMonth.length > 0 ? txs.filter(t=>monthKey(t.date)===currentMonth) : txs;
    const topCat = Object.entries(groupBy(transactionsForTopCat, t=>t.category))
      .map(([c, arr]) => [c, arr.reduce((a,b)=>a+Math.abs(b.amount),0)] as const) // Use absolute value for spending
      .sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
    
    // Debug logging
    console.log('KPI Debug:', {
      currentMonth,
      totalTxs: txs.length,
      thisMonthTxs: thisMonth.length,
      totalThis,
      totalSpending,
      displayTotal,
      displayLabel,
      topCat,
      transactionsForTopCat: transactionsForTopCat.length,
      categoryBreakdown: Object.entries(groupBy(transactionsForTopCat, t=>t.category))
        .map(([c, arr]) => [c, arr.reduce((a,b)=>a+Math.abs(b.amount),0)] as const)
        .sort((a,b)=>b[1]-a[1]),
      allTransactionDates: txs.map(t => ({ date: t.date, monthKey: monthKey(t.date), amount: t.amount })),
      thisMonthTransactions: thisMonth.map(t => ({ date: t.date, amount: t.amount, merchant: t.merchant })),
      sampleTransaction: txs[0] ? { 
        date: txs[0].date, 
        amount: txs[0].amount, 
        monthKey: monthKey(txs[0].date),
        merchant: txs[0].merchant 
      } : 'No transactions'
    });
    
    return { totalThis: displayTotal.toFixed(2), topCat, displayLabel };
  }, [txs]);

  const byCategoryAll = useMemo(()=>{
    const map = groupBy(txs, t=>t.category);
    const labels = Object.keys(map);
    const data = labels.map(l => Math.abs(map[l].reduce((a,b)=>a+b.amount,0))); // Use absolute values for spending
    return { labels, data };
  }, [txs]);



  const insights = useMemo(()=> buildInsights(txs, { currentSavings, targetAmount, targetDate, monthlyPace }), [txs, currentSavings, targetAmount, targetDate, monthlyPace]);

  const subscriptions = useMemo(() => {
    const byMerchant = groupBy(txs, t => t.merchant);
    const subs = [];
    
    // Debug logging for subscription detection
    console.log('Subscription Debug:', {
      totalMerchants: Object.keys(byMerchant).length,
      merchantsWithMultipleTxs: Object.entries(byMerchant).filter(([_, list]) => list.length >= 2).length,
      subscriptionCategoryTxs: txs.filter(t => t.category === 'Subscription').length,
      subscriptionCategoryMerchants: [...new Set(txs.filter(t => t.category === 'Subscription').map(t => t.merchant))],
      allMerchants: Object.keys(byMerchant)
    });
    
    for (const [merchant, list] of Object.entries(byMerchant)) {
      if (list.length < 2) continue;
      list.sort((a, b) => a.date.localeCompare(b.date));
      
      let cycles = 0;
      for (let i = 1; i < list.length; i++) {
        const days = (+new Date(list[i].date) - +new Date(list[i-1].date)) / 86400000;
        const close = Math.abs(list[i].amount - list[i-1].amount) <= 0.15 * list[i-1].amount;
        if (days >= 27 && days <= 33 && close) cycles++;
      }
      
      if (cycles >= 1) {
        const avg = +(list.reduce((a, b) => a + b.amount, 0) / list.length).toFixed(2);
        subs.push({ merchant, avg, frequency: cycles, total: list.length });
      }
    }
    
    // Also check for transactions explicitly categorized as "Subscription"
    const explicitSubscriptions = txs.filter(t => t.category === 'Subscription');
    if (explicitSubscriptions.length > 0) {
      const subByMerchant = groupBy(explicitSubscriptions, t => t.merchant);
      for (const [merchant, list] of Object.entries(subByMerchant)) {
        const avg = +(list.reduce((a, b) => a + Math.abs(b.amount), 0) / list.length).toFixed(2);
        // Check if this merchant is already in subs array (avoid double counting)
        const existingSub = subs.find(s => s.merchant === merchant);
        if (!existingSub) {
          subs.push({ merchant, avg, frequency: list.length, total: list.length, explicit: true });
        } else {
          // If already exists, mark it as explicit for display purposes
          existingSub.explicit = true;
        }
      }
    }
    
    console.log('Found Subscriptions:', subs);
    return subs;
  }, [txs]);

  const handleDeleteAllData = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      const transactionsRef = collection(db, `users/${user.uid}/transactions`);
      const snapshot = await getDocs(transactionsRef);
      
      const deletePromises = snapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, `users/${user.uid}/transactions`, docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      setShowDeleteConfirm(false);
      alert('All data has been successfully deleted. You can now start fresh!');
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Error deleting data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div style={{marginBottom: '2rem', textAlign: 'center'}}>
        <h2 style={{color: '#333', margin: 0, fontSize: '1.5rem'}}>
          Welcome back, {displayName}!
        </h2>
        <p style={{color: '#666', margin: '0.5rem 0 0 0', fontSize: '1rem'}}>
          Here's your financial overview
        </p>
      </div>
      
      <div className="dashboard-main-layout">
        <div className="dashboard-main-content">
          <section className="kpi-grid">
            <KPI title={kpis.displayLabel} value={`$${kpis.totalThis}`} />
            <KPI title="Top Category" value={kpis.topCat} />
            <KPI title="Subscriptions Found" value={subscriptions.length.toString()} />
          </section>

              <section className="charts-grid">
        <div className="chart-container">
          <h3 className="chart-title">All Categories (Total)</h3>
          <Doughnut 
            data={{ 
              labels: byCategoryAll.labels.length > 0 ? byCategoryAll.labels : ['No Data'], 
              datasets:[{ 
                data: byCategoryAll.data.length > 0 ? byCategoryAll.data : [1],
                backgroundColor: byCategoryAll.labels.length > 0 
                  ? byCategoryAll.labels.map(label => getCategoryColor(label))
                  : ['#D5DBDB'],
                borderColor: byCategoryAll.labels.length > 0 
                  ? byCategoryAll.labels.map(label => getCategoryColor(label))
                  : ['#D5DBDB'],
                borderWidth: 2,
                hoverOffset: 4
              }]
            }} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                      size: 12
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed;
                      const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                      return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </section>

      <div className="goals-insights-layout">
        <section className="goals-section">
          <h3 style={{marginBottom: '1rem', color: '#333'}}>Financial Goals</h3>
          <div className="goals-grid">
            <div className="goal-input">
              <label>Current Savings</label>
              <input type="number" value={currentSavings} onChange={e=>setCurrentSavings(+e.target.value)} />
            </div>
            <div className="goal-input">
              <label>Monthly Pace</label>
              <input type="number" value={monthlyPace} onChange={e=>setMonthlyPace(+e.target.value)} />
            </div>
            <div className="goal-input">
              <label>Target Amount</label>
              <input type="number" value={targetAmount} onChange={e=>setTargetAmount(+e.target.value)} />
            </div>
            <div className="goal-input">
              <label>Target Date</label>
              <input type="date" value={targetDate} onChange={e=>setTargetDate(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="insights-section">
          <h3 style={{marginBottom: '1rem', color: '#333'}}>AI Insights</h3>
          <ul className="insights-list">
            {insights.map((i, idx)=>(
              <li key={idx} className={`insight-item ${i.severity}`}>
                <div className="insight-type">[{i.type.toUpperCase()}]</div>
                <div className="insight-message">{i.message}</div>
              </li>
            ))}
            {insights.length===0 && <li className="insight-item info">No insights yet. Import your CSV data to get started.</li>}
          </ul>
        </section>
      </div>



      {(subscriptions.length > 0 || txs.some(t => t.category === 'Subscription')) && (
        <section className="insights-section subscription-detector-container">
          <h3 style={{marginBottom: '1rem', color: '#333'}}>Subscription Detector</h3>
          <div style={{display: 'grid', gap: '1rem'}}>
            {subscriptions.map((sub, idx) => (
              <div key={idx} className="insight-item warn">
                <div className="insight-type">RECURRING CHARGE DETECTED</div>
                <div className="insight-message">
                  <strong>{sub.merchant}</strong> - ${sub.avg}/month (detected {sub.frequency} cycles from {sub.total} transactions)
                </div>
              </div>
            ))}
            {/* Show explicit subscription category transactions */}
            {txs.filter(t => t.category === 'Subscription').map((tx, idx) => (
              <div key={`explicit-${idx}`} className="insight-item info">
                <div className="insight-type">SUBSCRIPTION</div>
                <div className="insight-message">
                  <strong>{tx.merchant}</strong> - ${Math.abs(tx.amount).toFixed(2)} on {tx.date}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="insights-section recent-transactions-container">
        <h3 style={{marginBottom: '1rem', color: '#333'}}>Recent Transactions</h3>
        <div style={{display: 'grid', gap: '0.75rem', marginBottom: '1rem'}}>
          {txs.slice(0, 5).map((tx, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getCategoryColor(tx.category)
                }}></div>
                <div>
                  <div style={{fontWeight: '600', color: '#333', fontSize: '0.9rem'}}>
                    {tx.merchant}
                  </div>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>
                    {tx.category} • {dayjs(tx.date).format('MMM D, YYYY')}
                  </div>
                </div>
              </div>
              <div style={{
                fontWeight: '600',
                color: tx.amount < 0 ? '#E74C3C' : '#27AE60',
                fontSize: '0.9rem'
              }}>
                {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center'}}>
          <button
            className="btn"
            onClick={() => window.open('/transactions', '_blank')}
            style={{
              background: 'linear-gradient(135deg, #3498DB, #2980B9)',
              minWidth: '160px'
            }}
          >
            All Transactions
          </button>
        </div>
      </section>

      <section className="insights-section data-management-container">
        <h3 style={{marginBottom: '1rem', color: '#333'}}>Data Management</h3>
          <div style={{display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
            <div className="data-management-section">
              <div className="data-management-content">
                <h4>Import More Data</h4>
                <p>
                  Add new CSV files to expand your financial insights and analysis.
                </p>
              </div>
              <button 
                className="btn" 
                onClick={() => navigate('/import')}
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
                  minWidth: '140px'
                }}
              >
                Import CSV
              </button>
            </div>
            <div className="data-management-section">
              <div className="data-management-content">
                <h4>Start Fresh</h4>
                <p>
                  Remove all transaction data to start over with a clean slate.
                </p>
              </div>
              <button 
                className="btn" 
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: '#dc3545',
                  minWidth: '140px'
                }}
              >
                Remove All Data
              </button>
            </div>
          </div>
        </section>

        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{margin: '0 0 1rem 0', color: '#dc3545'}}>Confirm Data Deletion</h3>
            <p style={{margin: '0 0 1.5rem 0', color: '#666', lineHeight: '1.5'}}>
              Are you sure you want to delete all your transaction data? This action cannot be undone.
              You will lose all your financial history, insights, and analysis.
            </p>
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn"
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                style={{
                  background: '#dc3545',
                  minWidth: '120px'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({title, value}:{title:string; value:string}){
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}