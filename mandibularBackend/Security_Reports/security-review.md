# 🛡️ Backend API Security Review

- **[API-001] Debug Mode Configuration** (Low): Flask DEBUG mode might be enabled in fallback configs.
- **[API-002] Fallback SECRET_KEY** (Low): A hardcoded fallback secret key exists.
- **[API-003] Missing Rate Limiting** (Low): Flask-Limiter is not applied to auth_routes.
- **[API-004] Default Werkzeug Hashing** (Low): Password hashing relies on default settings instead of Argon2.
- **[API-005] Wildcard CORS** (Low): CORS is set to allow * on public endpoints.
- **[API-006] Unauthenticated Progress Saves** (Low): Guest users might simulate progress_routes without JWT.
- **[API-007] Missing Security Headers** (Low): Flask-Talisman is not configured to enforce HSTS.
- **[API-008] Verbose Error Messages** (Low): Unhandled exceptions may leak stack traces.
- **[API-009] No Query Parameter Validation** (Low): GET requests missing strict marshmallow validation.
- **[API-010] Outdated Dependency: requests** (Low): The requests library version in requirements.txt is slightly outdated.
- **[API-011] Lack of API Monitoring** (Low): No APM or security logging agent is attached.
- **[API-012] Weak Session ID Entropy** (Low): Default session ID generation could be improved.
- **[API-013] Missing CSRF Protection** (Low): Forms submitted from legacy clients lack CSRF tokens.
- **[API-014] Excessive Token Lifetime** (Low): JWT tokens do not expire quickly enough.