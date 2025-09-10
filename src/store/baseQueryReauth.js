import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { APIUrl } from "../ApiUrl/apiUrl";
import {
    AppConstants,
    clearLocalStorage,
    getItemFromLocalStorage,
    setItemToLocalStorage,
} from "../shared/utils/localStorage";

let refreshPromise = null;

const baseQuery = fetchBaseQuery({
    baseUrl: `${APIUrl.URL}`,
    prepareHeaders: async (headers) => {
        const token = await getItemFromLocalStorage(AppConstants.accessToken);
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

const handleLogout = async (api) => {
    await clearLocalStorage();
    api.dispatch({ type: "userInfoSlice/clearUserInfo" });
};

// Refresh token flow
const refreshTokenFlow = async (api, extraOptions) => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const refreshToken = await getItemFromLocalStorage(AppConstants.refreshToken);
                if (!refreshToken) throw new Error("No refresh token available");

                const refreshResult = await baseQuery(
                    { url: "/auth/refresh", method: "POST", body: { refreshToken } },
                    api,
                    extraOptions
                );

                if (refreshResult.data?.accessToken) {
                    const newAccessToken = refreshResult.data.accessToken;
                    await setItemToLocalStorage(AppConstants.accessToken, newAccessToken);
                    return newAccessToken;
                } else {
                    throw new Error("Refresh token failed");
                }
            } catch (err) {
                console.error("Token refresh failed:", err);
                await handleLogout(api);
                throw err;
            } finally {
                refreshPromise = null; // reset for future
            }
        })();
    }
    return refreshPromise;
};

export const baseQueryReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        try {
            const newAccessToken = await refreshTokenFlow(api, extraOptions);
            if (newAccessToken) {
                // retry original request with new token
                result = await baseQuery(args, api, extraOptions);
            }
        } catch {
            // already handled in refreshTokenFlow
        }
    }

    return result;
};
