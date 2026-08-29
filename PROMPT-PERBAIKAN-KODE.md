# 🔧 PROMPT PERBAIKAN KODE — ChessClub Repository

## 📌 Panduan Penggunaan

Gunakan prompt di bawah ini untuk meminta Copilot AI melakukan perbaikan otomatis pada repository. Copy-paste prompt sesuai prioritas, atau gunakan secara keseluruhan untuk sprint planning.

---

## **🔴 PRIORITY 1 — IMMEDIATE FIXES (Production Critical)**

### **1.1 — Enable Minification in Vite Build**

```
# Prompt untuk Copilot:

Buka file vite.config.js dan ubah build configuration untuk mengaktifkan minification pada production build.

Saat ini:
- minify: false (menghasilkan bundle besar 30-50% lebih dari optimal)
- sourcemap: true (untuk debugging production)

Yang harus dilakukan:
1. Set minify ke 'esbuild' (bawaan Vite)
2. Pertahankan sourcemap: true untuk production debugging
3. Tambah komentar yang menjelaskan trade-off
4. Verifikasi build size berkurang signifikan dengan `npm run build`
5. Pastikan tidak ada error saat build

Expected result:
- Production bundle size turun 30-50%
- Build masih menghasilkan source map untuk debugging
- No functional changes pada aplikasi
```

### **1.2 — Add Sensitive Paths to .gitignore**

```
# Prompt untuk Copilot:

Update file .gitignore untuk melindungi data sensitif di production.

Yang wajib ditambahkan:
1. data/rahasia/**                    (contains kontak.json, jejak-audit.jsonl)
2. admin.json                         (admin credentials file jika ada)
3. .env.local                         (local environment overrides)
4. server/.env                        (server-specific secrets)
5. *.log                              (log files dari development)

Catatan keamanan:
- Jangan hardcode credentials ke git
- GitHub secret scanning mungkin sudah aktif, tapi explicit .gitignore adalah layer pertama
- Verify dengan: git check-ignore -v <file> setelah update

Expected result:
- File sensitif tidak akan accidentally di-commit
- CI/CD warnings tentang exposed secrets berkurang
```

### **1.3 — Add Pre-Deployment Security Checklist**

```
# Prompt untuk Copilot:

Buat file DEPLOYMENT-CHECKLIST.md yang mencegah deployment dengan default credentials.

File harus berisi:
1. ✅ Production Environment Variables Checklist
   - KCI_PEPPER (min 32 karakter, random)
   - KCI_ADMIN_PASSWORD (NOT "admin123", min 12 karakter)
   - KCI_JWT_SECRET (min 32 karakter, random)
   - KCI_ASAL_DIIZINKAN (origin list untuk CORS)
   - KCI_CHESS_CLIENT_ID, KCI_CHESS_CLIENT_SECRET

2. ✅ File Security Checklist
   - /data/rahasia/ permissions 0700 (owner only)
   - admin.json NOT in git history
   - .env files NOT in git history

3. ✅ Deployment Platform Specific
   - Vercel: env vars via dashboard, not code
   - Render: persistent disk configured
   - GitHub Pages: build artifact clean

4. ✅ Post-Deployment Tests
   - Run: npm run uji:backend terhadap staging
   - API /api/kesehatan respond 200 OK
   - Health check endpoint accessible

5. ⚠️ Security Warnings
   - Default admin creds WILL be caught by security scanner
   - Rate limits reset on Vercel cold start (document limitation)
   - X-Forwarded-For spoofing possible if KCI_JUMLAH_PROXY misconfigured

Tambahkan link ke:
- PANDUAN-DEPLOY-FULL-VERCEL.md
- PANDUAN-DEPLOY-VERCEL-RENDER.md
- server/README.md

Expected result:
- Deployment team punya clear security checklist
- Default creds tidak akan teracidentally deployed
- Production incidents berkurang
```

### **1.4 — Verify Vercel Temporary Storage Limitations**

