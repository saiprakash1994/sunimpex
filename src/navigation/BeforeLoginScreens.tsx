import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import LoginScreen from "../modules/authentication/pages/Login/LoginScreen";

export const BeforeLoginScreens = () => {
    const Stack = createNativeStackNavigator();
    return (
        <Stack.Navigator>
            <Stack.Screen name='login' component={LoginScreen} options={{
                headerShown: false,
            }} />
        </Stack.Navigator>
    )
}