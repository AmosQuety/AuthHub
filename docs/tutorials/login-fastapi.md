# Tutorial — Login with FastAPI (Python)

This tutorial demonstrates a FastAPI backend handling token exchange with AuthHub.

1. Generate PKCE values in client and redirect user to AuthHub authorize.
2. FastAPI callback receives `code` and uses `requests` to call `POST /api/v1/oauth/token`.
3. Store refresh token in a secure server-side session or cookie.

Example exchange in FastAPI:

```python
from fastapi import FastAPI, Request, Response
import requests

app = FastAPI()

@app.get('/auth/callback')
async def callback(code: str, request: Request):
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'https://app.example.com/callback',
        'client_id': CLIENT_ID,
        'code_verifier': request.session.get('pkce_verifier')
    }
    r = requests.post('https://auth.example.com/api/v1/oauth/token', data=data)
    tokens = r.json()
    # Set HttpOnly cookie or session
    response = Response()
    response.set_cookie('refreshToken', tokens['refresh_token'], httponly=True, secure=True)
    return tokens
```