# SmartResolver — AI-Powered Complaint Management System

SmartResolver is a full-stack complaint management platform built with the MERN stack. It enables users to submit, track, and resolve institutional complaints in real time — with an AI-powered duplicate detection engine that automatically identifies similar complaints using the Gemini API.

---


## 🧠 The AI Layer

The core engineering challenge was duplicate complaints. The same issue would get submitted 10–15 times in different words:

- *"WiFi down in block A"*
- *"No internet near the canteen"*
- *"Connectivity issue in hostel wing"*

Rather than keyword matching (which would miss semantic similarity), I integrated the **Gemini API** to perform semantic similarity detection on every new submission. When a complaint is submitted, it's compared against all open complaints. If similarity crosses a threshold, the user sees a **"possible duplicate" warning** — giving them control rather than auto-merging blindly.

The hardest part was calibrating the threshold. Too strict → different problems get merged. Too loose → duplicates slip through. I iterated with real complaint data until the false positive rate was acceptable.

---

## ✨ Features

- 📝 **Submit complaints** with category, priority, and description
- 🤖 **AI duplicate detection** powered by Gemini API — flags similar complaints before submission
- 📊 **Priority-based routing** — urgent complaints are automatically escalated
- 📈 **Admin analytics dashboard** — visualize complaint trends, resolution rates, and key metrics
- 🔐 **Role-based access** — separate views and permissions for students and admins
- ⚡ **Real-time status updates** — track complaint progress from submission to resolution

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| AI / NLP | Gemini API (Google) |
| Styling | CSS3 |
| Version Control | Git, GitHub |

---

## 📁 Project Structure

```
smartresolver/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
├── server/          # Node.js + Express backend
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── index.js
└── .gitignore
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Gemini API key — get one at [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Clone the repo
git clone https://github.com/gokulakannan18/smartresolver.git
cd smartresolver
```

```bash
# Install server dependencies
cd server
npm install
```

```bash
# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file inside the `server/` directory:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

### Run the App

```bash
# Start the backend (from /server)
npm run dev

# Start the frontend (from /client)
npm start
```

The app will be running at `http://localhost:3000`

---

## 🔍 How the Duplicate Detection Works

1. User submits a complaint with a description
2. The server sends the new complaint + all open complaints to the **Gemini API**
3. Gemini computes semantic similarity scores
4. If any score exceeds the threshold, the API returns a warning with the matching complaint
5. The user sees a "Possible duplicate found" message and can choose to proceed or cancel

```
New Complaint → Gemini API → Similarity Score → Threshold Check → Warning or Submit
```

---

## 📊 Admin Dashboard

The admin panel provides:
- Total complaints by status (open, in-progress, resolved)
- Complaints by category and priority
- Resolution rate over time
- Escalated complaints requiring immediate attention

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 👤 Author

**K. Gokulakannan**
- GitHub: [@gokulakannan18](https://github.com/gokulakannan18)
---