```
# Prompt untuk Copilot:

Buat dokumentasi tentang /tmp keterbatasan di Vercel Serverless Function.

Masalah:
- Vercel /tmp directory bersifat ephemeral (tidak persist antar invocation)
- Data JSON simpanan (anggota.json, turnamen.json) akan hilang setelah cold start
- Ini adalah blocker untuk production FULL VERCEL strategy

Solusi dokumentasi:
1. Tambah WARNING di PANDUAN-DEPLOY-FULL-VERCEL.md:
   ```
   ⚠️ PENTING: Vercel Serverless /tmp tidak persistent!
   
   Solusi A: Gunakan Render + Persistent Disk untuk backend
   Solusi B: Implement Vercel KV (Redis) untuk data storage
   Solusi C: Gunakan PostgreSQL dengan Railway/Heroku
   ```

2. Tambah note di server/README.md:
   - KCI_DIR_DATA default di Vercel = /tmp/kci-data (ephemeral)
   - Untuk data persistent, setup postgres atau use external storage

3. Create VERCEL-LIMITATIONS.md:
   - Cold start time: ~1-2s (acceptable)
   - /tmp storage: ephemeral (NOT OK untuk data)
   - Rate limit: reset per restart (work-around: use Vercel KV)
   - CPU timeout: 10s execution max

Expected result:
- Developers tidak akan accidentally deploy ke Vercel tanpa disk solution
- Clear migration path untuk scaling
```

---

## **🟡 PRIORITY 2 — SHOULD FIX (Pre-Release)**

### **2.1 — Refactor server/src/index.js (35 KB Monster File)**

```
# Prompt untuk Copilot:

Refactor server/src/index.js yang sangat besar (35 KB, 1100+ baris) menjadi modular structure.

Target struktur:
```
server/src/
├── index.js                    (100 baris: startup + exports)
├── server.js                   (setup HTTP server, listen, graceful shutdown)
├── routes.js                   (500 baris: definisi semua rute)
├── handlers/
│   ├── auth.js                 (login, CSRF, JWT, admin routes)
│   ├── keanggotaan.js         (member registration, blacklist)
│   ├── turnamen.js            (tournament management)
│   ├── konten.js              (news, announcements)
│   ├── pesan.js               (messages)
│   └── kesehatan.js           (health check)
└── middleware/
    ├── errorHandler.js        (error handling)
    ├── cors.js                (CORS setup)
    ├── rateLimit.js           (rate limiting)
    └── auth.js                (authentication checks)
```

Detail perubahan:
1. index.js:
   - Import routes dan start server
   - Handle graceful shutdown
   - Export tangani untuk Vercel
   - ~100 baris

2. server.js:
   - createServer logic
   - listen() dengan logging
   - Graceful shutdown untuk signals
   - ~50 baris

3. routes.js:
   - router.get() dan router.post() definitions
   - Group by domain (auth, keanggotaan, turnamen, etc)
   - ~500 baris

4. handlers/auth.js:
   - POST /api/auth/login
   - GET /api/auth/cara
   - POST /api/pengurus/ganti-password
   - ~200 baris

5. handlers/keanggotaan.js:
   - POST /api/anggota (register)
   - GET /api/anggota (roster)
   - Pengurus endpoints (blokir, buka, pindai)
   - ~300 baris

6. middleware/errorHandler.js:
   - Terpusat error handling
   - GalatAplikasi catch
   - Chess error handling
   - ~50 baris

Testing:
- Semua endpoint tetap berfungsi sama
- npm run uji:backend PASS semua 100+ tests
- No functional changes, hanya refactor

Expected result:
- Kode lebih maintainable
- Easier onboarding untuk developer baru
- Better separation of concerns
```

### **2.2 — Add JSON Schema Validation with Zod**

