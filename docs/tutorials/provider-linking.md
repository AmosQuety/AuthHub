# Tutorial — Provider Linking

Use provider linking when a signed-in user wants to attach Google or GitHub to their existing AuthHub account.

Flow

1. Authenticate the user with AuthHub.
2. Start the social login flow in linking mode, passing the current user id in state.
3. Complete the provider callback.
4. AuthHub attaches the provider record to the existing user instead of creating a new account.

Notes

- The runtime uses `mode=link` and `user_id` in the OAuth state payload.
- The provider can only be linked when it is not already attached to another account.

Related docs

- [Social Login API Reference](../api-reference/auth_social.md)
- [Unlink Provider](provider-unlinking.md)
