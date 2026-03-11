import { useState, useEffect } from 'react';
import axios from 'axios';
import './Buyer.css';

function Buyer() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/crops');
      setListings(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    
    // Poll for new listings every 5 seconds for MVP feel
    const interval = setInterval(fetchListings, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = (cropName) => {
    alert(`Initiated purchase for ${cropName}! (MVP basic feature)`);
  };

  return (
    <div className="buyer-container">
      <h2>Buyer Feed</h2>
      {loading ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p>No listings available yet.</p>
      ) : (
        <div className="listing-grid">
          {listings.map((listing) => (
            <div key={listing._id} className="listing-card">
              <h3>{listing.cropName}</h3>
              <p><strong>Quantity:</strong> {listing.quantity} kg</p>
              <p><strong>Price:</strong> ${listing.price} / kg</p>
              <p><strong>Seller:</strong> {listing.sellerRole}</p>
              <button className="buy-btn" onClick={() => handleBuy(listing.cropName)}>
                Buy Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Buyer;
