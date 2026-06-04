# Quoteshub Frontend

A Vite + React + TypeScript single-page app for discovering, sharing, and saving quotes.

## Features

- Quote feed with search and filter tabs
- Share, like, save, and delete interactions
- Auth modal for sign-in and sign-up
- Responsive, editorial-inspired UI

## Getting Started

1. Install dependencies
   - `npm install`
2. Start the dev server
   - `npm run dev`

## Configuration

The app expects a backend API. Set `VITE_API_URL` in your environment when needed.

Example (PowerShell):

```
$env:VITE_API_URL="http://localhost:3333/api/v1"
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check and build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
