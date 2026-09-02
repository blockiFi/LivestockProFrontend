import Axios from "axios";

const configuredBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

// Dev: always same-origin /api/* so Vite proxies to the backend (avoids CORS).
// Prod: same-origin when unset (Vercel rewrites); set VITE_API_BASE_URL only for direct API hosts.
const baseURL = import.meta.env.DEV ? "/" : configuredBase || "/";

const axios = Axios.create({
    baseURL,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

export default axios;
