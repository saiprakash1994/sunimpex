import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StackNavgation } from './ScreensNavigations';
import { BeforeLoginScreens } from './BeforeLoginScreens';
import { AppConstants, getItemFromLocalStorage } from '../shared/utils/localStorage';
import { ActivityIndicator, View } from 'react-native';
import { THEME_COLORS } from '../globalStyle/GlobalStyles';
import { useSelector } from 'react-redux';
import CustomToast from '../shared/components/CustomToast';
import { ToastProvider } from 'react-native-toast-notifications';


const Navigation = () => {
    const isLoggedIn = useSelector((state: any) => state.userInfoSlice.isLoggedIn);

    // Remove useState and useEffect for isLoggedIn

    if (isLoggedIn === null) {
        // Show loading indicator while checking AsyncStorage
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={THEME_COLORS.secondary} />
            </View>
        );
    }

    return (
        <ToastProvider
            renderType={{
                custom_type: (toast: any) => (
                    <CustomToast
                        message={toast.message}
                        title={toast.data?.title}
                        type={toast.data?.type}
                        color={toast.data?.color}
                        sideColor={toast.data?.sideColor}
                    />
                )
            }}
        >
            <NavigationContainer>
                {isLoggedIn ? <StackNavgation /> : <BeforeLoginScreens />}
            </NavigationContainer>
        </ToastProvider>
    );
};

export default Navigation;
