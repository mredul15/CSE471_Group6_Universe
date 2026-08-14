# Module 2 · Feature 3 — Smart Job Aggregator & Alert System

Owner: Shah Mohaimin Kabir (23101318) · Group 06 · CSE471 Section 11

Aggregates internship and graduate listings from LinkedIn and BDJobs, scores each
one against the logged-in student's department, semester, CGPA and saved skills,
raises alerts when a strong match appears, and tracks the application pipeline.

---

## 1. Where the files go

Copy these into your repo, keeping the paths exactly:

```
prisma/schema.prisma              ← replaces your current schema (adds 4 models)
lib/prisma.ts                     ← new: single shared Prisma client
lib/jobs/types.ts                 ← new
lib/jobs/normalize.ts             ← new
lib/jobs/matcher.ts               ← new
lib/jobs/aggregator.ts            ← new
lib/jobs/providers/linkedin.ts    ← new
lib/jobs/providers/bdjobs.ts      ← new
lib/jobs/providers/curated.ts     ← new
app/actions/jobs.ts               ← new
app/jobs/page.tsx                 ← new route: /jobs
.env.example                      ← reference for your .env
```

`lib/` sits at the repo root next to `app/`, so `@/lib/...` resolves through the
`"@/*": ["./*"]` path alias already in your `tsconfig.json`. No config changes
are needed.

## 2. Run the migration

```bash
npx prisma migrate dev --name add_job_aggregator
npx prisma generate
```

This adds `JobListing`, `JobPreference`, `SavedJob` and `JobAlert`, plus four
relation fields on `User`. Nothing existing is altered, so your CGPA, attendance
and budget data survives.

## 3. Set environment variables

Copy the new keys from `.env.example` into your `.env`. The feature runs with
**none** of them set — it falls back to seeded sample listings so you always have
something to demo.

| Key | Purpose |
| --- | --- |
| `LINKEDIN_API_URL`, `LINKEDIN_API_KEY` | Enable live LinkedIn fetching |
| `LINKEDIN_API_HOST`, `LINKEDIN_API_AUTH_STYLE` | Gateway-specific headers |
| `BDJOBS_ENABLED` | `true` attempts a live BDJobs parse |
| `CURATED_JOBS_ENABLED` | `false` hides the sample listings |

## 4. Add the dashboard card

Three edits to `app/dashboard/page.tsx`.

**a. Import the summary action** alongside your existing imports:

```tsx
import { getJobSummary } from '@/app/actions/jobs';
```

**b. Add state and load it** inside the existing `loadData()`:

```tsx
const [jobStats, setJobStats] = useState({
  unreadAlerts: 0,
  savedCount: 0,
  appliedCount: 0,
});

// inside loadData(), after the getDashboardData() call:
const jobRes = await getJobSummary();
if (jobRes.success) {
  setJobStats({
    unreadAlerts: jobRes.unreadAlerts,
    savedCount: jobRes.savedCount,
    appliedCount: jobRes.appliedCount,
  });
}
```

**c. Paste this fourth card** inside the `Core Navigation Modules Grid` div,
directly after the Smart Budget & Expense Tracker card:

```tsx
<div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
  <div>
    <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-bold mb-6 group-hover:bg-sky-600 group-hover:text-white transition">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v1m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">Career Matchmaker</h3>
    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
      Internships and graduate roles aggregated from LinkedIn and BDJobs, scored against your
      department, semester and CGPA, with alerts when a strong match appears.
    </p>

    <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 mb-6 text-xs font-semibold text-sky-900 flex justify-between items-center">
      <span>Saved roles: <strong>{jobStats.savedCount}</strong></span>
      <span className="text-sky-700 font-bold">
        {jobStats.unreadAlerts} new alert{jobStats.unreadAlerts === 1 ? '' : 's'}
      </span>
    </div>
  </div>

  <Link
    href="/jobs"
    className="w-full bg-[#0f172a] hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md"
  >
    Launch Career Matchmaker
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  </Link>
</div>
```

---

## 5. How it works

```
  Refresh listings (user action)
            │
            ▼
  lib/jobs/aggregator.ts  ──►  providers run in parallel
            │                    ├─ linkedin.ts   (API gateway, env-gated)
            │                    ├─ bdjobs.ts     (HTML parse, env-gated)
            │                    └─ curated.ts    (seeded fallback)
            │
            ├─ dedupe by company + squashed title, best source wins
            ├─ upsert into JobListing (unique on source + externalId)
            │
            ▼
  lib/jobs/matcher.ts     ──►  score each listing 0–100 against the student
            │
            ▼
  JobAlert rows created for anything above the student's threshold
```

**Scoring weights** — skills 35, field relevance 20, level fit 15, location 10,
CGPA eligibility 10, keyword hit 5, freshness 5. Every point awarded produces a
sentence, which is why the card can answer "Why this match?" instead of showing
a bare percentage.

**Failure behaviour is deliberate.** A provider never throws upward. If LinkedIn
returns 401 or BDJobs changes its markup, the source reports itself as failed in
the sync panel and the other sources still populate the feed.

## 6. Demo script for the lab

1. Register or log in, then open `/jobs`.
2. Press **Edit preferences** → add skills (`React, Python, SQL`), locations
   (`Dhaka, Remote`), set the alert threshold to 60 → **Save preferences**.
3. Press **Refresh listings** → the source report shows which providers ran.
4. Point out the match ring, then click **Why this match?** on a high-scoring
   card to show the reasons and gaps.
5. Open the alerts panel — the alerts were raised by the threshold in step 2.
6. **Save** a role, switch its status to **Applied**, and show the counter on the
   metrics row update.

## 7. Honest limitations to state in your report

- **LinkedIn has no open jobs API.** Access is restricted to Talent Solutions
  partners, so live LinkedIn data requires a paid third-party gateway. The
  provider is written against that reality rather than pretending otherwise.
- **BDJobs has no API at all.** Parsing their public search page is fragile by
  nature and will break whenever they redesign. Treat it as best-effort.
- **Sample listings are labelled.** Anything from the curated provider shows a
  "Sample" badge and a footer note, so it is never mistaken for a live vacancy.
- **Alerts are in-app only.** Email or push delivery would need a mail provider
  and a scheduled job; the data model (`JobAlert`) is ready for it.

## 8. One unrelated thing worth fixing

`app/actions/auth.ts` stores and compares passwords in plain text. For the
assignment it works, but it is the first thing a reviewer will flag. `bcryptjs`
is a two-line change:

```ts
import bcrypt from 'bcryptjs';
// register: password: await bcrypt.hash(data.password, 10)
// login:    const ok = await bcrypt.compare(data.password, user.password)
```

Separately, your other action files each call `new PrismaClient()` at module
scope, which opens a fresh connection on every hot reload in development. This
module uses the shared client in `lib/prisma.ts` instead — worth switching the
others over when you get a chance:

```ts
import prisma from '@/lib/prisma';   // replaces: const prisma = new PrismaClient()
```
