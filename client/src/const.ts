export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE =
  import.meta.env.VITE_APP_TITLE || "Insurtech News Tracker";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Return the local login page URL for Google OAuth authentication.
export const getLoginUrl = () => "/login";
