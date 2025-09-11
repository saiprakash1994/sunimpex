import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import {
    AccountIcon,
    DairyIcon,
    DeviceIcon,
    GroupPeople,
    LogoutIcon,
    UploadIcon,
    HomeIcon,
    SettingsIcon,
    ReportsIcon
} from '../icons/SvgIcons';
import { TEXT_COLORS, THEME_COLORS } from '../globalStyle/GlobalStyles';
import { roles } from '../shared/utils/appRoles';
import { AdminOptions, DairyOptions, DeviceOptions } from '../shared/utils/appConstants';
import { clearUserInfo } from '../modules/authentication/store/userInfoSlice';
import { persistor } from '../store/store';
import { AppConstants, clearLocalStorage, getItemFromLocalStorage } from '../shared/utils/localStorage';
import { authApi } from '../modules/authentication/store/authenticateApi';
import { useLogoutMutation } from '../modules/authentication/store/authenticateEndPoints';

// Define navigation types
type RootStackParamList = {
    dairy: undefined;
    device: undefined;
    upload: undefined;
    profile: undefined;
    members: undefined;
    dairyadd: undefined;
    deviceadd: undefined;
    dashboard: undefined;
    settings: undefined;
    reports: undefined;
};

type MenuScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const MenuScreen = () => {
    const navigation = useNavigation<MenuScreenNavigationProp>();
    const dispatch = useDispatch();
    const userInfo = useSelector((state: any) => state?.userInfoSlice?.userInfo);
    const userType = useSelector((state: any) => state.userInfoSlice.userInfo.role);
    const [logout] = useLogoutMutation();
    const [currentTab, setCurrentTab] = React.useState('dashboard');

    // Get menu options based on user role
    const menuOptions = userType === roles.ADMIN ? AdminOptions :
        userType === roles.DAIRY ? DairyOptions : DeviceOptions;

    const displayLabel = userInfo?.dairyName || userInfo?.deviceName ||
        (userInfo && Object.keys(userInfo).length === 0 ? "" : "User");
    const profileLetter = displayLabel.charAt(0).toUpperCase();

    // Update current tab when this screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            // Check current navigation state to determine active tab
            const state = navigation.getParent()?.getState();
            if (state) {
                const currentRoute = state.routes[state.index];
                if (currentRoute.name === 'Home') {
                    setCurrentTab('dashboard');
                } else if (currentRoute.name === 'Reports') {
                    setCurrentTab('reports');
                } else if (currentRoute.name === 'Settings') {
                    setCurrentTab('settings');
                } else {
                    setCurrentTab('menu');
                }
            }
        }, [navigation])
    );

    // Create complete menu with proper ordering and deduplication
    const createMenuItems = () => {
        const baseItems = [
            { title: 'dashboard', label: 'Dashboard', icon: HomeIcon }
        ];

        // Filter out dashboard from menuOptions since we handle it separately
        const filteredMenuOptions = menuOptions.filter(item =>
            item.title !== 'dashboard'
        );

        const logoutItem = { title: 'logout', label: 'Logout', icon: LogoutIcon };

        // Combine all items
        const allItems = [
            ...baseItems,
            ...filteredMenuOptions,
            logoutItem
        ];

        // Remove duplicates based on title
        return allItems.filter((item, index, self) =>
            index === self.findIndex(t => t.title === item.title)
        );
    };

    const allMenuItems = createMenuItems();

    const handleLogout = async (): Promise<void> => {
        try {
            await logout({ refreshToken: await getItemFromLocalStorage(AppConstants.refreshToken) }).unwrap();

            if (persistor) {
                await persistor.purge();
            }

            await clearLocalStorage();
            dispatch(clearUserInfo());
            dispatch(authApi.util.resetApiState());
        } catch (err) {
            console.error("Logout error:", err);

            if (persistor) {
                await persistor.purge();
            }
            await clearLocalStorage();
            dispatch(clearUserInfo());
            dispatch(authApi.util.resetApiState());
        }
    };

    const handleMenuPress = (screenName: string) => {
        if (screenName === 'dashboard') {
            setCurrentTab('dashboard');
            navigation.navigate('Home' as any);
            return;
        }

        if (screenName === 'settings') {
            setCurrentTab('settings');
            navigation.navigate('Settings' as any);
            return;
        }

        if (screenName === 'reports') {
            setCurrentTab('reports');
            navigation.navigate('Reports' as any);
            return;
        }

        if (screenName === 'logout') {
            handleLogout();
            return;
        }

        // For other screens, set current tab and navigate
        if (screenName in navigation.getState().routeNames ||
            ['dairy', 'device', 'upload', 'profile', 'members', 'dairyadd', 'deviceadd'].includes(screenName)) {
            setCurrentTab(screenName);
            (navigation as any).navigate(screenName);
        }
    };

    const getIcon = (title: string, isActive: boolean = false) => {
        const iconColor = isActive ? THEME_COLORS.secondary : '#6B7280';
        const iconProps = { color: iconColor, height: 24, width: 24 };

        switch (title) {
            case 'dashboard': return <HomeIcon {...iconProps} />;
            case 'members': return <GroupPeople {...iconProps} />;
            case 'dairy': return <DairyIcon {...iconProps} />;
            case 'device': return <DeviceIcon {...iconProps} />;
            case 'upload': return <UploadIcon {...iconProps} />;
            case 'profile': return <AccountIcon {...iconProps} />;
            case 'settings': return <SettingsIcon {...iconProps} />;
            case 'reports': return <ReportsIcon {...iconProps} />;
            case 'logout': return <LogoutIcon {...iconProps} />;
            default: return <AccountIcon {...iconProps} />;
        }
    };

    const getRoleDisplayText = () => {
        return displayLabel || 'Admin';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME_COLORS.secondary} />

            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.profileCircle}>
                    <Text style={styles.profileLetter}>{profileLetter}</Text>
                </View>
                <Text style={styles.profileName}>{getRoleDisplayText()}</Text>
            </View>

            {/* All Menu Items including Logout */}
            <ScrollView
                style={styles.menuContainer}
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.scrollContent}
            >
                {allMenuItems.map(({ title, label, icon: Icon }, index) => {
                    // Check if current item is active based on currentTab state
                    const isActive = currentTab === title;
                    const isLogout = title === 'logout';

                    return (
                        <TouchableOpacity
                            key={title}
                            style={[
                                styles.menuItem,
                                isActive && styles.activeMenuItem,
                                isLogout && styles.logoutMenuItem
                            ]}
                            onPress={() => handleMenuPress(title)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                {getIcon(title, isActive)}
                            </View>
                            <Text style={[
                                styles.menuLabel,
                                isActive && styles.activeMenuLabel
                            ]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    profileHeader: {
        backgroundColor: THEME_COLORS.secondary,
        paddingVertical: 40,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    profileLetter: {
        fontSize: 32,
        fontWeight: 'bold',
        color: THEME_COLORS.secondary,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    menuContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 30,
        backgroundColor: '#F5F5F5',
    },
    activeMenuItem: {
        backgroundColor: '#E3F2FD',
    },
    logoutMenuItem: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        marginTop: 10,
    },
    iconContainer: {
        width: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 20,
        color: TEXT_COLORS.primary,

    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '400',
        color: TEXT_COLORS.primary,
        flex: 1,
    },
    activeMenuLabel: {
        color: THEME_COLORS.secondary,
        fontWeight: '600',
    },
});

export default MenuScreen;