```
# Prompt untuk Copilot:

Tambahkan input validation layer dengan Zod library ke backend.

Saat ini:
- Manual string validation di keanggotaan.js
- Regex checks untuk email, nomor HP
- No structured schema validation
- Susah di-maintain kalau schema berubah

Yang harus dilakukan:
1. npm install zod (ke server/package.json)

2. Buat server/src/schemas.js:
   ```javascript
   import { z } from 'zod';

   // User registration
   export const PendaftaranSchema = z.object({
     username: z.string().regex(/^[a-z0-9_-]{3,25}$/),
     namaLengkap: z.string().min(5).max(80),
     panggilan: z.string().min(1).max(30),
     hp: z.string().regex(/^\d{10,15}$/),
     email: z.string().email().optional(),
     kota: z.string().max(60),
     tanggalLahir: z.string().datetime(),
     klub: z.string().max(60).optional(),
     setuju: z.boolean().refine(v => v === true),
   });

   // Tournament
   export const TurnamenSchema = z.object({
     nama: z.string().min(3).max(100),
     jenis: z.enum(['bulanan', 'musiman', 'terbuka', 'antar-komunitas']),
     deskripsi: z.string().max(500).optional(),
     tanggalMulai: z.string().datetime(),
     // ... lebih banyak field
   });
   ```

3. Update handlers untuk gunakan schema:
   ```javascript
   export async function handleDaftar(req) {
     const bodi = await bacaBodi(req);
     
     // Validate dengan Zod
     const result = PendaftaranSchema.safeParse(bodi);
     if (!result.success) {
       throw new GalatAplikasi(400, 'Validasi gagal', {
         galat: result.error.flatten().fieldErrors
       });
     }
     
     // Proceed dengan validated data
     const bersih = result.data;
     // ... lanjutkan pendaftaran
   }
   ```

4. Testing:
   - Validation error messages clear & field-specific
   - Valid data passes through
   - Invalid data rejected dengan 400
   - Performance tidak signifikan berubah

Expected result:
- Type-safe input validation
- Easier to maintain schema definitions
- Better error messages untuk client
- No more manual regex validation per field
```

### **2.3 — Implement API Versioning**

```
# Prompt untuk Copilot:

Tambahkan API versioning (/api/v1/) untuk support future breaking changes.

Alasan:
- Saat ini semua endpoint di /api/ tanpa version
- Kalau ada breaking change di masa depan, semua client rusak
- Versioning memungkinkan old & new client coexist

Implementasi:
1. Update router.js:
   - Prefix semua existing routes dengan /api/v1/
   - Create router-v1.js yang reference router.js
   - Support /api/v1/* untuk backward compat

2. Update client (vite.config):
   - Proxy /api/* ke /api/v1/* (default)
   - Add env var untuk override (development)

3. Document:
   - README mention API versioning strategy
   - CHANGELOG track breaking changes per version
   - API_VERSIONING.md explain process

4. Future-proof:
   - V1 selamanya maintain di server
   - V2 dapat ditambah tanpa affect V1
   - Deprecation path jelas

Testing:
- GET /api/v1/anggota respond 200 OK
- GET /api/anggota redirect ke v1 (optional)
- Old client dengan /api/* tetap work
- New client dengan /api/v1/* work

Expected result:
- API future-proof untuk breaking changes
- Smooth transition path kalau perlu upgrade
```

### **2.4 — Add Admin Audit Logging**

```
# Prompt untuk Copilot:

Implementasikan comprehensive audit logging untuk admin actions.

Saat ini:
- jejak-audit.jsonl ada tapi tidak comprehensive
- Hanya catat "tolak-daftar" dan "blokir-manual"
- Tidak catat PASSWORD CHANGES, token generation, etc

Yang harus ditambahkan:
1. server/src/audit.js:
   ```javascript
   export async function logAudit(action, details) {
     const entry = {
       timestamp: new Date().toISOString(),
       action,          // 'admin-login', 'member-block', 'password-change'
       username,        // siapa melakukan
       ip,              // IP address
       userAgent,       // browser info
       resourceId,      // siapa/apa yang di-affect (member username, tournament id)
       status,          // 'success' | 'failed'
       reason,          // kalau failed, apa alasannya
       details,         // metadata tambahan
       // DO NOT log: passwords, tokens, sensitive data
     };
     
     await tambahBaris(konfigurasi.berkasAudit, entry);
   }
   ```

2. Audit untuk actions:
   - Admin login (success/failed)
   - Member registration (success/failed)
   - Member block/unblock
   - Tournament create/update/delete
   - Password change
   - Pengurus access attempts (failed)
   - Dashboard access

3. Retention policy:
   - Keep 90 days di file
   - Archive ke S3 monthly
   - 1 year retention untuk legal/compliance

4. UI untuk audit:
   - /pengurus/audit tab baru
   - Filterable by username, action, date
   - Export to CSV

Testing:
- Admin login logged
- Failed access attempts logged
- Sensitive data NOT in logs
- Performance tidak terpengaruh

Expected result:
- Complete audit trail untuk compliance
- Security incident investigation enabled
- Admin accountability clear
```

