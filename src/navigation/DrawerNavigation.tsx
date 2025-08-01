import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AccountIcon, DairyIcon, DeviceIcon, GroupPeople, HomeIcon, LogoutIcon, RateChart, ReportsIcon, SettingsIcon, UploadIcon } from "../icons/SvgIcons";
import { TEXT_COLORS, THEME_COLORS } from "../globalStyle/GlobalStyles";
import DashboardScreen from "../modules/dashboard/pages/DashboardScreen";
import DeviceScreen from "../modules/device/pages/DeviceScreen";
import SettingsScreen from "../modules/settings/pages/SettingsScreen";
import UploadScreen from "../modules/uploads/pages/UploadScreen";
import ProfileScreen from "../modules/profile/pages/ProfileScreen";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { clearLocalStorage } from "../shared/utils/localStorage";
import { useDispatch, useSelector } from "react-redux";
import { clearUserInfo } from "../modules/authentication/store/userInfoSlice";
import { persistor } from "../store/store"; // Import the persistor
import { roles } from "../shared/utils/appRoles";
import { AdminOptions, DairyOptions, DeviceOptions } from "../shared/utils/appConstants";
import DairyScreen from "../modules/dairy/pages/DairyScreen";
import RateTable from "../modules/rateTable/pages/RateTable";
import MembersList from "../modules/members/pages/MembersList";
import RecordsPage from "../modules/records/pages/recordsPage/RecordsPage";


type RootStackParamList = {
    login: undefined;
};

// ✅ Custom TabBar Icon with your SVGs
function CustomTabBarLabel({ label, color }: any) {
    return (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
            {label === "Dashboard" && <HomeIcon color={color} />}
            {label === "Profile" && <AccountIcon color={color} height={25} width={25} fill={color} />}
            {label === "Device" && <DeviceIcon color={color} height={25} width={25} fill={color} />}
            {label === "Settings" && <SettingsIcon color={color} height={25} width={25} fill={color} />}
            {label === "Reports" && <ReportsIcon color={color} height={25} width={25} fill={color} />}
            {label === "Upload" && <UploadIcon color={color} height={25} width={25} fill={color} />}
            {label === "Logout" && <LogoutIcon color={color} height={25} width={25} fill={color} />}
            {label === "Dairy" && <DairyIcon color={color} height={25} width={25} fill={color} />}
            {label === "Rate Table" && <RateChart color={color} height={25} width={25} fill={color} />}
            {label === "Member List" && <GroupPeople color={color} height={25} width={25} fill={color} />}

        </View>
    );
}


// // ✅ Bottom Tabs for Home
//const Tab = createBottomTabNavigator<RootStackParamList>();
// function HomeTabs() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarShowLabel: false,
//         tabBarActiveTintColor: THEME_COLORS.secondary,
//         tabBarInactiveTintColor: TEXT_COLORS.secondary,
//         tabBarHideOnKeyboard: true,
//         headerStyle: {
//           shadowColor: "#000",
//           shadowOffset: { width: 0, height: 0 },
//           shadowOpacity: 0.25,
//           shadowRadius: 3.84,
//           elevation: 5,
//         },
//       }}
//     >
//       <Tab.Screen
//         name="Home"
//         component={HomeScreen}
//         options={{
//           tabBarIcon: ({ color }) => <CustomTabBarLabel label={"Home"} color={color} />,
//           headerShown: false,
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={ProfileScreen}
//         options={{
//           tabBarIcon: ({ color }) => <CustomTabBarLabel label={"Profile"} color={color} />,
//           headerShown: false,
//         }}
//       />
//     </Tab.Navigator>
//   );
// }

// function CustomDrawerContent(props: any) {
//     const username = "SaiPrakash";
//     const profileLetter = username.charAt(0).toUpperCase();

//     return (
//         <View style={{ flex: 1 }}>
//             <View style={styles.drawerHeader}>
//                 <View style={styles.profileCircle}>
//                     <Text style={styles.profileLetter}>{profileLetter}</Text>
//                 </View>
//                 <Text style={styles.drawerTitle}>{username}</Text>
//             </View>

//             <DrawerContentScrollView {...props}>
//                 <DrawerItemList {...props} />
//             </DrawerContentScrollView>
//         </View>
//     );
// }


