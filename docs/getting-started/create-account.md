# Create an Account

AuthHub supports multiple onboarding paths:

- Email and password registration through `POST /api/v1/auth/register`
- Social login through Google and GitHub
- Tenant-aware sign-up when a `client_id` is provided

Minimum request for email/password registration

```json
{
  "email": "user@example.com",
  "password": "S3cureP@ssw0rd"
}
```

What happens next

- The password is hashed with Argon2.
- A user record is created.
- A `user.created` webhook is emitted.
- Email verification can be requested with `POST /api/v1/auth/verify-email/send`.

First things to check

- Confirm `BASE_URL` and `FRONTEND_URL` are configured.
- Confirm mail delivery is configured if you want verification emails.

Related pages

- [Create an OAuth Client](create-oauth-client.md)
- [Login and Tokens](login-and-tokens.md)
- [Email Verification Tutorial](../tutorials/email-verification.md)
