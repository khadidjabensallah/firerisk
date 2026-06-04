# Deployment Guide - Algerian Forest Fire Risk Engine

To make your deployed application functional, you need to host the machine learning backend (FastAPI) and point your frontend to it.

## 1. Deploy the Backend to Render.com

Render is a great free/affordable option for hosting Python APIs.

1.  **Create a Render Account**: Go to [render.com](https://render.com).
2.  **New Web Service**: Click **New +** and select **Web Service**.
3.  **Connect GitHub**: Connect your repository.
4.  **Configure Service**:
    *   **Name**: `forest-fire-backend`
    *   **Root Directory**: `forest-fire-backend`
    *   **Language**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5.  **Deploy**: Click **Create Web Service**.
6.  **Get URL**: Once deployed, Render will providing a URL like `https://forest-fire-backend.onrender.com`. **Copy this URL.**

---

## 2. Configure Netlify Environment Variable

Now, tell your frontend where the live backend is.

1.  **Netlify Dashboard**: Go to your project on Netlify.
2.  **Site Configuration**: Go to **Site settings** > **Environment variables**.
3.  **Add Variable**:
    *   **Key**: `VITE_BACKEND_URL`
    *   **Value**: Paste your Render URL (e.g., `https://forest-fire-backend.onrender.com`).
4.  **Redeploy**: Trigger a new deploy of your site for the changes to take effect.
    *   Go to **Deploys** > **Trigger deploy** > **Clear cache and deploy site**.

---

## 3. Local Development

When running locally, you can still use the local backend:
1.  Navigate to `forest-fire-backend`.
2.  Run `python app.py`.
3.  The frontend will automatically fallback to `http://localhost:8000` if `VITE_BACKEND_URL` is not set in your `.env` file.
