import axios from "axios";

// Local development backend
const baseURL = "http://localhost:8000";

const api = axios.create({
baseURL,
headers: {
"Content-Type": "application/json",
},
});

api.interceptors.request.use(
(config) => {
const token =
localStorage.getItem("access_token") ||
localStorage.getItem("token");

if (token) {
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
}

return config;

},
(error) => Promise.reject(error)
);

api.interceptors.response.use(
(response) => response,
(error) => {
if (error?.response?.status === 401) {
localStorage.removeItem("access_token");
localStorage.removeItem("token");
}

return Promise.reject(
  error?.response?.data || error
);

}
);

export const setAuthToken = (token) => {
if (token) {
localStorage.setItem("access_token", token);
localStorage.setItem("token", token);
} else {
localStorage.removeItem("access_token");
localStorage.removeItem("token");
}
};

export default api;
