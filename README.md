# PixelPlus

A Photoshop-like system for photo editing using OpenCV.

---

## Monorepo Structure

- `frontend/` - Next.js, Electron, Tailwind CSS, lucide-react
- `backend/` - FastAPI, OpenCV (Python)

---

## Frontend

- **Stack:** Next.js, Electron, Tailwind CSS, lucide-react
- **Setup:**
  1. `cd frontend`
  2. `npm install`
  3. `npm run dev` (for Next.js)
  4. Configure Electron entry point as needed

## Backend

- **Stack:** FastAPI, OpenCV (Python)
- **Setup:**
  1. `cd backend`
  2. `python3 -m venv venv && source venv/bin/activate`
  3. `pip install fastapi uvicorn opencv-python`
  4. `uvicorn main:app --reload`

---

## Getting Started

- Develop frontend and backend independently.
- Integrate via API endpoints for image processing.

---

## Next Steps

- Implement Electron main process in `frontend`.
- Add API endpoints in `backend` for image editing features.
