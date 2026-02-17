# 🔐 Secrets Management Guide

## ⚠️ CRITICAL: NEVER Commit Secrets to GitHub!

Exposing API keys in public repositories can lead to:
- API quota theft
- Unauthorized usage charges
- Account suspension
- Security vulnerabilities

---

## ✅ Proper Way to Handle Secrets

### 1. For Cloudflare Workers (Production)

Use `wrangler secret` commands:

```bash
# Navigate to worker directory
cd nexus-worker

# Login to Cloudflare
wrangler login

# Set each secret individually
wrangler secret put NEWSDATA_API_KEY
# Enter your key when prompted

wrangler secret put GNEWS_API_KEY
# Enter your key when prompted

wrangler secret put CURRENTS_API_KEY
# Enter your key when prompted
```

**These secrets are:**
- ✅ Encrypted at rest
- ✅ Only accessible to your Worker
- ✅ Never exposed in code or GitHub
- ✅ Managed by Cloudflare securely

---

### 2. For Local Development

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your real keys (this file is gitignored!)
nano .env

# Add to .gitignore (if not already there)
echo ".env" >> .gitignore
```

Your `.env` file:
```bash
NEWSDATA_API_KEY=pub_your_real_key_here
GNEWS_API_KEY=your_real_gnews_key_here
CURRENTS_API_KEY=your_real_currents_key_here
```

---

### 3. For GitHub Actions (CI/CD)

Use GitHub Secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - `CF_API_TOKEN` - Cloudflare API token
   - `NEWSDATA_API_KEY` - Your NewsData.io key
   - `GNEWS_API_KEY` - Your GNews key
   - `CURRENTS_API_KEY` - Your Currents API key

Example workflow:
```yaml
- name: Deploy Worker
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CF_API_TOKEN }}
    secrets: |
      NEWSDATA_API_KEY
      GNEWS_API_KEY
      CURRENTS_API_KEY
```

---

## 🔑 Getting API Keys

### NewsData.io
1. Visit: https://newsdata.io
2. Sign up for free account
3. Get API key from dashboard
4. **Free tier**: 200 requests/day

### GNews
1. Visit: https://gnews.io
2. Create free account
3. Copy API key
4. **Free tier**: 100 requests/day

### Currents API
1. Visit: https://currentsapi.services
2. Register for API key
3. **Free tier**: 600 requests/day

---

## 🧪 Testing Without API Keys

The platform works without API keys using:
- ✅ HackerNews API (free, no key)
- ✅ GDELT (free, no key)
- ✅ RSS feeds (free, no key)
- ✅ RSS2JSON (free tier)

API keys only needed for higher rate limits and additional sources.

---

## 🚨 What If I Accidentally Committed Secrets?

### Immediate Actions:

1. **Revoke the exposed keys immediately!**
   - Log into each API provider
   - Delete/regenerate the exposed keys

2. **Remove from Git history:**
   ```bash
   # Remove file from history
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch nexus-worker/.env' \
   --prune-empty --tag-name-filter cat -- --all
   
   # Force push (DANGEROUS - coordinate with team)
   git push origin --force --all
   ```

3. **Use BFG Repo-Cleaner (easier):**
   ```bash
   # Download BFG
   wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
   
   # Remove secrets
   java -jar bfg-1.14.0.jar --replace-text secrets.txt
   ```

4. **Check GitHub's secret scanning:**
   - GitHub automatically scans for secrets
   - Check Security → Secret scanning alerts

---

## 📋 Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded keys in source code
- [ ] API keys use environment variables
- [ ] Cloudflare secrets set via `wrangler secret`
- [ ] GitHub Actions use `secrets.*` context
- [ ] Regular key rotation schedule
- [ ] Monitor API usage for anomalies

---

## ❓ FAQ

**Q: Can I put secrets in wrangler.toml?**
A: NO! `wrangler.toml` is committed to Git. Use `wrangler secret put` instead.

**Q: Where are Cloudflare secrets stored?**
A: Encrypted in Cloudflare's infrastructure, not in your code.

**Q: Can team members see the secrets?**
A: Only if they have Cloudflare dashboard access. Not visible in code.

**Q: Do I need all API keys?**
A: No! The platform works with just free RSS/HN/GDELT sources.

---

## 📞 Need Help?

- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Wrangler secrets: https://developers.cloudflare.com/workers/wrangler/commands/#secret
- GitHub Actions secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets
