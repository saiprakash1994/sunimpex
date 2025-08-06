import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { THEME_COLORS, TEXT_COLORS } from '../../../globalStyle/GlobalStyles';
import { roles } from '../../../shared/utils/appRoles';
import { clearUserInfo } from '../../authentication/store/userInfoSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import AddDairy from '../../dairy/pages/AddDairy';
import AddDevice from '../../device/pages/AddDevice';
import { LogoutIcon } from '../../../icons/SvgIcons';
import { AppConstants, clearLocalStorage, getItemFromLocalStorage } from '../../../shared/utils/localStorage';
import { persistor } from '../../../store/store';
import { useLogoutMutation } from '../../authentication/store/authenticateEndPoints';
import { authApi } from '../../authentication/store/authenticateApi';

type RootStackParamList = {
    login: undefined;
};
const ProfileScreen = () => {
    const userInfo = useSelector((state: any) => state.userInfoSlice.userInfo);
    const role = userInfo?.role;
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [logout] = useLogoutMutation();

    const [modalVisible, setModalVisible] = useState(false);
    console.log(role, roles.DEVICE)
    let name = '';
    let email = '';
    let avatarIcon = 'user-circle';
    let roleLabel: string = '';
    if (role === roles.DAIRY) {
        name = userInfo?.dairyName || 'Dairy User';
        avatarIcon = 'bottle-water';
        roleLabel = 'Dairy';
    } else if (role === roles.DEVICE) {
        name = userInfo?.deviceName || 'Device User';
        avatarIcon = 'microchip';
        roleLabel = 'Device';
    }
    else if (role === roles.ADMIN) {
        name = userInfo?.deviceName || 'Admin';
        avatarIcon = 'circle-user';
        roleLabel = 'Admin';
    } else {
        name = 'User';
        roleLabel = 'User';
    }

    const handleLogout = async (): Promise<void> => {
        try {
            // Call backend logout if you want to invalidate the refresh token
            await logout({ refreshToken: await getItemFromLocalStorage(AppConstants.refreshToken) }).unwrap();

            // Clear Redux Persist (if you use it)
            if (persistor) {
                await persistor.purge();
            }

            // Clear local storage
            await clearLocalStorage();

            // Clear Redux state
            dispatch(clearUserInfo());
            dispatch(authApi.util.resetApiState());

            // Navigate to login screen
            // navigation.reset({
            //     index: 0,
            //     routes: [{ name: "login" }],
            // });
        } catch (err) {
            console.error("Logout error:", err);

            // Even if backend logout fails, still clear local data
            if (persistor) {
                await persistor.purge();
            }
            await clearLocalStorage();
            dispatch(clearUserInfo());
            dispatch(authApi.util.resetApiState());
            // navigation.reset({
            //     index: 0,
            //     routes: [{ name: "login" }],
            // });
        }
    };


    const handleEditProfile = () => {
        setModalVisible(true);
    };
    const handleModalClose = () => {
        setModalVisible(false);
        // Optionally refresh user info here
    };

    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <Icon name={avatarIcon} size={80} color={THEME_COLORS.secondary} />
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
            <View style={styles.infoRow}>
                <Icon name="id-badge" size={18} color={THEME_COLORS.secondary} style={{ marginRight: 8 }} />
                <Text style={styles.role}>{roleLabel}</Text>
            </View>
            {(role === roles.DAIRY || role === roles.ADMIN || role === roles.DEVICE) && (
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                    <Icon name="edit" size={18} color={TEXT_COLORS.whiteColor} style={{ marginRight: 8 }} />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogoutIcon size={18} color={TEXT_COLORS.whiteColor} style={{ marginRight: 8 }} />
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
            <Modal
                visible={modalVisible}
                onRequestClose={handleModalClose}
                animationType="slide"
                transparent={false}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: THEME_COLORS.primary }}>
                    {(role === roles.DAIRY || role === roles.ADMIN) && userInfo?.dairyCode && (
                        <AddDairy dairyCode={userInfo.dairyCode} onClose={handleModalClose} />
                    )}
                    {role === roles.DEVICE && userInfo?.deviceid && (
                        <AddDevice deviceId={userInfo.deviceid} onClose={handleModalClose} />
                    )}
                </ScrollView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME_COLORS.primary,
        padding: 24,
    },
    avatarContainer: {
        backgroundColor: '#fff',
        borderRadius: 60,
        padding: 16,
        marginBottom: 24,
        elevation: 3,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: TEXT_COLORS.primary,
        marginBottom: 8,
    },
    email: {
        fontSize: 16,
        color: TEXT_COLORS.secondary,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    role: {
        fontSize: 16,
        color: THEME_COLORS.secondary,
        textTransform: 'capitalize',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME_COLORS.secondary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 8,
    },
    editButtonText: {
        color: TEXT_COLORS.whiteColor,
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME_COLORS.secondary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 16,
    },
    logoutButtonText: {
        color: TEXT_COLORS.whiteColor,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ProfileScreen; 