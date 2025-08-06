import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView
} from "react-native";
import { useSelector } from "react-redux";
import { useToast } from "react-native-toast-notifications";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/FontAwesome5";
import { UserTypeHook } from "../../../shared/hooks/userTypeHook";
import { roles } from "../../../shared/utils/appRoles";
import { useAddMemberMutation, useDeleteMemberMutation, useEditMemberMutation, useGetAllDevicesQuery, useGetDeviceByCodeQuery, useGetDeviceByIdQuery } from "../../device/store/deviceEndPoint";
import { TEXT_COLORS, THEME_COLORS } from "../../../globalStyle/GlobalStyles";
import { BufIcon, CowIcon } from "../../../icons/SvgIcons";

import { ShowToster } from "../../../shared/components/ShowToster";
const initialMemberState = {
    CODE: "",
    MILKTYPE: "C",
    COMMISSIONTYPE: "N",
    MEMBERNAME: "",
    CONTACTNO: "",
    STATUS: "A"
};

const MemberList = () => {
    const toast = useToast();
    const userInfo = useSelector((state: any) => state.userInfoSlice.userInfo);
    const userType = UserTypeHook();
    const isAdmin = userType === roles.ADMIN;
    const isDairy = userType === roles.DAIRY;
    const isDevice = userType === roles.DEVICE;

    const deviceid = userInfo?.deviceid;
    const dairyCode = userInfo?.dairyCode;

    const { data: allDevices = [] } = useGetAllDevicesQuery(undefined, { skip: !isAdmin });
    const { data: dairyDevices = [], isLoading: isDairyLoading } = useGetDeviceByCodeQuery(dairyCode, { skip: !isDairy || !dairyCode });
    const { data: deviceData, isLoading: isDeviceLoading } = useGetDeviceByIdQuery(deviceid, { skip: !isDevice });
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : deviceData ? [deviceData] : [];

    const [deviceCode, setDeviceCode] = useState("");
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [memberForm, setMemberForm] = useState(initialMemberState);
    const [formLoading, setFormLoading] = useState(false);
    const [search, setSearch] = useState("");

    const [addMember] = useAddMemberMutation();
    const [editMember] = useEditMemberMutation();
    const [deleteMember] = useDeleteMemberMutation();

    const selectedDevice = deviceList.find((dev: any) => dev.deviceid === deviceCode);
    const members = selectedDevice?.members || [];

    useEffect(() => {
        if (isDevice && deviceid) setDeviceCode(deviceid);
    }, [isDevice, deviceid]);

    const openAddModal = () => {
        setIsEdit(false);
        setMemberForm(initialMemberState);
        setShowAddEditModal(true);
    };

    const openEditModal = (member: any) => {
        setIsEdit(true);
        setMemberForm({ ...member });
        setShowAddEditModal(true);
    };

    const handleAddEditSubmit = async () => {
        // Validate CODE
        const codeNum = Number(memberForm.CODE);
        if (!/^[0-9]{1,4}$/.test(memberForm.CODE) || isNaN(codeNum) || codeNum < 1 || codeNum > 9999) {
            ShowToster(toast, "Member Code must be 1-4 digits", "", "danger");
            return;
        }
        // Validate CONTACTNO if provided
        if (memberForm.CONTACTNO && !/^\d{10}$/.test(memberForm.CONTACTNO)) {
            ShowToster(toast, "Contact No must be exactly 10 digits", "", "danger");
            return;
        }

        setFormLoading(true);
        try {
            const payload = { deviceid: deviceCode, ...memberForm, CODE: codeNum };
            if (isEdit) {

                let res = await editMember(payload).unwrap();
                ShowToster(toast, "Member updated successfully", "", "success");
            } else {
                let res1 = await addMember(payload).unwrap();
                ShowToster(toast, "Member added successfully", "", "success");
            }
            setShowAddEditModal(false);
        } catch (err: any) {
            ShowToster(toast, err?.data?.error || "Error saving member", "", "danger");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = (member: any) => {
        Alert.alert(
            "Delete Member",
            `Are you sure you want to delete member #${member.CODE}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const payload = { deviceid: deviceCode, CODE: member.CODE };
                            await deleteMember(payload).unwrap();
                            ShowToster(toast, "Member deleted successfully", "", "success");
                        } catch (err: any) {
                            ShowToster(toast, err?.data?.error || "Error deleting member", "", "danger");
                        }
                    }
                }
            ]
        );
    };

    const filteredMembers = useMemo(() => {
        if (!search.trim()) return members;

        const query = search.toLowerCase();
        return members.filter((m: any) =>
            m.CODE?.toString().toLowerCase().includes(query) ||
            m.CONTACTNO?.toLowerCase().includes(query) ||
            (m.MILKTYPE === "C" ? "cow" : "buffalo").toLowerCase().includes(query) ||
            `member ${m.CODE.toString().padStart(4, "0")}`.toLowerCase().includes(query)
        );
    }, [search, members]);
    const renderMember = ({ item }: { item: any }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberTopRow}>
                <Text style={styles.memberCode}>#{item.CODE}</Text>
                <Text
                    style={[
                        styles.milkTypeBadge,
                        item.MILKTYPE === "C" ? styles.cowBadge : styles.buffaloBadge
                    ]}
                >
                    {item.MILKTYPE === "C" ? "COW" : "BUFFALO"}
                </Text>
            </View>
            <Text style={styles.memberName}>MEMBER {item.CODE.toString().padStart(4, "0")}</Text>
            <Text style={styles.memberDetail}>Commission: <Text style={styles.bold}>{item.COMMISSIONTYPE}</Text></Text>
            <Text style={styles.memberDetail}>Contact: {item.CONTACTNO || "N/A"}</Text>
            <Text style={styles.memberDetail}>
                Status:{" "}
                <Text
                    style={[
                        styles.statusText,
                        item.STATUS === "A" ? styles.activeStatus : styles.inactiveStatus
                    ]}
                >
                    {item.STATUS === "A" ? "Active" : "Deactive"}
                </Text>
            </Text>

            <View style={styles.memberActions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                    <Icon name="edit" size={18} color={THEME_COLORS.secondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                    <Icon name="trash" size={18} color="#f43f5e" />
                </TouchableOpacity>
            </View>
        </View>
    );


    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>Members List</Text>

                {deviceCode && <TouchableOpacity
                    style={styles.addButton}
                    onPress={openAddModal}
                >
                    <Icon name="plus" size={16} color="#fff" />
                    <Text style={styles.addButtonText}> Add Member</Text>
                </TouchableOpacity>}
            </View>
            <View>
                <ScrollView>
                    <View style={styles.summaryContainer}>
                        <View style={[styles.summaryCard, { backgroundColor: "#e0f2fe" }]}>
                            <CowIcon />
                            <Text style={styles.summaryValue}>{members.filter((m: any) => m.MILKTYPE === "C").length}</Text>
                            <Text style={styles.summaryLabel}>Cow Milk Members</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: "#f3e8ff" }]}>
                            <BufIcon />
                            <Text style={styles.summaryValue}>{members.filter((m: any) => m.MILKTYPE === "B").length}</Text>
                            <Text style={styles.summaryLabel}>Buffalo Milk Members</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: "#d1fae5" }]}>
                            <Icon name="users" size={28} color="#059669" />
                            <Text style={styles.summaryValue}>{members.length}</Text>
                            <Text style={styles.summaryLabel}>Total Members</Text>
                        </View>
                    </View>
                    {!isDevice && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>
                                <Icon name="desktop" size={18} color={THEME_COLORS.secondary} /> Select Device</Text>

                            <Picker
                                selectedValue={deviceCode}
                                onValueChange={(value) => setDeviceCode(value)}
                                style={styles.pickerModern}

                            >
                                <Picker.Item label="Select Device" value="" />
                                {deviceList.map((dev: any) => (
                                    <Picker.Item key={dev.deviceid} label={dev.deviceid} value={dev.deviceid} />
                                ))}
                            </Picker>
                        </View>


                    )}
                    <View style={styles.searchBar}>
                        <Icon name="search" size={16} color={TEXT_COLORS.secondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholderTextColor={TEXT_COLORS.primary}

                            placeholder="Search by member code, contact, or milk type..."
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {(isDairyLoading || isDeviceLoading) ? (
                        <ActivityIndicator size="large" color="#007bff" />
                    ) : !deviceCode ? (
                        <Text style={styles.noDeviceText}>Please select a device to view members.</Text>
                    ) : (
                        <>
                            <FlatList
                                data={filteredMembers}
                                keyExtractor={(item) => item.CODE.toString()}
                                renderItem={renderMember}
                                contentContainerStyle={styles.listContainer}

                                ListEmptyComponent={
                                    <Text style={styles.noMembersText}>No members found for this device.</Text>
                                }
                            />
                        </>
                    )}
                </ScrollView>
            </View>
            {/* Add/Edit Member Modal */}
            <Modal
                visible={showAddEditModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAddEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView
                            contentContainerStyle={styles.modalScrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.modalTitle}>
                                {isEdit ? "Edit Member" : "Add Member"}
                            </Text>

                            {/* Member Code */}
                            <Text style={styles.pickerLabel}>Member Code</Text>
                            <TextInput
                                placeholder="Member Code (1-4 digits)"
                                keyboardType="numeric"
                                value={memberForm.CODE.toString()}
                                onChangeText={(value) =>
                                    setMemberForm((prev) => ({ ...prev, CODE: value }))
                                }
                                editable={!isEdit}
                                maxLength={4}

                                style={[styles.input, isEdit && styles.disabledInput]}
                            />

                            {/* Member Name */}
                            <Text style={styles.pickerLabel}>Member Name</Text>

                            <TextInput
                                placeholder="Member Name"
                                value={memberForm.MEMBERNAME}
                                onChangeText={(value) =>
                                    setMemberForm((prev) => ({ ...prev, MEMBERNAME: value }))
                                }
                                style={styles.input}
                            />

                            {/* Contact Number */}
                            <Text style={styles.pickerLabel}>Contact Number</Text>

                            <TextInput
                                placeholder="Contact No (10 digits)"
                                keyboardType="numeric"
                                value={memberForm.CONTACTNO}
                                onChangeText={(value) =>
                                    setMemberForm((prev) => ({
                                        ...prev,
                                        CONTACTNO: value.replace(/\D/g, ""),
                                    }))
                                }
                                style={styles.input}
                            />

                            {/* Milk Type */}
                            <Text style={styles.pickerLabel}>Milk Type</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={memberForm.MILKTYPE}
                                    onValueChange={(value) =>
                                        setMemberForm((prev) => ({
                                            ...prev,
                                            MILKTYPE: value,
                                        }))
                                    }
                                >
                                    <Picker.Item label="Cow" value="C" />
                                    <Picker.Item label="Buffalo" value="B" />
                                </Picker>
                            </View>

                            {/* Commission Type */}
                            <Text style={styles.pickerLabel}>Commission Type</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={memberForm.COMMISSIONTYPE}
                                    onValueChange={(value) =>
                                        setMemberForm((prev) => ({
                                            ...prev,
                                            COMMISSIONTYPE: value,
                                        }))
                                    }
                                >
                                    <Picker.Item label="N" value="N" />
                                    {[...Array(8).keys()].map((num) => (
                                        <Picker.Item
                                            key={num + 1}
                                            label={`${num + 1}`}
                                            value={`${num + 1}`}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            {/* Status */}
                            <Text style={styles.pickerLabel}>Status</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={memberForm.STATUS}
                                    onValueChange={(value) =>
                                        setMemberForm((prev) => ({
                                            ...prev,
                                            STATUS: value,
                                        }))
                                    }
                                >
                                    <Picker.Item label="Active" value="A" />
                                    <Picker.Item label="Deactive" value="D" />
                                </Picker>
                            </View>
                        </ScrollView>

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setShowAddEditModal(false)}
                                disabled={formLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleAddEditSubmit}
                                disabled={formLoading}
                            >
                                {formLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>
                                        {isEdit ? "Update" : "Add"}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME_COLORS.primary,
        padding: 16,
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
    pickerModern: { color: TEXT_COLORS.primary },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
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
    summaryContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 12,
        paddingHorizontal: 8
    },
    summaryCard: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: "700",
        marginVertical: 4
    },
    summaryLabel: {
        fontSize: 12,
        color: "#555"
    },
    pickerContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 12,
        borderColor: "#ccc",
        borderWidth: 1,
    },

    listContainer: {
        paddingVertical: 10,
    },
    memberCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 12,
        marginVertical: 6,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
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
    memberTopRow: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    memberCode: {
        backgroundColor: THEME_COLORS.secondary,
        color: "#fff",              // White text
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: "bold",
        alignSelf: "flex-start"
    },
    bold: {
        fontWeight: "bold",
        color: "#111827" // optional: dark text color
    },
    milkTypeBadge: {
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        color: "#fff",
        fontWeight: "bold"
    },
    cowBadge: {
        backgroundColor: "#6c757d"
    },
    buffaloBadge: {
        backgroundColor: "#6c757d"
    },
    memberName: {
        fontSize: 16,
        fontWeight: "700",
        marginVertical: 4
    },
    memberDetail: {
        fontSize: 14,
        color: "#555"
    },
    statusText: {
        fontWeight: "700"
    },
    activeStatus: {
        color: "#16a34a"
    },
    inactiveStatus: {
        color: "#dc2626"
    },
    memberActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 8
    },
    actionButton: {
        marginHorizontal: 4
    },

    modalContainer: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },



    label: {
        fontWeight: "bold",
        marginTop: 8,
    },




    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    noDeviceText: {
        textAlign: "center",
        color: "#888",
        marginTop: 20,
    },
    noMembersText: {
        textAlign: "center",
        color: "#888",
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent background
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: THEME_COLORS.primary,
        borderRadius: 16,
        width: "90%",
        maxHeight: "85%",
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    modalScrollContent: {
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
        color: "#333",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        fontSize: 16,
        backgroundColor: "#fff",
    },
    disabledInput: {
        backgroundColor: "#e5e7eb",
        color: "#9ca3af",
    },
    pickerLabel: {
        fontSize: 14,
        color: THEME_COLORS.secondary,
        marginBottom: 4,
    },
    pickerWrapper: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        marginBottom: 12,
        overflow: "hidden",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: "#e5e7eb",
    },
    cancelButtonText: {
        color: "#374151",
        fontWeight: "600",
    },
    saveButton: {
        backgroundColor: THEME_COLORS.secondary,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
});

export default MemberList;
