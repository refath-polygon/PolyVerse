# 🚀 Project Features - Multi-User Blog Application

Tech stack: **Next.js (Frontend)** | **NestJS (Backend)** | **MongoDB (Database)** | **Docker + Kubernetes (DevOps)**  

Use this checklist to track progress.

---

## 🖥️ Frontend (Next.js)

- [ ] **Authentication**
  - [ ] Login & Registration pages
  - [ ] Social login (Google, GitHub)
  - [ ] JWT handling & refresh flow
  - [ ] Forgot/reset password UI

- [ ] **Blog Features**
  - [ ] Create post (Markdown/Rich text editor)
  - [ ] Edit & delete post
  - [ ] Draft vs. published mode
  - [ ] Categories & tags UI
  - [ ] Post detail page (SEO-friendly slug)
  - [ ] Share buttons (Twitter, Facebook, LinkedIn)

- [ ] **Comments & Engagement**
  - [ ] Nested comments display
  - [ ] Like & bookmark functionality
  - [ ] Post view counter
  - [ ] Reader profiles

- [ ] **UI/UX**
  - [ ] Responsive design (mobile-first)
  - [ ] Dark/light mode
  - [ ] Notifications (toasts, alerts)
  - [ ] Profile settings page

---

## ⚙️ Backend (NestJS)

- [ ] **Authentication & Security**
  - [x] User registration & login
  - [x] Block user after 3 failed attempts on login
  - [x] JWT + refresh tokens
  - [x] Role-based access (Admin, Author, Reader)
  - [x] Secure password hashing (bcrypt)
  - [X] CSRF & Helmet security headers
  - [x] Input validation & sanitization

- [ ] **User Management**
  - [ ] CRUD for user profiles
  - [ ] Avatar upload (Cloudinary/S3)
  - [ ] Email verification
  - [ ] Password reset flow

- [ ] **Blog Management**
  - [X] Post CRUD
  - [X] Draft/publish workflow
  - [ ] Elestich search
  - [ ] Tag & category system
  - [X] SEO fields (title, description, slug)
  - [ ] Image uploads (Cloudinary/S3)

- [ ] **Comments & Engagement**
  - [ ] Comment CRUD
  - [ ] Nested replies
  - [ ] Likes/bookmarks
  - [ ] Analytics (views tracking)
  - [ ] share posts (Twitter, Facebook, LinkedIn)

- [ ] **API**
  - [X] REST API (CRUD endpoints)
  - [ ] Pagination & filtering
  - [X] Swagger/OpenAPI documentation
  - [ ] Image hosting (Cloudinary)


- [ ] **Performance**
  - [ ] Redis caching for posts
  - [ ] Rate limiting & request throttling
  - [ ] Background jobs (BullMQ)

- [ ] **Testing**
  - [ ] Unit tests (Jest)
  - [ ] Integration tests
  - [ ] E2E tests (Supertest)

---

## 🛠️ DevOps (Infra, CI/CD, Security)

- [X] **Dockerization**
  - [X] Dockerfile for Next.js
  - [X] Dockerfile for NestJS API
  - [X] Docker Compose (local dev: frontend, backend, MongoDB, Redis)

- [ ] **Kubernetes Deployment**
  - [ ] Pods & deployments (frontend, backend, db, redis)
  - [ ] ConfigMaps & Secrets
  - [ ] Persistent storage for MongoDB
  - [ ] Ingress setup (NGINX ingress controller)

- [ ] **CI/CD**
  - [ ] GitHub Actions (build & test)
  - [ ] Docker image publishing
  - [ ] Kubernetes deploy pipeline (ArgoCD/Helm)

- [ ] **Monitoring & Logging**
  - [ ] Structured logs (Winston)
  - [ ] Centralized logging (ELK stack / Loki)
  - [ ] Metrics (Prometheus + Grafana)
  - [ ] Error tracking (Sentry)

- [ ] **Security Hardening**
  - [ ] Secrets management (K8s Secrets, Vault)
  - [ ] HTTPS with TLS certs (Cert-Manager + Let’s Encrypt)
  - [ ] OWASP checks
  - [ ] Penetration testing

---

## 📚 Documentation

- [ ] Project setup guide
- [X] API documentation (Swagger/OpenAPI)
- [ ] Deployment guide (Docker + Kubernetes)
- [ ] Security checklist
- [ ] Final capstone report
