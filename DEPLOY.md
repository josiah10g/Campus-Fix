# Deployment Guide: CampusFix

This guide covers deploying CampusFix as two independent services:
1. **Hosted PostgreSQL Database** (e.g., Neon / Render Postgres)
2. **Backend REST API** (Render Web Service)
3. **Frontend SPA** (Render Static Site / Netlify / Vercel)

---

## Step 1: Provision Hosted PostgreSQL Database

1. Sign up or log into [Neon](https://neon.tech) or create a PostgreSQL instance on [Render](https://render.com).
2. Create a new PostgreSQL database named `campusfix`.
3. Copy the full connection string URL. It looks like:
   ```text
   postgres://username:password@ep-cool-sample.region.neon.tech/campusfix?sslmode=require
   ```

---

## Step 2: Push Repository to GitHub

Ensure your local repository is pushed to your personal GitHub account:
```bash
git remote add origin https://github.com/your-username/campusfix.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend on Render (Web Service)

1. Log into your Render dashboard and click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `campusfix-api`
   - **Region**: Closest to your users (e.g. Frankfurt or Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free
4. Add Environment Variables under **Environment**:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Paste the PostgreSQL connection string from Step 1)*
   - `JWT_SECRET`: *(A long random secret string, e.g. 32+ characters)*
   - `SUPER_ADMIN_EMAIL`: `superadmin@example.com`
   - `SUPER_ADMIN_PASSWORD`: *(A strong password for your super admin account)*
   - `FRONTEND_URL`: `http://localhost:5173` *(Will be updated in Step 5)*
5. Click **Deploy Web Service**.
6. When deployment finishes, test the health check in your browser:
   ```text
   https://campusfix-api.onrender.com/api/health
   ```
   *Expected response:* `{"ok": true, "timestamp": "..."}`.

---

## Step 4: Deploy Frontend (Static Site on Vercel or Render)

### Option A: Vercel (Recommended & Supported)
Yes, you can deploy the frontend on **Vercel** with one click:
1. Log in to [Vercel](https://vercel.com) and click **Add New...** > **Project**.
2. Import your GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click "Edit" next to Root Directory and select the `frontend` folder).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables under **Environment Variables**:
   - `VITE_API_URL`: `https://campusfix-api.onrender.com` *(Your Render backend URL from Step 3)*
5. Click **Deploy**.
*(The repository already includes `frontend/vercel.json` with rewrite rules `{ "source": "/(.*)", "destination": "/index.html" }`, ensuring browser refreshes on deep routes like `/issues`, `/report`, or `/users` never 404).*

### Option B: Render Static Site
1. In Render dashboard, click **New +** > **Static Site**.
2. Connect your repository.
3. Configure settings:
   - **Name**: `campusfix-web`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `https://campusfix-api.onrender.com` *(Your Render backend URL from Step 3)*
5. Click **Create Static Site**.
*(The repository includes `frontend/public/_redirects` which handles client-side routing on Render).*

---

## Step 5: Update CORS on the Backend

1. Copy your live frontend URL (e.g. `https://campusfix-web.onrender.com`).
2. Go back to your Render Backend Service > **Environment**.
3. Update `FRONTEND_URL` to your live frontend URL:
   ```text
   FRONTEND_URL = https://campusfix-web.onrender.com
   ```
4. Save and trigger a manual redeploy on the backend service.

---

## Step 6: Verify End-to-End on the Live URL

1. Open your live frontend in your browser.
2. Log in with the super admin credentials configured in Render (`superadmin@example.com`).
3. Verify the 4 core CRUD operations:
   - **Create**: Report an issue and ensure it appears immediately.
   - **Read**: Check dashboard stats, category filters, and search bar.
   - **Update**: Change status inline or edit issue description.
   - **Delete**: Delete the test report and verify removal.
4. Copy the live frontend and backend URLs into `README.md`.

---

## Troubleshooting on Render

1. **First request slow after sleep**:
   - Free instances on Render spin down after 15 minutes of inactivity. The first request takes 30–50 seconds to wake up the server. Subsequent requests will be instant.
2. **Missing environment variables crashing the server**:
   - Check Render logs under the "Logs" tab. If `DATABASE_URL` or `JWT_SECRET` is missing, the server will log an error. Ensure all variables from `.env.example` are present.
3. **Database SSL errors**:
   - If you see `no pg_hba.conf entry for host` or `self-signed certificate in certificate chain`, ensure `NODE_ENV=production` is set in the Render dashboard. `backend/db.js` specifically sets `ssl: { rejectUnauthorized: false }` when `NODE_ENV === 'production'`.
4. **CORS errors in browser console**:
   - Ensure `FRONTEND_URL` in the backend Render environment exactly matches the frontend origin (including `https://` and without trailing slashes).
5. **Frontend still pointing to localhost**:
   - Ensure `VITE_API_URL` is set in the frontend build settings before running `npm run build`. Vite bakes environment variables in at build time.
6. **Refreshing a page returns 404**:
   - Ensure `public/_redirects` (with `/* /index.html 200`) is placed in the publish directory for Render/Netlify, or `vercel.json` is used for Vercel.

