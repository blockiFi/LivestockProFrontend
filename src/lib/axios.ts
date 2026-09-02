import Axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

// When VITE_API_BASE_URL is set, requests go directly to that backend.
// Otherwise use same-origin /api/* (Vite proxy in dev, vercel.json rewrites in production).
const axios = Axios.create({
    baseURL: apiBaseUrl || "/",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

export default axios;
