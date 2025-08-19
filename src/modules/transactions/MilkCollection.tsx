import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    StyleSheet,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSelector } from "react-redux";

import {
    useAddRecordMutation,
    useUpdateRecordMutation,
    useGetRecordsByDateShiftQuery,
} from "./recordApiSlice";
import {
    useGetAllDevicesQuery,
    useGetDeviceByCodeQuery,
    useGetDeviceByIdQuery,
} from "../device/store/deviceEndPoint";
import { UserTypeHook } from "../../shared/hooks/userTypeHook";
import { roles } from "../../shared/utils/appRoles";
import { useToast } from "react-native-toast-notifications";
import { ShowToster } from "../../shared/components/ShowToster";
import Icon from "react-native-vector-icons/FontAwesome5";
import { TEXT_COLORS, THEME_COLORS } from "../../globalStyle/GlobalStyles";
type RecordItem = {
    _id: string;
    CODE: string | number;
    MILKTYPE: string;
    SAMPLEDATE: string;
    SHIFT: string;
    FAT: number;
    SNF: number;
    CLR: number;
    QTY: number;
    RATE: number;
    AMOUNT: number;
    INCENTIVEAMOUNT: number;
    TOTAL: number;
    ANALYZERMODE: string;
    WEIGHTMODE: string;
    DEVICEID: string,
    RECORDTYPE: string
};
type RecordType = {
    id: string;
    code: string;
    name: string;
    milktype: string;
    fat: string;
    snf: string;
    clr: number;
    water: number;
    rate: number;
    qty: number;
    incentive: number;
    amount: number;
    totalAmount: number;
};



