# Backend Setup Guide

This document outlines all the API endpoints and configuration needed to connect the mobile app to your backend.

## Environment Variables

Set these in your `.env` file or Expo environment configuration:

```bash
EXPO_PUBLIC_BASE_URL=https://your-backend-domain.com
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=your_uploadcare_key  # Optional, for file uploads
```

## Required API Endpoints

### Authentication

#### `GET /account/signin?callbackUrl=/api/auth/token`
- **Purpose**: Sign in page
- **Response**: HTML page with authentication form
- **Callback**: After successful auth, redirects to `/api/auth/token` with auth data

#### `GET /account/signup?callbackUrl=/api/auth/token`
- **Purpose**: Sign up page
- **Response**: HTML page with registration form
- **Callback**: After successful registration, redirects to `/api/auth/token` with auth data

#### `GET /api/auth/token`
- **Purpose**: Auth callback endpoint (native apps)
- **Response**: JSON with `{ jwt: string, user: object }`
- **Headers**: Should include auth cookies/tokens from the auth flow

#### `GET /api/auth/expo-web-success`
- **Purpose**: Auth callback endpoint (web iframe)
- **Response**: HTML page that posts message to parent window with `{ type: 'AUTH_SUCCESS', jwt: string, user: object }`
- **Note**: Used for web platform authentication via iframe

### File Uploads

#### `POST /api/upload`
- **Purpose**: Upload files (images, documents, etc.)
- **Request Body**: 
  - FormData with `file` field, OR
  - JSON with `{ url: string }` for URL uploads, OR
  - JSON with `{ base64: string }` for base64 uploads, OR
  - Raw binary data with `Content-Type: application/octet-stream`
- **Response**: JSON with `{ url: string, mimeType: string | null }`
- **Headers**: `Authorization: Bearer <jwt>` (if authenticated)

#### `POST /api/upload/presign`
- **Purpose**: Get presigned URL for Uploadcare uploads
- **Response**: JSON with `{ secureSignature: string, secureExpire: number }`
- **Headers**: `Authorization: Bearer <jwt>` (if authenticated)
- **Note**: Used as fallback when direct file upload fails

### Bible Data & User Content

#### `GET /api/highlights?deviceId={id}&version={version}&book={book}&chapter={chapter}`
- **Purpose**: Get highlights for a chapter
- **Response**: JSON with `{ highlights: Array<{ verse: number, color: string }> }`
- **Headers**: `Authorization: Bearer <jwt>` (optional, for synced highlights)

#### `POST /api/highlights`
- **Purpose**: Create or update a highlight
- **Request Body**: JSON with `{ deviceId: string, version: string, book: string, chapter: number, verse: number, color: string }`
- **Response**: JSON with `{ highlight: { id: string, ... } }`
- **Headers**: `Authorization: Bearer <jwt>` (optional)

#### `DELETE /api/highlights`
- **Purpose**: Delete a highlight
- **Request Body**: JSON with `{ deviceId: string, version: string, book: string, chapter: number, verse: number }`
- **Response**: JSON with `{ ok: boolean }`
- **Headers**: `Authorization: Bearer <jwt>` (optional)

#### `GET /api/notes?deviceId={id}&version={version}&book={book}&chapter={chapter}`
- **Purpose**: Get notes for a chapter
- **Response**: JSON with `{ notes: Array<{ verse: number, note: string }> }`
- **Headers**: `Authorization: Bearer <jwt>` (optional)

#### `POST /api/notes`
- **Purpose**: Create or update a note
- **Request Body**: JSON with `{ deviceId: string, version: string, book: string, chapter: number, verse: number, note: string }`
- **Response**: JSON with note object
- **Headers**: `Authorization: Bearer <jwt>` (optional)

#### `DELETE /api/notes`
- **Purpose**: Delete a note
- **Request Body**: JSON with `{ deviceId: string, version: string, book: string, chapter: number, verse: number }`
- **Response**: JSON with success status
- **Headers**: `Authorization: Bearer <jwt>` (optional)

### AI Chat

#### `POST /api/ai/chat`
- **Purpose**: Chat with Ezra AI assistant
- **Request Body**: JSON with:
  ```json
  {
    "systemPrompt": "string",
    "book": "string",
    "chapter": "number",
    "verse": "number | null",
    "verseText": "string",
    "messages": Array<{ role: "user" | "assistant", content: string }>,
    "userMessage": "string"
  }
  ```
- **Response**: JSON with `{ reply: string }`
- **Headers**: `Authorization: Bearer <jwt>` (optional, for rate limiting/user tracking)
- **Note**: Used for main idea generation, concept questions, and general chat

### Reading Stats

#### `GET /api/reading/stats?deviceId={id}`
- **Purpose**: Get reading statistics for a device/user
- **Response**: JSON with stats object (structure depends on your needs)
- **Headers**: `Authorization: Bearer <jwt>` (optional)

#### `POST /api/reading/activity`
- **Purpose**: Log reading activity
- **Request Body**: JSON with activity data (structure depends on your needs)
- **Response**: JSON with success status
- **Headers**: `Authorization: Bearer <jwt>` (optional)

## Request Headers

All API requests to your backend will include:
- `Authorization: Bearer <jwt>` - If user is authenticated (stored in SecureStore with key `auth-jwt`)
- `Content-Type: application/json` - For JSON requests
- Standard fetch headers for CORS

## Local Storage (Client-Side Only)

These features currently use AsyncStorage and don't require backend endpoints:
- **Insights** - Stored locally in `dw_insights_v1`
- **Favorites** - Stored locally in `dw_favorites_v1`
- **Journeys** - Stored locally in `journey-state-v1`

You may want to sync these to your backend in the future for cross-device support.

## External APIs Used

The app also uses these external APIs (no backend needed):
- **Bible API**: `https://bible.helloao.org/api/{version}/{book}/{chapter}.json` (primary)
- **Bible API Fallback**: `https://bible-api.com/{book} {chapter}?translation={version}` (fallback)
- **Uploadcare**: For file uploads (if `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY` is set)

## Notes

1. **Device ID**: The app generates a device ID for tracking. You may want to associate this with user accounts when authenticated.

2. **CORS**: Ensure your backend allows CORS requests from your app's origin (for web platform).

3. **Auth Flow**: 
   - Native apps use WebView with redirect to `/api/auth/token`
   - Web apps use iframe with postMessage to parent window
   - Both expect JWT token in response

4. **Error Handling**: All endpoints should return appropriate HTTP status codes:
   - `200` - Success
   - `400` - Bad Request
   - `401` - Unauthorized
   - `404` - Not Found
   - `413` - File Too Large (for uploads)
   - `500` - Server Error

5. **Base URL**: All relative URLs (starting with `/`) will be prefixed with `EXPO_PUBLIC_BASE_URL` automatically by the fetch polyfill.

