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

const toList = (value = "") =>
	value
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);

const ADMIN_EMAILS = toList(process.env.REACT_APP_FOUND_ADMIN_EMAILS || "");
const ADMIN_DOMAINS = toList(process.env.REACT_APP_FOUND_ADMIN_DOMAINS || "")
	.map((domain) => domain.replace(/^@+/, ""))
	.filter(Boolean);
const HAS_ADMIN_FILTER = ADMIN_EMAILS.length > 0 || ADMIN_DOMAINS.length > 0;
const IS_DEV = process.env.NODE_ENV !== "production";

const hasLocalOverride = () => {
	if (typeof window === "undefined" || !window.localStorage) return false;
	try {
		return window.localStorage.getItem("retrievaFoundAdminOverride") === "true";
	} catch (e) {
		return false;
	}
};

export const isFoundAdmin = (emailOrUser) => {
	if (hasLocalOverride()) return true;
	const email =
		typeof emailOrUser === "string"
			? emailOrUser
			: emailOrUser?.email || "";
	const normalized = email.toLowerCase().trim();
	if (!normalized) {
		return !HAS_ADMIN_FILTER && IS_DEV;
	}
	if (ADMIN_EMAILS.includes(normalized)) return true;
	if (ADMIN_DOMAINS.some((domain) => normalized.endsWith(`@${domain}`))) return true;
	if (!HAS_ADMIN_FILTER && IS_DEV) return true;
	return false;
};