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
import debounce from "lodash.debounce";
import { useToast } from "react-native-toast-notifications";
import { useMemberExportHandlers } from "../utils/useMemberExportHandlers";
import ExportButtonsSection from "../utils/ExportButtonsSection";
import MemberRecordsFilterSection from "../utils/MemberRecordsFilterSection";
import { UserTypeHook } from "../../../../shared/hooks/userTypeHook";
import { roles } from "../../../../shared/utils/appRoles";
import { useGetAllDevicesQuery, useGetDeviceByCodeQuery } from "../../../device/store/deviceEndPoint";
import { useLazyGetAbsentMemberReportQuery } from "../../store/recordEndPoint";
import { ShowToster } from "../../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";

const getToday = () => new Date().toISOString().split("T")[0];

const AbsentMemberRecords: React.FC = () => {
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

    const [triggerGetRecords, { isLoading }] = useLazyGetAbsentMemberReportQuery();
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : [];

    // Filter states
    const [filterDeviceCode, setFilterDeviceCode] = useState("");
    const [filterDate, setFilterDate] = useState(getToday());
    const [filterAbsentShift, setFilterAbsentShift] = useState("MORNING");
    const [filterViewMode, setFilterViewMode] = useState("ALL");

    // Applied states
    const [deviceCode, setDeviceCode] = useState("");
    const [date, setDate] = useState(getToday());
    const [shift, setShift] = useState("");
    const [allRecords, setAllRecords] = useState<any[]>([]);
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
        setShift(filterAbsentShift);

        if (!filterDeviceCode || !filterDate) {
            ShowToster(toast, "Please select device and date", "", "error");
            return;
        }

        const formattedDate = filterDate.split("-").reverse().join("/");
        try {
            const result = await triggerGetRecords({
                params: {
                    date: formattedDate,
                    deviceid: filterDeviceCode,
                    ...(filterAbsentShift && { shift: filterAbsentShift }),
                    page: 1,
                    limit: 10000,
                },
            }).unwrap();

            setAllRecords(result?.absentMembers || []);
            setTotals([result]); // wrap summary into array
            setTotalCount(result?.absentMembers?.length || 0);
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

    const { handleExportCSV, handleExportPDF } = useMemberExportHandlers({
        deviceCode,
        date,
        shift,
        milkTypeFilter: "",
        triggerGetRecords,
        totalCount,
        reportType: "absent",
    });

    const sortedRecords = [...allRecords].sort((a, b) =>
        String(a.CODE).localeCompare(String(b.CODE))
    );

    const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
        <View style={styles.recordCard}>

            <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>
                    #{index + 1} | Code: {String(item.CODE).padStart(4, "0")}
                </Text>
            </View>
            <Text style={styles.recordText}>Member: {item.MEMBERNAME}</Text>
            <Text style={styles.recordText}>
                Milk Type: {item.MILKTYPE === "C" ? "Cow" : "Buffalo"}
            </Text>
        </View>
    );

    const renderTotalItem = ({ item }: { item: any }) => (
        <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>Overall Summary</Text>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Members:</Text>
                <Text style={styles.totalValue}>{item.totalMembers}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Present Count:</Text>
                <Text style={styles.totalValue}>{item.presentCount}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Absent Count:</Text>
                <Text style={styles.totalValue}>{item.absentCount}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Cow Absent:</Text>
                <Text style={styles.totalValue}>{item.cowAbsentCount}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Buffalo Absent:</Text>
                <Text style={styles.totalValue}>{item.bufAbsentCount}</Text>
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
                filterDeviceCode={filterDeviceCode}
                setFilterDeviceCode={setFilterDeviceCode}
                deviceCode={deviceCode}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                filterAbsentShift={filterAbsentShift}
                setFilterAbsentShift={setFilterAbsentShift}
                filterViewMode={filterViewMode}
                setFilterViewMode={setFilterViewMode}
                handleSearch={debouncedHandleSearch}
                isFetching={isLoading}
                filtersConfig={{
                    deviceCode: true,
                    date: true,
                    absentShift: true,
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
                <Text style={styles.infoText}>
                    Apply filters and press Search to view records.
                </Text>
            ) : isLoading ? (
                <ActivityIndicator
                    size="large"
                    color="#2196f3"
                    style={{ marginTop: 20 }}
                />
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
                    </>

                    {(<>
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
            ) : <Text style={styles.infoText}>No Records Found With Filters </Text>
            }
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        backgroundColor: THEME_COLORS.primary,
    },
    infoText: {
        textAlign: "center",
        marginVertical: 20,
        color: "#777",
        fontSize: 15,
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
        color: THEME_COLORS.secondary,
    },
    recordText: {
        fontSize: 14,
        color: "#444",
        marginBottom: 2,
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
        borderLeftColor: THEME_COLORS.secondary,
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
});

export default AbsentMemberRecords;
