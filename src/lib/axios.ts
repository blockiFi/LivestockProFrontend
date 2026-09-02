import Axios from "axios";

// Always same-origin /api/* — proxied by Vite in dev and vercel.json rewrites on Vercel.
// Do NOT point axios at the backend URL in production; that causes browser CORS errors.
// VITE_API_BASE_URL is only used by vite.config.ts as the dev proxy target.
const axios = Axios.create({
    baseURL: "/",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

export default axios;
