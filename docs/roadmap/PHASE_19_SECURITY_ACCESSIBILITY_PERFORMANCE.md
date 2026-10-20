# Phase 19 — Security, Accessibility, and Performance Review

## Fixes implemented

- Classifies `/writing/grounded_generate` as an AI-intensive route so both IP-based and authenticated-user budgets use the stricter AI limits (20 and 30 requests per minute, respectively) rather than the default limits.
- Adds regression coverage for both rate-limit paths, including HTTP 429 and `Retry-After` behavior.
- Closes the implicit loopback CORS fallback when `NODE_ENV=production`. In production, cross-origin requests now require an explicit `ALLOWED_ORIGINS` or `APP_URL` allowlist; exact-origin comparison remains in force.
- Adds a regression test that proves localhost/loopback-origin requests do not receive CORS permission in production when no explicit allowlist exists.

## Existing controls rechecked

- JSON request bodies have a 5 MiB global ceiling; the authenticated OCR route has a bounded, separately configured parser ceiling.
- Grounded generation accepts at most 10 evidence chunks per request.
- Full-text HTML retrieval requires HTTPS, rejects IP literals and resolved private/reserved addresses, validates each redirect hop, uses timeouts, limits response bodies to 5 MiB, and accepts only text/HTML content types.
- Existing CSP, exact-origin CORS, content-type protection, and non-mutating prompt-injection detection have regression coverage.

## Residual risks and release conditions

- The rate limiter is process-local. Deployments with multiple application instances need a shared rate-limit store before per-user/IP limits can be treated as global.
- Public-address DNS validation occurs before the outbound fetch, but that DNS answer is not pinned into the subsequent connection. DNS-rebinding resistance is therefore not fully certified; do not treat this review as complete SSRF certification for arbitrary caller-supplied URLs.
- Dependency advisories remain a separate risk: the CI audit is report-only and non-blocking. Review and remediate the current advisories before a production release; this phase does not silently update packages.
- CI does not prove visual RTL/mobile accessibility. A human browser pass is still required for keyboard navigation, focus visibility, small-screen layout, and screen-reader labels.

No dependencies were added or updated. No tests or lint scripts were run manually; CI is the verification gate for this branch.
