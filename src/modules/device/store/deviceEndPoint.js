import { DeviceApi } from "./deviceApi";

export const deviceDetails = DeviceApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getAllDevices: builder.query({
            query: () => {
                console.log('[getAllDevices] API called');
                return `device/getall`;
            },
            providesTags: ['device'],
            refetchOnMountOrArgChange: false, // Prevent refetch on mount if data exists
            refetchOnFocus: false, // Prevent refetch when window regains focus
        }),
        getDeviceById: builder.query({
            query: (deviceid) => {
                console.log('[getDeviceById] API called with deviceid:', deviceid);
                return `device/deviceid/${deviceid}`;
            },
            providesTags: ['device'],
            refetchOnMountOrArgChange: false,
            refetchOnFocus: false,
        }),
        getDeviceByCode: builder.query({
            query: (dairyCode) => {
                console.log('[getDeviceByCode] API called with dairyCode:', dairyCode);
                return `device/devicecode/${dairyCode}`;
            },
            providesTags: ['device'],
            refetchOnMountOrArgChange: false,
            refetchOnFocus: false,
        }),
        createDevice: builder.mutation({
            query: (body) => {
                console.log('[createDevice] API called with body:', body);
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
                console.log('[editDevice] API called with id:', id, 'body:', body);
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
                console.log('[deleteDevice] API called with deviceid:', deviceid);
                return {
                    url: `device/delete/${deviceid}`,
                    method: 'DELETE'
                };
            },
            invalidatesTags: ['device']
        }),
        addMember: builder.mutation({
            query: (body) => {
                console.log(body, 'add')
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
                console.log(body, 'edit')

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
