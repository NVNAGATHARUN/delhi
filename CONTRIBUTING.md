# Contributing to Q-Traffic

Welcome! This guide will help you get set up to continue working on the Q-Traffic project.

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- **Git**
- **Python 3.10+**
- **Node.js 18+** (includes npm)

### 2. Clone the Repository
```bash
git clone https://github.com/NVNAGATHARUN/delhi.git
cd delhi
```

### 3. Backend Setup (FastAPI)
Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Frontend Setup (Next.js)
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

---

## 🛠️ Running the Application

### Option A: The Windows Shortcut
If you are on Windows, simply run the `start.bat` file in the root directory. It will automatically launch both the backend and frontend in separate terminal windows.

### Option B: Manual Execution
Open two terminal windows:

**Terminal 1: Backend**
```bash
cd backend/src
python main.py
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

---

## 🌐 Accessing the System
- **Next.js Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📁 Project Structure
- `backend/`: Core logic, AI detection (YOLOv8), and Quantum optimization (Qiskit).
- `frontend/`: Real-time dashboard built with Next.js, Framer Motion, and Recharts.
- `simulation/`: Traffic physics and coordination logic.
