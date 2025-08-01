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
import { useLazyGetDatewiseSummaryReportQuery } from "../../store/recordEndPoint";
import { ShowToster } from "../../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";

const getToday = () => new Date().toISOString().split("T")[0];

const DatewiseSummaryRecords: React.FC = () => {
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

    const [triggerGetRecords, { isLoading }] = useLazyGetDatewiseSummaryReportQuery();
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : [];



    // Filter inputs
    const [filterDeviceCode, setFilterDeviceCode] = useState("");
    const [filterFromDate, setFilterFromDate] = useState(getToday());
    const [filterToDate, setFilterToDate] = useState(getToday());
    const [filterStartMember, setFilterStartMember] = useState("");
    const [filterEndMember, setFilterEndMember] = useState("");
    const [filterShift, setFilterShift] = useState("");

    // Applied
    const [deviceCode, setDeviceCode] = useState("");
    const [fromDate, setFromDate] = useState(getToday());
    const [toDate, setToDate] = useState(getToday());
    const [milkTypeFilter, setMilkTypeFilter] = useState("ALL");
    const [allRecords, setAllRecords] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [shift, setShift] = useState("");


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
        setFromDate(filterFromDate);
        setToDate(filterToDate);
        setShift(filterShift);


        if (!filterDeviceCode || !filterFromDate || !filterToDate) {
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
                    deviceId: filterDeviceCode,
                    ...(filterStartMember && { fromCode: filterStartMember }),
                    ...(filterEndMember && { toCode: filterEndMember }),
                    ...(filterShift && { shift: filterShift }),

                    page: 1,
                    limit: 10000,
                },
            }).unwrap();
            console.log(result, 'res')
            setAllRecords(result?.data || []);
            setTotalCount(result?.data?.length || 0);
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
            const lastMember = memberCodes[memberCodes.length - 1];

            setFilterStartMember(firstMember.CODE);
            setFilterEndMember(lastMember.CODE);
        } else {
            setFilterStartMember("");
            setFilterEndMember("");
        }
    }, [deviceCode, memberCodes]);
    const { handleExportCSV, handleExportPDF } = useMemberExportHandlers({
        deviceCode,
        fromDate,
        toDate,
        milkTypeFilter,
        triggerGetRecords,
        totalCount,
        shift,

        reportType: 'summary',
    });

    const filteredRecords =
        milkTypeFilter === "ALL"
            ? allRecords
            : allRecords?.filter((r) => r?.milkType === milkTypeFilter);

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
    });

    const renderRecordItem = ({ item, index }: { item: any; index: number }) => (
        <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>
                    #{index + 1} | Date: {item.date} | Shift: {item.shift}
                </Text>
                {item.photoUrl && (
                    <Image source={{ uri: item.photoUrl }} style={styles.summaryPhoto} />
                )}
            </View>
            <Text style={styles.recordText}>
                Total Records: {item.totalRecords} | Total Qty: {item.totalQuantity} L
            </Text>
            <Text style={styles.recordText}>
                Total Amount: ₹{item.totalAmount} | Incentive: ₹{item.totalIncentive}
            </Text>
            <Text style={styles.grandTotalText}>
                Grand Total: ₹{item.grandTotal}
            </Text>
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
                filterShift={filterShift}
                setFilterShift={setFilterShift}
                filterDeviceCode={filterDeviceCode}
                setFilterDeviceCode={setFilterDeviceCode}
                deviceCode={deviceCode}
                filterFromDate={filterFromDate}
                setFilterFromDate={setFilterFromDate}
                filterToDate={filterToDate}
                setFilterToDate={setFilterToDate}
                filterStartMember={filterStartMember}
                setFilterStartMember={setFilterStartMember}
                filterEndMember={filterEndMember}
                setFilterEndMember={setFilterEndMember}
                handleSearch={debouncedHandleSearch}
                isFetching={isLoading}
                filtersConfig={{
                    deviceCode: true,
                    fromDate: true,
                    toDate: true,
                    startMember: true,
                    endMember: true,
                    shift: true
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
                    <View style={styles.headingCard}>
                        <Text style={styles.headingTitle}>RECORD SECTION</Text>
                    </View>
                    {(
                        <FlatList
                            data={sortedRecords}
                            renderItem={renderRecordItem}
                            keyExtractor={(item) => `${item.date}-${item.shift}`}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            scrollEnabled={false}
                        />
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
    summaryPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: THEME_COLORS.secondary
    },
    recordText: {
        fontSize: 14,
        color: "#444",
        marginBottom: 2
    },
    grandTotalText: {
        fontSize: 16,
        fontWeight: "700",
        color: THEME_COLORS.secondary,
        marginTop: 4,
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

export default DatewiseSummaryRecords; 