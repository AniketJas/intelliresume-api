# 🚀 IntelliResume Backend API

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express.js Version](https://img.shields.io/badge/express-%5E5.2.1-green.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%5E9.7.1-darkgreen.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Powered-purple.svg?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![Redis Cache](https://img.shields.io/badge/Redis-Rate%20Limit%20%26%20Cache-red.svg?style=for-the-badge&logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Welcome to the backend engine of **IntelliResume**, a production-grade, AI-powered resume analyzer and Applicant Tracking System (ATS) evaluation pipeline. 

Built on a modern event-driven Node.js & Express.js stack, this server handles secure token-based user authentication, multipart file upload processing, fast text extraction, cloud file replication, AI-based analysis using the Google Gemini model, Redis-backed rate limiting, and cached historical analysis retrievals.

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Folder Structure](#-folder-structure)
4. [Request & Data Pipelines](#-request--data-pipelines)
   - [Request Execution Flow](#request-execution-flow)
   - [Authentication Flow](#authentication-flow)
   - [AI Analysis Pipeline](#ai-analysis-pipeline)
5. [Tech Stack](#-tech-stack)
6. [Installation & Setup](#-installation--setup)
7. [Environment Variables](#-environment-variables)
8. [API Endpoints Reference](#-api-endpoints-reference)
9. [Security Architecture](#-security-architecture)
10. [Error Handling Strategy](#-error-handling-strategy)
11. [Performance Optimizations](#-performance-optimizations)
12. [Deployment Guide](#-deployment-guide)
13. [Troubleshooting & FAQ](#-troubleshooting--faq)
14. [Roadmap & Future Improvements](#-roadmap--future-improvements)
15. [Contributing](#-contributing)
16. [License](#-license)

---

## 🎯 Project Overview

In today's highly competitive job market, resumes are filtered by automated **Applicant Tracking Systems (ATS)** before reaching human eyes. **IntelliResume Backend** acts as a secure, fast, and scalable API engine that parses uploaded resumes, extracts text content, uploads files to Cloudinary for persistence, and runs a comprehensive, multi-criteria evaluation using Google’s state-of-the-art **Gemini API**.

The backend leverages a composite evaluation framework, grading resumes on a scale of `0-100` across 9 key structural parameters (e.g., technical skills, quantified achievements, recommended roles) and outputting structured JSON analyses containing strengths, weaknesses, missing skills, and a detailed recruiter summary. It guarantees high performance via Redis connection-pooling, query optimization, cron keep-alive cycles, and cryptographic resume deduplication.

---

## ✨ Key Features

*   **🔒 Secure Authentication:** Implements stateless **JWT-in-Cookie** authorization. JWT tokens are signed with high-entropy keys and delivered to the client via `HttpOnly`, `Secure`, and `SameSite` cookie configurations to eliminate XSS and CSRF token extraction vulnerabilities.
*   **📂 Multi-Format File Uploads:** Integrated memory-buffered `Multer` middleware to handle multipart forms, restricting file processing to only `.pdf` and `.docx` extensions with a hard-capped `10MB` limit.
*   **⚡ Native Text Parsing:** Processes file buffers directly in memory using `pdf-parse` (for PDF files) and `mammoth` (for Microsoft Word DOCX files), completely bypassing intermediate disk writes for speed and security.
*   **☁️ Cloudinary Replication:** Uploads unique resume files to a secure Cloudinary folder, generating cloud-hosted static URLs for permanent, redundant resume storage.
*   **🤖 Advanced Gemini AI Pipeline:** Communicates with Google's Gen AI client, packaging extracted text with professional hiring prompts, and enforces strict schema validation for a predictable JSON feedback response.
*   **💾 Smart Resume Deduplication:** Utilizes SHA-256 hashing on extracted resume text. Before engaging external cloud APIs or AI models, the server performs a compound lookup on `{ userId, resumeHash }` to return cached results instantly.
*   **🔴 Redis Rate-Limiting:** Incorporates `express-rate-limit` using `rate-limit-redis` as the memory database store, mitigating brute-force and Denial-of-Service (DoS) vectors globally.
*   **⏱️ Cron Keep-Alive:** Runs background ping sequences (pings every 14 minutes in production environments) to prevent cold starts on serverless or free-tier hosting solutions like Render.
*   **🛡️ Hardened Security Middlewares:** Configured CORS policies with explicit origin validations, credential transport support, request-loggers (`morgan`), and strict environment isolation.

---

## 📂 Folder Structure

The server employs a highly clean, decoupled MVC/Service architecture separating business layers, data representations, middleware operations, and external services.

```
server/
├── configs/               # Database and third-party API clients initialization
│   ├── db.js              # Mongoose MongoDB connection pool
│   ├── cron.js            # Keep-alive cron jobs
│   ├── multer.js          # Multer memory-storage configuration
│   ├── cloudinary.js      # Cloudinary credentials configuration
│   ├── gemini.js          # Google Gemini GenAI client initialization
│   └── redis.js           # ioredis connection pool setup
├── controllers/           # HTTP Request Handlers (processes inputs, formats output)
│   ├── user.controller.js # Register, login, and logout controllers
│   └── resume.controller.js # Resume upload, parsing, deduplication, and history pagination
├── middlewares/           # Global and Route-specific middlewares
│   ├── jwt.js             # Token verification and cookie extraction
│   ├── multer.js          # Error-wrapped file upload interceptor
│   └── rateLimiter.js     # Redis-backed Express rate limiter
├── models/                # Mongoose Database Schemas (Data integrity layers)
│   ├── user.model.js      # User model (name, email, hashed passwords)
│   └── resume.model.js    # Resume model (user reference, hash, file URL, AI analysis)
├── routes/                # Express API Route Registries
│   ├── user.routes.js     # Defines endpoints for auth state (/api/users/*)
│   └── resume.routes.js   # Defines endpoints for uploads & history (/api/resume/*)
├── services/              # Decoupled business logic and external integrations
│   ├── pdf.service.js     # Parses buffers using pdf-parse library
│   ├── docx.service.js    # Parses buffers using mammoth library
│   ├── gemini.service.js  # Core AI parsing prompt & retry validation
│   └── cloudinary.service.js # Direct stream uploader for Cloudinary
├── index.js               # Express application entry-point and configuration
├── package.json           # Project manifest, scripts, and dependencies
├── .env.example           # Non-sensitive placeholder variables template
└── README.md              # Documentation (This file)
```

### Folder Breakdown
*   `/configs`: Contains static configurations. Rather than scattering API config keys in code, all clients (Redis, Cloudinary, Gemini, Mongoose) are initialized here.
*   `/controllers`: Bridges Express HTTP routing and domain services. They contain validation, instrumented console logging, and HTTP response builders.
*   `/middlewares`: Functions executing within the request-response lifecycle (e.g. rate-limit counts, route authorization guards, Multer error catching).
*   `/models`: Declarative MongoDB schemas. They implement unique constraints, pre-save tasks, and compound indexing schemes.
*   `/routes`: Plain route mapping files binding controller handlers to public URI endpoints.
*   `/services`: Single-responsibility functions. This isolates domain work (like parsing a PDF file or talking to Cloudinary streams) making testing simple.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js (ES Modules, `"type": "module"`)
*   **Web Framework:** Express.js (v5.2.1-next, offering optimized async-route handling)
*   **Database:** MongoDB via Mongoose (v9.7.1, with built-in connection pool defaults)
*   **Caching & Rates:** Redis (via `ioredis` v5.11.1 and `rate-limit-redis` v5.0.0)
*   **AI Engine:** Google Gemini AI API (`@google/genai` v2.9.0 client library)
*   **Cloud Storage:** Cloudinary (`cloudinary` v2.10.0 Node.js SDK)
*   **Upload Handling:** Multer (v2.2.0-next, handles in-memory file buffers)
*   **Text Parsers:** `pdf-parse` (v2.4.5) and `mammoth` (v1.12.0)
*   **Cryptography & Protection:** `bcryptjs` (v3.0.3) & `jsonwebtoken` (v9.0.3)
*   **Request Utilities:** `cookie-parser` (v1.4.7), `cors` (v2.8.6), `morgan` (v1.11.0)
*   **Background Jobs:** `cron` (v4.4.0)
*   **Environment Configuration:** `dotenv` (v17.4.2)

---

## 📥 Installation & Setup

Follow these steps to configure, build, and run the backend server locally on your machine.

### Prerequisites
Make sure you have installed:
*   [Node.js](https://nodejs.org/) (Version `>=18.x.x` required)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or a remote MongoDB Atlas URI)
*   [Redis](https://redis.io/docs/getting-started/) (Running locally or a managed Redis instance)

### 1. Clone the Repository
```bash
git clone https://github.com/AniketJas/intelliresume-api.git
cd intelliresume-api
```
*(Note: Change directory into the backend project root folder containing `package.json`)*

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Your Environment File
Create a `.env` file in the root backend directory. You can copy the template from `.env.example`:
```bash
cp .env.example .env
```
Fill out the configuration parameters as described in the next section.

### 4. Run the Server
*   **Development Mode** (with automatic code reloads via `nodemon`):
    ```bash
    npm run dev
    ```
*   **Production Mode**:
    ```bash
    npm start
    ```

---

## 🔒 Environment Variables

The server expects the following keys in your `.env` file. Do not share your production environment secrets.

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Optional | `9000` | The local port number the Express server listens to. |
| `MONGO_URI` | **Required** | `N/A` | The connection string for your MongoDB deployment (e.g., `mongodb+srv://...` or `mongodb://localhost:27017/intelliresume`). |
| `JWT_SECRET` | **Required** | `N/A` | High-entropy random string used to sign JWT session cookies. |
| `GEMINI_API_KEY` | **Required** | `N/A` | API Key obtained from Google AI Studio to interact with the Gemini LLM. |
| `CLOUDINARY_CLOUD_NAME`| **Required** | `N/A` | Cloudinary Account Cloud Name for media uploads. |
| `CLOUDINARY_API_KEY` | **Required** | `N/A` | Cloudinary integration Public API Key. |
| `CLOUDINARY_API_SECRET`| **Required** | `N/A` | Cloudinary integration Secret API Key. |
| `REDIS_HOST` | **Required** | `127.0.0.1` | The hostname of your Redis database instance. |
| `REDIS_PORT` | **Required** | `6379` | The port number your Redis database listens on. |
| `REDIS_PASSWORD` | Optional | `N/A` | Authentication password for your Redis database instance. |
| `API_URL` | Optional | `N/A` | The public base URL of this server (used by the cron job to ping and keep active). |
| `NODE_ENV` | Optional | `development` | Denotes server stage. Set to `production` to activate keep-alive cron tasks. |

> [!WARNING]
> Keep your secret keys secret. Never commit your `.env` file containing actual database strings or API tokens to your version control systems. Always populate these via secure platform variables on your hosting providers (e.g., Render, Heroku).

---

## 🔌 API Endpoints Reference

Below is a summary of the backend route mapping. All route endpoints are prefixed with the base domain URL.

### 👥 User Authentication Routes
| Method | Endpoint | Authentication | Description | Expected Payload | Success Response (200 / 201) |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **POST** | `/api/users/register` | 🔓 Public | Registers a new user. Salts and hashes passwords automatically. | `{ "name": "Name", "email": "a@a.com", "password": "pass" }` | `{ "success": true, "message": "User registered successfully" }` |
| **POST** | `/api/users/login` | 🔓 Public | Logs in a user, signs a JWT, and sets it inside an HttpOnly cookie. | `{ "email": "a@a.com", "password": "pass" }` | `{ "success": true, "message": "Login successful" }` |
| **POST** | `/api/users/logout` | 🔓 Public | Invalidates the user session by clearing the JWT token cookie. | *None* | `{ "success": true, "message": "Logged out successfully" }` |

### 📄 Resume Operations Routes
| Method | Endpoint | Authentication | Description | Expected Payload | Success Response (200) |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **POST** | `/api/resume/analyze` | 🔐 Authenticated | Accepts a `.pdf` or `.docx` file in a multipart form field named `resume`. Extracts text, checks for deduplication, uploads to Cloudinary, runs Gemini evaluation, and saves to MongoDB. | Multipart Form: `resume: [File]` | `{ "success": true, "message": "Resume analyzed successfully", "data": { "resumeId": "...", "analysis": { ... } } }` |
| **GET** | `/api/resume/analyses` | 🔐 Authenticated | Retrieves a list of historical resume analyses belonging to the authenticated user. Supports pagination and returns their personal high score. | Query parameters: `?page=1&limit=10` | `{ "success": true, "data": { "resumes": [...], "bestScore": 88, "pagination": { ... } } }` |

---

### 💡 Extensibility & Legacy Routes
For projects transitioning or upgrading features, here is how other standard route queries are handled or extended:

*   **`GET /api/users/me` (Profile Check):** Accessible by attaching the `authenticateToken` middleware to verify validity and return the decoded token `req.user` directly.
*   **`GET /api/resume/report/:id` (PDF Download):** Previously supported to build download links. The application now processes text analysis, database state, and visual reports directly in the client application dashboard.
*   **`DELETE /api/resume/:id` (Delete Analysis):** Can be implemented by matching `req.user.id` against the document's owner `userId` constraint, deleting the record from MongoDB, and purging the file from Cloudinary using `fileId` via the Cloudinary Admin API.

---

## 🛡️ Security Architecture

Production servers require hardening against exploitation. This backend integrates several defensive safeguards:

1.  **JWT HTTP-Only Cookies:** Rather than storing tokens in `localStorage` or `sessionStorage` (making them vulnerable to Cross-Site Scripting - XSS), the authentication token is stored inside an `HttpOnly` cookie. This prevents client-side scripts from reading the cookie.
2.  **CORS Domain Validation:** Restricts request execution to registered origins only. In local environments, it is configured for `http://localhost:5173`. Credentials (cookies) are explicitly allowed.
3.  **Strict File Upload Filters:**
    *   **Mime-type verification:** Expressly checks if files end in `.pdf` or `.docx`.
    *   **Payload Size Capping:** Imposes a strict limit of `10MB` via Multer, preventing denial-of-service attempts using massive file streams.
4.  **Reverse Proxy Trust configuration:** Express is set to `app.set("trust proxy", 1)` to trust headers appended by reverse proxies (like Cloudflare or Render's load balancer), ensuring client rate-limit IPs are captured correctly instead of the load balancer IP.
5.  **Sensitive Parameter Protection:** User passwords are encrypted with `bcryptjs` using a salt work factor of `10`. Unhandled error messages do not return database stack traces to clients in production environments.

---

## ⚠️ Error Handling Strategy

The server handles internal exceptions cleanly to prevent application crashes and maintain API reliability:

```
[Incoming Request]
        │
        ▼
   [Try Block] ──► (Valid Operations) ──► [HTTP Success Response]
        │
        ▼ (Throws Exception)
  [Catch Block]
        │
        ▼
   [Logger] ──► (Log context-rich warning/error internally with details)
        │
        ▼
[Format JSON Response] ──► [Return Standardized Error Status Code to Client]
```

Standardized error codes returned:
*   **400 Bad Request:** Occurs during malformed requests (e.g., missing fields, empty search parameters, files exceeding the size limit, or unsupported mime-types).
*   **401 Unauthorized:** Returned when a protected route is requested without a session cookie, or if the cookie signature validation fails.
*   **429 Too Many Requests:** Triggered when a single IP triggers more than 50 requests in a 10-minute window, backed by Redis counts.
*   **500 Internal Server Error:** Used for unexpected system faults. Details of third-party API connectivity issues (Cloudinary or Gemini timeout limits) are masked with friendly messages before being sent to the client, while full error details are printed to secure server logs for developer inspection.

---

## ⚡ Performance Optimizations

*   **Database Query Concurrency:** The history controller retrieves historical records, counts document totals, and calculates the user's highest resume ATS score concurrently using `Promise.all`. This reduces MongoDB round-trip latency.
    ```javascript
    const [resumes, totalRecords, bestScoreRecord] = await Promise.all([
      Resume.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Resume.countDocuments({ userId }),
      Resume.findOne({ userId }).sort({ "analysis.overallScore": -1 }).select("analysis.overallScore")
    ]);
    ```
*   **Crypto-Deduplication Engine:** Before performing network calls to Cloudinary and the Gemini AI model, a SHA-256 hash of the extracted resume text is checked against existing entries for that user. This saves Cloudinary storage and reduces Gemini API token usage.
*   **Redis-Backed Rate Limiting:** Offloads rate-limiting state from the Node.js application process memory into Redis, preventing server memory bloat and keeping state consistent across multiple container instances.
*   **Compound Mongoose Indexes:** Employs a compound unique index on `{ userId: 1, resumeHash: 1 }` to optimize database searches and prevent duplicate entries in case of concurrent user submissions.
*   **Stream-Based Cloud Uploads:** Uploads files to Cloudinary using write streams (`cloudinary.uploader.upload_stream`), passing the in-memory file buffer directly to the cloud without saving temporary files to the server's disk.

---

## 🚀 Deployment Guide

### Deploying to Render
1.  Sign in to [Render](https://render.com/) and create a new **Web Service**.
2.  Connect your GitHub repository containing the backend code.
3.  Configure the service environment settings:
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
4.  Add your production environment secrets under the **Environment Variables** tab:
    *   `MONGO_URI` (Your MongoDB Atlas connection string)
    *   `JWT_SECRET` (A strong random secret)
    *   `GEMINI_API_KEY` (Your Google Gemini API Key)
    *   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
    *   `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (From Upstash, Redis Labs, or Render Redis)
    *   `NODE_ENV`: `production`
    *   `API_URL`: `https://your-app-name.onrender.com` (Used by the self-ping cron job)
5.  Click **Deploy Web Service**.

> [!NOTE]
> The server has an integrated cron service (`configs/cron.js`). When `NODE_ENV` is set to `production`, the server pings its own `API_URL` every 14 minutes. This prevents Render's free tier web services from spinning down due to inactivity.

---

## 🔍 Troubleshooting & FAQ

<details>
<summary><b>1. Database Connection Failed: Why is MongoDB not connecting?</b></summary>
<p>
Check if your <code>MONGO_URI</code> environment variable is set correctly. If you are using MongoDB Atlas, make sure you have whitelisted all IP addresses (<code>0.0.0.0/30</code>) in your MongoDB Atlas network security settings, as cloud hosting services like Render change their outbound IP addresses dynamically.
</p>
</details>

<details>
<summary><b>2. Redis Error: Connection refused or Timeout?</b></summary>
<p>
Ensure your Redis instance is running. If you are running locally, start the Redis service (e.g. <code>redis-server</code>). If you are in production, verify that you have provided the correct <code>REDIS_HOST</code>, <code>REDIS_PORT</code>, and <code>REDIS_PASSWORD</code> in your environment variables.
</p>
</details>

<details>
<summary><b>3. Cloudinary Upload Error: Direct uploads fail?</b></summary>
<p>
Verify your Cloudinary credentials (cloud name, API key, and API secret) in your environment variables. Make sure your account has not exceeded its storage quota limits.
</p>
</details>

<details>
<summary><b>4. Gemini API Error: Why does it time out or fail?</b></summary>
<p>
This can happen due to transient errors or rate limits from Google's servers. The backend includes a robust retry service (<code>services/gemini.service.js</code>) that automatically retries transient errors (like 429 and 503) up to 3 times with exponential backoff before failing.
</p>
</details>

<details>
<summary><b>5. "Token signature invalid" / Authentication Errors?</b></summary>
<p>
This occurs if the server restarts with a different <code>JWT_SECRET</code>, or if the client cookie is corrupted. Clear the cookies in your browser's developer tools and log in again to resolve this.
</p>
</details>

---

## 🗺️ Roadmap & Future Improvements

- [ ] **Email Alerts:** Add email notifications via Nodemailer to alert users when a new login occurs or when a resume analysis report is generated.
- [ ] **Deep Match Score:** Implement job description matching, allowing users to paste a target job description and get a customized match score and gap analysis.
- [ ] **JSON Validation Recovery:** Add a backup parser to handle cases where the LLM response fails to match the expected JSON structure.
- [ ] **Admin Analytics Dashboard:** Create admin endpoints to view usage metrics, active users, and platform-wide average resume scores.
- [ ] **Multi-Resume Comparison:** Allow users to upload multiple resumes side-by-side to compare ATS scores and strengths.

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this project better, please fork the repo and create a pull request. You can also open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a **Pull Request**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Made with ❤️ by [Aniket Jas](https://github.com/AniketJas)*
