❤️ CardioInsight

## AI-Powered Application for Early Detection of Heart Disease Risk

CardioInsight is a full-stack AI-powered healthcare web application designed to predict cardiovascular disease risk using machine learning. The system performs real-time heart disease risk analysis based on clinical parameters and provides secure user authentication, OCR-based medical report processing, and downloadable PDF report generation.

## 🚀 Features

* 🔍 Real-time heart disease risk prediction
* 🤖 Random Forest ML model (Scikit-learn)
* 📊 Probability-based risk analysis
* 🔐 Secure JWT authentication
* 🗂 Prediction history tracking
* 📄 OCR-based medical report data extraction
* 📑 Automated PDF report generation
* 📦 Scalable REST API architecture

## 🛠 Tech Stack

**Frontend:** Next.js (TypeScript), React, Tailwind CSS
**Backend:** Flask (Python)
**Machine Learning:** Scikit-learn, Pandas, NumPy
**Database:** MongoDB (Mongoose)
**Authentication:** JWT, bcrypt
**OCR & Image Processing:** Tesseract, OpenCV, Pillow
**PDF Generation:** ReportLab
**Deployment:** Gunicorn, Node.js

## 🏗 Architecture Overview

CardioInsight follows a modular monorepo structure:

```
CardioInsight/
│
├── client/        # Next.js frontend + API routes
├── backend/       # Flask ML server
├── models/        # Trained ML models
├── docs/          # Documentation
└── ml/            # ML experiments
```

### Application Flow

1. User submits health parameters or uploads medical report
2. Frontend sends request to Flask backend
3. ML model predicts heart disease risk
4. Result stored in MongoDB
5. PDF report generated and displayed

## 🤖 Machine Learning Model

* Algorithm: Random Forest Classifier
* Dataset: UCI Heart Disease Dataset
* 13 Clinical Input Features
* Feature Scaling & Probability Calibration
* Improved accuracy by 12% through feature engineering

## 👁 OCR Processing

* Converts PDF/Image to processable format
* Image preprocessing using OpenCV
* Text extraction using Tesseract
* Extracted values used for ML prediction

## 🔐 Security

* JWT-based authentication
* Password hashing using bcrypt
* Protected routes with middleware
* Secure cookie handling

## ⚙️ Installation & Setup

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python train_model.py
python app.py
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## 🌍 Environment Variables

Create a `.env` file:

```
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
RISK_THRESHOLD=0.5
```

## 📈 Future Enhancements

* Cloud deployment (AWS/Azure)
* Model improvement using deep learning
* Role-based access control
* Advanced clinical data analytics dashboard

## 📌 Author

**Chitra M**
B.Tech Information Technology
AI & Full-Stack Developer
