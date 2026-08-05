# 🦷 Mandibular Morphogenetic Analysis System

> AI-powered Dental OPG Analysis Platform — Monorepo

## 📁 Project Structure

```
mandibular/
├── dataset/        # Shared AI/ML — OPG images, model training, landmark detection
│   ├── process_dataset.py
│   ├── train_landmark_model.py
│   ├── landmark_model.pth
│   └── *.jpg (OPG images)
│
├── web/            # Next.js 14 Web Application
│   ├── src/app/    # Pages & routing
│   ├── src/lib/    # Supabase client (shared backend)
│   └── .env.local  # Supabase credentials
│
└── mobile/         # React Native (Expo) Mobile App
    ├── app/        # Expo Router screens
    ├── lib/        # Supabase client (same backend as web)
    └── .env        # Supabase credentials (same as web)
```

## 🔗 Shared Backend (Supabase)

Both **web** and **mobile** apps connect to the **same Supabase project**:
- Authentication (email/password)
- Database (patient records, analyses, reports)
- Storage (OPG image uploads)

## 🚀 Getting Started

### Web App
```bash
cd web
npm install
npm run dev
# Opens at http://localhost:3000
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go app
```

### AI Model Training
```bash
cd dataset
python train_landmark_model.py
```

## 🛠️ Tech Stack

| Layer | Web | Mobile |
|-------|-----|--------|
| Framework | Next.js 14 | React Native (Expo) |
| Auth & DB | Supabase | Supabase (same project) |
| UI | Tailwind CSS | React Native StyleSheet |
| AI | Python (landmark_model.pth) | API calls to backend |
