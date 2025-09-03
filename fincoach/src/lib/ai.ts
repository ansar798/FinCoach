// src/lib/ai.ts
export type Tx = { date:string; amount:number; merchant:string; category:string; };
export type Insight = { type:"trend"|"subscription"|"anomaly"|"forecast"; severity:"info"|"warn"|"alert"; message:string; };

const by = <T, K extends string | number>(xs:T[], key:(x:T)=>K) =>
  xs.reduce((m, x) => ((m[key(x)] ??= [] as T[]).push(x), m), {} as Record<K, T[]>);

const median = (xs:number[]) => {
  const a=[...xs].sort((x,y)=>x-y), m=Math.floor(a.length/2);
  return a.length%2 ? a[m] : (a[m-1]+a[m])/2;
};
const mad = (xs:number[]) => {
  const m = median(xs); const dev = xs.map(x=>Math.abs(x-m));
  return median(dev) || 1;
};
const robustZ = (x:number, xs:number[]) => Math.abs(x - median(xs)) / (1.4826 * mad(xs));

export function monthKey(s:string){ return s.slice(0,7); } // "YYYY-MM"

export function buildInsights(txs: Tx[], opts: { currentSavings:number, targetAmount:number, targetDate:string, monthlyPace:number }): Insight[] {
  const insights: Insight[] = [];
  if (txs.length===0) return insights;

  // Trend (this month vs last 3-month avg)
  const mThis = txs.filter(t => monthKey(t.date) === monthKey(new Date().toISOString().slice(0,10)));
  const catThis = by(mThis, t=>t.category);
  const byMonth = by(txs, t=>monthKey(t.date));
  const lastMonths = Object.keys(byMonth).sort().slice(-4, -1); // last 3 months
  const avgLast3: Record<string, number> = {};
  for (const cat of new Set(txs.map(t=>t.category))) {
    const sums = lastMonths.map(m => (by(byMonth[m]||[], t=>t.category)[cat]||[]).reduce((a,b)=>a+b.amount,0));
    avgLast3[cat] = sums.length? (sums.reduce((a,b)=>a+b,0)/sums.length) : 0;
  }
  for (const [cat, list] of Object.entries(catThis)) {
    const thisSum = list.reduce((a,b)=>a+b.amount,0);
    const base = avgLast3[cat] || 0;
    if (base>0) {
      const delta = (thisSum - base)/base;
      if (delta > 0.4 && thisSum > 50) {
        const savings = Math.round(thisSum * 0.3);
        insights.push({ type:"trend", severity:"info",
          message: `${cat} spending is up ${Math.round(delta*100)}% this month ($${thisSum.toFixed(0)}). Consider reducing by 30% to save ~$${savings}/month.` });
      }
    }
    if (cat==="Coffee" && thisSum>100) insights.push({ type:"trend", severity:"info",
      message: `☕ Coffee spend is $${thisSum.toFixed(0)} this month. Brewing at home 3x/week could save ~$${Math.round(thisSum*0.6)}/month!` });
    if (cat==="Food Delivery" && thisSum>150) insights.push({ type:"trend", severity:"warn",
      message: `🍕 Food delivery: $${thisSum.toFixed(0)} this month. Meal prep could save ~$${Math.round(thisSum*0.5)}/month.` });
    if (cat==="Groceries" && thisSum>300) insights.push({ type:"trend", severity:"info",
      message: `🛒 Grocery spending is $${thisSum.toFixed(0)}. Try buying generic brands to save 15-20% (~$${Math.round(thisSum*0.17)}/month).` });
  }

  // Subscriptions (≈ monthly, similar amounts)
  const byMerchant = by(txs, t=>t.merchant);
  for (const [merchant, list] of Object.entries(byMerchant)) {
    if (list.length<2) continue;
    list.sort((a,b)=>a.date.localeCompare(b.date));
    let cycles=0;
    for (let i=1;i<list.length;i++){
      const days=(+new Date(list[i].date)-+new Date(list[i-1].date))/86400000;
      const close=Math.abs(list[i].amount - list[i-1].amount) <= 0.15*list[i-1].amount;
      if (days>=27 && days<=33 && close) cycles++;
    }
    if (cycles>=1) {
      const avg = +(list.reduce((a,b)=>a+b.amount,0)/list.length).toFixed(2);
      insights.push({ type:"subscription", severity:"warn", message:`Recurring charge: ${merchant} ~ $${avg}/mo.` });
    }
  }

  // Anomalies (robust z > 3 & amount>50)
  const last60 = txs.filter(t => (+new Date() - +new Date(t.date)) / 86400000 <= 60);
  const byCat60 = by(last60, t=>t.category);
  for (const [cat, list] of Object.entries(byCat60)) {
    const amounts = list.map(t=>t.amount);
    for (const tx of list) {
      if (tx.amount>50 && robustZ(tx.amount, amounts) > 3) {
        insights.push({ type:"anomaly", severity:"alert",
          message: `Unusual ${cat}: $${tx.amount.toFixed(2)} at ${tx.merchant} on ${tx.date}.` });
      }
    }
  }

  // Forecast (are we on track?)
  const monthsLeft = Math.max(1, Math.round((+new Date(opts.targetDate)-Date.now())/(30*86400000)));
  const projected = opts.currentSavings + monthsLeft*opts.monthlyPace;
  if (opts.targetAmount) {
    if (projected >= opts.targetAmount) {
      insights.push({ type:"forecast", severity:"info", message:`On track for $${opts.targetAmount} by ${opts.targetDate}. ✅` });
    } else {
      const need = Math.ceil((opts.targetAmount - projected)/monthsLeft);
      insights.push({ type:"forecast", severity:"warn", message:`Off track. Need about $${need}/month to hit $${opts.targetAmount} by ${opts.targetDate}.` });
    }
  }

  return insights;
}