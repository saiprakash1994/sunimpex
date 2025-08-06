import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Image,
    Platform,
} from "react-native";
import { useSelector } from "react-redux";
import debounce from "lodash.debounce";
import { useToast } from "react-native-toast-notifications";
import ExportButtonsSection from "../utils/ExportButtonsSection";
import MemberRecordsFilterSection from "../utils/MemberRecordsFilterSection";
import { UserTypeHook } from "../../../../shared/hooks/userTypeHook";
import { roles } from "../../../../shared/utils/appRoles";
import { useGetAllDevicesQuery, useGetDeviceByCodeQuery, useGetDeviceByIdQuery } from "../../../device/store/deviceEndPoint";
import { useLazyGetDatewiseSummaryReportQuery } from "../../store/recordEndPoint";
import { ShowToster } from "../../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import RNFetchBlob from "react-native-blob-util";
import { Path } from "react-native-svg";
const getToday = () => new Date().toISOString().split("T")[0];

const DatewiseSummaryRecords: React.FC = () => {
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
            const lastMember = memberCodes[memberCodes?.length - 1];

            setFilterStartMember(firstMember.CODE);
            setFilterEndMember(lastMember.CODE);
        } else {
            setFilterStartMember("");
            setFilterEndMember("");
        }
    }, [deviceCode, memberCodes]);


    const filteredRecords = useMemo(() => {
        return allRecords.map((day) => {
            const stats =
                milkTypeFilter === "ALL"
                    ? day.milktypeStats
                    : day.milktypeStats.filter((m: any) => m.milktype === milkTypeFilter);

            const totals = stats.find((m: any) => m.milktype === milkTypeFilter) ||
                day.milktypeStats.find((m: any) => m.milktype === "ALL");

            return {
                ...day,
                filteredStats: stats,
                totalRecords: totals?.totalSamples || 0,
                totalQuantity: totals?.totalQty || 0,
                totalAmount: totals?.totalAmount || 0,
                totalIncentive: totals?.totalIncentive || 0,
                grandTotal: totals?.grandTotal || 0,
            };
        }).sort(
            (a, b) =>
                new Date(a.parsedDate).getTime() -
                new Date(b.parsedDate).getTime()
        );
    }, [allRecords, milkTypeFilter]);


    const saveAndShareFile = async (filePath: string, mime: string) => {
        try {
            const exists = await RNFS.exists(filePath);
            if (!exists) {
                ShowToster(toast, `File not found: ${filePath}`, '', 'error');
                return;
            }

            const finalPath = `file://${filePath}`;
            console.log("Sharing file at:", finalPath);

            await Share.open({
                url: finalPath,
                type: mime,
                failOnCancel: false,
            });
        } catch (err: any) {
            console.log("Share error", err);
            ShowToster(toast, "Unable to share file.", '', 'error');
        }
    };

    const handleExportCSV = async () => {
        if (!allRecords?.length) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        let csvData: any = [];

        allRecords?.forEach((record) => {
            record?.milktypeStats.forEach((stat: any) => {
                csvData.push({
                    Date: record?.date,
                    Shift: record?.shift,
                    "Milk Type": stat?.milktype,
                    "Samples": stat?.totalSamples,
                    "Avg FAT": stat?.avgFat?.toFixed(2),
                    "Avg SNF": stat?.avgSnf?.toFixed(2),
                    "Avg CLR": stat?.avgClr?.toFixed(2),

                    "Avg Rate": stat?.avgRate?.toFixed(2),
                    "Total Qty": stat?.totalQty?.toFixed(2),
                    "Total Amount": stat?.totalAmount?.toFixed(2),
                    "Incentive": stat?.totalIncentive?.toFixed(2),
                    "Grand Total": stat?.grandTotal?.toFixed(2),
                });
            });
        });

        const csvContent = Papa.unparse(csvData);

        // File Path
        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${getToday()}_${deviceCode}_milktype_summary.csv`;

        await RNFS.writeFile(path, csvContent, "utf8");
        ShowToster(toast, `File saved to:\n${path}`, '', 'success');
        await saveAndShareFile(path, "text/csv");

    };


    const handleExportPDF = async () => {
        if (!allRecords?.length) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        const doc = new jsPDF();
        let currentY = 10;
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        const header = "Milk Type Summary Report";
        doc.text(header, (pageWidth - doc.getTextWidth(header)) / 2, currentY);
        currentY += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Device Code: ${deviceCode}`, 14, currentY);
        currentY += 6;
        doc.text(`Date: ${fromDate} to ${toDate}`, 14, currentY);
        currentY += 8;

        allRecords.forEach((record, recordIndex) => {
            if (recordIndex > 0) currentY += 6;

            doc.setFont("helvetica", "bold");
            doc.text(`Date: ${record.date} | Shift: ${record.shift}`, 14, currentY);
            currentY += 6;

            const tableData = record.milktypeStats?.map((stat: any) => ([
                stat?.milktype,
                stat?.totalSamples,
                stat?.avgFat.toFixed(2),
                stat?.avgSnf.toFixed(2),
                stat?.avgClr.toFixed(2),

                stat?.avgRate.toFixed(2),
                stat?.totalQty.toFixed(2),
                stat?.totalAmount.toFixed(2),
                stat?.totalIncentive.toFixed(2),
                stat?.grandTotal.toFixed(2),
            ]));

            autoTable(doc, {
                head: [[
                    "Milk Type", "Samples", "Avg FAT", "Avg SNF", "Avg CLR", "Avg Rate",
                    "Total Qty", "Total Amount", "Incentive", "Grand Total"
                ]],
                body: tableData,
                startY: currentY,
                styles: { fontSize: 9 },
                theme: "grid",
            });

            currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 10;
        });


        // Save file
        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${(deviceCode || "NA").toString().padStart(4, "0")}_milktype_summary_${getToday()}.pdf`;

        const pdfBase64 = doc.output("datauristring").split(",")[1];
        await RNFetchBlob.fs.writeFile(path, pdfBase64, "base64");

        ShowToster(toast, `File saved to:\n${path}`, '', 'success');
        await saveAndShareFile(path, "application/pdf");
    };
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
                            data={filteredRecords}
                            renderItem={({ item, index }) => (
                                <View style={styles.recordCard}>
                                    <Text style={styles.recordHeader}>
                                        #{index + 1} | Date: {item.date} | Shift: {item.shift}
                                    </Text>
                                    <Text style={styles.recordText}>
                                        Total Records: {item.totalRecords} | Total Qty: {item.totalQuantity.toFixed(2)} L
                                    </Text>
                                    <Text style={styles.recordText}>
                                        Total Amount: ₹{item.totalAmount.toFixed(2)} | Incentive: ₹{item.totalIncentive.toFixed(2)}
                                    </Text>
                                    <Text style={styles.grandTotalText}>
                                        Grand Total: ₹{item.grandTotal.toFixed(2)}
                                    </Text>

                                    {milkTypeFilter === "ALL" &&
                                        item.filteredStats
                                            .filter((m: any) => m.milktype !== "ALL")
                                            .map((m: any, idx: number) => (
                                                <View key={idx} style={styles.milkTypeRow}>
                                                    <Text style={styles.milkTypeTitle}>
                                                        {m.milktype === "COW" ? "🐄 Cow Milk" : "🐃 Buffalo Milk"}
                                                    </Text>
                                                    <Text style={styles.milkTypeText}>
                                                        Qty: {m.totalQty.toFixed(2)} L | Rate: ₹{m.avgRate.toFixed(2)} | Amount: ₹{m.totalAmount.toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                </View>
                            )}
                            keyExtractor={(_, index) => index.toString()}
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
        marginVertical: 8,
        marginHorizontal: 12,
        padding: 14,
        borderRadius: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recordHeader: {
        fontSize: 15,
        fontWeight: "600",
        color: THEME_COLORS.secondary,
        marginBottom: 6,
    },
    recordText: {
        fontSize: 13,
        color: "#374151",
        marginBottom: 4,
    },
    grandTotalText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#059669",
        marginTop: 6,
    },
    milkTypeRow: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    milkTypeTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1e3a8a",
        marginBottom: 2,
    },
    milkTypeText: {
        fontSize: 12,
        color: "#374151",
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