### **2.5 — Refactor Tournament Engine (28 KB)**

```
# Prompt untuk Copilot:

Refactor server/src/turnamen.js (28 KB) menjadi modular components.

Struktur baru:
```
server/src/turnamen/
├── index.js                 (exports main functions)
├── types.js                 (constants: JENIS, STATUS)
├── validation.js            (input validation, score format)
├── engine/
│   ├── roundRobin.js       (round-robin logic)
│   ├── groupStage.js       (group stage tiebreaker)
│   ├── classification.js   (standings + score calculation)
│   └── pairing.js          (generate next round matchups)
├── repository.js            (CRUD operations)
└── service.js              (business logic, public API)
```

Detail:
1. types.js:
   ```javascript
   export const JENIS = {
     BULANAN: 'bulanan',
     MUSIMAN: 'musiman',
     TERBUKA: 'terbuka',
     ANTAR_KOMUNITAS: 'antar-komunitas'
   };

   export const STATUS = {
     DRAFT: 'draf',
     ACTIVE: 'berlangsung',
     COMPLETED: 'selesai'
   };

   export const SKOR_VALID = ['1-0', '0-1', '0.5-0.5'];
   ```

2. validation.js:
   ```javascript
   export function validateTornamentCreate(data) {
     // Gunakan Zod schema
     return TurnamenSchema.safeParse(data);
   }

   export function validateScore(ronde, putih, hitam, skor) {
     // Check skor format, cek duplikasi, cek no reverse color
   }
   ```

3. engine/roundRobin.js:
   ```javascript
   export function generateRoundRobin(peserta) {
     // Create all matchups
   }

   export function calculateStandings(hasil) {
     // Sort by points, tiebreaker
   }
   ```

Testing:
- Round-robin generate correct pairings
- Standings calculate correctly
- No duplicate results
- Reverse color check work
- npm run uji:backend PASS

Expected result:
- Tournament logic testable in isolation
- Easier to add new tournament types
- Cleaner main index.js
- Performance same or better
```

---

## **🟢 PRIORITY 3 — NICE TO HAVE (Future)**

### **3.1 — Add Frontend Unit Tests with Jest**

```
# Prompt untuk Copilot:

Setup Jest + React Testing Library untuk frontend unit tests.

Setup:
1. npm install --save-dev jest @babel/preset-react @testing-library/react
2. Create jest.config.js:
   - moduleNameMapper untuk CSS/images
   - setupFilesAfterEnv untuk @testing-library/jest-dom
   - transform untuk JSX

3. Create tests/:
   ```
   tests/
   ├── components/
   │   ├── Header.test.jsx
   │   ├── Hero.test.jsx
   │   └── Footer.test.jsx
   ├── pages/
   │   └── PendaftaranAnggota.test.jsx
   └── lib/
       ├── identitas.test.js
       └── i18n.test.js
   ```

4. Test coverage target:
   - Snapshot tests untuk components
   - Interaction tests (form submission)
   - Edge cases (validation errors)
   - Accessibility (role, aria-label)

5. CI integration:
   - npm test dalam quality.yml
   - Coverage report (minimum 70%)
   - Fail build jika < threshold

Expected result:
- Frontend code regression prevented
- Confidence dalam refactoring
- Documentation via tests
```

### **3.2 — Write Comprehensive SECURITY.md**

