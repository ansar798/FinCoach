// src/lib/ai.ts
export type Tx = { date:string; amount:number; merchant:string; category:string; source?:string; memo?:string; };
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

// Credit card statement parsing function
export function parseCreditCardStatement(statementText: string): string {
  const lines = statementText.trim().split('\n').filter(line => line.trim());
  const transactions: Array<{
    date: string;
    amount: number;
    merchant: string;
    category: string;
    source: string;
    memo: string;
  }> = [];

  // Helper function to categorize merchant
  const categorizeMerchant = (merchant: string): string => {
    const lower = merchant.toLowerCase();
    
    // Coffee
    if (lower.includes('starbucks') || lower.includes('coffee') || lower.includes('dunkin') || lower.includes('tim hortons') ||
        lower.includes('peets') || lower.includes('caribou') || lower.includes('costa') || lower.includes('cafe') ||
        lower.includes('espresso') || lower.includes('latte') || lower.includes('cappuccino') || lower.includes('brew')) {
      return 'Coffee';
    }
    
    // Food Delivery
    if (lower.includes('uber eats') || lower.includes('doordash') || lower.includes('grubhub') || lower.includes('postmates') || 
        lower.includes('delivery') || lower.includes('caviar') || lower.includes('seamless') || lower.includes('chownow') ||
        lower.includes('foodpanda') || lower.includes('just eat') || lower.includes('takeaway')) {
      return 'Food Delivery';
    }
    
    // Groceries
    if (lower.includes('costco') || lower.includes('walmart') || lower.includes('target') || lower.includes('safeway') || lower.includes('kroger') || 
        lower.includes('whole foods') || lower.includes('trader joe') || lower.includes('aldi') || lower.includes('lidl') ||
        lower.includes('wegmans') || lower.includes('publix') || lower.includes('giant') || lower.includes('stop & shop') ||
        lower.includes('food lion') || lower.includes('harris teeter') || lower.includes('heb') || lower.includes('meijer') ||
        lower.includes('supermarket') || lower.includes('grocery') || lower.includes('market')) {
      return 'Groceries';
    }
    
    // Gas
    if (lower.includes('shell') || lower.includes('exxon') || lower.includes('chevron') || lower.includes('bp') || lower.includes('mobil') || 
        lower.includes('sunoco') || lower.includes('marathon') || lower.includes('speedway') || lower.includes('citgo') || 
        lower.includes('valero') || lower.includes('phillips') || lower.includes('conoco') || lower.includes('texaco') ||
        lower.includes('gas') || lower.includes('fuel') || lower.includes('petrol') || lower.includes('station') ||
        lower.includes('pump') || lower.includes('gasoline') || lower.includes('filling') || lower.includes('service station')) {
      return 'Gas';
    }
    
    // Transportation
    if (lower.includes('ezpass') || lower.includes('toll') || lower.includes('uber') || lower.includes('lyft') || lower.includes('taxi') || 
        lower.includes('metro') || lower.includes('transit') || lower.includes('bus') || lower.includes('train') || lower.includes('subway') ||
        lower.includes('parking') || lower.includes('garage') || lower.includes('lot') || lower.includes('ride') || lower.includes('car rental') ||
        lower.includes('hertz') || lower.includes('avis') || lower.includes('enterprise') || lower.includes('zipcar')) {
      return 'Transportation';
    }
    
    // Utilities
    if (lower.includes('spectrum') || lower.includes('comcast') || lower.includes('verizon') || lower.includes('at&t') || lower.includes('t-mobile') ||
        lower.includes('sprint') || lower.includes('electric') || lower.includes('water') || lower.includes('internet') || lower.includes('phone') ||
        lower.includes('cable') || lower.includes('wifi') || lower.includes('broadband') || lower.includes('utility') || lower.includes('power') ||
        lower.includes('gas company') || lower.includes('electric company') || lower.includes('water company') || lower.includes('sewer')) {
      return 'Utilities';
    }
    
    // Electronics
    if (lower.includes('apple') || lower.includes('best buy') || lower.includes('amazon') || lower.includes('electronics') || lower.includes('computer') ||
        lower.includes('samsung') || lower.includes('microsoft') || lower.includes('dell') || lower.includes('hp') || lower.includes('lenovo') ||
        lower.includes('sony') || lower.includes('lg') || lower.includes('nintendo') || lower.includes('playstation') || lower.includes('xbox') ||
        lower.includes('phone') || lower.includes('laptop') || lower.includes('tablet') || lower.includes('tv') || lower.includes('monitor')) {
      return 'Electronics';
    }
    
    // Clothing
    if (lower.includes('nike') || lower.includes('adidas') || lower.includes('zara') || lower.includes('h&m') || lower.includes('clothing') || lower.includes('fashion') ||
        lower.includes('uniqlo') || lower.includes('gap') || lower.includes('old navy') || lower.includes('banana republic') || lower.includes('j crew') ||
        lower.includes('macy') || lower.includes('nordstrom') || lower.includes('target') || lower.includes('walmart') || lower.includes('kohl') ||
        lower.includes('shirt') || lower.includes('pants') || lower.includes('shoes') || lower.includes('dress') || lower.includes('jacket') ||
        lower.includes('apparel') || lower.includes('outfit') || lower.includes('wardrobe')) {
      return 'Clothing';
    }
    
         // Entertainment
     if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('hulu') || lower.includes('disney') || lower.includes('movie') || lower.includes('theater') || lower.includes('entertainment') ||
         lower.includes('amazon prime') || lower.includes('hbo') || lower.includes('youtube') || lower.includes('twitch') || lower.includes('steam') ||
         lower.includes('cinema') || lower.includes('concert') || lower.includes('show') || lower.includes('game') || lower.includes('arcade') ||
         lower.includes('bowling') || lower.includes('pool') || lower.includes('karaoke') || lower.includes('club') || lower.includes('bar') ||
         lower.includes('pub') || lower.includes('casino') || lower.includes('gambling') || lower.includes('lottery') ||
         lower.includes('top golf') || lower.includes('amc')) {
       return 'Entertainment';
     }
    
         // Dining
     if (lower.includes('restaurant') || lower.includes('dining') || lower.includes('food') || lower.includes('cafe') || lower.includes('bistro') ||
         lower.includes('mcdonalds') || lower.includes('burger king') || lower.includes('wendys') || lower.includes('kfc') || lower.includes('subway') ||
         lower.includes('pizza hut') || lower.includes('dominos') || lower.includes('chipotle') || lower.includes('taco bell') || lower.includes('panera') ||
         lower.includes('olive garden') || lower.includes('applebees') || lower.includes('chilis') || lower.includes('outback') || lower.includes('red lobster') ||
         lower.includes('diner') || lower.includes('grill') || lower.includes('kitchen') || lower.includes('eatery') || lower.includes('bistro') ||
         lower.includes('tavern') || lower.includes('steakhouse') || lower.includes('seafood') || lower.includes('italian') || lower.includes('chinese') ||
         lower.includes('mexican') || lower.includes('japanese') || lower.includes('thai') || lower.includes('indian') || lower.includes('mediterranean') ||
         lower.includes('pizzeria') || lower.includes('chicken') || lower.includes('pizza') || lower.includes('wing') || lower.includes('buffalo') ||
         lower.includes('chick-fil-a') || lower.includes('chick fil a') || lower.includes('chickfila')) {
       return 'Dining';
     }
    
    // Fees
    if (lower.includes('interest') || lower.includes('fee') || lower.includes('charge') || lower.includes('annual') ||
        lower.includes('late') || lower.includes('overdraft') || lower.includes('penalty') || lower.includes('service') ||
        lower.includes('maintenance') || lower.includes('processing') || lower.includes('transaction') || lower.includes('convenience') ||
        lower.includes('atm') || lower.includes('wire') || lower.includes('transfer') || lower.includes('foreign') ||
        lower.includes('cash advance') || lower.includes('balance transfer') || lower.includes('minimum payment')) {
      return 'Fees';
    }
    
    // Subscription
    if (lower.includes('subscription') || lower.includes('monthly') || lower.includes('plan') || lower.includes('service') ||
        lower.includes('adobe') || lower.includes('microsoft 365') || lower.includes('office 365') || lower.includes('google') ||
        lower.includes('dropbox') || lower.includes('icloud') || lower.includes('aws') || lower.includes('azure') ||
        lower.includes('slack') || lower.includes('zoom') || lower.includes('canva') || lower.includes('figma') ||
        lower.includes('github') || lower.includes('linkedin') || lower.includes('premium') || lower.includes('pro') ||
        lower.includes('plus') || lower.includes('membership') || lower.includes('recurring') || lower.includes('auto-renew')) {
      return 'Subscription';
    }
    
         // Shopping
     if (lower.includes('shopping') || lower.includes('store') || lower.includes('shop') || lower.includes('retail') ||
         lower.includes('mall') || lower.includes('outlet') || lower.includes('boutique') || lower.includes('department') ||
         lower.includes('home depot') || lower.includes('lowes') || lower.includes('ikea') || lower.includes('bed bath') ||
         lower.includes('container store') || lower.includes('michaels') || lower.includes('joann') || lower.includes('hobby lobby') ||
         lower.includes('petco') || lower.includes('petsmart') || lower.includes('staples') || lower.includes('office depot') ||
         lower.includes('dicks') || lower.includes('sports authority') || lower.includes('academy') || lower.includes('bass pro') ||
         lower.includes('sam\'s club') || lower.includes('sams club') || lower.includes('samsclub')) {
       return 'Shopping';
     }
    
    return 'Other';
  };

  // Helper function to generate memo
  const generateMemo = (merchant: string, category: string): string => {
    const lower = merchant.toLowerCase();
    
    if (category === 'Transportation' && lower.includes('ezpass')) return 'Toll payment';
    if (category === 'Utilities' && lower.includes('spectrum')) return 'Internet bill';
    if (category === 'Fees' && lower.includes('interest')) return 'Interest fee';
    if (category === 'Gas') return 'Fuel refill';
    if (category === 'Coffee') return 'Coffee purchase';
    if (category === 'Food Delivery') return 'Food delivery';
    if (category === 'Groceries') return 'Grocery shopping';
    if (category === 'Subscription') return 'Monthly plan';
    if (category === 'Entertainment') return 'Entertainment';
    if (category === 'Dining') return 'Dining out';
    if (category === 'Shopping') return 'Shopping';
    if (category === 'Electronics') return 'Electronics purchase';
    if (category === 'Clothing') return 'Clothing purchase';
    
    return category.toLowerCase();
  };

  // Helper function to clean merchant name
  const cleanMerchantName = (merchant: string): string => {
    // Remove store numbers and extra details
    return merchant
      .replace(/#\d+/g, '') // Remove store numbers like #1103
      .replace(/\d{3}-\d{3}-\d{4}/g, '') // Remove phone numbers
      .replace(/\b[A-Z]{2}\b/g, '') // Remove state abbreviations
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  // Helper function to format date
  const formatDate = (dateStr: string): string => {
    // Handle MM/DD format and assume current year
    if (dateStr.match(/^\d{2}\/\d{2}$/)) {
      const [month, day] = dateStr.split('/');
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Process each line
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Parse the line - format: MM/DD  MERCHANT NAME    AMOUNT
    const parts = trimmedLine.split(/\s+/);
    if (parts.length < 3) continue;

    // Extract date (first part)
    const dateStr = parts[0];
    if (!dateStr.match(/^\d{2}\/\d{2}$/)) continue;

    // Extract amount (last part)
    const amountStr = parts[parts.length - 1];
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;

    // Skip negative amounts (credits, refunds, payments)
    if (amount < 0) continue;

    // Skip payment/refund lines
    const merchantPart = trimmedLine.substring(dateStr.length).trim();
    if (merchantPart.toLowerCase().includes('payment') || 
        merchantPart.toLowerCase().includes('refund') || 
        merchantPart.toLowerCase().includes('thank you')) {
      continue;
    }

    // Extract merchant name (everything between date and amount)
    const merchantMatch = trimmedLine.match(/^\d{2}\/\d{2}\s+(.+?)\s+[\d.-]+$/);
    if (!merchantMatch) continue;

    const rawMerchant = merchantMatch[1].trim();
    const merchant = cleanMerchantName(rawMerchant);
    const category = categorizeMerchant(merchant);
    const memo = generateMemo(merchant, category);
    const formattedDate = formatDate(dateStr);

    transactions.push({
      date: formattedDate,
      amount: amount,
      merchant: merchant,
      category: category,
      source: 'Credit Card',
      memo: memo
    });
  }

  // Remove duplicates based on date + merchant + amount
  const uniqueTransactions = transactions.filter((transaction, index, self) => 
    index === self.findIndex(t => 
      t.date === transaction.date && 
      t.merchant === transaction.merchant && 
      t.amount === transaction.amount
    )
  );

  // Generate CSV
  const csvHeader = 'date,amount,merchant,category,source,memo';
  const csvRows = uniqueTransactions.map(t => 
    `${t.date},${t.amount},${t.merchant},${t.category},${t.source},${t.memo}`
  );

  return [csvHeader, ...csvRows].join('\n');
}

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
      message: `Coffee spend is $${thisSum.toFixed(0)} this month. Brewing at home 3x/week could save ~$${Math.round(thisSum*0.6)}/month!` });
    if (cat==="Food Delivery" && thisSum>150) insights.push({ type:"trend", severity:"warn",
      message: `Food delivery: $${thisSum.toFixed(0)} this month. Meal prep could save ~$${Math.round(thisSum*0.5)}/month.` });
    if (cat==="Groceries" && thisSum>300) insights.push({ type:"trend", severity:"info",
      message: `Grocery spending is $${thisSum.toFixed(0)}. Try buying generic brands to save 15-20% (~$${Math.round(thisSum*0.17)}/month).` });
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
      insights.push({ type:"forecast", severity:"info", message:`On track for $${opts.targetAmount} by ${opts.targetDate}.` });
    } else {
      const need = Math.ceil((opts.targetAmount - projected)/monthsLeft);
      insights.push({ type:"forecast", severity:"warn", message:`Off track. Need about $${need}/month to hit $${opts.targetAmount} by ${opts.targetDate}.` });
    }
  }

  return insights;
}