import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { APIUrl } from '../../../ApiUrl/apiUrl';
import { AppConstants, getItemFromLocalStorage } from '../../../shared/utils/localStorage';

export const DairyApi = createApi({
    reducerPath: 'DairyApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${APIUrl.URL}`,
        prepareHeaders: async (headers) => {
            try {
                const token = await getItemFromLocalStorage(AppConstants.accessToken);
                if (token) {
                    headers.set("Authorization", `Bearer ${token}`);
                } else {
                    console.log("No token found in AsyncStorage");
                }
            } catch (err) {
                console.error("Error in prepareHeaders", err);
            }
            return headers;
        },
    }),
    tagTypes: ['getAll'],
    keepUnusedDataFor: 300, // Keep data for 5 minutes to reduce refetches
    endpoints: () => ({})
});