```
# Prompt untuk Copilot:

Buat file SECURITY.md yang comprehensive untuk project.

Isi:
1. Threat Model:
   - Identify assets (member data, tournament results, admin accounts)
   - Identify threats (SQL injection, brute force, CSRF, XSS)
   - Mitigation per threat

2. Security Architecture:
   - Authentication: JWT + legacy token
   - Authorization: role-based (master/pengurus)
   - Data protection: bcrypt hashing, pepper
   - Transport: HTTPS required (document)

3. Security Checklist:
   - Secrets management (env vars)
   - Dependency scanning (npm audit)
   - Code review process
   - Incident response plan

4. Known Limitations:
   - Rate limit ephemeral (Vercel)
   - X-Forwarded-For spoofing (if misconfigured)
   - JSON DB scaling limit

5. Reporting Security Issues:
   - Email: (set contact)
   - GPG key (optional)
   - Responsible disclosure (90 days grace)

Expected result:
- Security transparency untuk users
- Clear incident reporting process
- Security best practices documented
```

### **3.3 — Implement Automated Backups to S3**

```
# Prompt untuk Copilot:

Buat automated backup mechanism ke AWS S3 atau Backblaze B2.

Implementation:
1. npm install aws-sdk (atau aws-sdk-js-v3)

2. Create scripts/backup-s3.mjs:
   - Compress data/ directory
   - Upload to S3 with timestamp
   - Rotation policy (keep 30 days)
   - Error notification

3. Schedule via:
   - GitHub Actions: daily scheduled workflow
   - Render: cron job di background
   - Vercel: external service (AWS Lambda)

4. Recovery process:
   - Download dari S3
   - Decompress
   - Restore ke data/
   - Validation

Testing:
- Backup creates file successfully
- Upload to S3 works
- Restore dari backup valid
- Retention policy honored

Expected result:
- Data loss protection
- Disaster recovery plan
- Compliance-ready (3-copy rule)
```

### **3.4 — Setup Sentry Error Tracking**

```
# Prompt untuk Copilot:

Integrate Sentry untuk error tracking dan performance monitoring.

Setup:
1. npm install @sentry/node @sentry/tracing

2. Backend integration:
   - Init Sentry di server startup
   - Wrap error handler
   - Capture exceptions
   - Performance monitoring untuk slow endpoints

3. Frontend integration:
   - npm install @sentry/react
   - Error boundary integration
   - Session replay (optional)

4. Configuration:
   - DSN from Sentry project
   - Environment (development/production)
   - Sample rate (100% untuk errors, 10% untuk performance)

5. Alerts:
   - 5xx errors → Slack notification
   - High error rate → Alert
   - Performance regression → Alert

Expected result:
- Real-time error monitoring
- Performance insights
- Easier debugging production issues
- Alert system untuk critical errors
```

### **3.5 — Plan PostgreSQL Migration Path**

