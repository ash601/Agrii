import { useState } from 'react';
import axios from 'axios';
import './Farmer.css';

function Farmer() {
  const [formData, setFormData] = useState({
    cropName: '',
    quantity: '',
    price: '',
    sellerRole: 'Farmer'
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      await axios.post('http://localhost:5000/api/crops', formData);
      setStatus('Successfully submitted!');
      setFormData({
        ...formData,
        cropName: '',
        quantity: '',
        price: ''
      });
    } catch (error) {
      console.error(error);
      setStatus('Error submitting listing.');
    }
  };

  return (
    <div className="farmer-container">
      <h2>Farmer / Seller Portal</h2>
      <form onSubmit={handleSubmit} className="farmer-form">
        <label>
          Crop Name:
          <input type="text" name="cropName" value={formData.cropName} onChange={handleChange} required />
        </label>
        <label>
          Quantity (kg):
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
        </label>
        <label>
          Price per kg ($):
          <input type="number" name="price" value={formData.price} onChange={handleChange} required />
        </label>
        <label>
          Role:
          <select name="sellerRole" value={formData.sellerRole} onChange={handleChange}>
            <option value="Farmer">Farmer</option>
            <option value="Cooperative">Cooperative</option>
            <option value="Supplier">Supplier</option>
          </select>
        </label>
        <button type="submit">Submit Listing</button>
      </form>
      {status && <p className="status-msg">{status}</p>}
    </div>
  );
}

export default Farmer;
