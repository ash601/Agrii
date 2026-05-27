# Waste Risk Feature: Comprehensive Documentation & Data Flow

This document serves as the official technical documentation and presentation guide for the "Waste Risk" feature within the AgriTrade AI application.

---

## 1. Feature Overview
The Waste Risk feature calculates a dynamic **Spoilage Risk Score (0-100)** to help users decide whether to hold or sell their inventory. It completely bypasses dummy mock data and dynamically scores risk based on three real-time variables:
1. **Live Temperature**
2. **Live Humidity** 
3. **Market Supply/Surplus** 

Based on these thresholds, the system categorizes the risk into `LOW` (0-33), `MEDIUM` (34-66), or `HIGH` (67-100), adjusting the crop's anticipated shelf life proportionally.

---

## 2. Technical Architecture (Files Involved)
The feature spans across the full stack using these four primary files:

1. **Frontend UI Display:** `client/src/pages/WasteRisk.jsx` 
   - Responsible for drawing the input form, communicating with the backend, and painting the SVG Gauge and data cards on the screen.
2. **Backend Brain:** `server/src/routes/waste.routes.js` 
   - Contains the core algorithm and `SPOILAGE_THRESHOLDS` mapping. Calculates the math.
3. **Live Weather Engine:** `server/src/services/weather.service.js` 
   - The integration layer executing calls to the external OpenWeather API.
4. **Market Data Fetcher:** `server/src/services/mandi.service.js` 
   - Pulls nationwide market metrics natively from AGMARKNET (data.gov.in) to populate the local database for surplus detection.

---

## 3. The Lifecycle of the Data (Step-By-Step)

If you are asked to explain the data flow, follow this chronological 7-step process:

### Step 1: Input Capture (The Frontend)
When the user interacts with the UI (e.g., selecting "Tomato" and "Maharashtra"), React immediately captures these selections.
* **Storage Location:** Browser RAM (Temporary state memory).
* **Code Reference:** `onChange={e => setForm({ ...form, commodity: e.target.value })}` creates `{ commodity: "Tomato", state: "Maharashtra" }`.

### Step 2: Transmission to the Backend
When the user clicks "Check Risk", the frontend packages the variables and transmits them securely over HTTP to the backend server.
* **Code Reference:** `client/src/pages/WasteRisk.jsx` (Line 37)
* **Execution:** `const res = await api.get('/waste-risk', { params: form });`

### Step 3: Backend Reception & Threshold Lookup
The Node/Express backend catches the GET request at the `/waste-risk` route.
* **Code Reference:** `server/src/routes/waste.routes.js`
* **Execution:** `const { commodity, state } = req.query;` unpacks the payload. It then cross-references the selected "Tomato" against identical thresholds (e.g., Max Temp: 25°C, Max Humidity: 80%).

### Step 4: Scraping Live External Data (API Queries)
The backend requires live numbers to compare against the rules.
* **Weather API:** Calls OpenWeather via `weather.service.js` to grab the instantaneous temperature.
* **Market Database Query:** The backend queries the persistent `dev.db` database via Prisma (`await prisma.mandiPrice.count()`). It calculates arriving truckloads over the last 7 days compared to a 30-day moving average.
* **Storage Reality:** The massive array of raw Mandi Prices is the only data permanently resting in the hard drive/Database. Weather data is held purely in RAM.

### Step 5: The Math (Core Logic Processing)
Everything is evaluated in memory:
1. **Temperature Penalty:** `((Current Temp - Max Temp Threshold) / 25) * 200`
2. **Humidity Penalty:** `((Current Humidity - Max Hum Threshold) / 80) * 200`
3. **Surplus Penalty:** (Current 7-Day Arrivals / 30-Day Average)
The server crunches a final weighted score (out of 100) and dictates a textual warning like "Sell Immediately". 

### Step 6: Transmission Back to Frontend
Unlike traditional records, the Final Risk Score is **never saved to the database**. Risk is highly volatile, so once the math calculation ends, the server instantly converts the scores, the colors (e.g., `#EF4444` for red), and recommendations into a JSON packet and fires it back to the client.

### Step 7: Final Rendering
The React Frontend physically catches the returned JSON packet.
* **Code Reference:** `setResult(res.data);` 
* **Execution:** React recognizes a change in the internal variables and instantly repaints the screen—rotating the needle on the Risk Gauge, animating the colored progress bars, and rendering the dynamic text on the monitor.

---

## 4. The Weather Microservice Architecture

The Weather system operates as a sophisticated, independent module inside `server/src/services/weather.service.js`.

### A. The External API Endpoint
When a weather request is triggered, the backend securely targets the **OpenWeatherMap API**. 
* **The Endpoint:** `https://api.openweathermap.org/data/2.5/weather`
* **Query Formatting:** It automatically formats the location to ensure high accuracy in India: `?q=[District],[State],IN&units=metric`
* **Authorization:** It silently attaches the `OPENWEATHER_API_KEY` from the encrypted `.env` file.

### B. Smart Caching (Rate Limit Protection)
OpenWeather tightly restricts how many free API calls can be made per minute. To prevent server blacklisting, the architecture uses an **In-Memory Cache System**.
* **How it works:** When someone checks the risk for "Maharashtra", the server saves the weather result in a temporary `Map` object in the RAM. 
* **The TTL (Time To Live):** It keeps this snapshot alive for exactly **10 minutes**. Subsequent checks for that state hit the RAM instantly rather than burning external API credits.

### C. macOS Network Bypass Execution
The implementation utilizes a specialized execution pipeline. Instead of relying on standard HTTP clients like `axios` or `fetch`, the code executes a native terminal subprocess using `curl -s`.
* **Why?** Node.js frequently suffers from aggressive `ETIMEDOUT` network sandboxing when developing locally on macOS machines. Shelling out to the kernel via `child_process` execution completely circumvents Apple's local blocking, ensuring a 100% reliable connection to OpenWeather.

### D. The Fallback Safety Net
If the OpenWeather servers drop offline or the API key is revoked, the core server **will not crash**.
A local `catch (err)` block intercepts network failures and generates a "Graceful Degradation" object (defaulting to benign constraints like 30°C and 65% humidity) so the frontend UI can continue rendering without throwing fatal red errors to the user.

---

## 5. The Data Payload (JSON Structure)

This is the exact structure of the data packet that is transmitted across the internet from the Backend (`/api/waste-risk`) back to the Frontend UI in Step 6 of the lifecycle.

```json
{
  "commodity": "Tomato",
  "state": "Maharashtra",
  "district": "All Districts",
  "category": "Perishable",
  "riskScore": 68,
  "riskLevel": "HIGH",
  "recommendation": "Sell immediately or arrange cold storage. Current conditions accelerate spoilage significantly.",
  "color": "#EF4444",
  "weather": {
    "temperature": 32.5,
    "humidity": 78,
    "condition": "Clear",
    "city": "Maharashtra"
  },
  "factors": {
    "temperature": {
      "current": 32.5,
      "threshold": 25,
      "score": 60,
      "status": "EXCEEDS"
    },
    "humidity": {
      "current": 78,
      "threshold": 80,
      "score": 0,
      "status": "SAFE"
    },
    "marketSurplus": {
      "ratio": 1.45,
      "score": 27,
      "status": "MODERATE"
    }
  },
  "shelfLife": {
    "normal": 7,
    "adjusted": 4
  }
}
```
