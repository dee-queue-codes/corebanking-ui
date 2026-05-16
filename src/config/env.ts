export const env = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:5173/api/v1',
  AUTH_REFRESH_PATH: (import.meta.env.VITE_AUTH_REFRESH_PATH as string) ?? '/api/v1/auth/refresh',
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) ?? 'Chelsea Bank',
}
