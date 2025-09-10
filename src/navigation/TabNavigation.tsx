import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { HomeIcon, ReportsIcon, SettingsIcon, AccountIcon, MenuIcon } from "../icons/SvgIcons";
import { TEXT_COLORS, THEME_COLORS } from "../globalStyle/GlobalStyles";
import DashboardScreen from "../modules/dashboard/pages/DashboardScreen";
import SettingsScreen from "../modules/settings/pages/SettingsScreen";
import RecordsPage from "../modules/records/pages/recordsPage/RecordsPage";
import MenuScreen from "./MenuScreen";
import MilkCollection from "../modules/transactions/MilkCollection";

// Custom Tab Bar Icon Component
function CustomTabBarIcon({ route, color, size }: { route: any, color: string, size: number }) {
    const iconProps = { color, height: size, width: size };

    switch (route.name) {
        case 'Home':
            return <HomeIcon {...iconProps} />;
        case 'Reports':
            return <ReportsIcon {...iconProps} />;
        case 'Settings':
            return <SettingsIcon {...iconProps} />;
        case 'Menu':
            return <MenuIcon {...iconProps} />;
        case 'MilkCollection':
            return <Text style={{ color, fontSize: size, fontWeight: 'bold' }}>+</Text>;
        default:
            return <HomeIcon {...iconProps} />;
    }
}

export const TabNavigation = () => {
    const Tab = createBottomTabNavigator();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'MilkCollection') {
                        return (
                            <View style={styles.plusButton}>
                                <Text style={styles.plusText}>+</Text>
                            </View>
                        );
                    }
                    return <CustomTabBarIcon route={route} color={color} size={size} />;
                },
                tabBarActiveTintColor: THEME_COLORS.secondary,
                tabBarInactiveTintColor: TEXT_COLORS.secondary,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                headerStyle: {
                    backgroundColor: THEME_COLORS.secondary,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                },
                headerTintColor: TEXT_COLORS.whiteColor,
                headerTitleStyle: {
                    fontWeight: "bold",
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    title: "Home",
                    headerShown: true,
                }}
            />
            <Tab.Screen
                name="Reports"
                component={RecordsPage}
                options={{
                    title: "Reports",
                    headerShown: true,
                }}
            />
            <Tab.Screen
                name="MilkCollection"
                component={MilkCollection}
                options={{
                    title: "Milk Collection",
                    headerShown: true,
                    tabBarLabel: "ADD",
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: "Settings",
                    headerShown: true,
                }}
            />
            <Tab.Screen
                name="Menu"
                component={MenuScreen}
                options={{
                    title: "Menu",
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    tabBarLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    plusButton: {
        top: -15,
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: THEME_COLORS.secondary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    plusText: {
        fontSize: 30,
        color: TEXT_COLORS.whiteColor,
        fontWeight: 'bold',
    },
});

