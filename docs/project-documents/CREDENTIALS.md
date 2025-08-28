# 🔐 ClickUp Credentials Configuration

**IMPORTANT**: This file contains your personal ClickUp API credentials. 
- Do NOT commit this file to version control
- Keep your credentials secure and private
- Regenerate tokens if compromised

## Required Credentials

### ClickUp API Token
```
CLICKUP_API_TOKEN=pk_2457496_8HDO7D8HEX91LD2UCQJQU8VK7K9FQJTU
```

**How to get your token:**
1. Go to ClickUp Settings (click your profile picture)
2. Navigate to "Apps" → "API" 
3. Click "Generate" to create a new token
4. Copy the token (starts with "pk_") and paste above

### ClickUp List ID
```
CLICKUP_LIST_ID=901512226346
```

**How to get your List ID:**
1. Go to your ClickUp List where you want to track tasks
2. Look at the URL: `https://app.clickup.com/[team_id]/v/li/[LIST_ID]`
3. Copy the LIST_ID from the URL and paste above


## Framework Setup
Once you've filled in your credentials above, the orchestrator will automatically use them for all ClickUp operations.

## Security Notes
- These credentials give access to your ClickUp workspace
- Use personal tokens, not team tokens for better security
- Tokens can be regenerated in ClickUp Settings if needed
- Never share these credentials with others