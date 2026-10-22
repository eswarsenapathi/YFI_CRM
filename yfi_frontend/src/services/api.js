import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
});


// Add access token to every request
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("access");

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// Refresh access token when it expires
api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refresh");

            if (refreshToken) {
                try {
                    const response = await axios.post(
                        "http://127.0.0.1:8000/api/token/refresh/",
                        {
                            refresh: refreshToken,
                        }
                    );

                    const newAccessToken = response.data.access;

                    localStorage.setItem(
                        "access",
                        newAccessToken
                    );

                    originalRequest.headers.Authorization =
                        `Bearer ${newAccessToken}`;

                    return api(originalRequest);

                } catch (refreshError) {
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");

                    window.location.href = "/login";

                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);


export default api;