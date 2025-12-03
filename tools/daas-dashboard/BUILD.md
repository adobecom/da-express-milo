Authoring tool for AX Templates.

## Local Development

### Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env` file for local development with real data:
```bash
# .env
VITE_DA_TOKEN=your_da_live_token_here
```

To get your DA.live token:
- Open DA.live in your browser
- Open Developer Console
- Run: `await DA_SDK` then copy the token value

3. Start the dev server:
```bash
npm run dev
```

**Without `.env`**: The app will run in offline mode with mock data (perfect for UI development)
**With `.env`**: The app will connect to real DA.live API

## Build

```bash
npm run build
```

## Integration

Integrated into a block after build: `aem up`

Note: this block should be authored separately on a page to avoid style pollution with prod styles
