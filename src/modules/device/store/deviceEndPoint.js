import { DeviceApi } from "./deviceApi";

export const deviceDetails = DeviceApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getAllDevices: builder.query({
            query: () => {
                return `device/getall`;
            },
            providesTags: ['device'],
            refetchOnMountOrArgChange: false, // Prevent refetch on mount if data exists
            refetchOnFocus: false, // Prevent refetch when window regains focus
        }),
        getDeviceById: builder.query({
            query: (deviceid) => {
                return `device/deviceid/${deviceid}`;
            },
            providesTags: ['device'],
            refetchOnMountOrArgChange: false,
            refetchOnFocus: false,
        }),
        getDeviceByCode: builder.query({
            query: (dairyCode) => {
                return `device/devicecode/${dairyCode}`;
            },
            providesTags: ['device'],
            refetchOnMountOrArgChange: false,
            refetchOnFocus: false,
        }),
        createDevice: builder.mutation({
            query: (body) => {
                return {
                    url: 'device/add',
                    method: 'POST',
                    body
                };
            },
            invalidatesTags: ['device']
        }),
        editDevice: builder.mutation({
            query: ({ id, ...body }) => {
                return {
                    url: `device/edit/${id}`,
                    method: 'PUT',
                    body
                };
            },
            invalidatesTags: ['device']
        }),
        deleteDevice: builder.mutation({
            query: (deviceid) => {
                return {
                    url: `device/delete/${deviceid}`,
                    method: 'DELETE'
                };
            },
            invalidatesTags: ['device']
        }),
        addMember: builder.mutation({
            query: (body) => {
                return {
                    url: 'device/addMember',
                    method: 'POST',
                    body
                }
            },
            invalidatesTags: ['device']
        }),
        editMember: builder.mutation({
            query: (body) => {

                return {
                    url: 'device/editMember',
                    method: 'PUT',
                    body
                }
            },
            invalidatesTags: ['device']
        }),
        deleteMember: builder.mutation({
            query: (body) => ({
                url: 'device/deleteMember',
                method: 'DELETE',
                body
            }),
            invalidatesTags: ['device']
        }),
    }),
});

// Hooks
export const {
    useGetAllDevicesQuery,
    useLazyGetAllDevicesQuery,
    useGetDeviceByCodeQuery,
    useLazyGetDeviceByCodeQuery,
    useGetDeviceByIdQuery,
    useLazyGetDeviceByIdQuery,
    useCreateDeviceMutation,
    useEditDeviceMutation,
    useDeleteDeviceMutation,
    useAddMemberMutation,
    useEditMemberMutation,
    useDeleteMemberMutation
} = deviceDetails;
