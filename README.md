# 🌸 Nourish Glow — AI Dermatology & Skincare Intelligence

> *Your intelligent skincare companion — powered by computer vision, clinical AI, and personalized routine science.*

Nourish Glow is a next-generation skincare web application that blends **AI diagnostics**, **clinical cosmetic chemistry**, and **circadian skincare science** into a single, beautifully crafted platform. Whether you're identifying your skin type, building a custom morning-to-evening routine, or getting real-time analysis through your camera — Nourish Glow puts dermatologist-level intelligence in your hands.

---

## ✨ Features

- 🔬 **AI Skin Diagnostic** — Real-time facial scan with computer vision to detect skin type, hydration, and concerns
- 🧴 **Personalized Routine Planner** — Build AM & PM skincare routines tailored to your unique skin profile
- 🔔 **Routine Reminders & Notifications** — Scheduled morning & evening alerts so you never miss a skincare step
- 🛍️ **Product Catalog** — Curated skincare products with ingredient analysis and skin-type matching
- 📓 **Progress Journal** — Track your skincare journey with daily logs and progress photos
- 👩‍⚕️ **Dermatologist Consultation** — Book virtual consultations with certified skin specialists
- 🧪 **Ingredient Lab** — Deep-dive into ingredient safety, compatibility, and clinical evidence
- 🪞 **Smart Mirror IoT** — Connect with smart mirror devices for ambient routine guidance
- 💳 **Secure Checkout** — Full e-commerce flow with order tracking

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sachikangutkar/Nourish-Glow.git
   cd Nourish-Glow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   Required keys:
   - `GEMINI_API_KEY` — Your Google Gemini API key
   - `VITE_FIREBASE_*` — Firebase project credentials

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Custom CSS |
| AI / Vision | Google Gemini API + MediaPipe + TensorFlow Lite |
| Auth & Database | Firebase Auth + Firestore |
| Notifications | Web Notifications API + Service Worker |
| Payments | Razorpay |
| Deployment | Vercel |

---

## 🌐 Live Demo

👉 **[https://nourish-glow.vercel.app](https://nourish-glow.vercel.app)**

---

## 👩‍💻 Developer

Made with 💖 by **Sachi Kangutkar**

---

*© 2026 Nourish Glow AI • Clinical Cosmetic Chemistry*