function CustomDrawerContent(props: any) {
    const userInfo = useSelector((state: any) => state?.userInfoSlice?.userInfo)

    const displayLabel = userInfo?.dairyName || userInfo?.deviceName || (userInfo && Object.keys(userInfo).length === 0 ? "" : "User");

    const profileLetter = displayLabel.charAt(0).toUpperCase();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const dispatch = useDispatch();
    const userType = useSelector((state: any) => state.userInfoSlice.userInfo.role);
    const sidebarOptions = userType === roles.ADMIN ? AdminOptions : userType === roles.DAIRY ? DairyOptions : DeviceOptions;

    const handleLogout = async () => {
        await persistor.purge(); // Purge the persisted state
        clearLocalStorage();
        dispatch(clearUserInfo());
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.drawerHeader}>
                <View style={styles.profileCircle}>
                    <Text style={styles.profileLetter}>{profileLetter}</Text>
                </View>
                <Text style={styles.drawerTitle}>{displayLabel}</Text>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
                {sidebarOptions.map(({ title, label, icon: Icon }) => {
                    const currentRoute = props.state?.routeNames[props.state?.index];
                    const isActive = currentRoute === title;
                    const iconColor = isActive ? THEME_COLORS.secondary : TEXT_COLORS.secondary;
                    const labelColor = isActive ? THEME_COLORS.secondary : TEXT_COLORS.secondary;
                    const fontWeight = isActive ? 'bold' : 'normal';
                    return (
                        <TouchableOpacity
                            key={title}
                            style={{
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isActive ? '#f0f0f0' : 'transparent',
                            }}
                            onPress={() => {
                                props.navigation.navigate(title);
                                props.navigation.closeDrawer();
                            }}
                        >
                            <Icon color={iconColor} height={25} width={25} />
                            <Text style={{ color: labelColor, fontSize: 16, marginLeft: 12, fontWeight }}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </DrawerContentScrollView>

            <View style={styles.logoutContainer}>
                <View
                    style={styles.logoutButton}
                    onTouchEnd={handleLogout}
                >
                    <LogoutIcon color={TEXT_COLORS.secondary} height={25} width={25} />
                    <Text style={styles.logoutText}>Logout</Text>
                </View>
            </View>
        </View>
    );
}

export const DrawerNav = () => {
    const Drawer = createDrawerNavigator();

    return (
        <Drawer.Navigator
            initialRouteName="dashboard"
            drawerContent={(props) => <CustomDrawerContent {...props} />}

            screenOptions={{
                drawerActiveTintColor: THEME_COLORS.secondary,
                drawerInactiveTintColor: TEXT_COLORS.secondary,
                headerStyle: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                },
            }}

        >
            <Drawer.Screen
                name="dashboard"
                component={DashboardScreen}
                options={{
                    title: "Dashboard",
                    headerShown: true,
                    drawerIcon: ({ color }) => (
                        <CustomTabBarLabel label={"Dashboard"} color={color} />
                    ),
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                }}
            />
            <Drawer.Screen
                name="rateTable"
                component={RateTable}
                options={{
                    title: "Rate Table Generator",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Rate Table"} color={color} />,
                }}
            />
            <Drawer.Screen
                name="members"
                component={MembersList}
                options={{
                    title: "Member List",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Member List"} color={color} />,
                }}
            />
            <Drawer.Screen
                name="dairy"
                component={DairyScreen}
                options={{
                    title: "Dairy",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Device"} color={color} />,
                }}
            />
            <Drawer.Screen
                name="device"
                component={DeviceScreen}
                options={{
                    title: "Device",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Device"} color={color} />,
                }}
            />
            <Drawer.Screen
                name="reports"
                component={RecordsPage}
                options={{
                    title: "Reports",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Reports"} color={color} />,
                }}
            />
            <Drawer.Screen
                name="settings"
                component={SettingsScreen}
                options={{
                    title: "Settings",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Settings"} color={color} />,
                }}
            />
            <Drawer.Screen
                name="upload"
                component={UploadScreen}
                options={{
                    title: "Upload",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Upload"} color={color} />,
                }}
            />
            <Drawer.Screen
                name="profile"
                component={ProfileScreen}
                options={{
                    title: "Profile",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: THEME_COLORS.secondary,
                    },
                    headerTintColor: TEXT_COLORS.whiteColor,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    drawerIcon: ({ color }) => <CustomTabBarLabel label={"Profile"} color={color} />,
                }}
            />

        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    drawerHeader: {
        backgroundColor: THEME_COLORS.secondary,
        paddingVertical: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    profileCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: THEME_COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    profileLetter: {
        fontSize: 26,
        fontWeight: "bold",
        color: THEME_COLORS.secondary,
    },
    drawerTitle: {
        fontSize: 18,
        color: TEXT_COLORS.whiteColor,
        fontWeight: "bold",
    },
    logoutContainer: {
        borderTopWidth: 1,
        borderTopColor: "#ccc",
        paddingVertical: 15,
        paddingHorizontal: 20,
    },

    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
    },

    logoutText: {
        marginLeft: 15,
        fontSize: 16,
        color: TEXT_COLORS.secondary,
        fontWeight: "bold",
    },

});
