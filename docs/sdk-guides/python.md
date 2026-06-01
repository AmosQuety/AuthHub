# SDK Guide — Python (requests)

This guide shows how to exchange authorization code and call UserInfo using Python.

Install

```bash
pip install requests
```

Exchange authorization code

```python
import requests
from urllib.parse import urlencode

TOKEN_URL = 'https://auth.example.com/api/v1/oauth/token'

payload = {
  'grant_type': 'authorization_code',
  'code': code,
  'redirect_uri': 'https://app.example.com/callback',
  'client_id': CLIENT_ID,
  'code_verifier': code_verifier,
}

r = requests.post(TOKEN_URL, data=payload)
print(r.json())
```

Call UserInfo

```python
r = requests.get('https://auth.example.com/api/v1/oidc/userinfo', headers={'Authorization': f'Bearer {access_token}'})
print(r.json())
```

Server-side refresh

```python
r = requests.post(TOKEN_URL, data={'grant_type': 'refresh_token', 'refresh_token': refresh_token, 'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET})
```

Notes

- Use secure storage for client secrets and refresh tokens.
- For high-level OAuth handling, consider libraries like `authlib`.