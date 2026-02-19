# Security & Git Ignore Configuration

## ✅ Protected Files

### Backend
- ✅ `.env` - Database credentials, secret keys
- ✅ `*.db`, `*.sqlite*` - Local database files
- ✅ `*.key`, `*.pem` - SSL/TLS certificates
- ✅ `venv/`, `.venv/` - Virtual environment
- ✅ `__pycache__/` - Python cache
- ✅ `secrets/`, `credentials/` - Any credential folders

### Frontend
- ✅ `.env`, `.env.*` - API URLs, keys
- ✅ `node_modules/` - Dependencies
- ✅ `dist/`, `build/` - Build artifacts
- ✅ `.cache/` - Build cache

### General
- ✅ `.vscode/`, `.idea/` - IDE settings
- ✅ `.DS_Store` - macOS files
- ✅ `*.log` - Log files
- ✅ `uploads/`, `media/` - User uploads

## 🔒 Current Sensitive Data

**Backend `.env` contains:**
```
DATABASE_URL=postgresql+psycopg2://postgres:h12%4034aHUNDE@127.0.0.1:5432/task_management
SECRET_KEY=your-secret-key-here-change-in-production
```

⚠️ **IMPORTANT:** These credentials are now protected and won't be pushed to Git.

## 📋 Pre-Deployment Checklist

### Before Pushing to Git
- [ ] Verify `.env` files are not tracked: `git status`
- [ ] Check for hardcoded secrets: `grep -r "password\|secret\|key" --include="*.py" --include="*.tsx"`
- [ ] Ensure database files ignored: `git check-ignore *.db`

### Before Production Deployment
- [ ] Generate strong `SECRET_KEY`: `openssl rand -hex 32`
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS/SSL
- [ ] Set `DEBUG=False` in production
- [ ] Use managed database (not SQLite)
- [ ] Configure CORS properly
- [ ] Set up proper logging (not to files in repo)
- [ ] Use secrets manager (AWS Secrets Manager, etc.)

## 🛡️ Best Practices

### Environment Variables
```bash
# Development
cp .env.example .env
# Edit .env with your local credentials

# Production
# Use platform environment variables (Render, Railway, etc.)
# Never commit .env to Git
```

### Secret Key Generation
```bash
# Backend
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or
openssl rand -base64 32
```

### Database URLs
```bash
# Development (local)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Production (use platform-provided)
DATABASE_URL=${DATABASE_URL}  # From platform env vars
```

## 🚨 If Secrets Were Exposed

1. **Rotate immediately:**
   - Change `SECRET_KEY`
   - Update database password
   - Revoke API keys

2. **Remove from Git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (if necessary):**
   ```bash
   git push origin --force --all
   ```

## 📝 .env.example Files

### Backend `.env.example`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/task_management
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_ORIGINS=http://localhost:5173
```

### Frontend `.env.example`
```env
VITE_API_URL=http://localhost:8000
```

## ✅ Verification Commands

```bash
# Check what's ignored
git check-ignore -v backend/.env

# List all ignored files
git status --ignored

# Verify no secrets in staged files
git diff --cached | grep -i "password\|secret\|key"

# Check for large files (databases)
find . -type f -size +1M | grep -v node_modules | grep -v venv
```

## 🔐 Additional Security Measures

1. **Use `.gitattributes` for binary files:**
   ```
   *.db binary
   *.sqlite binary
   ```

2. **Pre-commit hooks:**
   ```bash
   # Install pre-commit
   pip install pre-commit
   
   # Add to .pre-commit-config.yaml
   - repo: https://github.com/pre-commit/pre-commit-hooks
     hooks:
       - id: detect-private-key
       - id: check-added-large-files
   ```

3. **Scan for secrets:**
   ```bash
   # Using truffleHog
   pip install truffleHog
   truffleHog --regex --entropy=False .
   ```

## 📚 Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App: Config](https://12factor.net/config)
