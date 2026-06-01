# Tutorial — Provider Unlinking

Use provider unlinking to remove a social identity from an account.

Flow

1. Open the authenticated account settings UI.
2. Call `DELETE /api/v1/auth/providers/:id`.
3. Show a success message if the provider is removed.

Safety

- The runtime prevents users from unlinking their last authentication method.
- Ensure the user has another login method before allowing unlink.

Related docs

- [Provider Linking](provider-linking.md)
- [Auth API Reference](../api-reference/auth/index.md)
