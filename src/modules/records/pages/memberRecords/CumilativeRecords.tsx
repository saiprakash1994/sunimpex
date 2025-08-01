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
import { useLazyGetCumulativeReportQuery } from "../../store/recordEndPoint";
import { ShowToster } from "../../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";

const getToday = () => new Date().toISOString().split("T")[0];

const CumilativeRecords: React.FC = () => {
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
    const { data: deviceData } = useGetDeviceByIdQuery(deviceid, { skip: !isDevice });

    const [triggerGetRecords, { isLoading }] = useLazyGetCumulativeReportQuery();
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : [];


    // Filter inputs
    const [filterDeviceCode, setFilterDeviceCode] = useState("");
    const [filterStartMember, setFilterStartMember] = useState("");
    const [filterEndMember, setFilterEndMember] = useState("");
    const [filterFromDate, setFilterFromDate] = useState(getToday());
    const [filterToDate, setFilterToDate] = useState(getToday());

    // Applied
    const [deviceCode, setDeviceCode] = useState("");
    const [startMember, setStartMember] = useState("");
    const [endMember, setEndMember] = useState("");
    const [fromDate, setFromDate] = useState(getToday());
    const [toDate, setToDate] = useState(getToday());
    const [shift, setShift] = useState("");
    const [milkTypeFilter, setMilkTypeFilter] = useState("ALL");
    const [allRecords, setAllRecords] = useState<any[]>([]);
    const [data, setData] = useState<any>({})
    const [totals, setTotals] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Get selected device and member codes
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
        setStartMember(filterStartMember);
        setEndMember(filterEndMember);
        setFromDate(filterFromDate);
        setToDate(filterToDate);

        if (!filterDeviceCode || !filterFromDate || !filterToDate || !filterStartMember || !filterEndMember) {
            ShowToster(toast, "Please select device and date range", "", "error");
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        if (filterFromDate > today || filterToDate > today) {
            ShowToster(toast, "Future dates are not allowed.", "", "error");
            return;
        }

        if (filterFromDate > filterToDate) {
            ShowToster(toast, "From date cannot be greater than to date.", "", "error");
            return;
        }

        const formattedFromDate = filterFromDate.split("-").reverse().join("/");
        const formattedToDate = filterToDate.split("-").reverse().join("/");

        try {
            const result = await triggerGetRecords({
                params: {
                    fromDate: formattedFromDate,
                    toDate: formattedToDate,
                    deviceid: filterDeviceCode,
                    ...(filterStartMember && { fromCode: filterStartMember }),
                    ...(filterEndMember && { toCode: filterEndMember }),
                    page: 1,
                    limit: 10000,
                },
            }).unwrap();
            setAllRecords(result?.data || []);
            setTotals(result?.milkTypeTotals || []);
            setTotalCount(result?.data?.length || 0);
            setData(result)
            setHasSearched(true);
            ShowToster(toast, "Data loaded successfully!", "", "success");
        } catch (err: any) {
            console.error(err);
            ShowToster(toast, "Failed to fetch data", "", "error");
        }
    };
    const {
        totalMembers = 0,
        grandAvgFat = 0,
        grandAvgSnf = 0,
        grandAvgClr = 0,
        grandTotalQty = 0,
        grandAvgRate = 0,
        grandTotalIncentive = 0,
        grandTotalAmount = 0,
        grandTotal = 0,
    } = data || {};
    useEffect(() => {
        if (memberCodes.length > 0) {
            const firstMember = memberCodes[0];
            const lastMember = memberCodes[memberCodes.length - 1];

            setFilterStartMember(firstMember.CODE);
            setFilterEndMember(lastMember.CODE);
        } else {
            setFilterStartMember("");
            setFilterEndMember("");
        }
    }, [deviceCode, memberCodes]);


    const debouncedHandleSearch = debounce(handleSearch, 600, {
        leading: true,
        trailing: false,
    });

    const { handleExportCSV, handleExportPDF } = useMemberExportHandlers({
        deviceCode,
        startMember,
        endMember,
        fromDate,
        toDate,
        milkTypeFilter,
        triggerGetRecords,
        totalCount,
        reportType: 'cumulative',
    });

    const filteredRecords =
        milkTypeFilter === "ALL"
            ? allRecords
            : allRecords?.filter((r) =>
                r?.milkTypeBreakdown?.COW || r?.milkTypeBreakdown?.BUF
            );

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        return String(a.CODE).localeCompare(String(b.CODE));
    });

    // Record Item Renderer
    const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
        <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>
                    #{index + 1} | Code: {String(item.CODE).padStart(4, "0")}
                </Text>
            </View>
            <Text style={styles.recordText}>Milk Type: {item.MILKTYPE}</Text>
            <Text style={styles.recordText}>
                Total Qty: {parseFloat(item.totalQty).toFixed(2)} L
            </Text>
            <Text style={styles.recordText}>
                Avg FAT: {parseFloat(item.avgFat).toFixed(1)} |
                Avg SNF: {parseFloat(item.avgSnf).toFixed(1)} |
                Avg CLR: {parseFloat(item.avgClr).toFixed(1)}
            </Text>
            <Text style={styles.recordText}>
                Rate: ₹{parseFloat(item.avgRate).toFixed(2)}
            </Text>
            <Text style={styles.recordText}>
                Total Amount: ₹{parseFloat(item.totalAmount).toFixed(2)} |
                Incentive: ₹{parseFloat(item.totalIncentive).toFixed(2)}
            </Text>
            <Text style={styles.grandTotalText}>
                Grand Total: ₹{parseFloat(item.grandTotal).toFixed(2)}
            </Text>
        </View>
    );

    // Milk Type Totals Renderer
    const renderTotalItem = ({ item }: { item: any }) => (
        <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>{item.MILKTYPE} Milk</Text>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Members:</Text>
                <Text style={styles.totalValue}>{item.memberCount}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Qty (L):</Text>
                <Text style={styles.totalValue}>{parseFloat(item.totalQty).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg Fat:</Text>
                <Text style={styles.totalValue}>{parseFloat(item.avgFat).toFixed(1)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg SNF:</Text>
                <Text style={styles.totalValue}>{parseFloat(item.avgSnf).toFixed(1)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg CLR:</Text>
                <Text style={styles.totalValue}>{parseFloat(item.avgClr).toFixed(1)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Rate:</Text>
                <Text style={styles.totalValue}>₹{parseFloat(item.avgRate).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount:</Text>
                <Text style={styles.totalValue}>₹{parseFloat(item.totalAmount).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Incentive:</Text>
                <Text style={[styles.totalValue, { color: "green" }]}>
                    ₹{parseFloat(item.totalIncentive).toFixed(2)}
                </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                    ₹{parseFloat(item.grandTotal).toFixed(2)}
                </Text>
            </View>
        </View>
    );


    const RenderGrandTotalItem = () => (
        <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>Grand Total</Text>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Members:</Text>
                <Text style={styles.totalValue}>{totalMembers}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Qty (L):</Text>
                <Text style={styles.totalValue}>{parseFloat(grandTotalQty).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg Fat:</Text>
                <Text style={styles.totalValue}>{parseFloat(grandAvgFat).toFixed(1)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg SNF:</Text>
                <Text style={styles.totalValue}>{parseFloat(grandAvgSnf).toFixed(1)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg CLR:</Text>
                <Text style={styles.totalValue}>{parseFloat(grandAvgClr).toFixed(1)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Rate:</Text>
                <Text style={styles.totalValue}>₹{parseFloat(grandAvgRate).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount:</Text>
                <Text style={styles.totalValue}>₹{parseFloat(grandTotalAmount).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Incentive:</Text>
                <Text style={[styles.totalValue, { color: "green" }]}>
                    ₹{parseFloat(grandTotalIncentive).toFixed(2)}
                </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                    ₹{parseFloat(grandTotal).toFixed(2)}
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
                filterStartMember={filterStartMember}
                setFilterStartMember={setFilterStartMember}
                filterEndMember={filterEndMember}
                setFilterEndMember={setFilterEndMember}
                filterFromDate={filterFromDate}
                setFilterFromDate={setFilterFromDate}
                filterToDate={filterToDate}
                setFilterToDate={setFilterToDate}
                handleSearch={debouncedHandleSearch}
                isFetching={isLoading}
                filtersConfig={{
                    deviceCode: true,
                    startMember: true,
                    endMember: true,
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
                    <>
                        <View style={styles.headingCard}>
                            <Text style={styles.headingTitle}>TOTAL SECTION</Text>
                        </View>
                        {(
                            <FlatList
                                data={totals}
                                renderItem={renderTotalItem}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                scrollEnabled={false}
                            />
                        )}
                        {<RenderGrandTotalItem />}
                    </>
                    {(
                        <>
                            <View style={styles.headingCard}>
                                <Text style={styles.headingTitle}>RECORD SECTION</Text>
                            </View>                            <FlatList
                                data={sortedRecords}
                                renderItem={renderRecordItem}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                scrollEnabled={false}
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
        borderLeftColor: "#3F51B5",
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
        color: "#3F51B5"
    },
    memberPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#3F51B5",
    },
    recordText: {
        fontSize: 14,
        color: "#444",
        marginBottom: 2
    },
    grandTotalText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#3F51B5",
        marginTop: 4,
    },
    breakdownContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: "#fff",
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: "#C5CAE9",
    },
    breakdownTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#3F51B5",
        marginBottom: 4,
    },
    breakdownRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    breakdownLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        width: 40,
    },
    breakdownValue: {
        fontSize: 12,
        color: "#444",
        flex: 1,
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
        borderLeftColor: "#3F51B5",
    },
    totalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#3F51B5",
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
        color: "#3F51B5",
    },
    grandTotalValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#303F9F",
    },
});

export default CumilativeRecords; 