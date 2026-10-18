# Deploy Storia Viva (PoC)

Quick deployment guide for the PoC on **Render.com** (free tier).

## 1. Deploy the Backend

1. Push the `backend/` folder to a GitHub repo (or create a new one).
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect the repo and set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   - `TTS_MODE` = `eleven`
   - `ELEVENLABS_API_KEY` = your ElevenLabs key
5. Deploy. Note the URL (e.g. `https://storia-viva-backend.onrender.com`).

## 2. Deploy the Frontend

1. Update `src/environments/environment.prod.ts` with your real backend URL:
   ```ts
   apiBaseUrl: 'https://storia-viva-backend.onrender.com'
   ```
2. Push the `angular-frontend/` folder.
3. On Render: New → Static Site.
4. Set:
   - **Root Directory**: `angular-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist/storia-viva/browser`
5. Deploy.

## 3. Test

Open the frontend URL. The demo and story generation should work against the live backend.

---

**Notes**
- Free Render services spin down after inactivity (cold start ~30s).
- Audio files are stored in memory on the free tier (they disappear on restart). Fine for a PoC.
- Later you can move to a paid plan or add persistent storage if needed.
