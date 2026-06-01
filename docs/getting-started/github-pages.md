# GitHub Pages

This portal is intended to be deployed to GitHub Pages using Redocly.

Steps

1. Commit the portal structure and docs pages.
2. Add the GitHub Actions workflow at `.github/workflows/deploy-docs.yml`.
3. Enable GitHub Pages in the repository settings.
4. Choose GitHub Actions as the source.
5. Push to `main` and wait for the workflow to publish the site.

Local preview

```bash
npx @redocly/cli build-docs redocly.yaml -o dist/index.html
```

Deployment notes

- The workflow adds `.nojekyll` to the build output.
- The OpenAPI spec is fetched from the hosted JSON endpoint.
- If you want fully offline builds, vendor the OpenAPI JSON into the repository and update `redocly.yaml` to point at the local file.
