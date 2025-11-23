const DEFAULT_BASE_URL = "https://retrieva-3.onrender.com";
const envBase = (process.env.REACT_APP_API_BASE || "").trim();
const BASE_URL = (envBase || DEFAULT_BASE_URL).replace(/\/+$/, "");

const buildUrl = (path = "") => {
	if (!path) return BASE_URL;
	if (/^https?:\/\//i.test(path)) return path;
	const normalizedPath = path.replace(/^\/+/, "");
	return `${BASE_URL}/${normalizedPath}`;
};

export const API = {
	BASE_URL,
	url: buildUrl,
};