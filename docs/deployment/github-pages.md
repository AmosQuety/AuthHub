# GitHub Pages Deployment & Administration Handbook

This guide provides complete operational guidelines for deploying the AuthHub Developer Portal via GitHub Pages, mapping custom domains, configuring HTTPS, enabling search console indexing, and resolving deployment workflow issues.

---

## 🚀 1. Repository & Actions Setup

Before GitHub Pages can serve the documentation, configure the repository privileges:

1. Navigate to your repository page at `https://github.com/AmosQuety/AuthHub`.
2. Select the **Settings** tab.
3. In the left navigation pane under the "Code and automation" section, click on **Pages**.
4. Under the **Build and deployment** settings:
   - **Source**: Select **GitHub Actions** from the dropdown menu (this bypasses manual branch builds and permits zero-touch CI/CD deploys via [docs.yml](file:///.github/workflows/docs.yml)).
5. In the left navigation pane under the "Security" section, click on **Actions** -> **General**.
6. Scroll down to **Workflow permissions** and select **Read and write permissions** (this allows the deploy actions runner to write build page releases). Click **Save**.

---

## 🌐 2. Custom Domain & DNS Mapping

To host the documentation portal under a professional branded URL (e.g. `https://authhub.dev` or `https://docs.authhub.dev`):

### Setting the Custom Domain in GitHub:
1. On the **Pages** settings screen, scroll down to **Custom domain**.
2. Input `authhub.dev` (or your chosen domain) and click **Save**.
3. A `.nojekyll` file will be created in your root (we have pre-engineered this in [this config](file:///g:/MyProjects/new%20code/AuthHub/.nojekyll) to bypass Jekyll processing entirely).

### Configuring Your DNS Provider:
To point your custom domain name to GitHub's server cluster, log in to your DNS provider control panel (e.g. Cloudflare, GoDaddy, Namecheap) and create these records:

#### Option A: Apex Domain Configuration (`authhub.dev`)
Add four **A** records pointing to GitHub Pages IP infrastructure:
```
Type  | Name | Value
A     | @    | 185.199.108.153
A     | @    | 185.199.109.153
A     | @    | 185.199.110.153
A     | @    | 185.199.111.153
```
Also add a **CNAME** record for subdomains like `www.authhub.dev`:
```
Type  | Name | Value
CNAME | www  | AmosQuety.github.io.
```

#### Option B: Subdomain Configuration (`docs.authhub.dev`)
Add a single **CNAME** record:
```
Type  | Name | Value
CNAME | docs | AmosQuety.github.io.
```

---

## 🔒 3. Provisioning HTTPS Security

Once DNS records propagate (usually taking 5-30 minutes):
1. Return to the **Pages** settings screen in your GitHub repository.
2. Scroll to the **Custom domain** section.
3. Check the **Enforce HTTPS** box.
   - *Note: GitHub automatically handles SSL certificate generation and automatic renewals using Let's Encrypt certificates.*

---

## 🔍 4. SEO & Search Console Verification

To allow humans and crawler engines to index the website, verify the portal ownership:

1. Register with **[Google Search Console](https://search.google.com/search-console)**.
2. Select **Add Property** and input your domain: `https://authhub.dev/`.
3. Select the **HTML Tag** verification option and copy the verification tag, e.g.:
   ```html
   <meta name="google-site-verification" content="..." />
   ```
4. Insert this tag in the `<head>` block of your [landing page](file:///g:/MyProjects/new%20code/AuthHub/docs/index.html).
5. Commit and push the changes, then click **Verify** in the Search Console.
6. Once verified, submit your sitemap url: `https://authhub.dev/sitemap.xml`.

---

## 🛠️ 5. Deployment Troubleshooting Guide

### Issue A: Page returns 404 (Not Found)
* **Check Pages Settings**: Confirm the build source is set to "GitHub Actions" instead of "Deploy from a branch".
* **Verify path prefixes**: If your site does not use a custom domain, it will be served under a subpath (`https://AmosQuety.github.io/AuthHub/`). Make sure `redocly.yaml` and `docs/index.html` have relative paths or point to the correct subpath prefix.

### Issue B: The CI/CD build fails at "Validate Redocly Configuration"
* Run `redocly lint authhub` locally to diagnose OpenAPI validation issues.
* Ensure all endpoints mapped in the `sidebar` of [redocly.yaml](file:///g:/MyProjects/new%20code/AuthHub/redocly.yaml) physically exist in the `docs/` folder path.

### Issue C: The CI/CD build fails at "Verify Internal Links Integrity"
* The `lychee-action` checker executes static analysis on all internal and external paths. If a markdown file links to a page you renamed or deleted, the build fails.
* Check the run logs to identify the exact file and line of the offending URL, and correct the path link.
