import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Platform,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useGetAllDevicesQuery } from "../../device/store/deviceEndPoint";
import { useDeleteDairyMutation, useGetAllDairysQuery } from "../store/dairyEndPoint";
import { useToast } from "react-native-toast-notifications";
import { ShowToster } from "../../../shared/components/ShowToster";
import { DairyIcon, DeviceIcon } from "../../../icons/SvgIcons";
import { TEXT_COLORS, THEME_COLORS } from "../../../globalStyle/GlobalStyles";
import { ScrollView } from "react-native-gesture-handler";
type RootStackParamList = {
    dairyadd: { dairyCode?: string } | undefined;
};
const DairyPage = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const toast = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const { data: dairies = [], isLoading, isError } = useGetAllDairysQuery("");
    const { data: allDevices = [] } = useGetAllDevicesQuery("");
    const [deleteDairy] = useDeleteDairyMutation();
    const handleDelete = async (id: any) => {
        Alert.alert(
            "Delete Dairy",
            "Are you sure you want to delete this dairy?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDairy(id).unwrap();
                            ShowToster(toast, "Dairy deleted successfully!", "", "success");
                        } catch (err) {
                            console.error("Delete error:", err);
                            ShowToster(toast, "Failed to delete dairy.", "", "error");
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const getDeviceCountForDairy = (dairyCode: any) => {
        return allDevices.filter((device: any) => device.dairyCode === dairyCode).length;
    };

    const totalDevices = allDevices.length;
    const totalMembers = allDevices.reduce((total: any, device: any) => {
        return total + (device.members ? device.members.length : 0);
    }, 0);

    const filteredDairies = dairies.filter((dairy: any) => {
        const q = searchTerm.toLowerCase();
        return (
            dairy.dairyCode?.toLowerCase().includes(q) ||
            dairy.dairyName?.toLowerCase().includes(q) ||
            dairy.email?.toLowerCase().includes(q)
        );
    });

    const renderItem = ({ item, index }: any) => (
        <View style={styles.dairyRow}>
            <View style={styles.dairyRowLeft}>
                <View style={styles.dairyAvatar}>
                    <Text style={styles.avatarText}>{item.dairyName?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.dairyInfo}>
                    <Text style={styles.dairyName}>{item.dairyName}</Text>
                    <Text style={styles.dairyCode}>Code: {item.dairyCode}</Text>
                    <Text style={styles.dairyEmail}><Icon name="envelope" size={12} color={THEME_COLORS.secondary} /> {item.email}</Text>
                </View>
            </View>
            <View style={styles.dairyRowRight}>
                <Text style={styles.deviceCount}>
                    {getDeviceCountForDairy(item.dairyCode)} Devices
                </Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => navigation.navigate("dairyadd", { dairyCode: item.dairyCode })}
                    >
                        <Icon name="edit" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item.dairyCode)}
                    >
                        <Icon name="trash" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>

            <View>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Dairy Management</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate("dairyadd")}
                    >
                        <Icon name="plus" size={16} color="#fff" />
                        <Text style={styles.addButtonText}> Add Dairy</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <DairyIcon color={THEME_COLORS.secondary} height={30} width={30} fill={TEXT_COLORS.whiteColor} />
                        <Text style={styles.statValue}>{dairies.length}</Text>
                        <Text style={styles.statLabel}>Total Dairies</Text>
                    </View>
                    <View style={styles.statCard}>
                        <DeviceIcon color={THEME_COLORS.secondary} height={30} width={30} fill={TEXT_COLORS.whiteColor} />
                        <Text style={styles.statValue}>
                            {allDevices.filter((d: any) => getDeviceCountForDairy(d.dairyCode) > 0).length}
                        </Text>
                        <Text style={styles.statLabel}>Dairies with Devices</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Icon name="desktop" size={24} color={THEME_COLORS.secondary} />
                        <Text style={styles.statValue}>{totalDevices}</Text>
                        <Text style={styles.statLabel}>Total Devices</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Icon name="users" size={24} color={THEME_COLORS.secondary} />
                        <Text style={styles.statValue}>{totalMembers}</Text>
                        <Text style={styles.statLabel}>Total Members</Text>
                    </View>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Icon name="search" size={16} color={TEXT_COLORS.secondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search dairies..."
                        placeholderTextColor={TEXT_COLORS.primary}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                {/* Dairy List */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={THEME_COLORS.secondary} style={styles.loading} />
                ) : isError ? (
                    <Text style={styles.errorText}>Error loading dairies. Please try again.</Text>
                ) : (
                    <FlatList
                        data={filteredDairies}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        ListEmptyComponent={<Text style={styles.noDataText}>No dairies found.</Text>}
                    />
                )}
            </View>
        </ScrollView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME_COLORS.primary,
        padding: 16,
    },

    /** Header */
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
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

    /** Stats */
    statsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    statCard: {
        width: "48%",
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginVertical: 6,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#888",
    },

    /** Search bar */
    searchContainer: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 10,
        alignItems: "center",
        paddingHorizontal: 12,
        marginBottom: 14,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 14,
        marginLeft: 8,
        color: TEXT_COLORS.primary
    },

    /** Dairy Row */
    dairyRow: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 14,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: THEME_COLORS.secondary,
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    dairyRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    dairyAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME_COLORS.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    avatarText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    dairyInfo: {
        flex: 1,
    },
    dairyName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    dairyCode: {
        fontSize: 13,
        color: "#555",
    },
    dairyEmail: {
        fontSize: 12,
        color: "#888",
    },
    dairyRowRight: {
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    deviceCount: {
        fontSize: 12,
        color: "#4CAF50",
        marginBottom: 6,
        fontWeight: "500",
    },

    /** Action Buttons */
    actionButtons: {
        flexDirection: "row",
        gap: 4,
    },
    actionButton: {
        padding: 6,
        borderRadius: 6,
    },
    editButton: {
        backgroundColor: THEME_COLORS.secondary,
    },
    deleteButton: {
        backgroundColor: "#F44336",
    },

    /** Loading and Errors */
    loading: {
        marginTop: 32,
    },
    errorText: {
        color: "red",
        textAlign: "center",
        marginTop: 20,
        fontSize: 14,
    },
    noDataText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 14,
        color: "#999",
    },
});


export default DairyPage;
