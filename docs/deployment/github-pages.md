# GitHub Pages Setup

This portal is designed to be published to GitHub Pages after building the Markdown site with Redocly.

## Recommended approach

1. Add the Redocly config at the repository root.
2. Commit the portal Markdown under `docs/`.
3. Enable GitHub Pages for the repository.
4. Use GitHub Actions to build the docs and publish the generated site.

## Enable GitHub Pages

In GitHub:

1. Open the repository settings.
2. Go to Pages.
3. Select GitHub Actions as the deployment source.
4. Push the workflow file in `.github/workflows/deploy-docs.yml`.
5. Wait for the workflow to publish the docs site.

## Local build

If you install the Redocly CLI locally:

```bash
npx @redocly/cli build-docs
```

## Notes

- The runtime OpenAPI spec is fetched from the hosted JSON document, so the portal can be built without checking in a separate generated spec.
- Add `.nojekyll` to the published output if your deployment path requires it.
