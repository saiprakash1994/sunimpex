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
import { useLazyGetDatewiseDetailedReportQuery } from "../../store/recordEndPoint";
import { ShowToster } from "../../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";

const getToday = () => new Date().toISOString().split("T")[0];

const DailyRecordCard: React.FC<{ dailyRecord: any; index: number }> = ({ dailyRecord, index }) => (
    <View style={styles.dailyCard}>
        <View style={styles.dailyHeader}>
            <Text style={styles.dailyTitle}>
                #{index + 1} | Date: {dailyRecord.date} | Shift: {dailyRecord.shift}
            </Text>

        </View>

        <FlatList
            data={dailyRecord.records}
            renderItem={({ item, index: recordIndex }) => (
                <View style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                        <Text style={styles.recordTitle}>
                            Record #{recordIndex + 1} | Code: {String(item.CODE).padStart(4, "0")}
                        </Text>
                        {item.photoUrl && (
                            <Image source={{ uri: item.photoUrl }} style={styles.memberPhoto} />
                        )}
                    </View>
                    <Text style={styles.recordText}>
                        Member: {item.MEMBERNAME} | Milk: {item.MILKTYPE}
                    </Text>
                    <Text style={styles.recordText}>
                        FAT: {item.FAT} | SNF: {item.SNF} | QTY: {item.QTY} L
                    </Text>
                    <Text style={styles.recordText}>
                        Rate: ₹{item.RATE} | Total: ₹{item.TOTAL}
                    </Text>
                </View>
            )}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={false}
        />
    </View>
);

const DatewiseDetailedRecords: React.FC = () => {
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

    const [triggerGetRecords, { isLoading }] = useLazyGetDatewiseDetailedReportQuery();
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
    const [startMember, setStartMember] = useState("");
    const [endMember, setEndMember] = useState("");
    const [fromDate, setFromDate] = useState(getToday());
    const [shift, setShift] = useState("");
    const [toDate, setToDate] = useState(getToday());
    const [allRecords, setAllRecords] = useState<any[]>([]);
    const [milkTypeFilter, setMilkTypeFilter] = useState("ALL");

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
        setFromDate(filterFromDate);
        setToDate(filterToDate);
        setStartMember(filterStartMember);
        setEndMember(filterEndMember);
        setShift(filterShift);

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
        startMember,
        endMember,
        milkTypeFilter,
        shift,
        triggerGetRecords,
        totalCount,
        reportType: 'detailed',
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
                filterShift={filterShift}
                setFilterShift={setFilterShift}
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
                    startMember: true,
                    endMember: true,
                    fromDate: true,
                    toDate: true,
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
                            renderItem={({ item, index }) => (
                                <DailyRecordCard dailyRecord={item} index={index} />
                            )}
                            keyExtractor={(_, index) => index.toString()}
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
    dailyCard: {
        backgroundColor: "#f8faff",
        padding: 14,
        marginVertical: 8,
        borderRadius: 10,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: THEME_COLORS.secondary,
    },
    dailyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    dailyTitle: {
        fontWeight: "700",
        fontSize: 16,
        color: THEME_COLORS.secondary
    },
    dailyPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: THEME_COLORS.secondary,
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
    recordCard: {
        backgroundColor: "#fff",
        padding: 10,
        marginVertical: 4,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: THEME_COLORS.primary,
    },
    recordHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    recordTitle: {
        fontWeight: "600",
        fontSize: 13,
        color: THEME_COLORS.secondary
    },
    memberPhoto: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: THEME_COLORS.primary,
    },
    recordText: {
        fontSize: 12,
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

export default DatewiseDetailedRecords; 