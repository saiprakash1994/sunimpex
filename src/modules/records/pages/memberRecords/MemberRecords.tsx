import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Image,
    Alert,
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
import { useLazyGetMemberCodewiseReportQuery } from "../../store/recordEndPoint";
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
        if (memberCodes?.length > 0) {
            const firstMember = memberCodes[0];
            setFilterMemberCode(firstMember?.CODE);
        } else {
            setFilterMemberCode('')
        }
    }, [memberCodes, deviceCode]);



    const filteredRecords =
        milkTypeFilter === "ALL"
            ? allRecords
            : allRecords?.filter((r) => r?.MILKTYPE === milkTypeFilter);

    const sortedRecords = [...filteredRecords].sort((a, b) => {
        const dateA = new Date(a?.SAMPLEDATE).getTime();
        const dateB = new Date(b?.SAMPLEDATE).getTime();
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
            <Text style={styles.totalTitle}>{item?._id?.milkType} Milk</Text>
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
                    ₹{item?.totalIncentive}
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
        if (!totals?.length && !allRecords?.length) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        let combinedCSV = "";
        const sanitize = (val: any) => `"${(val ?? "").toString().replace(/"/g, '""')}"`;

        // Header Info
        combinedCSV += `Device Code:,${sanitize(deviceCode)}\n`;
        combinedCSV += `Member Code:,${sanitize((memberCode || "").toString().padStart(4, "0"))}\n`;
        combinedCSV += `Member Records From,${sanitize(fromDate)},To,${sanitize(toDate)}\n\n`;

        // Records Section
        if (allRecords?.length) {
            const recordsCSVData = allRecords.map((rec, index) => ({
                "S.No": index + 1,
                Date: rec?.SAMPLEDATE || "",
                Shift: rec?.SHIFT || "",
                "Milk Type": rec?.MILKTYPE || "",
                Fat: rec?.FAT ?? "",
                SNF: rec?.SNF ?? "",
                CLR: rec?.CLR ?? "",
                Qty: rec?.QTY ?? "",
                Rate: rec?.RATE ?? "",
                Amount: Number(rec?.AMOUNT ?? 0).toFixed(2),
                Incentive: Number(rec?.INCENTIVEAMOUNT ?? 0).toFixed(2),
                "Grand Total": Number(rec?.TOTAL ?? 0).toFixed(2),
            }));
            combinedCSV += "Record Summary:\n";
            combinedCSV += Papa.unparse(recordsCSVData) + "\n\n";
        }

        // Totals Section
        if (totals?.length) {
            const totalsCSVData = totals.map((total) => ({
                "Milk Type": total?._id?.milkType || "",
                "Total Samples": total?.totalRecords ?? "",
                "Avg FAT": total?.averageFat ?? "",
                "Avg SNF": total?.averageSNF ?? "",
                "Avg CLR": total?.averageCLR ?? "",
                "Total Qty": total?.totalQuantity ?? "",
                "Avg Rate": total?.averageRate ?? "",
                "Total Amount": Number(total?.totalAmount ?? 0).toFixed(2),
                "Total Incentive": Number(total?.totalIncentive ?? 0).toFixed(2),
                "Grand Total": (
                    Number(total?.totalAmount ?? 0) +
                    Number(total?.totalIncentive ?? 0)
                ).toFixed(2),
            }));
            combinedCSV += "Total Summary:\n";
            combinedCSV += Papa.unparse(totalsCSVData);
        }

        // File Path
        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${(memberCode || "NA")}_Memberwise_Report_${deviceCode}_${getToday().replace(/\//g, "-")}.csv`;

        await RNFS.writeFile(path, combinedCSV, "utf8");
        ShowToster(toast, `File saved to:\n${path}`, '', 'success');
        await saveAndShareFile(path, "text/csv");
    };


    const handleExportPDF = async () => {
        if (!totals?.length && !allRecords?.length) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        const doc = new jsPDF();
        let currentY = 10;
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        const title = "MEMBERWISE REPORT";
        doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, currentY);

        // Header info
        currentY += 10;
        doc.setFontSize(12);
        doc.text(`Device Code: ${deviceCode}`, 14, currentY);

        const memberCodeText = `Member Code: ${(memberCode || "").toString().padStart(4, "0")}`;
        doc.text(memberCodeText, pageWidth - 14 - doc.getTextWidth(memberCodeText), currentY);

        currentY += 7;
        doc.text(`Records From: ${fromDate} To: ${toDate}`, 14, currentY);

        // Records Table
        if (allRecords?.length) {
            const recordsTable = allRecords.map((record, index) => [
                index + 1,
                record?.SAMPLEDATE || "",
                record?.SHIFT || "",
                record?.MILKTYPE || "",
                record?.FAT ?? "",
                record?.SNF ?? "",
                record?.CLR ?? "",
                record?.QTY ?? "",
                record?.RATE ?? "",
                Number(record?.AMOUNT ?? 0).toFixed(2),
                Number(record?.INCENTIVEAMOUNT ?? 0).toFixed(2),
                Number(record?.TOTAL ?? 0).toFixed(2),
            ]);

            autoTable(doc, {
                startY: currentY + 6,
                head: [[
                    "S.No", "Date", "Shift", "Milk Type", "Fat", "Snf", "Clr",
                    "Qty", "Rate", "Amount", "Incentive", "Grand Total",
                ]],
                body: recordsTable,
                theme: "grid",
                styles: { fontSize: 9 },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Totals Table
        if (totals?.length) {
            doc.setFontSize(12);
            doc.text("Summary:", 14, currentY);

            const totalsTable = totals.map((total) => [
                total?._id?.milkType || "",
                total?.totalRecords ?? "",
                total?.averageFat ?? "",
                total?.averageSNF ?? "",
                total?.averageCLR ?? "",
                total?.totalQuantity ?? "",
                total?.averageRate ?? "",
                Number(total?.totalAmount ?? 0).toFixed(2),
                Number(total?.totalIncentive ?? 0).toFixed(2),
                (
                    Number(total?.totalAmount ?? 0) +
                    Number(total?.totalIncentive ?? 0)
                ).toFixed(2),
            ]);

            autoTable(doc, {
                startY: currentY + 6,
                head: [[
                    "Milk Type", "Total Samples", "Avg FAT", "Avg SNF", "Avg CLR",
                    "Total Qty", "Avg Rate", "Total Amount", "Total Incentive", "Grand Total",
                ]],
                body: totalsTable,
                theme: "striped",
                styles: { fontSize: 9 },
            });
        }

        // Save file
        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${(memberCode || "NA").toString().padStart(4, "0")}_Memberwise_Report_${getToday()}.pdf`;

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