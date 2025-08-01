import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from 'react';
import { DrawerNav } from "./DrawerNavigation";
import AddDairy from "../modules/dairy/pages/AddDairy";
import { TEXT_COLORS, THEME_COLORS } from "../globalStyle/GlobalStyles";
import AddDevice from "../modules/device/pages/AddDevice";

export const StackNavgation = () => {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen name='main' component={DrawerNav} options={{
                headerShown: false
            }} />
            <Stack.Screen name="dairyadd" component={AddDairy} options={{
                title: 'Dairy Information',
                headerStyle: {
                    backgroundColor: THEME_COLORS.secondary,
                },
                headerTintColor: TEXT_COLORS.whiteColor,
                headerTitleStyle: {
                    fontWeight: "bold",
                },
            }} />
            <Stack.Screen name="deviceadd" component={AddDevice} options={{
                title: 'Device Information',
                headerStyle: {
                    backgroundColor: THEME_COLORS.secondary,
                },
                headerTintColor: TEXT_COLORS.whiteColor,
                headerTitleStyle: {
                    fontWeight: "bold",
                },
            }} />

        </Stack.Navigator>
    );
};