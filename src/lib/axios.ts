import Axios from "axios";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const apiBaseUrl = normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
);

const axios = Axios.create({
    baseURL: `${apiBaseUrl}/`,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

export default axios;