export default function MilkCollection() {
    const userInfo = useSelector((state: any) => state?.userInfoSlice?.userInfo);
    const userType = UserTypeHook();
    const isDairy = userType === roles?.DAIRY;
    const isDevice = userType === roles?.DEVICE;
    const isAdmin = userType === roles?.ADMIN;

    const deviceid = userInfo?.deviceid;
    const dairyCode = userInfo?.dairyCode;
    const toast = useToast()
    const { data: allDevices = [] } = useGetAllDevicesQuery(undefined, { skip: !isAdmin });

    // Fetch devices
    const { data: dairyDevices = [] } = useGetDeviceByCodeQuery(dairyCode, {
        skip: !isDairy || !dairyCode,
    });
    const { data: deviceData } = useGetDeviceByIdQuery(deviceid, {
        skip: !isDevice,
    });
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : deviceData ? [deviceData] : [];

    const [deviceCode, setDeviceCode] = useState("");
    const [commissionRate, setCommissionRate] = useState(0);
    const [sampleDate, setSampleDate] = useState("");
    const [sampleShift, setSampleShift] = useState("MORNING");
    const [isEditRecord, setIsEditRecord] = useState(false);
    const [record, setRecord] = useState<RecordType>({
        id: "",
        code: "",
        name: "",
        milktype: "",
        fat: "",
        snf: "",
        clr: 0,
        water: 0,
        rate: 0,
        qty: 0,
        incentive: 0,
        amount: 0,
        totalAmount: 0,
    });
    const [member, setMember] = useState<any>({});

    const [addRecord] = useAddRecordMutation();
    const [updateRecord] = useUpdateRecordMutation();

    // Fetch records for current shift
    const { data: shiftData = [], isSuccess: isShiftSuccess } = useGetRecordsByDateShiftQuery(
        {
            devicecode: deviceCode,
            date: sampleDate,
            shift: sampleShift,
        },
        { skip: !(deviceCode && sampleDate && sampleShift) }

    );
    console.log(shiftData, 'sai')
    // Members of selected device
    const selectedDevice = deviceList?.find((dev: any) => dev?.deviceid === deviceCode);
    const members = selectedDevice?.members || [];
    const serverSettings = selectedDevice?.serverSettings || {};
    const fatBufTable = selectedDevice?.fatBufTable || [];
    const fatCowTable = selectedDevice?.fatCowTable || [];

    const snfCowTable = selectedDevice?.snfCowTable || {};
    const snfBufTable = selectedDevice?.snfBufTable || {};
    useEffect(() => {
        if (isDevice && deviceid) setDeviceCode(deviceid);
    }, [isDevice, deviceid]);
    useEffect(() => {
        if (isShiftSuccess && shiftData) {
            console.log("Fetched Shift Data:", shiftData);

            console.log("server settings", serverSettings);
        }
    }, [isShiftSuccess, shiftData]);
    // Default date + shift
    useEffect(() => {
        const today = new Date();
        const formatted = today?.toLocaleDateString("en-GB");
        setSampleDate(formatted);
        const hours = today?.getHours();
        setSampleShift(hours < 12 ? "MORNING" : "EVENING");
    }, []);

    useEffect(() => {
        const fatNum = parseFloat(record?.fat);
        const snfNum = parseFloat(record?.snf);
        const milktype = record?.milktype;

        if (!fatNum || !milktype) {
            setRecord((prev: any) => ({ ...prev, rate: "" }));
            return;
        }

        const isCow = milktype === "C";
        const mixedMilk = serverSettings?.mixedMilk === "Y";
        const useSnf = isCow
            ? serverSettings?.useCowSnf === "Y"
            : serverSettings?.useBufSnf === "Y";

        const cowTable = useSnf ? snfCowTable : fatCowTable;
        const bufTable = useSnf ? snfBufTable : fatBufTable;

        const getRange = (table: any, isObjectFormat = false) => {
            if (isObjectFormat) {
                // When table is object (used for SNF-based rate charts)
                const { fatMin, fatMax, snfMin, snfMax } = getFatSnfRange(table);
                return { fatMin, fatMax, snfMin, snfMax };
            } else {
                // When table is array (used for FAT-only rate charts)
                const fatList = table?.map((r: any) => r.FAT);
                const snfList = table?.map((r: any) => r.SNF ?? 0);
                return {
                    fatMin: Math?.min(...fatList),
                    fatMax: Math?.max(...fatList),
                    snfMin: Math?.min(...snfList),
                    snfMax: Math?.max(...snfList),
                };
            }
        };

        const cowRange = getRange(cowTable, useSnf);
        const bufRange = getRange(bufTable, useSnf);

        // Default table and range
        let selectedTable = isCow ? cowTable : bufTable;
        let currentRange = isCow ? cowRange : bufRange;

        let withinRange = false;

        if (useSnf) {
            if (!record?.snf || isNaN(snfNum)) {
                setRecord((prev: any) => ({ ...prev, rate: "" }));
                return;
            }

            withinRange =
                fatNum >= currentRange?.fatMin &&
                fatNum <= currentRange?.fatMax &&
                snfNum >= currentRange?.snfMin &&
                snfNum <= currentRange?.snfMax;
        } else {
            withinRange =
                fatNum >= currentRange?.fatMin && fatNum <= currentRange?.fatMax;
        }

        // Mixed milk switching
        if (mixedMilk && !withinRange) {
            selectedTable = isCow ? bufTable : cowTable;
            currentRange = isCow ? bufRange : cowRange;
        }

        const clamp = (val: any, min: any, max: any) => Math.min(Math.max(val, min), max);

        const getFatOnlyRate = (table: any, fatVal: any) => {
            const fatList = table?.map((r: any) => r.FAT);
            const fatMin = Math?.min(...fatList);
            const fatMax = Math?.max(...fatList);
            const clampedFat = clamp(fatVal, fatMin, fatMax);
            return table?.find((r: any) => r?.FAT === clampedFat)?.RATE ?? null;
        };

        const getClampedRate = (table: any, fatVal: any, snfVal: any) => {
            const { fatMin, fatMax, snfMin, snfMax } = getFatSnfRange(table);
            const clampedFat = clamp(fatVal, fatMin, fatMax);
            const clampedSnf = clamp(snfVal, snfMin, snfMax);
            return getMilkRate(table, clampedFat, clampedSnf);
        };

        // Check low/high fat accept flags
        const isLowFatRejected =
            fatNum < currentRange.fatMin && serverSettings?.lowFatAccept !== "Y";
        const isHighFatRejected =
            fatNum > currentRange.fatMax && serverSettings?.highFatAccept !== "Y";
        const isLowSnfRejected =
            useSnf &&
            snfNum < currentRange.snfMin &&
            serverSettings?.lowFatAccept !== "Y";
        const isHighSnfRejected =
            useSnf &&
            snfNum > currentRange.snfMax &&
            serverSettings?.highFatAccept !== "Y";

        if (
            isLowFatRejected ||
            isHighFatRejected ||
            isLowSnfRejected ||
            isHighSnfRejected
        ) {
            setRecord((prev: any) => ({ ...prev, rate: "0.00" }));
            return;
        }

        let finalRate = useSnf
            ? getClampedRate(selectedTable, fatNum, snfNum)
            : getFatOnlyRate(selectedTable, fatNum);

        setRecord((prev: any) => ({
            ...prev,
            rate: finalRate !== null ? Number(finalRate).toFixed(2) : "",
        }));
    }, [record.fat, record.snf, record.milktype]);

    const getFatSnfRange = (table: any) => {
        const fatKeys = Object.keys(table).map(Number);
        const fatMin = Math?.min(...fatKeys);
        const fatMax = Math?.max(...fatKeys);

        const sampleSnfArr = table[fatMin.toFixed(1)];
        const snfValues = sampleSnfArr?.map((item: any) =>
            parseFloat(Object.keys(item)[0])
        );
        const snfMin = Math?.min(...snfValues);
        const snfMax = Math?.max(...snfValues);

        return { fatMin, fatMax, snfMin, snfMax };
    };

    const getMilkRate = (table: any, fat: any, snf: any) => {
        const fatRow = table[fat.toFixed(1)];
        if (!fatRow) return null;

        for (const entry of fatRow) {
            const snfKey = Object.keys(entry)[0];
            if (parseFloat(snfKey) === parseFloat(snf?.toFixed(1))) {
                return entry[snfKey];
            }
        }

        return null;
    };

    // Commission calculation
    useEffect(() => {
        if (serverSettings?.commissionType === "Y") {
            if (member?.COMMISSIONTYPE === "N") {
                setCommissionRate(parseFloat(serverSettings?.normalCommission || 0));
            } else {
                const idx = parseInt(member?.COMMISSIONTYPE) - 1;
                setCommissionRate(parseFloat(serverSettings?.specialCommission?.[idx] || 0));
            }
        } else {
            setCommissionRate(0);
        }
    }, [member]);

    // Amount calculation
    useEffect(() => {
        const { rate, qty } = record;
        const rateNum = parseFloat(rate as any);
        const qtyNum = parseFloat(qty as any);
        let incentive = 0;

        if (!isNaN(rateNum) && !isNaN(qtyNum)) {
            const amount = (rateNum * qtyNum).toFixed(2);
            if (qtyNum) incentive = qtyNum * commissionRate;
            setRecord((prev: any) => ({
                ...prev,
                incentive,
                amount,
            }));
        }
    }, [record.rate, record.qty]);

    const handleChange = (name: string, value: string) => {
        if (name === "code") {
            const selectedMember = members.find((m: any) => m.CODE === value);
            setMember(selectedMember || {});
            setRecord((prev: any) => ({
                ...prev,
                code: value,
                name: selectedMember?.MEMBERNAME || "",
                milktype: selectedMember?.MILKTYPE || "",
                fat: "",
                snf: "",
                rate: 0,
                qty: 0,
                amount: 0,
                incentive: 0,
                totalAmount: 0,
            }));
        } else {
            setRecord((prev: any) => ({
                ...prev,
                [name]: value,
            }));
        }
    };


    const handleDeviceChange = (value: string) => {
        setDeviceCode(value);
        setRecord({
            id: "",
            code: "",
            name: "",
            milktype: "",
            fat: "",
            snf: "",
            clr: 0,
            water: 0,
            rate: 0,
            qty: 0,
            incentive: 0,
            amount: 0,
            totalAmount: 0,
        });
        setMember({});
        setCommissionRate(0);
    };

    const handleSubmit = async () => {
        try {
            if (!isEditRecord) {
                const now = new Date();
                const formattedDate = now?.toLocaleDateString("en-GB");
                const formattedTime = now?.toTimeString().split(" ")[0];
                const timePeriod = now?.getHours() < 12 ? "MORNING" : "EVENING";

                const newRecord = {
                    DEVICEID: String(deviceCode),
                    CODE: parseInt(record?.code),
                    MILKTYPE: record.milktype === "C" ? "COW" : "BUF",
                    FAT: parseFloat(record?.fat),
                    SNF: parseFloat(record?.snf),
                    CLR: 0,
                    WATER: 0,
                    QTY: record?.qty,
                    RATE: record?.rate,
                    SAMPLEDATE: formattedDate,
                    SAMPLETIME: formattedTime,
                    SHIFT: timePeriod,
                    RECORDTYPE: "A",
                    ANALYZERMODE: "MANUAL",
                    WEIGHTMODE: "MANUAL",

                    ANALYZERSAMPLETIME: formattedTime,
                    INCENTIVEAMOUNT: parseFloat(record?.incentive as any),
                };
                await addRecord(newRecord).unwrap();
                ShowToster(toast, "Record added successfully!", '', 'success');
            } else {
                const editRecord = {
                    id: record.id,
                    CODE: parseInt(record?.code),
                    MILKTYPE: record?.milktype === "C" ? "COW" : "BUF",
                    FAT: parseFloat(record?.fat),
                    SNF: parseFloat(record?.snf),
                    QTY: record?.qty,
                    RATE: record?.rate,
                    RECORDTYPE: "E",
                    ANALYZERMODE: "MANUAL",
                    WEIGHTMODE: "MANUAL",
                    INCENTIVEAMOUNT: parseFloat(record.incentive as any),
                };
                await updateRecord({ ...editRecord }).unwrap();
                ShowToster(toast, "Record updated successfully!", '', 'success');
            }
            setRecord({
                id: "",
                code: "",
                name: "",
                milktype: "",
                fat: "",
                snf: "",
                clr: 0,
                water: 0,
                rate: 0,
                qty: 0,
                incentive: 0,
                amount: 0,
                totalAmount: 0,
            }); setIsEditRecord(false);
            setMember({});
        } catch (err) {
            ShowToster(toast, `Error ${isEditRecord ? "updating" : "adding"} record`, '', 'error');
            setRecord({
                id: "",
                code: "",
                name: "",
                milktype: "",
                fat: "",
                snf: "",
                clr: 0,
                water: 0,
                rate: 0,
                qty: 0,
                incentive: 0,
                amount: 0,
                totalAmount: 0,
            });
            setMember({});
        }
    };

    const handleEdit = (record: any) => {
        const editMember = members?.find((m: any) => m?.CODE === record?.CODE);
        const amount = record?.RATE * record?.QTY;
        const totalAmount = amount + record?.INCENTIVEAMOUNT;
        setIsEditRecord(true);
        setRecord({
            ...record,
            id: record?._id,
            code: record?.CODE || "",
            name: editMember?.MEMBERNAME || "",
            milktype: editMember?.MILKTYPE || "",
            fat: record?.FAT || "",
            snf: record?.SNF || "",
            clr: record?.CLR || "",
            rate: record?.RATE || "",
            qty: record?.QTY || "",
            amount: amount || "",
            incentive: record?.INCENTIVEAMOUNT || "",
            totalAmount: totalAmount || "",
        });
        setMember(editMember);
    };

    const handleReset = () => {
        setIsEditRecord(false);
        setRecord({
            id: "",
            code: "",
            name: "",
            milktype: "",
            fat: "",
            snf: "",
            clr: 0,
            water: 0,
            rate: 0,
            qty: 0,
            incentive: 0,
            amount: 0,
            totalAmount: 0,
        });

    };
    const renderRecordItem = ({ item, index }: { item: RecordItem; index: number }) => (
        <View
            style={[
                styles.recordCard,
                item.RECORDTYPE === "E" && styles.errorCard,
            ]}
        >
            {/* Header */}
            <Text style={styles.recordHeader}>
                #{index + 1} | Code: {String(item.CODE).padStart(4, "0")} | {item.SAMPLEDATE} | Shift: {item.SHIFT}
            </Text>

            {/* Two column layout */}
            <View style={styles.recordColumns}>
                {/* Left column */}
                <View style={styles.recordColumn}>
                    <Text style={styles.recordText}>Milk: {item.MILKTYPE}</Text>
                    <Text style={styles.recordText}>FAT: {item.FAT}%</Text>
                    <Text style={styles.recordText}>SNF: {item.SNF}</Text>
                    <Text style={styles.recordText}>CLR: {item.CLR}</Text>
                    <Text style={styles.recordText}>Qty: {item.QTY} L</Text>
                </View>

                {/* Right column */}
                <View style={styles.recordColumn}>
                    <Text style={styles.recordText}>Rate: ₹{item.RATE}</Text>
                    <Text style={styles.recordText}>Amount: ₹{(item.QTY * item.RATE).toFixed(2)}</Text>
                    <Text style={styles.recordText}>Incentive: ₹{item.INCENTIVEAMOUNT.toFixed(2)}</Text>
                    <Text style={styles.grandTotalText}>Total: ₹{(
                        item.QTY * item.RATE +
                        item.INCENTIVEAMOUNT
                    ).toFixed(2)}</Text>
                </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    disabled={isEditRecord}
                    style={[styles.editBtn, isEditRecord && styles.disabledBtn]}
                >
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
                    disabled={isEditRecord}
                    style={[styles.deleteBtn, isEditRecord && styles.disabledBtn]}
                >
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity> */}
            </View>
        </View>
    );

    console.log(record, 'sai')
    return (
        // --- inside return ---
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Milk Entry Form</Text>

            {/* Device Selection */}
            {!isDevice && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        <Icon name="desktop" size={16} style={styles.icon} /> Select Device
                    </Text>
                    <Picker
                        selectedValue={deviceCode}
                        onValueChange={handleDeviceChange}
                        style={styles.pickerModern}
                    >
                        <Picker.Item label="Select Device" value="" />
                        {deviceList.map((dev: any) => (
                            <Picker.Item key={dev.deviceid} label={dev.deviceid} value={dev.deviceid} />
                        ))}
                    </Picker>
                </View>
            )}

            {/* Member Selection */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    <Icon name="users" size={16} style={styles.icon} /> Select Member
                </Text>
                <Picker
                    selectedValue={record.code}
                    onValueChange={(v) => handleChange("code", v)}
                    style={styles.pickerModern}
                >
                    <Picker.Item label="Select Code" value="" />
                    {members.map((m: any) => (
                        <Picker.Item
                            key={m.CODE}
                            label={`${m.MEMBERNAME} (${m.CODE})`}
                            value={m.CODE}
                        />
                    ))}
                </Picker>
            </View>

            {/* Member Info */}


            {/* Fat + SNF + Rate */}
            {record.code && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Milk Analysis</Text>

                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="user" size={16} style={styles.icon} />
                            <Text style={styles.readOnly}>{record.name}</Text>
                        </View>
                    </View>

                    {/* Milk Type */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Milk Type</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="glass-whiskey" size={16} style={styles.icon} />
                            <Text style={styles.readOnly}>{record.milktype}</Text>
                        </View>
                    </View>

                    {/* FAT */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>FAT (%)</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="flask" size={16} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                value={String(record.fat)}
                                onChangeText={(v) => handleChange("fat", v)}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {/* SNF */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>SNF (%)</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="vial" size={16} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                value={String(record.snf)}
                                onChangeText={(v) => handleChange("snf", v)}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {/* Rate */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Rate</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="money-bill-alt" size={16} style={styles.icon} />
                            <Text style={styles.readOnly}>{record.rate}</Text>
                        </View>
                    </View>
                </View>
            )}

            {record.rate ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Milk Quantity</Text>

                    {/* Quantity */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantity (Litres)</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="tint" size={16} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                value={String(record.qty)}
                                onChangeText={(v) => handleChange("qty", v)}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {/* Amount */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="rupee-sign" size={16} style={styles.icon} />
                            <Text style={styles.readOnly}>₹{record.amount}</Text>
                        </View>
                    </View>

                    {/* Incentive */}
                    {commissionRate > 0 && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Incentive</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="gift" size={16} style={styles.icon} />
                                <Text style={styles.readOnly}>₹{record.incentive}</Text>
                            </View>
                        </View>
                    )}

                    {/* Total */}
                    {parseFloat(record.incentive as any) > 0 && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Total</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="calculator" size={16} style={styles.icon} />
                                <Text style={styles.readOnly}>
                                    ₹{Number(record.incentive) + Number(record.amount)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            ) : null}


            {/* Buttons */}
            <View style={styles.row}>
                <TouchableOpacity style={styles.buttonPrimary} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>
                        {isEditRecord ? "Update Record" : "Add Record"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSecondary} onPress={handleReset}>
                    <Text style={styles.buttonText}>Reset</Text>
                </TouchableOpacity>
            </View>

            {/* Records Table */}
            {shiftData.length > 0 && (
                <>
                    <View style={styles.headingCard}>
                        <Text style={styles.headingTitle}>
                            Records for {deviceCode} - {sampleDate} ({sampleShift})
                        </Text>
                    </View>

                    <FlatList
                        data={shiftData}
                        keyExtractor={(item) => item._id}
                        renderItem={renderRecordItem}
                        contentContainerStyle={{ paddingBottom: 20 }}

                    />
                </>
            )}

        </ScrollView>

    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f4f6f9", padding: 12 },
    title: { fontSize: 20, fontWeight: "bold", marginBottom: 16, color: THEME_COLORS.secondary },
    subTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#444" },

    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 8, color: THEME_COLORS.secondary },

    infoBox: {
        backgroundColor: "#e9f7ef",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    infoText: { fontSize: 14, color: "#2c3e50", marginVertical: 2 },

    inputGroup: { marginBottom: 12 },
    label: { fontWeight: "600", marginBottom: 6, color: "#333" },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 10,
    },
    input: { flex: 1, height: 40, color: "#333" },
    readOnly: { fontSize: 14, marginVertical: 4, color: "#555" },
    icon: { marginRight: 8, color: THEME_COLORS.secondary },

    row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
    buttonPrimary: {
        flex: 1,
        margin: 4,
        padding: 12,
        borderRadius: 8,
        backgroundColor: THEME_COLORS.secondary,
        alignItems: "center",
    },
    buttonSecondary: {
        flex: 1,
        margin: 4,
        padding: 12,
        borderRadius: 8,
        backgroundColor: "#6c757d",
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "bold" },

    recordRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
    recordText: { fontSize: 14, color: "#333" },
    editBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#eaf2ff", borderRadius: 6 },
    editText: { color: "#007bff", fontWeight: "600" },

    pickerModern: { color: "#333" },


    recordCard: {
        backgroundColor: "#f8faff",
        padding: 14,
        marginVertical: 8,
        borderRadius: 10,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: THEME_COLORS.secondary,
    },
    errorCard: {
        backgroundColor: "#ffe5e5", // light red for RECORDTYPE "E"
    },
    recordTitle: {
        fontWeight: "bold",
        fontSize: 15,
        marginBottom: 4,
    },

    recordTotal: {
        fontSize: 15,
        fontWeight: "bold",
        marginTop: 5,
        color: "#1e40af",
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 8,
    },

    deleteBtn: {
        backgroundColor: "#dc2626",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    disabledBtn: {
        opacity: 0.6,
    },

    deleteText: {
        color: "#fff",
        fontWeight: "bold",
    },
    recordHeader: { fontWeight: "700", fontSize: 14, color: THEME_COLORS.secondary, marginBottom: 4 },
    recordColumns: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },
    recordColumn: {
        flex: 1,
    },
    grandTotalText: {
        fontSize: 16,
        fontWeight: "700",
        color: THEME_COLORS.secondary,
        marginTop: 4,
    },
    headingCard: {
        backgroundColor: THEME_COLORS.secondary,
        marginBottom: 12,
        padding: 12,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: THEME_COLORS.secondary,
    },
    headingTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: TEXT_COLORS.whiteColor,
        textAlign: 'left',
    },
});

