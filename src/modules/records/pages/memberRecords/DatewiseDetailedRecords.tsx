import React, { useEffect, useState } from "react";
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
import { useLazyGetDatewiseDetailedReportQuery } from "../../store/recordEndPoint";
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
                    <Text style={styles.recordHeader}>
                        Record #{recordIndex + 1} | Code: {String(item.CODE).padStart(4, "0")} | Milk: {item?.MILKTYPE}
                    </Text>

                    <View style={styles.recordColumns}>
                        <View style={styles.recordColumn}>
                            <Text style={styles.recordText}>FAT: {item?.FAT.toFixed(1)}</Text>
                            <Text style={styles.recordText}>SNF: {item?.SNF.toFixed(1)}</Text>
                            <Text style={styles.recordText}>CLR: {item?.CLR.toFixed(1)}</Text>
                            <Text style={styles.recordText}>QTY: {item?.QTY.toFixed(2)} L</Text>
                        </View>
                        <View style={styles.recordColumn}>
                            <Text style={styles.recordText}>Rate: ₹{item?.RATE.toFixed(2)}</Text>
                            <Text style={styles.recordText}>Amount: ₹{item?.TOTALAMOUNT.toFixed(2)}</Text>
                            <Text style={styles.recordText}>Incentive: ₹{item?.INCENTIVEAMOUNT.toFixed(2)}</Text>
                            <Text style={styles.grandTotalText}>Total: ₹{(item?.TOTALAMOUNT + item?.INCENTIVEAMOUNT).toFixed(2)}</Text>

                        </View>
                    </View>


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
            setAllRecords(result?.data || []);
            setTotalCount(result?.data?.length || 0);
            setHasSearched(true);
            ShowToster(toast, "Data loaded successfully!", "", "success");
        } catch (err: any) {
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





    const filteredRecords =
        milkTypeFilter === "ALL"
            ? allRecords
            : allRecords?.filter((r) => r?.MILKTYPE === milkTypeFilter);

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const dateA = new Date(a.SAMPLEDATE).getTime();
        const dateB = new Date(b.SAMPLEDATE).getTime();
        return dateA - dateB;
    });
    console.log(sortedRecords[0]?.milktypeStats)
    const renderTotalItem = ({ item }: { item: any }) => (
        <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>{item?.milktype} Milk</Text>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Samples:</Text>
                <Text style={styles.totalValue}>{item?.totalSamples}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg Fat:</Text>
                <Text style={styles.totalValue}>{item?.avgFat}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg SNF:</Text>
                <Text style={styles.totalValue}>{item?.avgSnf}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Avg CLR:</Text>
                <Text style={styles.totalValue}>{item?.avgClr}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Qty (L):</Text>
                <Text style={styles.totalValue}>{item?.totalQty}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Rate:</Text>
                <Text style={styles.totalValue}>₹{item?.avgRate}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount:</Text>
                <Text style={styles.totalValue}>₹{item?.totalAmount}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={[styles.totalValue, { color: "green" }]}>Incentive:</Text>
                <Text style={[styles.totalValue, { color: "green" }]}>
                    ₹{item?.totalIncentive}
                </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                    ₹{(parseFloat(item?.totalAmount) + parseFloat(item?.totalIncentive)).toFixed(2)}
                </Text>
            </View>
        </View>
    );

    const saveAndShareFile = async (filePath: string, mime: string) => {
        try {
            const exists = await RNFS.exists(filePath);
            if (!exists) {
                ShowToster(toast, `File not found: ${filePath}`, '', 'error');
                return;
            }

            const finalPath = `file://${filePath}`;

            await Share.open({
                url: finalPath,
                type: mime,
                failOnCancel: false,
            });
        } catch (err: any) {
            ShowToster(toast, "Unable to share file.", '', 'error');
        }
    };

    const handleExportCSV = async () => {
        if (!allRecords?.length) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        let combinedCSV = "";

        // Header Info
        const header = [
            [`Device Code: ${deviceCode}`],
            [`Members: ${startMember} to ${endMember}`],
            [`Records from ${fromDate} to ${toDate}`],
            [],
        ];
        combinedCSV += Papa.unparse(header, { quotes: true }) + "\n";

        allRecords.forEach((day, dayIndex) => {
            combinedCSV += `Date: ${day.date}, Shift: ${day.shift}, Device: ${deviceCode}\n\n`;

            if (day?.records?.length) {
                const dailyMemberRows = day?.records?.map((stat: any) => ({
                    Code: stat?.CODE,
                    MilkType: stat?.MILKTYPE,
                    FAT: stat?.FAT,
                    SNF: stat?.SNF,
                    CLR: stat?.CLR,

                    Rate: stat?.RATE,
                    Quantity: stat?.QTY,
                    IncentiveAmount: stat?.INCENTIVEAMOUNT,
                    TotalAmount: stat?.TOTALAMOUNT,
                }));

                combinedCSV += "Member Records:\n";
                combinedCSV += Papa.unparse(dailyMemberRows) + "\n\n";
            }

            // Milk Type Summary
            if (day?.milktypeStats?.length) {
                const summaryRows = day?.milktypeStats?.map((stat: any) => ({
                    MilkType: stat?.milktype,
                    Samples: stat?.totalSamples,
                    AvgFAT: stat?.avgFat.toFixed(2),
                    AvgSNF: stat?.avgSnf.toFixed(2),
                    AvgCLR: stat?.avgClr.toFixed(2),

                    AvgRate: stat?.avgRate.toFixed(2),
                    TotalQty: stat?.totalQty.toFixed(2),
                    TotalAmount: stat?.totalAmount.toFixed(2),
                    Incentive: stat?.totalIncentive.toFixed(2),
                    GrandTotal: stat?.grandTotal.toFixed(2),
                }));

                combinedCSV += "Summary Totals:\n";
                combinedCSV += Papa.unparse(summaryRows) + "\n\n";
            }
        });

        // File Path
        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${deviceCode}_datewise_detailed_${getToday().replace(/\//g, "-")}.csv`;

        await RNFS.writeFile(path, combinedCSV, "utf8");
        ShowToster(toast, `File saved to:\n${path}`, '', 'success');
        await saveAndShareFile(path, "text/csv");


    };
    const handleExportPDF = async () => {
        if (!allRecords?.length) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let currentY = 10;

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        const title = "Datewise Detailed";
        doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, currentY);
        currentY += 10;

        // Header
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Device Code: ${deviceCode}`, 14, currentY);
        doc.text(`Members: ${startMember} to ${endMember}`, pageWidth - 80, currentY);
        currentY += 8;
        doc.text(`Date Range: ${fromDate} to ${toDate}`, 14, currentY);
        currentY += 10;

        allRecords.forEach((day) => {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Date: ${day.date} | Shift: ${day.shift}`, 14, currentY);
            currentY += 6;

            if (day.records?.length) {
                const memberTable = day?.records?.map((stat: any) => [
                    stat?.CODE,
                    stat?.MILKTYPE,
                    stat?.FAT,
                    stat?.SNF,
                    stat?.CLR,

                    stat?.RATE,
                    stat?.QTY,
                    stat?.INCENTIVEAMOUNT,
                    stat?.TOTALAMOUNT,
                ]);

                autoTable(doc, {
                    head: [[
                        "Code", "Milk Type", "FAT", "SNF", "CLR", "Rate", "Qty", "Incentive", "Total"
                    ]],
                    body: memberTable,
                    startY: currentY,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [41, 128, 185] },
                    theme: "grid",
                });

                currentY = (doc as any).lastAutoTable.finalY + 8;
            }

            if (day.milktypeStats?.length) {
                const summaryTable = day?.milktypeStats?.map((stat: any) => [
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
                ]);

                autoTable(doc, {
                    head: [[
                        "Milk Type", "Samples", "Avg FAT", "Avg SNF", "Avg CLR", "Avg Rate", "Total Qty",
                        "Total Amount", "Incentive", "Grand Total"
                    ]],
                    body: summaryTable,
                    startY: currentY,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [39, 174, 96] },
                    theme: "striped",
                });

                currentY = (doc as any).lastAutoTable.finalY + 10;
            }
        });

        // Save file
        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${(deviceCode || "NA").toString().padStart(4, "0")}__datewise_detailed_${getToday()}.pdf`;

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
                    {(
                        <>
                            <View style={styles.headingCard}>
                                <Text style={styles.headingTitle}>TOTAL SECTION</Text>
                            </View>

                            <FlatList
                                data={sortedRecords[0]?.milktypeStats}
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
                                renderItem={({ item, index }) => (
                                    <DailyRecordCard dailyRecord={item} index={index} />
                                )}
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
        backgroundColor: "#f8faff",
        padding: 14,
        marginVertical: 8,
        borderRadius: 10,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: THEME_COLORS.secondary,
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

export default DatewiseDetailedRecords; 