```
# Prompt untuk Copilot:

Dokumentasikan migration path dari JSON ke PostgreSQL untuk scaling.

Dokumentasi:
1. Create DATABASE-MIGRATION.md:
   - When to migrate (> 5K members)
   - PostgreSQL schema design
   - Data transformation script
   - Zero-downtime migration strategy

2. Schema design:
   ```sql
   -- Users/Members table
   CREATE TABLE members (
     id SERIAL PRIMARY KEY,
     username VARCHAR(25) UNIQUE NOT NULL,
     name VARCHAR(80),
     city VARCHAR(60),
     elo_rating INT,
     verified_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Tournaments table
   CREATE TABLE tournaments (
     id SERIAL PRIMARY KEY,
     name VARCHAR(100),
     type VARCHAR(20),
     status VARCHAR(20),
     created_at TIMESTAMP
   );

   -- Results table
   CREATE TABLE results (
     id SERIAL PRIMARY KEY,
     tournament_id INT REFERENCES tournaments,
     round INT,
     white_player_id INT REFERENCES members,
     black_player_id INT REFERENCES members,
     score VARCHAR(7),
     created_at TIMESTAMP
   );

   -- Indexes
   CREATE INDEX idx_members_username ON members(username);
   CREATE INDEX idx_results_tournament ON results(tournament_id);
   ```

3. Migration script (data transformation):
   - Read JSON files
   - Transform to SQL inserts
   - Validate data integrity
   - Transaction handling

4. Rollback plan:
   - Keep JSON backup
   - Parallel run during transition
   - Quick rollback procedure

Expected result:
- Clear scaling roadmap
- Schema ready when needed
- Confidence dalam upgrade
- No data loss risk
```

---

## **🚀 BONUS — Performance Optimization Prompts**

### **B.1 — Implement Frontend Caching Strategy**

```
# Prompt untuk Copilot:

Optimasi frontend caching untuk mengurangi API calls.

Implementasi:
1. Service Worker:
   - Cache /api/anggota (12 hours)
   - Cache /api/turnamen (1 hour)
   - Network-first strategy untuk user endpoints

2. Memory cache:
   - useMemo untuk komponen berat
   - React.memo untuk pure components

3. HTTP cache headers:
   - Set Cache-Control dari backend
   - ETag validation
   - Conditional requests (304 Not Modified)

Testing:
- DevTools Network tab: check cache hits
- Lighthouse: cache coverage score
- Performance: reduced API calls 50%+

Expected result:
- Faster page loads (especially repeat visits)
- Reduced bandwidth
- Better mobile experience
```

### **B.2 — Optimize Tournament Leaderboard Queries**

```
# Prompt untuk Copilot:

Cache leaderboard results untuk tournament yang sudah selesai.

Masalah:
- Leaderboard sort O(n log n) setiap fetch
- Tidak cache hasil untuk tournament "selesai"

Solusi:
1. Cache leaderboard saat status berubah ke "selesai"
2. Invalidate cache saat ada update hasil
3. Return cached result untuk tournament "selesai"
4. Sort dari cache instead of file

Performance impact:
- Leaderboard fetch: 500ms → 50ms (10x faster)
- Especially penting untuk tournament dengan 100+ peserta

Testing:
- Leaderboard menampilkan same results
- Cache invalidated saat hasil update
- Memory usage reasonable
```

### **B.3 — Implement API Response Compression**

```
# Prompt untuk Copilot:

Tambahkan gzip compression untuk API responses.

Implementasi:
1. Backend:
   - npm install compression
   - Middleware di http.js
   - Compress JSON responses > 1KB

2. Testing:
   - DevTools: check Content-Encoding: gzip
   - Response size: ~60-70% lebih kecil
   - No latency penalty

Expected result:
- Bandwidth usage 30-40% lebih rendah
- Faster mobile network (3G/4G)
- Better user experience
```

---

## **📋 IMPLEMENTATION CHECKLIST**

Copy checklist ini untuk tracking progress:

```markdown
## Priority 1 (Do First)
- [ ] 1.1 Enable minification (vite.config.js)
- [ ] 1.2 Update .gitignore (data/rahasia/**)
- [ ] 1.3 Create DEPLOYMENT-CHECKLIST.md
- [ ] 1.4 Document Vercel /tmp limitations

## Priority 2 (Pre-Release)
- [ ] 2.1 Refactor server/src/index.js → modular
- [ ] 2.2 Add Zod schema validation
- [ ] 2.3 Implement API versioning (/api/v1/)
- [ ] 2.4 Add comprehensive audit logging
- [ ] 2.5 Refactor tournament engine

## Priority 3 (Post-Release)
- [ ] 3.1 Setup Jest + React Testing Library
- [ ] 3.2 Write SECURITY.md
- [ ] 3.3 Implement S3 backups
- [ ] 3.4 Setup Sentry integration
- [ ] 3.5 Plan PostgreSQL migration

## Bonus (Performance)
- [ ] B.1 Frontend caching strategy
- [ ] B.2 Optimize leaderboard caching
- [ ] B.3 API response compression
```

---

## **💡 TIPS PENGGUNAAN PROMPT**

1. **Copy-paste per prompt** untuk implementasi satu fitur
2. **Gunakan untuk sprint planning** — prioritas sudah jelas
3. **Share dengan tim** — alignment tentang goals
4. **Track di GitHub Issues** — satu issue per prompt
5. **Reference di PR descriptions** — link ke prompt yang di-implement

---

**Last Updated:** 2026-08-29  
**Version:** 1.0  
**Next Review:** Setelah Priority 1 selesai
