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
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      response
        .clone()
        .json()
        .then((data) => isServerStarting(data) && notify())
        .catch(() => {});
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
