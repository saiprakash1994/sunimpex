import { createSlice } from '@reduxjs/toolkit';

export const userInfoSlice = createSlice({
    name: 'userInfoSlice',
    initialState: {
        userInfo: {},
        isLoggedIn: false
    },
    reducers: {
        adduserInfo: (state, action) => {
            state.userInfo = action.payload;
            state.isLoggedIn = true;
        },
        clearUserInfo: (state) => {
            state.userInfo = {};
            state.isLoggedIn = false;
        }
    }
})



export const { adduserInfo, clearUserInfo } = userInfoSlice.actions;

export default userInfoSlice.reducer;