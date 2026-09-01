import Axios from "axios";

// Same-origin /api/* — proxied by Vite in dev and by vercel.json rewrites in production.
// This avoids browser CORS when the UI and API are on different hosts.
const axios = Axios.create({
    baseURL: "/",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

export default axios;
