# Secure Vault Asset Management — Deployment Status & Guide

This document summarizes the current state of the application's deployment configuration, where the work currently stands, and the next steps required to deploy the project to a local or production cloud environment.

---

## 🚦 Current Deployment Status

The application has been **fully containerized** using Docker. The configuration files are in place and pushed to the repository:
1. **Frontend Client Container** ([client/Dockerfile](file:///c:/Users/LENOVO/Desktop/SPA/asset-management-spa/client/Dockerfile)): Multi-stage build that compiles the React app with Vite and serves it using a lightweight Nginx server configured in [client/nginx.conf](file:///c:/Users/LENOVO/Desktop/SPA/asset-management-spa/client/nginx.conf).
2. **Backend API Server Container** ([server/Dockerfile](file:///c:/Users/LENOVO/Desktop/SPA/asset-management-spa/server/Dockerfile)): Node.js runtime environment running on Alpine Linux to host the Express API server.
3. **Orchestration Configuration** ([docker-compose.yml](file:///c:/Users/LENOVO/Desktop/SPA/asset-management-spa/docker-compose.yml)): Defines three services—`mongodb` database volume storage, `server` backend container, and `client` frontend container—and routes them together under a private network `vault-network`.

---

## 🛠️ Next Process & Detailed Steps

### Step 1: Configure Environment Variables
You need to create a `.env` file in the root directory (where `docker-compose.yml` resides) based on the [.env.example](file:///c:/Users/LENOVO/Desktop/SPA/asset-management-spa/.env.example) template.

1. **Copy the example template**:
   ```bash
   cp .env.example .env
   ```
2. **Fill in the variables**:
   * `JWT_SECRET`: A secure, random string used to sign user auth tokens.
   * **AWS S3 Config** (Required for secure, persistent file storage in production):
     * `AWS_ACCESS_KEY_ID`
     * `AWS_SECRET_ACCESS_KEY`
     * `AWS_REGION`
     * `AWS_BUCKET_NAME`
   * **SMTP Email Config** (Required to email users when support tickets are resolved or password resets are requested):
     * `SMTP_HOST`
     * `SMTP_PORT` (usually `587` or `465`)
     * `SMTP_USER`
     * `SMTP_PASS`

---

### Step 2: Run Locally with Docker Compose
To verify the containers build and run correctly on your local machine:

1. **Build and start services**:
   ```bash
   docker-compose up --build
   ```
2. **Verify endpoints**:
   * **Client App**: Open [http://localhost:8080](http://localhost:8080) in your browser.
   * **Backend API**: Accessible at [http://localhost:5000](http://localhost:5000).
   * **MongoDB**: Running internally on port `27017` inside the container network.
3. **Shut down services**:
   ```bash
   docker-compose down -v
   ```

---

### Step 3: Choose a Staging/Production Host
You can deploy this Dockerized setup using one of these options:

#### Option A: Managed PaaS (e.g., Render, Railway, fly.io)
This is the simplest option. Render supports direct deployment of `docker-compose.yml`:
1. Sign in to [Render](https://render.com/) and create a **Web Service** or a **Private Service**.
2. Connect it to your GitHub repository `asset-management-spa`.
3. Render will detect the Dockerfile configurations or you can use a unified Docker Compose setup on Railway.
4. Input all the production environment variables (S3, SMTP, JWT) in the hosting provider's dashboard configuration panel.

#### Option B: Virtual Private Server (VPS) (e.g., DigitalOcean Droplet, AWS EC2)
If you want complete control on a server:
1. Provision a VPS running Ubuntu 22.04 LTS.
2. Install Docker and Docker Compose:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   ```
3. Clone your GitHub repository onto the VPS:
   ```bash
   git clone https://github.com/rkotesh/asset-management-spa.git
   cd asset-management-spa
   ```
4. Create the `.env` file as detailed in Step 1.
5. Run the containers in detached (background) mode:
   ```bash
   sudo docker-compose up -d --build
   ```
