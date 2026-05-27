# AgriTrade AI Chatbot Architecture

Here is the precise, step-by-step technical breakdown of how the AI Chatbot feature is wired into your codebase.

## 1. Where is the main code logic written?

The vast majority of the backend logic powering the Chatbot is centralized in one file:
**Backend Controller/Router**: [chat.routes.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/src/routes/chat.routes.js)

## 2. Step-by-Step Flow of Data

When you type a message and press "Send", the following precise sequence occurs:

1. **Frontend Capture**: The React component [Chat.jsx](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/client/src/pages/Chat.jsx) captures your text input and temporarily renders it on the screen to feel instantly responsive (optimistic UI rendering).
2. **REST Call**: The frontend sends an HTTP `POST` payload to the backend server.
3. **Database Insertion (User)**: The backend securely receives the message and immediately saves your exact message into the local SQLite database so it isn't lost.
4. **Context Building**: The backend gathers context to mentally prepare the AI:
   - It queries the database for your **past 20 messages** so the AI remembers the conversation.
   - It triggers a background process to fetch the **Live Weather** for your precise District & State.
5. **AI Payload Generation**: The backend injects the live weather, your role (Farmer/Buyer), and your location into a massive hidden System Prompt. 
6. **Network Bypass Request**: To bypass your Mac's firewall, the server spins up a hidden terminal `curl` command and fires it over the internet to the Anthropic servers.
7. **Database Insertion (AI)**: The AI responds. The server parses the response, saves Claude's answer into the database, and finally returns the JSON back to your frontend.

## 3. What all files are involved?

- **Frontend Interface**: [Chat.jsx](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/client/src/pages/Chat.jsx) *(Draws the UI, handles React state, manages conversation threads)*
- **Frontend Networking**: [api.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/client/src/services/api.js) *(Axios configuration)*
- **Backend Routing & AI Injection**: [chat.routes.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/src/routes/chat.routes.js) *(Heart of the logic)*
- **Weather Service Integrator**: [weather.service.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/src/services/weather.service.js)
- **Environment Variables**: [server/.env](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/.env) *(Stores the secret keys)*

## 4. Where is the data being stored?

All messages and chat history are safely stored in your local SQLite relational database, specifically in the file:
[dev.db](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/dev.db)

## 5. Where is the Frontend calling the Backend?

In [Chat.jsx](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/client/src/pages/Chat.jsx), there are two specific lines where the network requests are triggered using Axios `api` intercepts:

**Creating a new Chat Thread** (Line 59):
```javascript
const res = await api.post('/chat/sessions', { title: 'New Conversation' });
```

**Sending an actual Message bubble** (Line 109):
```javascript
const res = await api.post(`/chat/sessions/${sessionId}/messages`, { content: currentInput });
```

## 6. Where are the exact lines calling the Database?

In [chat.routes.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/src/routes/chat.routes.js), database actions happen via Prisma:

**Saving your User message to DB** (Line 81):
```javascript
await prisma.chatMessage.create({ ... })
```

**Loading past conversation history** (Line 90):
```javascript
const history = await prisma.chatMessage.findMany({ where: { sessionId: session.id } ... })
```

**Saving the AI's response to DB** (Line 100):
```javascript
await prisma.chatMessage.create({ data: { role: 'assistant', content: aiResponse } })
```

## 7. Which APIs are being called and what are their Endpoints?

The AI Chatbot relies on two external APIs that it securely fires out over the web. Both are patched via `curl` wrappers in child environments to circumvent your local application firewalls.

### A. The Weather Application (OpenWeatherMap API)
Before generating an AI response, the Chatbot asks the weather service to get your current humidity and temperature.
- **Service File**: [weather.service.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/src/services/weather.service.js)
- **API Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **Query Format**: `?q=[District,State,IN]&appid=[YOUR_KEY]&units=metric`

### B. The AI Brain (Anthropic Claude 3 Haiku)
The server sends your question, history, and weather data over to Claude's infrastructure for evaluation.
- **Service File**: [chat.routes.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/src/routes/chat.routes.js)
- **API Endpoint**: `https://api.anthropic.com/v1/messages`
- **Method & Model**: `HTTP POST` request pushing payload for `claude-3-haiku-20240307`

## 8. What is the Database Schema and where is it actualized?

The Database architecture powering your AI Chat is designed using **Prisma ORM**. The blueprint for how SQL tables should be constructed is explicitly written in:
[schema.prisma](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/prisma/schema.prisma)

Here is the exact schema definition for the AI Chat context:

```prisma
model ChatSession { 
  id        String        @id @default(cuid())
  userId    String        // Tied to the person logged in
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?       // The title of the chat
  createdAt DateTime      @default(now())
  messages  ChatMessage[] // Array containing all messages inside this thread
  @@index([userId])
}

model ChatMessage { 
  id        String      @id @default(cuid())
  sessionId String      // Ties this message back to the 'ChatSession'
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String      // 'user' (You) OR 'assistant' (Claude AI)
  content   String      // The actual text payload
  createdAt DateTime    @default(now())
  @@index([sessionId])
}
```

### Where is this schema "Actualized" in code?
The physical database connection mapped to this schema is birthed and instantiated directly inside [chat.routes.js](file:///Applications/1%20-%201%20Entire%20Work%20Station/Projects/PBL_agri/server/src/routes/chat.routes.js).

**Line 2** (The server imports the Javascript object compiled from the schema blueprint):
```javascript
const { PrismaClient } = require('@prisma/client');
```

**Line 6** (The code actualizes the schema by spinning up a live network connection to `dev.db`):
```javascript
const prisma = new PrismaClient();
```

**Line 81** (The code uses that actualized object to push the user's message into SQLite):
```javascript
await prisma.chatMessage.create({ ... })
```
