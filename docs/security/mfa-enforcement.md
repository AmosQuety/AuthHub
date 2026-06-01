# MFA Enforcement

MFA can be enforced in two ways:

- User-specific enabled MFA methods
- Risk-based step-up authentication

Runtime behavior

- Login can return `status: "mfa_required"`.
- MFA methods are stored in the database and checked during sign-in.
- MFA challenge tokens are short-lived.

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
- [backend/src/modules/mfa/controller.ts](backend/src/modules/mfa/controller.ts)
