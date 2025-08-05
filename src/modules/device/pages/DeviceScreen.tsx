import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useDispatch, useSelector } from "react-redux";
import { UserTypeHook } from "../../../shared/hooks/userTypeHook";
import { useDeleteDeviceMutation, useGetAllDevicesQuery, useGetDeviceByCodeQuery } from "../store/deviceEndPoint";
import { roles } from "../../../shared/utils/appRoles";
import { useGetAllDairysQuery } from "../../dairy/store/dairyEndPoint";
import { deleteDevice, setDevices } from "../store/deviceSlice";
import { TEXT_COLORS, THEME_COLORS } from "../../../globalStyle/GlobalStyles";

const { width } = Dimensions.get("window");
type RootStackParamList = {
    deviceadd: { deviceId?: string } | undefined;
};
const DeviceScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const dispatch = useDispatch();
    const userType = UserTypeHook();
    const userInfo = useSelector((state: any) => state.userInfoSlice.userInfo);

    const {
        data: allDevices = [],
        isLoading: isAllLoading,
        isError: isAllError,
    } = useGetAllDevicesQuery(undefined, { skip: userType !== roles.ADMIN });

    const {
        data: devicesByCode = [],
        isLoading: isDevicesByCodeLoading,
        isError: isDevicesByCodeError,
    } = useGetDeviceByCodeQuery(userInfo?.dairyCode || "", {
        skip: userType !== roles.DAIRY,
    });

    const { data: dairies = [] } = useGetAllDairysQuery(undefined, {
        skip: userType !== roles.ADMIN,
    });

    const [deleteDeviceById] = useDeleteDeviceMutation();

    const [selectedDairyCode, setSelectedDairyCode] = useState("");
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const devices =
        userType === roles.ADMIN ? allDevices : devicesByCode;

    const isLoading =
        userType === roles.ADMIN ? isAllLoading : isDevicesByCodeLoading;

    const isError =
        userType === roles.ADMIN ? isAllError : isDevicesByCodeError;

    useEffect(() => {
        if (userType === roles.ADMIN && allDevices && !isAllLoading && !isAllError) {
            dispatch(setDevices(allDevices));
        }
    }, [allDevices, isAllLoading, isAllError]);

    useEffect(() => {
        if (
            userType === roles.DAIRY &&
            devicesByCode &&
            !isDevicesByCodeLoading &&
            !isDevicesByCodeError
        ) {
            dispatch(setDevices(devicesByCode));
        }
    }, [devicesByCode, isDevicesByCodeLoading, isDevicesByCodeError]);

    const filteredDevices = useMemo(() => {
        const q = search.toLowerCase();
        return devices.filter((device: any) => {
            const matchesSearch =
                device?.deviceid?.toLowerCase().includes(q) ||
                device?.email?.toLowerCase().includes(q);
            const matchesDairy =
                !selectedDairyCode || device?.dairyCode === selectedDairyCode;
            return matchesSearch && matchesDairy;
        });
    }, [devices, search, selectedDairyCode]);

    const paginatedDevices = filteredDevices.slice(
        0,
        page * pageSize
    );

    const handleLoadMore = () => {
        if (paginatedDevices.length < filteredDevices.length) {
            setPage((prev) => prev + 1);
        }
    };

    const confirmDelete = (deviceId: string) => {
        Alert.alert(
            "Delete Device",
            "Are you sure you want to delete this device?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDelete(deviceId),
                },
            ]
        );
    };

    const handleDelete = async (deviceId: string) => {
        try {
            await deleteDeviceById(deviceId).unwrap();
            dispatch(deleteDevice(deviceId));
            Alert.alert("Success", "Device deleted successfully.");
        } catch (err) {
            console.error("Delete error:", err);
            Alert.alert("Error", "Failed to delete device.");
        }
    };

    const renderDeviceCard = ({ item, index }: any) => {
        const status = item?.status || "Unknown";

        let statusColor = "#b0b7c3";
        if (status.toLowerCase() === "active") statusColor = "#27ae60"; // Green
        else if (status.toLowerCase() === "deactive") statusColor = "#e74c3c"; // Red
        else if (status.toLowerCase() === "pending") statusColor = "#f1c40f"; // Yellow

        return (
            <View style={styles.card}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    {/* Device Icon */}
                    <View style={styles.deviceIcon}>
                        <Icon name="desktop" size={24} color={THEME_COLORS.secondary} />
                    </View>

                    {/* Device Info */}
                    <View style={styles.deviceInfo}>
                        <Text style={styles.deviceId}>{item.deviceid}</Text>
                        <View style={styles.dairyRow}>
                            <Icon name="building" size={12} color="#555" />
                            <Text style={styles.dairyCode}> {item.dairyCode}</Text>
                        </View>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Email Row */}
                <View style={styles.emailContainer}>
                    <Text style={styles.emailLabel}>EMAIL</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate("deviceadd", { deviceId: item.deviceid })}
                    >
                        <Icon name="edit" size={15} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmDelete(item.deviceid)}
                    >
                        <Icon name="trash" size={15} color="#b91c1c" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Device Management</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate("deviceadd")}
                >
                    <Icon name="plus" size={16} color="#fff" />
                    <Text style={styles.addButtonText}> Add Device</Text>
                </TouchableOpacity>
            </View>

            {userType === roles.ADMIN && (
                <View style={styles.dropdown}>
                    <Text style={styles.dropdownLabel}> <Icon name="building" size={18} color={THEME_COLORS.secondary} /> Select Dairy:</Text>
                    <FlatList
                        data={dairies}
                        horizontal
                        keyExtractor={(item) => item.dairyCode}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dairyListContainer}
                        renderItem={({ item }) => {
                            const isActive = selectedDairyCode === item.dairyCode;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.dairyButton,
                                        isActive && styles.dairyButtonActive,
                                    ]}
                                    onPress={() => setSelectedDairyCode(item.dairyCode)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.dairyButtonText,
                                            isActive && styles.dairyButtonTextActive,
                                        ]}
                                    >
                                        {item.dairyName} ({item.dairyCode})
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            )}


            <View style={styles.searchBar}>
                <Icon name="search" size={16} color={TEXT_COLORS.secondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholderTextColor={TEXT_COLORS.primary}

                    placeholder="Search by device ID or email..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={THEME_COLORS.secondary} />
            ) : (
                <FlatList
                    data={paginatedDevices}
                    keyExtractor={(item) => item._id}
                    renderItem={renderDeviceCard}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                />
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: THEME_COLORS.primary,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    addButton: {
        flexDirection: "row",
        backgroundColor: THEME_COLORS.secondary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
        elevation: 3, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    addButtonText: {
        color: "#fff",
        marginLeft: 6,
        fontWeight: "600",
        fontSize: 14,
    },
    dropdown: {
        marginVertical: 10,
    },
    dropdownLabel: {
        fontSize: 15, fontWeight: "bold", marginBottom: 6, color: THEME_COLORS.secondary, flexDirection: "row", alignItems: "center"
    },
    dairyListContainer: {
        paddingHorizontal: 10,
    },
    dairyButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#f0f4f8",
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3, // Android shadow
    },
    dairyButtonActive: {
        backgroundColor: THEME_COLORS.secondary, // Active background
    },
    dairyButtonText: {
        fontSize: 14,
        color: "#374151",
        fontWeight: "500",
    },
    dairyButtonTextActive: {
        color: "#ffffff", // Active text color
        fontWeight: "600",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderColor: "#ccc",
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: TEXT_COLORS.primary
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#d0d7de",
        padding: 12,
        marginVertical: 4,
        marginHorizontal: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    deviceIcon: {
        backgroundColor: "#e6f0ff",
        borderRadius: 8,
        padding: 8,
        marginRight: 10,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceId: {
        fontSize: 16,
        fontWeight: "600",
        color: THEME_COLORS.secondary,
    },
    dairyRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    dairyCode: {
        fontSize: 12,
        color: "#555",
    },
    statusBadge: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    emailContainer: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 8,
        marginVertical: 8,
    },
    emailLabel: {
        fontSize: 10,
        color: "#6c757d",
        marginBottom: 2,
    },
    email: {
        fontSize: 14,
        color: "#343a40",
    },
    cardActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    editButton: {
        backgroundColor: THEME_COLORS.secondary,
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    deleteButton: {
        backgroundColor: "#fee2e2",
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
    },

});


export default DeviceScreen;
