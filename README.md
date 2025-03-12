# Price Scanner

A web application that scans price tags and provides instant currency conversion and tax calculations.

## Environment Variables

The following environment variables are required for the application to work:

- `GEMINI_API_KEY`: Your Google Gemini API key for image analysis

### Local Development

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your actual Gemini API key

### Deployment

When deploying to Vercel:

1. Go to your project settings
2. Navigate to the Environment Variables section
3. Add `GEMINI_API_KEY` with your Gemini API key
4. Redeploy your application for the changes to take effect