# Nourish Glow Tech Stack & Proposed System

This document outlines the frontend, backend, and database specifications of the **Nourish Glow** application, prepared to be compatible with standard Node.js/Express full-stack hosting and Vercel environments.

---

## 1. Frontend Configuration
* **Core Framework:** React v19.0.1
* **Build Tool:** Vite v6.2.3
* **Styling Engine:** Tailwind CSS v4.1.14
* **Icons Library:** Lucide React v0.546.0
* **Data Visualizations:** Recharts v3.9.2
* **Animations:** Motion (Framer Motion) v12.23.24

---

## 2. Backend Configuration
* **Server Framework:** Express v4.21.2
* **Development Runner:** `tsx` (TypeScript Execution)
* **Production Bundler:** `esbuild` v0.25.0
* **Deployment Setup:** Native Node.js Server (`server.ts`) bundled into CommonJS (`dist/server.cjs`) for lightweight container/lambda startup. Fully configured for Vercel functions via `/api/index.ts` and `vercel.json` rewrite routing.

---

## 3. Database Configuration
* **Database Engine:** Google Cloud Firestore (NoSQL, Firebase SDK v12.16.0)
* **Authentication Platform:** Firebase Authentication
* **Security & Rules:** Custom `firestore.rules` containing collection-level access policies (users can only access, edit, and delete their own logged diagnostic cards, routines, and profiles).

---

## 4. Proposed System (Summary)
**Nourish Glow** is an elegant, highly personalized skincare companion and routine optimizer. The system is designed to remove the complexity of custom product pairing through:
* **Personalized Skin Diagnostic:** A comprehensive evaluation panel assessing parameters like skin type, oil levels, climate conditions, and primary concerns (e.g., irritation, dehydration) without using "AI" jargon.
* **Routine Planner:** A dual-regimen calendar (AM/PM timelines) that lets users schedule, track, and modify custom application steps.
* **Interactive Ingredient Lab:** A scientific sandbox analyzing product components like Salicylic Acid and Niacinamide, highlighting layering interactions to avoid ingredient conflict.
* **Progress Journal & Streak Tracker:** A high-contrast dashboard displaying streak longevity metrics and daily routine check-ins, fully persisted via secure Cloud Firestore syncing.
