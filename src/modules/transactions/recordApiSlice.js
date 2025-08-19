// src/features/records/recordApiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryReauth } from "../../store/baseQueryReauth";

export const TransactionApi = createApi({
  reducerPath: "TransactionApi",
  baseQuery: baseQueryReauth,
  tagTypes: ["Record"],
  endpoints: (builder) => ({
    addRecord: builder.mutation({
      query: (newRecord) => ({
        url: "records/addRecord",
        method: "POST",
        body: newRecord,
      }),
      invalidatesTags: ["Record"],
    }),
    updateRecord: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `records/editRecord/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: ["Record"],
    }),
    getRecordByCodeDateShift: builder.query({
      query: ({ devicecode, code, date, shift }) => ({
        url: `records/getRecordByCodeDateShift?devicecode=${devicecode}&code=${code}&date=${date}&shift=${shift}`,
        method: "GET",
      }),
    }),
    getRecordsByDateShift: builder.query({
      query: ({ devicecode, date, shift }) => ({
        url: `records/getRecordsByDateShift?devicecode=${devicecode}&date=${date}&shift=${shift}`,
        method: "GET",
      }),
      providesTags: ["Record"],
    }),
  }),
});

export const {
  useAddRecordMutation,
  useGetRecordByCodeDateShiftQuery,
  useGetRecordsByDateShiftQuery,
  useUpdateRecordMutation,
} = TransactionApi;
