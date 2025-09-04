# FinCoach - Smart Financial Coach

> **Hackathon Submission**: A smart financial coach that uses AI to transform raw transaction data into personalized insights that empower users to take control of their financial lives.

## Design Documentation & Demo Video
- **Demo Video**: https://drive.google.com/file/d/1c9j4jcPA2BH3IXiO93J-Y2zdJA8o_bUC/view?usp=share_link
- **Design Documentation**: Available in the repository as `FinCoach Design Doc.pdf`

## Problem Statement

Many people struggle with personal finance due to a lack of visibility and personalized, actionable advice. Manually tracking every expense is tedious, and generic budgeting apps often fail to inspire lasting behavioral change. As a result, people are often unaware of wasteful spending habits, miss opportunities to save, and feel anxious about their financial future.

## Solution

FinCoach is a smart financial coach that uses AI to transform raw transaction data into personalized insights that empower users to take control of their financial lives. It goes beyond simple categorization to provide actionable recommendations that lead to measurable behavioral change.

## Key Features

### AI-Powered Insights
- **Intelligent Spending Analysis**: Identifies trends and anomalies in spending patterns
- **Personalized Recommendations**: Provides specific, actionable advice like "Brewing at home 3x/week could save ~$120/month!"
- **Anomaly Detection**: Uses robust statistical methods to identify unusual spending patterns
- **Trend Analysis**: Compares current spending to historical averages with actionable insights

### Subscription & Gray Charge Detector
- **Automatic Detection**: Scans transaction history to identify recurring subscriptions
- **Forgotten Services**: Finds free trials that converted to paid services
- **Cost Analysis**: Shows monthly costs and frequency of each subscription
- **Easy Review**: Presents all subscriptions in a single, easy-to-review list

### Personalized Goal Forecasting
- **Smart Forecasting**: Analyzes spending and income to predict goal achievement
- **Progress Tracking**: Visual indicators show progress toward financial goals
- **Actionable Suggestions**: Provides specific recommendations when off-track
- **Real-time Updates**: Adjusts forecasts as spending patterns change

### Comprehensive Analytics
- **Visual Dashboards**: Beautiful charts showing spending patterns and trends
- **Category Analysis**: Detailed breakdown of spending by category
- **Monthly Comparisons**: Track spending changes over time
- **KPI Tracking**: Key metrics at a glance

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Modern CSS with glassmorphism design
- **Charts**: Chart.js + React-ChartJS-2
- **Backend**: Firebase (Authentication + Firestore)
- **Data Processing**: PapaParse for CSV import
- **AI/ML**: Custom algorithms for anomaly detection and trend analysis

## Design Philosophy

- **Trust & Security**: Clean, professional design that builds confidence
- **Accessibility**: Intuitive interface that works for all users
- **Mobile-First**: Responsive design that works on all devices
- **Visual Hierarchy**: Clear information architecture with actionable insights

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fincoach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Getting Started
- Create a new account or sign in with existing credentials
- Import your CSV transaction data to get started
- Explore the AI insights and subscription detection features

## Success Metrics

### Behavioral Change
- Provides insights that lead to measurable changes in spending habits
- Actionable recommendations with specific savings amounts
- Trend analysis helps users understand spending patterns

### Financial Visibility
- Clear dashboard showing exactly where money is going
- Visual charts make spending patterns easy to understand
- Real-time updates as new transactions are added

### Trust and Security
- Professional, clean design that builds confidence
- Secure Firebase authentication
- Clear data handling and privacy practices

### AI Application
- Advanced anomaly detection using robust statistical methods
- Personalized forecasting based on individual spending patterns
- Smart categorization and trend analysis

## Future Enhancements

- **Bank Integration**: Direct connection to bank accounts via Plaid
- **Bill Reminders**: Smart notifications for upcoming bills
- **Investment Tracking**: Portfolio analysis and recommendations
- **Credit Score Monitoring**: Integration with credit monitoring services
- **Social Features**: Family/partner financial goal sharing
- **Advanced AI**: Machine learning models for better predictions

## Hackathon Highlights

This submission demonstrates:

1. **Real AI Implementation**: Custom algorithms for anomaly detection, trend analysis, and forecasting
2. **User-Centric Design**: Focus on actionable insights that drive behavioral change
3. **Technical Excellence**: Modern tech stack with clean, maintainable code
4. **Scalable Architecture**: Firebase backend ready for production deployment
5. **Comprehensive Features**: All requested features plus additional value-adds

## Demo Instructions

1. **Start the app** and create a new account or sign in
2. **Import your CSV data** with transaction history
3. **Explore the dashboard** to see AI insights in action
4. **Check subscription detection** to see recurring charges identified
5. **Adjust financial goals** to see personalized forecasting
6. **Review insights** for actionable recommendations

## Contributing

This is a hackathon submission, but feedback and suggestions are welcome!

## License

MIT License - feel free to use this code for learning and development.

---

**Built with love for the hackathon challenge**
