import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useGetDeviceByCodeQuery, useGetAllDevicesQuery } from "../../device/store/deviceEndPoint";
import { useGetMultipleRecordsQuery } from "../../records/store/recordEndPoint";
import { roles } from "../../../shared/utils/appRoles";
import { skipToken } from '@reduxjs/toolkit/query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TEXT_COLORS, THEME_COLORS } from "../../../globalStyle/GlobalStyles";
type RootStackParamList = {
    login: undefined;
};
const screenWidth = Dimensions.get("window").width;

const shifts = [
    { value: "", label: "All Shifts" },
    { value: "MORNING", label: "Morning" },
    { value: "EVENING", label: "Evening" },
];
const DashboardScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const userInfo = useSelector((state: any) => state.userInfoSlice.userInfo);
    const userType = userInfo?.role;
    const isAdmin = userType === roles.ADMIN;
    const isDairy = userType === roles.DAIRY;
    const deviceid = userInfo?.deviceid;
    const dairyCode = userInfo?.dairyCode;

    // Admin: all devices
    const { data: allDevices = [] } = useGetAllDevicesQuery(undefined, {
        skip: !isAdmin,
    });

    // Dairy: dairy devices
    const { data: dairyDevices = [], error: codeError } = useGetDeviceByCodeQuery(
        isDairy && dairyCode ? dairyCode : skipToken
    );

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedShift, setSelectedShift] = useState("");
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [selectedDairyCode, setSelectedDairyCode] = useState(""); // For admin dairy filter

    // Unique dairy codes for admin
    const dairyCodes = useMemo(() => {
        if (!isAdmin) return [];
        const codes = allDevices.map((d: any) => d.dairyCode).filter(Boolean);
        return Array.from(new Set(codes));
    }, [isAdmin, allDevices]);
    console.log(dairyCodes, allDevices.map((e: any) => e.dairyCode))
    // Devices for selected dairy (admin)
    const filteredDevices = useMemo(() => {
        if (!isAdmin) return [];
        if (!selectedDairyCode) return allDevices;
        return allDevices.filter((d: any) => d.dairyCode === selectedDairyCode);
    }, [isAdmin, selectedDairyCode, allDevices]);

    // Device list logic for admin, dairy, or device user
    const deviceList = useMemo(() => {
        if (isAdmin) return filteredDevices;
        if (isDairy) return dairyDevices;
        return deviceid ? [{ deviceid }] : [];
    }, [isAdmin, isDairy, filteredDevices, dairyDevices, deviceid]);

    const deviceCodes = useMemo(() => {
        if (isAdmin) {
            if (!deviceList?.length) return "";
            return selectedDeviceId || deviceList?.map((d: any) => d?.deviceid)?.join(",");
        }
        if (isDairy) {
            if (!deviceList?.length) return "";
            return selectedDeviceId || deviceList?.map((d: any) => d?.deviceid)?.join(",");
        }
        return deviceid || "";
    }, [isAdmin, isDairy, selectedDeviceId, deviceList, deviceid]);

    const formattedDate = useMemo(() => {
        return `${selectedDate.getDate().toString().padStart(2, "0")}/${(selectedDate.getMonth() + 1).toString().padStart(2, "0")
            }/${selectedDate.getFullYear()}`;
    }, [selectedDate]);

    const skipFetch = !deviceCodes || !formattedDate;
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (!skipFetch) {
            setHasFetched(true);
        } else {
            setHasFetched(false);
        }
    }, [skipFetch]);

    // Admin login logic: redirect to login if not admin or not logged in
    useEffect(() => {
        if (!userInfo) {
            // @ts-ignore
            navigation.reset({
                index: 0,
                routes: [{ name: 'login' }],
            });
        }
    }, [userInfo, isAdmin, navigation]);

    const { data, isLoading, isError, error } = useGetMultipleRecordsQuery(
        { params: { deviceCodes, date: formattedDate, shift: selectedShift } },
        { skip: skipFetch }
    );
    const totals = data?.totals || [];
    const cowQuantity =
        totals?.find((item: any) => item?._id?.milkType === "COW")?.totalQuantity || 0;
    const buffaloQuantity =
        totals?.find((item: any) => item?._id?.milkType === "BUF")?.totalQuantity || 0;

    // Updated Pie Chart data with a modern color scheme
    const pieData = [
        { name: "Cow Milk 🐄", quantity: cowQuantity, color: THEME_COLORS.primary, legendFontColor: "#1f2937", legendFontSize: 15 },
        { name: "Buffalo Milk 🐃", quantity: buffaloQuantity, color: THEME_COLORS.secondary, legendFontColor: "#1f2937", legendFontSize: 15 },
    ];


    const barData = {
        labels: totals?.map((item: any) => item?._id.milkType),
        datasets: [
            {
                data: totals?.map((item: any) => item?.totalQuantity),
            },
        ],
    };

    const handleResetFilters = () => {
        setSelectedDate(new Date());
        setSelectedShift("");
        setSelectedDeviceId("");
        setSelectedDairyCode("");
    };

    // Modern skeleton loader
    const SkeletonCard = () => (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonRow} />
            <View style={styles.skeletonRow} />
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Filters Card */}
            <View style={styles.filtersCardModern}>
                <Text style={styles.sectionTitle}><Icon name="filter-variant" size={22} color={THEME_COLORS.secondary} /> Filters</Text>
                <View style={styles.filterRow}>
                    <View style={styles.filterCol}>
                        <Text style={styles.filterLabel}><Icon name="calendar" size={18} color={THEME_COLORS.secondary} /> Date</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.datePickerText}>
                                {selectedDate.toDateString()}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setSelectedDate(date);
                                }}
                            />
                        )}
                    </View>
                    <View style={styles.filterCol}>
                        <Text style={styles.filterLabel}><Icon name="clock-outline" size={18} color={THEME_COLORS.secondary} /> Shift</Text>
                        <Picker
                            selectedValue={selectedShift}
                            onValueChange={(itemValue) => setSelectedShift(itemValue)}
                            style={styles.pickerModern}
                        >
                            {shifts?.map((s) => (
                                <Picker.Item key={s.value} label={s.label} value={s.value} />
                            ))}
                        </Picker>
                    </View>
                </View>
                {isAdmin && (
                    <View style={styles.filterCol}>
                        <Text style={styles.filterLabel}><Icon name="home-city" size={18} color={THEME_COLORS.secondary} /> Dairy Code</Text>
                        <Picker
                            selectedValue={selectedDairyCode}
                            onValueChange={(itemValue) => {
                                setSelectedDairyCode(itemValue);
                                setSelectedDeviceId("");
                            }}
                            style={styles.pickerModern}
                        >
                            <Picker.Item label="All Dairies" value="" />
                            {dairyCodes.map((code) => (
                                <Picker.Item key={String(code)} label={String(code)} value={String(code)} />
                            ))}
                        </Picker>
                    </View>
                )}
                {(isDairy || (isAdmin && selectedDairyCode)) && (
                    <View style={styles.filterCol}>
                        <Text style={styles.filterLabel}><Icon name="chip" size={18} color={THEME_COLORS.secondary} /> Device</Text>
                        <Picker
                            selectedValue={selectedDeviceId}
                            onValueChange={(itemValue) => setSelectedDeviceId(itemValue)}
                            style={styles.pickerModern}
                        >
                            <Picker.Item label="All Devices" value="" />
                            {deviceList?.map((dev: any) => (
                                <Picker.Item
                                    key={dev.deviceid}
                                    label={dev.deviceid}
                                    value={dev.deviceid}
                                />
                            ))}
                        </Picker>
                    </View>
                )}
                <TouchableOpacity style={styles.resetButtonModern} onPress={handleResetFilters}>
                    <Icon name="refresh" size={18} color="#fff" />
                    <Text style={styles.resetButtonTextModern}>Reset Filters</Text>
                </TouchableOpacity>
            </View>

            {/* Data Section */}
            {isLoading ? (
                <View style={{ marginTop: 20 }}>
                    <SkeletonCard />
                    <SkeletonCard />
                </View>
            ) : isError ? (
                <View style={styles.errorCard}>
                    <Icon name="alert-circle-outline" size={22} color={TEXT_COLORS.error} />
                    <Text style={styles.errorText}>
                        Error: {
                            (error && 'data' in error && (error as any).data?.message)
                                ? (error as any).data.message
                                : "Failed to load data"
                        }
                    </Text>
                </View>
            ) : totals.length > 0 ? (
                <>
                    {/* Top Summary Cards Grid - 2x2 Layout */}
                    <View style={styles.topSummaryGrid}>
                        <View style={styles.topSummaryCard}>
                            <View style={[styles.iconCircle, { backgroundColor: '#ede9fe' }]}>
                                <Icon name="water-outline" size={24} color="#6366f1" />
                            </View>
                            <Text style={styles.topSummaryValue}>{totals.reduce((sum: any, item: any) => sum + (item?.totalQuantity || 0), 0).toFixed(2)} L</Text>
                            <Text style={styles.topSummaryLabel}>Total Quantity</Text>
                        </View>
                        <View style={styles.topSummaryCard}>
                            <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
                                <Icon name="currency-inr" size={24} color="#22c55e" />
                            </View>
                            <Text style={styles.topSummaryValue}>₹{totals.reduce((sum: any, item: any) => sum + (item?.totalAmount || 0), 0).toFixed(2)}</Text>
                            <Text style={styles.topSummaryLabel}>Total Amount</Text>
                        </View>
                        <View style={styles.topSummaryCard}>
                            <View style={[styles.iconCircle, { backgroundColor: '#fef9c3' }]}>
                                <Icon name="gift-outline" size={24} color="#f59e42" />
                            </View>
                            <Text style={styles.topSummaryValue}>₹{totals.reduce((sum: any, item: any) => sum + (item?.totalIncentive || 0), 0).toFixed(2)}</Text>
                            <Text style={styles.topSummaryLabel}>Total Incentive</Text>
                        </View>
                        <View style={styles.topSummaryCard}>
                            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                                <Icon name="chart-bar" size={24} color="#e11d48" />
                            </View>
                            <Text style={styles.topSummaryValue}>₹{totals.reduce((sum: any, item: any) => sum + (item?.totalAmount || 0) + (item?.totalIncentive || 0), 0).toFixed(2)}</Text>
                            <Text style={styles.topSummaryLabel}>Grand Total</Text>
                        </View>
                    </View>

                    {/* Per-Milk-Type Cards - Single Column Layout */}
                    {totals?.map((item: any, idx: any) => (
                        <View key={idx} style={styles.perMilkCard}>
                            <View style={styles.perMilkHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: item?._id.milkType === 'COW' ? '#ede9fe' : '#dbeafe' }]}>
                                    <Icon name={item?._id.milkType === 'COW' ? 'cow' : 'water-outline'} size={28} color={item?._id.milkType === 'COW' ? '#6366f1' : '#3b82f6'} />
                                </View>
                                <View>
                                    <Text style={styles.perMilkTitle}>{item?._id.milkType} Milk</Text>
                                    <Text style={styles.perMilkSubtitle}>Summary for {formattedDate}</Text>
                                </View>
                            </View>
                            <View style={styles.perMilkStatsRow}>
                                <View style={styles.perMilkStatBox}><Text style={styles.perMilkStatValue}>{item?.totalQuantity.toFixed(2)} L</Text><Text style={styles.perMilkStatLabel}>Quantity</Text></View>
                                <View style={styles.perMilkStatBox}><Text style={styles.perMilkStatValue}>₹{item?.totalAmount.toFixed(2)}</Text><Text style={styles.perMilkStatLabel}>Amount</Text></View>
                                <View style={styles.perMilkStatBox}><Text style={styles.perMilkStatValue}>₹{item?.totalIncentive.toFixed(2)}</Text><Text style={styles.perMilkStatLabel}>Incentive</Text></View>
                            </View>
                            <View style={styles.perMilkFooterRow}>
                                <Text style={styles.perMilkFooterText}>Fat: {item?.averageFat || 0}</Text>
                                <Text style={styles.perMilkFooterText}>SNF: {item?.averageSNF || 0}</Text>
                                <Text style={styles.perMilkFooterText}>CLR: {item?.averageCLR || 0}</Text>
                                <Text style={styles.perMilkFooterText}>Rate: ₹{item?.averageRate || 0}</Text>
                            </View>
                            <View style={styles.perMilkGrandTotalRow}>
                                <Text style={styles.perMilkGrandTotalLabel}>Grand Total:</Text>
                                <Text style={styles.perMilkGrandTotalValue}>₹{(Number(item?.totalAmount) + Number(item?.totalIncentive)).toFixed(2)}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Bar Chart Card */}
                    <View style={styles.chartCardModern}>
                        <Text style={styles.sectionTitle}><Icon name="chart-bar" size={20} color={THEME_COLORS.secondary} /> Bar Chart</Text>
                        <BarChart
                            data={barData}
                            width={screenWidth - 40}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: "#fff",
                                backgroundGradientFrom: "#fff",
                                backgroundGradientTo: "#fff",
                                decimalPlaces: 2,

                                color: (opacity) => `rgba(43, 80, 161, ${opacity})`,
                                labelColor: () => TEXT_COLORS.primary,
                            }}
                            style={styles.chart}
                        />
                    </View>

                    {/* Pie Chart Card - Improved */}
                    <View style={styles.chartCardModern}>
                        <Text style={styles.sectionTitle}><Icon name="chart-pie" size={20} color={THEME_COLORS.secondary} /> Milk Distribution</Text>
                        <View style={styles.chartWrapper}>

                            <PieChart
                                data={pieData?.map((d) => ({
                                    name: d.name,
                                    population: d.quantity,
                                    color: d.color,
                                    legendFontColor: d.legendFontColor,
                                    legendFontSize: d.legendFontSize,

                                }))}

                                width={screenWidth * 0.7}
                                height={220}
                                chartConfig={{
                                    backgroundColor: "#fff",
                                    backgroundGradientFrom: "#fff",
                                    backgroundGradientTo: "#fff",

                                    color: () => "#000",
                                    labelColor: () => "#000",
                                }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft="60"
                                absolute
                                style={styles.chart}
                                hasLegend={false}
                            />
                        </View>
                        {/* Custom Legend below the chart */}
                        <View style={styles.pieLegendContainer}>
                            {pieData.map((d, idx) => (
                                <View key={d.name} style={styles.pieLegendRow}>
                                    <View style={[styles.pieLegendDot, { backgroundColor: d.color }]} />
                                    <Text style={styles.pieLegendLabel}>{`${d.quantity.toFixed(2)} ${d.name}`}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </>
            ) : (
                <View style={styles.emptyStateCard}>
                    <Icon name="emoticon-sad-outline" size={40} color={THEME_COLORS.secondary} />
                    <Text style={styles.emptyStateText}>No records found for selected filters.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.primary, padding: 12 },
    filtersCardModern: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 18,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    filterRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
    filterCol: { flex: 1, minWidth: 120, marginBottom: 10 },
    filterLabel: { fontSize: 15, fontWeight: "bold", marginBottom: 6, color: THEME_COLORS.secondary, flexDirection: "row", alignItems: "center" },
    datePickerButton: {
        padding: 12,
        backgroundColor: "#f1f1f1",
        borderRadius: 8,
        marginBottom: 8,
    },
    datePickerText: { fontSize: 15, color: TEXT_COLORS.primary },
    pickerModern: { backgroundColor: "#f1f1f1", borderRadius: 8, marginBottom: 8, color: TEXT_COLORS.primary },
    resetButtonModern: {
        marginTop: 10,
        backgroundColor: THEME_COLORS.secondary,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    resetButtonTextModern: { color: "#fff", fontWeight: "bold", marginLeft: 6 },
    sectionTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 10, color: "#22223b", flexDirection: 'row', alignItems: 'center' },

    // New styles for Summary Grid
    summaryGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -6, // Counteract card margin
    },
    // Restore the old summary card styles
    summaryItemCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        width: '48%', // Two columns with a little space
        marginHorizontal: 6,
    },
    summaryItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryItemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        color: '#1f2937'
    },
    summaryItemText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 4,
    },
    summaryItemValue: {
        fontWeight: 'bold',
        color: '#1f2937'
    },
    summaryGrandTotal: {
        fontWeight: 'bold',
        color: '#16a34a',
        fontSize: 15,
    },
    summaryItemFooter: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginTop: 8,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    summaryItemSmallText: {
        fontSize: 12,
        color: '#6b7280'
    },
    // Old summary styles (can be removed if no longer used)
    summaryCardModern: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
    },
    summaryRowModern: {
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f1f1",
        paddingBottom: 8,
    },
    summaryTitleModern: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#6366f1",
    },
    summaryValueModern: { fontSize: 15, marginBottom: 2, color: "#22223b" },
    summaryNumber: { fontWeight: "bold", color: "#2563eb" },
    chartCardModern: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
    },
    chart: { marginVertical: 8, borderRadius: 16 },
    chartWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    errorCard: {
        backgroundColor: "#fee2e2",
        borderRadius: 12,
        padding: 16,
        marginVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    errorText: { color: TEXT_COLORS.error, fontWeight: "bold", marginLeft: 8 },
    emptyStateCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 32,
        marginVertical: 32,
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
    },
    emptyStateText: { color: "#6366f1", fontSize: 18, marginTop: 12, fontWeight: "bold" },
    skeletonCard: {
        backgroundColor: "#e5e7eb",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        minHeight: 100,
    },
    skeletonTitle: {
        width: 120,
        height: 18,
        backgroundColor: "#cbd5e1",
        borderRadius: 8,
        marginBottom: 12,
    },
    skeletonRow: {
        width: "100%",
        height: 14,
        backgroundColor: "#cbd5e1",
        borderRadius: 8,
        marginBottom: 8,
    },
    pieLegendContainer: {
        flexDirection: 'column',
        marginTop: 10,
        marginBottom: 8,
        alignItems: 'flex-start',
        paddingLeft: 10,
    },
    pieLegendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    pieLegendDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 8,
    },
    pieLegendLabel: {
        fontSize: 14,
        color: '#22223b',
        fontWeight: '500',
    },
    // New styles for the web dashboard look
    // Top summary cards
    topSummaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // marginHorizontal: -6, // To counteract card margin
        marginBottom: 18,
    },
    topSummaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        width: '46%', // 2 columns
        alignItems: 'center',
        marginHorizontal: 6,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    topSummaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
    },
    topSummaryLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center',
    },
    // Per-milk-type cards
    perMilkCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 18,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        width: '100%', // Single column for mobile
    },
    perMilkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    perMilkTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 12,
    },
    perMilkSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginLeft: 12,
    },
    perMilkStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
    },
    perMilkStatBox: {
        alignItems: 'center',
        flex: 1,
    },
    perMilkStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    perMilkStatLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    perMilkFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    perMilkFooterText: {
        fontSize: 12,
        color: '#6b7280',
    },
    perMilkGrandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
        marginTop: 4,
    },
    perMilkGrandTotalLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME_COLORS.secondary,
        marginRight: 8,
    },
    perMilkGrandTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME_COLORS.secondary,
    }
});

export default DashboardScreen;
