# 🛡️ Web Frontend Security Review

## Findings
- **[WEB-001] Local Storage Usage** (Low): Authentication tokens or PII may be stored in localStorage instead of HttpOnly cookies.
- **[WEB-002] Missing CSP Meta Tag** (Low): Content Security Policy is not strictly enforced in the meta tags.
- **[WEB-003] X-Frame-Options Header Missing** (Low): Clickjacking protection via X-Frame-Options is missing.
- **[WEB-004] Hardcoded API Base URL** (Low): API URLs are hardcoded instead of dynamically loaded from environment variables.
- **[WEB-005] Verbose Console Logging** (Low): console.log statements exist in production builds.
- **[WEB-006] Lack of Session Inactivity TTL** (Low): Client-side session does not automatically expire after inactivity.
- **[WEB-007] Missing X-Content-Type-Options** (Low): MIME-sniffing prevention is disabled.
- **[WEB-008] Predictable File Names** (Low): Upload paths have predictable naming structures.
- **[WEB-009] Exposed Sourcemaps** (Low): Source maps might be exposed in production builds.
- **[WEB-010] Referrer-Policy Not Set** (Low): Information leakage could occur through the Referer header.
- **[WEB-011] Outdated Dependency** (Low): A minor vulnerability exists in an indirect UI dependency.
- **[WEB-012] Missing Subresource Integrity** (Low): External scripts lack SRI hashes.
- **[WEB-013] No Rate Limiting on Login Route** (Low): Frontend does not throttle login requests.
- **[WEB-014] Autocomplete Enabled on Passwords** (Low): autocomplete attribute not explicitly disabled on sensitive fields.
