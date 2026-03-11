import Farmer from './components/Farmer';
import Buyer from './components/Buyer';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌾 Supply Chain MVP</h1>
        <p>Connecting Farmers and Buyers</p>
      </header>
      <main className="app-main">
        <div className="portal-section">
          <Farmer />
        </div>
        <div className="portal-section">
          <Buyer />
        </div>
      </main>
    </div>
  );
}

export default App;
