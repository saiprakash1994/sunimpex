import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Image,
} from "react-native";
import { useSelector } from "react-redux";
import debounce from "lodash.debounce";
import { useToast } from "react-native-toast-notifications";
import { useMemberExportHandlers } from "../utils/useMemberExportHandlers";
import ExportButtonsSection from "../utils/ExportButtonsSection";
import MemberRecordsFilterSection from "../utils/MemberRecordsFilterSection";
import { UserTypeHook } from "../../../../shared/hooks/userTypeHook";
import { roles } from "../../../../shared/utils/appRoles";
import { useGetAllDevicesQuery, useGetDeviceByCodeQuery, useGetDeviceByIdQuery } from "../../../device/store/deviceEndPoint";
import { useLazyGetMemberCodewiseReportQuery } from "../../store/recordEndPoint";
import { ShowToster } from "../../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";
import { ThemeProvider } from "@react-navigation/native";

const getToday = () => new Date().toISOString().split("T")[0];

const MemberRecords: React.FC = () => {
    const userInfo = useSelector((state: any) => state?.userInfoSlice?.userInfo);
    const userType = UserTypeHook();
    const toast = useToast();
    const isDairy = userType === roles?.DAIRY;
    const isDevice = userType === roles?.DEVICE;
    const isAdmin = userType === roles?.ADMIN;

    const deviceid = userInfo?.deviceid;
    const dairyCode = userInfo?.dairyCode;
    const { data: allDevices = [] } = useGetAllDevicesQuery(undefined, { skip: !isAdmin });
    const { data: dairyDevices = [] } = useGetDeviceByCodeQuery(dairyCode, { skip: !isDairy || !dairyCode });
    const { data: deviceData } = useGetDeviceByIdQuery(deviceid, { skip: !isDevice });

    const [triggerGetRecords, { isLoading }] = useLazyGetMemberCodewiseReportQuery();
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : [];
    // Get selected device and member codes

    // Filter inputs
    const [filterDeviceCode, setFilterDeviceCode] = useState("");
    const [filterMemberCode, setFilterMemberCode] = useState("");
    const [filterFromDate, setFilterFromDate] = useState(getToday());
    const [filterToDate, setFilterToDate] = useState(getToday());
    const [filterViewMode, setFilterViewMode] = useState("ALL");

    // Applied
    const [deviceCode, setDeviceCode] = useState("");
    const [memberCode, setMemberCode] = useState("");
    const [fromDate, setFromDate] = useState(getToday());
    const [toDate, setToDate] = useState(getToday());
    const [milkTypeFilter, setMilkTypeFilter] = useState("ALL");
    const [allRecords, setAllRecords] = useState<any[]>([]);
    const [totals, setTotals] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const selectedDevice = isDevice
        ? deviceData
        : deviceList?.find((dev: any) => dev?.deviceid === filterDeviceCode);
    const memberCodes = selectedDevice?.members || [];
    useEffect(() => {
        if (isDevice && deviceid) {
            setFilterDeviceCode(deviceid);
            setDeviceCode(deviceid);
        }
    }, [isDevice, deviceid]);



    const handleSearch = async () => {
        setDeviceCode(filterDeviceCode);
        setMemberCode(filterMemberCode);
        setFromDate(filterFromDate);
        setToDate(filterToDate);

        if (!filterDeviceCode || !filterMemberCode || !filterFromDate || !filterToDate) {
            ShowToster(toast, "Please select device, enter member code and select from date and to date", "", "error");
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        if (filterFromDate > today || filterToDate > today) {
            ShowToster(toast, "Future dates are not allowed.", "", "error");
            return;
        }

        if (new Date(filterFromDate) > new Date(filterToDate)) {
            ShowToster(toast, "From date cannot be greater than to date.", "", "error");
            return;
        }


        // const formattedFromDate = filterFromDate.split("-").reverse().join("/");
        // const formattedToDate = filterToDate.split("-").reverse().join("/");
        try {
            const result = await triggerGetRecords({
                params: {
                    fromDate: filterFromDate,
                    toDate: filterToDate,
                    deviceCode: filterDeviceCode,
                    memberCode: filterMemberCode,
                    page: 1,
                    limit: 10000,
                },
            }).unwrap();
            console.log(result, 'res')
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

    useEffect(() => {
        if (memberCodes.length > 0) {
            const firstMember = memberCodes[0];
            setFilterMemberCode(firstMember?.CODE);
        } else {
            setFilterMemberCode('')
        }
    }, [memberCodes, deviceCode]);

    const { handleExportCSV, handleExportPDF } = useMemberExportHandlers({
        deviceCode,
        memberCode,
        fromDate,
        toDate,
        milkTypeFilter,
        triggerGetRecords,
        totalCount,
        reportType: 'member',
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

    const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
        <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>
                    #{index + 1} | Code: {String(item?.CODE).padStart(4, "0")}
                </Text>
            </View>
            <Text style={styles.recordText}>
                {item?.SAMPLEDATE} | Shift: {item?.SHIFT} | Milk: {item?.MILKTYPE}
            </Text>
            <Text style={styles.recordText}>
                FAT: {item?.FAT.toFixed(1)} | SNF: {item?.SNF.toFixed(1)} | QTY: {item.QTY.toFixed(2)} L
            </Text>
            <Text style={styles.recordText}>
                Rate: ₹{item.RATE.toFixed(2)} | Total: ₹{item.TOTAL.toFixed(2)}
            </Text>
        </View>
    );

    const renderTotalItem = ({ item }: { item: any }) => (
        <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>{item._id?.milkType} Milk</Text>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Samples:</Text>
                <Text style={styles.totalValue}>{item?.totalRecords}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg Fat:</Text>
                <Text style={styles.totalValue}>{item?.averageFat}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg SNF:</Text>
                <Text style={styles.totalValue}>{item?.averageSNF}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg CLR:</Text>
                <Text style={styles.totalValue}>{item?.averageCLR}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Qty (L):</Text>
                <Text style={styles.totalValue}>{item?.totalQuantity}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Rate:</Text>
                <Text style={styles.totalValue}>₹{item?.averageRate}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount:</Text>
                <Text style={styles.totalValue}>₹{item?.totalAmount}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={[styles.totalValue, { color: "green" }]}>Incentive:</Text>
                <Text style={[styles.totalValue, { color: "green" }]}>
                    ₹{item.totalIncentive}
                </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                    ₹{(item?.totalAmount + item?.totalIncentive)}
                </Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <MemberRecordsFilterSection
                isDairy={isDairy}
                isDevice={isDevice}
                isAdmin={isAdmin}
                deviceList={deviceList}
                memberCodes={memberCodes}
                filterDeviceCode={filterDeviceCode}
                setFilterDeviceCode={setFilterDeviceCode}
                deviceCode={deviceCode}
                filterMemberCode={filterMemberCode}
                setFilterMemberCode={setFilterMemberCode}
                filterFromDate={filterFromDate}
                setFilterFromDate={setFilterFromDate}
                filterToDate={filterToDate}
                setFilterToDate={setFilterToDate}
                filterViewMode={filterViewMode}
                setFilterViewMode={setFilterViewMode}
                handleSearch={debouncedHandleSearch}
                isFetching={isLoading}
                filtersConfig={{
                    deviceCode: true,
                    memberCode: true,
                    fromDate: true,
                    toDate: true,
                }}
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
            ) : totalCount > 0 ? (
                <>
                    {(
                        <>
                            <View style={styles.headingCard}>
                                <Text style={styles.headingTitle}>TOTAL SECTION</Text>
                            </View>

                            <FlatList
                                data={totals}
                                renderItem={renderTotalItem}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                scrollEnabled={false}
                            />
                        </>

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
                                scrollEnabled={false}
                            />
                        </>
                    )}

                </>
            ) : <Text style={styles.infoText}>No Records Found With Filters </Text>}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        backgroundColor: THEME_COLORS.primary
    },
    infoText: {
        textAlign: "center",
        marginVertical: 20,
        color: "#777",
        fontSize: 15
    },
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
    recordHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    recordTitle: {
        fontWeight: "700",
        fontSize: 15,
        color: THEME_COLORS.secondary
    },

    recordText: {
        fontSize: 14,
        color: "#444",
        marginBottom: 2
    },
    totalCard: {
        backgroundColor: "#f8faff",
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
    totalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: THEME_COLORS.secondary,
        marginBottom: 8,
        textAlign: "center",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#444",
    },
    totalValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#222",
    },
    grandTotalRow: {
        borderTopWidth: 1,
        borderTopColor: "#ddd",
        marginTop: 6,
        paddingTop: 6,
    },
    grandTotalLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: THEME_COLORS.secondary,
    },
    grandTotalValue: {
        fontSize: 15,
        fontWeight: "700",
        color: THEME_COLORS.secondary,
    },
});

export default MemberRecords; 