import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from 'react';
import { TabNavigation } from "./TabNavigation";
import AddDairy from "../modules/dairy/pages/AddDairy";
import { TEXT_COLORS, THEME_COLORS } from "../globalStyle/GlobalStyles";
import AddDevice from "../modules/device/pages/AddDevice";
import DairyScreen from "../modules/dairy/pages/DairyScreen";
import DeviceScreen from "../modules/device/pages/DeviceScreen";
import UploadScreen from "../modules/uploads/pages/UploadScreen";
import ProfileScreen from "../modules/profile/pages/ProfileScreen";
import MembersList from "../modules/members/pages/MembersList";
import MilkCollection from "../modules/transactions/MilkCollection";

export type RootStackParamList = {
    main: undefined;
    dairyadd: undefined;
    deviceadd: undefined;
    dairy: undefined;
    device: undefined;
    upload: undefined;
    profile: undefined;
    members: undefined;
    MilkCollection: undefined; // Add this
};

export const StackNavgation = () => {
    const Stack = createNativeStackNavigator<RootStackParamList>();

    const headerOptions = {
        headerStyle: {
            backgroundColor: THEME_COLORS.secondary,
        },
        headerTintColor: TEXT_COLORS.whiteColor,
        headerTitleStyle: {
            fontWeight: "bold" as const,
        },
    };

    return (
        <Stack.Navigator>
            <Stack.Screen
                name='main'
                component={TabNavigation}
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="dairyadd"
                component={AddDairy}
                options={{
                    title: 'Dairy Information',
                    ...headerOptions,
                }}
            />
            <Stack.Screen
                name="deviceadd"
                component={AddDevice}
                options={{
                    title: 'Device Information',
                    ...headerOptions,
                }}
            />
            <Stack.Screen
                name="dairy"
                component={DairyScreen}
                options={{
                    title: 'Dairy',
                    ...headerOptions,
                }}
            />
            <Stack.Screen
                name="device"
                component={DeviceScreen}
                options={{
                    title: 'Device',
                    ...headerOptions,
                }}
            />
            <Stack.Screen
                name="upload"
                component={UploadScreen}
                options={{
                    title: 'Upload',
                    ...headerOptions,
                }}
            />
            <Stack.Screen
                name="profile"
                component={ProfileScreen}
                options={{
                    title: 'Profile',
                    ...headerOptions,
                }}
            />
            <Stack.Screen
                name="members"
                component={MembersList}
                options={{
                    title: 'Member List',
                    ...headerOptions,
                }}
            />
            {/* Add the MilkCollection screen */}
            <Stack.Screen
                name="MilkCollection"
                component={MilkCollection}
                options={{
                    title: 'Milk Collection',
                    ...headerOptions,
                }}
            />
        </Stack.Navigator>
    );
};
