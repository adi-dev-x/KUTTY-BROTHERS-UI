import axios from "axios";

export const SERVER_UNREACHABLE_EVENT = "server-unreachable";

const isServerStarting = (data) => {
  if (!data) return false;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return false;
    }
  }
  return typeof data === "object" && data.status === "server_starting";
};

const notify = () => window.dispatchEvent(new Event(SERVER_UNREACHABLE_EVENT));

let installed = false;

// Watches every API response (fetch + axios) for the backend's
// {"message":"Client signed out","status":"server_starting"} payload.
export const installServerStatusInterceptor = () => {
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    // Check the body regardless of content-type; the backend may not label it JSON.
    const contentType = response.headers.get("content-type") || "";
    const isBinary = /image|pdf|octet-stream|zip|spreadsheet|video|audio/.test(contentType);
    if (!isBinary) {
      try {
        const text = await response.clone().text();
        if (text.includes("server_starting") && isServerStarting(text)) notify();
      } catch {
        // ignore unreadable bodies
      }
    }
    return response;
  };

  axios.interceptors.response.use(
    (response) => {
      if (isServerStarting(response.data)) notify();
      return response;
    },
    (error) => {
      if (isServerStarting(error?.response?.data)) notify();
      return Promise.reject(error);
    }
  );
};
