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
import { useLazyGetCumulativeReportQuery } from "../../store/recordEndPoint";
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
            console.log(result, 'res')
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
    const cowMilkTypeTotals =
        data?.milkTypeTotals.filter((cow: any) => cow?.MILKTYPE === "COW") || [];
    const bufMilkTypeTotals =
        data?.milkTypeTotals.filter((buf: any) => buf?.MILKTYPE === "BUF") || [];

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
        if (totalMembers === 0) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        let csvSections = [];
        const sanitize = (val: any) => `"${(val ?? "").toString().replace(/"/g, '""')}"`;

        // Header
        csvSections.push(`Device Code: ${deviceCode}`);
        csvSections.push(`Members: ${filterStartMember} to ${filterEndMember}`);
        csvSections.push(`Date Range: ${fromDate} to ${toDate}`);
        csvSections.push(""); // spacer

        // Member Records
        if (totalCount > 0) {
            const recordsCSVData = allRecords?.map((record, index) => ({
                SNO: index + 1,
                MemberCode: record?.CODE,
                MilkType: record?.MILKTYPE,
                AvgFAT: record?.avgFat,
                AvgSNF: record?.avgSnf,
                avgClr: record?.avgClr,
                TotalQty: record?.totalQty,
                AvgRate: record?.avgRate,
                TotalAmount: record?.totalAmount,
                TotalIncentive: record?.totalIncentive,
                GrandTotal: record?.grandTotal,
            }));

            csvSections.push("=== Member-wise Records ===");
            csvSections.push(Papa.unparse(recordsCSVData));
            csvSections.push(""); // spacer
        }

        // COW Totals
        if (cowMilkTypeTotals?.length) {
            const cowData = cowMilkTypeTotals?.map((cow: any) => ({
                MilkType: cow?.MILKTYPE,
                MemberCount: cow?.memberCount,
                AvgFAT: cow?.avgFat,
                AvgSNF: cow?.avgSnf,
                AvgCLR: cow?.avgClr,
                TotalQty: cow?.totalQty,
                TotalAmount: cow?.totalAmount,
                TotalIncentive: cow?.totalIncentive,
                GrandTotal: cow?.grandTotal,
            }));

            csvSections.push("=== COW Totals ===");
            csvSections.push(Papa.unparse(cowData));
            csvSections.push("");
        }

        // BUF Totals
        if (bufMilkTypeTotals?.length) {
            const bufData = bufMilkTypeTotals?.map((buf: any) => ({
                MilkType: buf?.MILKTYPE,
                MemberCount: buf?.memberCount,
                AvgFAT: buf?.avgFat,
                AvgSNF: buf?.avgSnf,
                AvgCLR: buf?.avgClr,
                TotalQty: buf?.totalQty,
                TotalAmount: buf?.totalAmount,
                TotalIncentive: buf?.totalIncentive,
                GrandTotal: buf?.grandTotal,
            }));

            csvSections.push("=== BUF Totals ===");
            csvSections.push(Papa.unparse(bufData));
            csvSections.push("");
        }

        // Grand Total
        csvSections.push("=== Overall Totals ===");
        csvSections.push(
            Papa.unparse([
                {
                    MilkType: "TOTAL",
                    MemberCount: totalMembers,
                    AvgFat: grandAvgFat,
                    AvgSnf: grandAvgSnf,
                    AvgClr: grandAvgClr,
                    TotalQty: grandTotalQty,
                    TotalAmount: grandTotalAmount,
                    TotalIncentive: grandTotalIncentive,
                    GrandTotal: grandTotal,
                },
            ])
        );

        // File Path
        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${deviceCode}_Payment_Register.csv_${getToday().replace(/\//g, "-")}.csv`;

        await RNFS.writeFile(path, csvSections.join("\n"), "utf8");
        ShowToster(toast, `File saved to:\n${path}`, '', 'success');
        await saveAndShareFile(path, "text/csv");
    };


    const handleExportPDF = async () => {
        if (totalMembers === 0) {
            ShowToster(toast, "No data available to export.", '', 'error');
            return;
        }

        const doc = new jsPDF();
        let currentY = 10;

        const pageWidth = doc.internal.pageSize.getWidth();
        const centerText = (text: any, y: any) => {
            const textWidth = doc.getTextWidth(text);
            const x = (pageWidth - textWidth) / 2;
            doc.text(text, x, y);
        };

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        centerText("Payment Register", currentY);
        currentY += 8;

        doc.setFontSize(12);
        doc.text(`Device Code: ${deviceCode}`, 14, currentY);
        doc.text(`Members: ${filterStartMember} to ${filterEndMember}`, pageWidth - 90, currentY);
        currentY += 6;
        doc.text(`Date Range: ${fromDate} to ${toDate}`, 14, currentY);
        currentY += 6;

        // Member-wise Table
        if (allRecords?.length) {
            const memberTable = allRecords?.map((record, index) => [
                index + 1,
                record?.CODE,
                record?.MILKTYPE,
                record?.totalQty,
                record?.avgRate,
                record?.totalAmount,
                record?.totalIncentive,
                record?.grandTotal,
            ]);

            autoTable(doc, {
                head: [
                    [
                        "S.No",
                        "Member Code",
                        "Milk Type",
                        "Total Qty",
                        "Avg Rate",
                        "Total Amount",
                        "Total Incentive",
                        "Grand Total",
                    ],
                ],
                body: memberTable,
                startY: currentY,
                styles: { fontSize: 8 },
                theme: "striped",
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;
        }

        const renderSection = (title: any, data: any, startY: any) => {
            if (!data?.length) return startY;

            doc.setFontSize(11);
            doc.text(title, 14, startY);
            startY += 4;

            const tableData = data?.map((item: any) => [
                item.memberCount,
                item.MILKTYPE,
                item.totalQty,
                item.totalAmount,
                item.totalIncentive,
                item.grandTotal,
            ]);

            autoTable(doc, {
                head: [
                    [
                        "Member Count",
                        "Milk Type",
                        "Total Qty",
                        "Total Amount",
                        "Total Incentive",
                        "Grand Total",
                    ],
                ],
                body: tableData,
                startY,
                styles: { fontSize: 9 },
                theme: "grid",
            });

            return (doc as any).lastAutoTable.finalY + 8;
        };

        currentY = renderSection("COW Totals", cowMilkTypeTotals, currentY);
        currentY = renderSection("BUF Totals", bufMilkTypeTotals, currentY);

        // Grand Total
        doc.text("Overall Totals", 14, currentY);
        currentY += 4;

        autoTable(doc, {
            head: [
                [
                    "Total Members",
                    "Total Qty",
                    "Total Incentive",
                    "Total Amount",
                    "Grand Total",
                ],
            ],
            body: [
                [
                    totalMembers,
                    grandTotalQty,
                    grandTotalIncentive,
                    grandTotalAmount,
                    grandTotal,
                ],
            ],
            startY: currentY,
            styles: { fontSize: 9 },
            theme: "grid",
        });

        const downloadPath = Platform.OS === "android"
            ? RNFS.DownloadDirectoryPath
            : RNFS.DocumentDirectoryPath;

        const path = `${downloadPath}/${deviceCode}_Payment_Register_${getToday()}.pdf`;

        const pdfBase64 = doc.output("datauristring").split(",")[1];
        await RNFetchBlob.fs.writeFile(path, pdfBase64, "base64");

        ShowToster(toast, `File saved to:\n${path}`, '', 'success');
        await saveAndShareFile(path, "application/pdf");

        doc.save(`${deviceCode}_Payment_Register.pdf`);
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