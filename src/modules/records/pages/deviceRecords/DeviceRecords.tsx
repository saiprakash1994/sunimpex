import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { useLazyGetAllRecordsQuery } from "../../store/recordEndPoint";
import { roles } from "../../../../shared/utils/appRoles";
import { UserTypeHook } from "../../../../shared/hooks/userTypeHook";
import DeviceRecordsTotalsSection from "../utils/DeviceRecordsTotalsSection";
import debounce from "lodash.debounce";
import { useToast } from "react-native-toast-notifications";
import { ShowToster } from "../../../../shared/components/ShowToster";
import DeviceRecordsFilterSection from "../utils/DeviceRecordsFilterSection";
import { useGetAllDevicesQuery, useGetDeviceByCodeQuery } from "../../../device/store/deviceEndPoint";
import { useExportHandlers } from "../utils/useExportHandlers";
import ExportButtonsSection from "../utils/ExportButtonsSection";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";

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
};

const getToday = () => new Date().toISOString().split("T")[0];

const DeviceRecords: React.FC = () => {
    const userInfo = useSelector((state: any) => state.userInfoSlice.userInfo);
    const userType = UserTypeHook();
    const toast = useToast();
    const isDairy = userType === roles.DAIRY;
    const isDevice = userType === roles.DEVICE;
    const isAdmin = userType === roles.ADMIN;

    const deviceid = userInfo?.deviceid;
    const dairyCode = userInfo?.dairyCode;
    const { data: allDevices = [] } = useGetAllDevicesQuery(undefined, { skip: !isAdmin });

    const { data: dairyDevices = [] } = useGetDeviceByCodeQuery(dairyCode, { skip: !isDairy || !dairyCode });

    const [triggerGetRecords, { isLoading }] = useLazyGetAllRecordsQuery();
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : [];

    // Filter inputs
    const [filterDeviceCode, setFilterDeviceCode] = useState("");
    const [filterDate, setFilterDate] = useState(getToday());
    const [filterShift, setFilterShift] = useState("");
    const [filterMilkTypeFilter, setFilterMilkTypeFilter] = useState("ALL");
    const [filterViewMode, setFilterViewMode] = useState("ALL");

    // Applied
    const [deviceCode, setDeviceCode] = useState("");
    const [date, setDate] = useState(getToday());
    const [shift, setShift] = useState("");
    const [milkTypeFilter, setMilkTypeFilter] = useState("ALL");
    const [result, setResult] = useState<any>();

    const [allRecords, setAllRecords] = useState<RecordItem[]>([]);
    const [totals, setTotals] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (isDevice && deviceid) {
            setFilterDeviceCode(deviceid);
            setDeviceCode(deviceid);
        }
    }, [isDevice, deviceid]);

    const handleSearch = async () => {
        setDeviceCode(filterDeviceCode);
        setDate(filterDate);
        setShift(filterShift);
        setMilkTypeFilter(filterMilkTypeFilter);

        if (!filterDeviceCode || !filterDate) {
            ShowToster(toast, "Please select device and date", "", "error");
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        if (filterDate > today) {
            ShowToster(toast, "Future dates are not allowed.", "", "error");
            return;
        }

        const formattedDate = filterDate.split("-").reverse().join("/");

        try {
            const result = await triggerGetRecords({
                params: {
                    date: formattedDate,
                    deviceCode: filterDeviceCode,
                    ...(filterShift && { shift: filterShift }),
                    page: 1,
                    limit: 10000,
                },
            }).unwrap();
            setResult(result)
            setAllRecords(result?.records || []);
            setTotals(result?.totals || []);
            setTotalCount(result?.records?.length || 0);
            setHasSearched(true);
            ShowToster(toast, "Data loaded successfully!", "", "success");
        } catch (err: any) {
            console.error(err);
            ShowToster(toast, "Failed to fetch data", "", "error");
        }
    };

    const debouncedHandleSearch = debounce(handleSearch, 600, {
        leading: true,
        trailing: false,
    });

    const { handleExportCSV, handleExportPDF } = useExportHandlers({
        deviceCode,
        date,
        shift,
        milkTypeFilter,
        totalCount,
        result
    });

    const filteredRecords =
        milkTypeFilter === "ALL"
            ? allRecords
            : allRecords?.filter((r) => r?.MILKTYPE === milkTypeFilter);

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const dateA = new Date(a.SAMPLEDATE).getTime();
        const dateB = new Date(b.SAMPLEDATE).getTime();
        return dateA - dateB;
    });

    const renderRecordItem = ({ item, index }: { item: RecordItem; index: number }) => (
        <View style={styles.recordCard}>
            <Text style={styles.recordHeader}>
                #{index + 1} | Code: {String(item.CODE).padStart(4, "0")}
            </Text>
            <Text style={styles.recordText}>
                {item.SAMPLEDATE} | Shift: {item.SHIFT} | Milk: {item.MILKTYPE}
            </Text>
            <Text style={styles.recordText}>
                FAT: {item.FAT.toFixed(1)} | SNF: {item.SNF.toFixed(1)} | QTY: {item.QTY.toFixed(2)} L
            </Text>
            <Text style={styles.recordText}>
                Rate: ₹{item.RATE.toFixed(2)} | Total: ₹{item.TOTAL.toFixed(2)}
            </Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <DeviceRecordsFilterSection
                isDairy={isDairy}
                isDevice={isDevice}
                filterDeviceCode={filterDeviceCode}
                setFilterDeviceCode={setFilterDeviceCode}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                filterShift={filterShift}
                setFilterShift={setFilterShift}
                filterMilkTypeFilter={filterMilkTypeFilter}
                setFilterMilkTypeFilter={setFilterMilkTypeFilter}
                filterViewMode={filterViewMode}
                setFilterViewMode={setFilterViewMode}
                handleSearch={debouncedHandleSearch}
                isFetching={isLoading}
                isAdmin={isAdmin}
                deviceList={deviceList}
                deviceCode={deviceCode}
                filtersConfig={{ deviceCode: true, date: true, shift: true }}

            />

            {totalCount > 0 && (
                <View style={styles.exportSection}>
                    <ExportButtonsSection
                        handleExportCSV={handleExportCSV}
                        handleExportPDF={handleExportPDF}
                        isFetching={isLoading}
                        isExporting={false}
                    />
                </View>
            )}

            {!hasSearched ? (
                <Text style={styles.infoText}>Apply filters and press Search to view records.</Text>
            ) : isLoading ? (
                <ActivityIndicator size="large" color="#2196f3" style={{ marginTop: 20 }} />
            ) : totalCount && totalCount > 0 ? (
                <>
                    <View style={styles.headingCard}>
                        <Text style={styles.headingTitle}>TOTAL SECTION</Text>
                    </View>
                    {(
                        <DeviceRecordsTotalsSection filteredTotals={totals} />
                    )}
                    {(
                        <>
                            <View style={styles.headingCard}>
                                <Text style={styles.headingTitle}>RECORD SECTION</Text>
                            </View>
                            <FlatList
                                data={sortedRecords}
                                renderItem={renderRecordItem}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        </>

                    )}
                </>

            ) : <Text style={styles.infoText}>No Records Found With Filters </Text>

            }
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: THEME_COLORS.primary },
    infoText: { textAlign: "center", marginVertical: 20, color: "#777", fontSize: 15 },
    exportSection: {
        marginVertical: 14,
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        elevation: 3,
    },
    recordCard: {
        backgroundColor: "#f8faff",
        padding: 14,
        marginVertical: 8,
        borderRadius: 10,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: THEME_COLORS.secondary,
    },
    totalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: THEME_COLORS.secondary,
        marginBottom: 8,
        textAlign: "center",
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
    recordHeader: { fontWeight: "700", fontSize: 15, color: THEME_COLORS.secondary, marginBottom: 4 },
    recordText: { fontSize: 14, color: "#444", marginBottom: 2 },
});

export default DeviceRecords;
