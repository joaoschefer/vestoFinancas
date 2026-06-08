import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/";

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let renovandoToken = null;

const encerrarSessao = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.setItem("auth_message", "Sua sessão não é mais válida. Entre novamente.");
    if (window.location.pathname !== "/login") window.location.href = "/login";
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requisicaoOriginal = error.config;
        const rotaPublica = requisicaoOriginal?.url?.includes("usuarios/login/")
            || requisicaoOriginal?.url?.includes("usuarios/registrar/");

        if (error.response?.status !== 401 || rotaPublica || requisicaoOriginal?._retry) {
            if (error.response?.status === 401 && !rotaPublica) encerrarSessao();
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
            encerrarSessao();
            return Promise.reject(error);
        }

        requisicaoOriginal._retry = true;
        try {
            renovandoToken ||= axios
                .post(`${API_URL}usuarios/refresh/`, { refresh: refreshToken })
                .then((response) => response.data.access)
                .finally(() => {
                    renovandoToken = null;
                });

            const accessToken = await renovandoToken;
            localStorage.setItem("access_token", accessToken);
            requisicaoOriginal.headers.Authorization = `Bearer ${accessToken}`;
            return api(requisicaoOriginal);
        } catch {
            encerrarSessao();
            return Promise.reject(error);
        }
    },
);

export default api;
