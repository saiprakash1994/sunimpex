// store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../modules/authentication/store/authenticateApi';
import userInfoSlice from '../modules/authentication/store/userInfoSlice';
import deviceSlice from '../modules/device/store/deviceSlice';
import { DairyApi } from '../modules/dairy/store/dairyApi';
import { DeviceApi } from '../modules/device/store/deviceApi';
import { RecordApi } from '../modules/records/store/recordApi';
import { UploadApi } from '../modules/uploads/store/uploadApi';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['userInfoSlice'], // We only want to persist the userInfoSlice
};

const rootReducer = combineReducers({
    userInfoSlice,
    deviceSlice,
    [authApi.reducerPath]: authApi.reducer,
    [DairyApi.reducerPath]: DairyApi.reducer,
    [DeviceApi.reducerPath]: DeviceApi.reducer,
    [RecordApi.reducerPath]: RecordApi.reducer,
    [UploadApi.reducerPath]: UploadApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(authApi.middleware, DairyApi.middleware, DeviceApi.middleware, RecordApi.middleware, UploadApi.middleware),
});

store.subscribe(() => {
    console.log("Redux store updated:", store.getState());
});

export const persistor = persistStore(store);
export default store;
