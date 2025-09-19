# Security Setup Instructions

## Password Configuration

1. Copy `src/config/passwords.example.js` to `src/config/passwords.js`
2. Edit `src/config/passwords.js` with your secure passwords
3. Never commit `passwords.js` to git (it's in .gitignore)

## Current Password Locations:
- **Login passwords:** `src/config/passwords.js` 
- **Edit password:** `src/config/passwords.js`

## Deployment:
- Create `passwords.js` on your server with production passwords
- Keep passwords secure and change them regularly

## Files Protected:
- `src/config/passwords.js` - excluded from git
- Contains all sensitive authentication data