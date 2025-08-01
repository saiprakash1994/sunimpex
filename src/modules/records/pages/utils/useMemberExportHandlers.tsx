import React from "react";
import { Alert, Platform } from "react-native";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import RNFetchBlob from "react-native-blob-util";

type Props = {
    deviceCode: string;
    memberCode?: string;
    startMember?: string;
    endMember?: string;
    date?: string;
    fromDate?: string;
    toDate?: string;
    shift?: string;
    milkTypeFilter?: string;
    triggerGetRecords: any; // RTK Query hook
    totalCount: number;
    reportType: 'member' | 'summary' | 'detailed' | 'cumulative' | 'absent';
};

export const useMemberExportHandlers = ({
    deviceCode,
    memberCode,
    startMember,
    endMember,
    date,
    fromDate,
    toDate,
    shift,
    milkTypeFilter,
    triggerGetRecords,
    totalCount,
    reportType,
}: Props) => {
    const shiftOrder: Record<string, number> = {
        MORNING: 1,
        EVENING: 2,
    };

    const formatDateDMY = (d: string) => {
        const dt = new Date(d);
        return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")
            }/${dt.getFullYear()}`;
    };

    const saveAndShareFile = async (filePath: string, mime: string) => {
        try {
            await Share.open({
                url: Platform.OS === "android" ? `file://${filePath}` : filePath,
                type: mime,
            });
        } catch (err) {
            console.log("Share cancelled", err);
        }
    };

    const getFileName = () => {
        const baseName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)}_Report`;
        const devicePart = deviceCode ? `_${deviceCode}` : '';
        const datePart = date ? `_${formatDateDMY(date).replace(/\//g, "-")}` :
            (fromDate && toDate) ? `_${formatDateDMY(fromDate).replace(/\//g, "-")}_to_${formatDateDMY(toDate).replace(/\//g, "-")}` : '';
        return `${baseName}${devicePart}${datePart}`;
    };

    const handleExportCSV = async () => {
        if (!deviceCode) {
            Alert.alert("Validation", "Please select device");
            return;
        }

        if (reportType === 'member' && !memberCode) {
            Alert.alert("Validation", "Please enter member code");
            return;
        }

        if (reportType === 'summary' || reportType === 'detailed') {
            if (!fromDate || !toDate) {
                Alert.alert("Validation", "Please select from and to dates");
                return;
            }
        }

        let allRecords: any[] = [];
        let allTotals: any[] = [];

        try {
            const params: any = {
                deviceCode,
                page: 1,
                limit: 10000,
            };

            if (memberCode) params.memberCode = memberCode;
            if (startMember) params.startMember = startMember;
            if (endMember) params.endMember = endMember;
            if (date) params.date = date.split("-").reverse().join("/");
            if (fromDate) params.fromDate = fromDate.split("-").reverse().join("/");
            if (toDate) params.toDate = toDate.split("-").reverse().join("/");
            if (shift) params.shift = shift;

            const result = await triggerGetRecords({
                params,
            }).unwrap();

            allRecords = result?.records || [];
            allTotals = result?.totals || [];
        } catch (err: any) {
            if (err?.status === 429) {
                Alert.alert("Error", "Too many requests. Please wait.");
            } else {
                Alert.alert("Error", "Failed to fetch data for export.");
            }
            return;
        }

        if (!allTotals.length && !allRecords.length) {
            Alert.alert("No Data", "No data available to export.");
            return;
        }

        let combinedCSV = "";
        const fileName = getFileName();

        if (allRecords.length) {
            const recordsData = allRecords.map((rec, i) => {
                const baseRecord = {
                    "S.No": i + 1,
                    "Member Code": String(rec?.CODE).padStart(4, "0"),
                    "Member Name": rec?.MEMBERNAME || "",
                    "Milk Type": rec?.MILKTYPE,
                    Date: formatDateDMY(rec?.SAMPLEDATE),
                    Shift: rec?.SHIFT,
                    FAT: rec?.FAT?.toFixed(1),
                    SNF: rec?.SNF?.toFixed(1),
                    CLR: rec?.CLR?.toFixed(1),
                    "Qty (L)": rec?.QTY?.toFixed(2),
                    Rate: rec?.RATE?.toFixed(2),
                    Amount: rec?.AMOUNT?.toFixed(2),
                    Incentive: rec?.INCENTIVEAMOUNT?.toFixed(2),
                    Total: rec?.TOTAL?.toFixed(2),
                    Device: rec?.DEVICEID,
                };

                // Add absent-specific fields
                if (reportType === 'absent') {
                    return {
                        ...baseRecord,
                        "Absent Dates": rec?.absentDates?.join(", ") || "",
                        "Total Absent Days": rec?.totalAbsentDays || 0,
                        "Last Present Date": rec?.lastPresentDate ? formatDateDMY(rec.lastPresentDate) : "",
                    };
                }

                return baseRecord;
            });

            combinedCSV += `Device Code: ${deviceCode}\n`;
            if (memberCode) combinedCSV += `Member Code: ${memberCode}\n`;
            if (date) combinedCSV += `Date: ${formatDateDMY(date)}\n`;
            if (fromDate && toDate) combinedCSV += `Period: ${formatDateDMY(fromDate)} to ${formatDateDMY(toDate)}\n`;
            combinedCSV += Papa.unparse(recordsData);
            combinedCSV += "\n\n";
        }

        if (allTotals.length) {
            const totalsData = allTotals.map((t) => ({
                "Milk Type": t._id?.milkType,
                "Total Records": t.totalRecords,
                "Avg FAT": t.averageFat,
                "Avg SNF": t.averageSNF,
                "Avg CLR": t.averageCLR,
                "Total Qty": t.totalQuantity?.toFixed(2),
                "Avg Rate": t.averageRate,
                "Total Amount": t.totalAmount?.toFixed(2),
                "Incentive": t.totalIncentive?.toFixed(2),
                "Grand Total": (
                    (t.totalAmount || 0) + (t.totalIncentive || 0)
                ).toFixed(2),
            }));
            combinedCSV += `Milk Totals for ${deviceCode}\n`;
            combinedCSV += Papa.unparse(totalsData);
        }

        const path = `${RNFS.DocumentDirectoryPath}/${fileName}.csv`;
        await RNFS.writeFile(path, combinedCSV, "utf8");
        saveAndShareFile(path, "text/csv");
    };

    const handleExportPDF = async () => {
        if (!deviceCode) {
            Alert.alert("Validation", "Please select device");
            return;
        }

        if (reportType === 'member' && !memberCode) {
            Alert.alert("Validation", "Please enter member code");
            return;
        }

        if (reportType === 'summary' || reportType === 'detailed') {
            if (!fromDate || !toDate) {
                Alert.alert("Validation", "Please select from and to dates");
                return;
            }
        }

        let allRecords: any[] = [];
        let allTotals: any[] = [];

        try {
            const params: any = {
                deviceCode,
                page: 1,
                limit: 10000,
            };

            if (memberCode) params.memberCode = memberCode;
            if (startMember) params.startMember = startMember;
            if (endMember) params.endMember = endMember;
            if (date) params.date = date.split("-").reverse().join("/");
            if (fromDate) params.fromDate = fromDate.split("-").reverse().join("/");
            if (toDate) params.toDate = toDate.split("-").reverse().join("/");
            if (shift) params.shift = shift;

            const result = await triggerGetRecords({
                params,
            }).unwrap();

            allRecords = result?.records || [];
            allTotals = result?.totals || [];
        } catch {
            Alert.alert("Error", "Failed to fetch data for export.");
            return;
        }

        if (!allTotals.length && !allRecords.length) {
            Alert.alert("No Data", "No data available to export.");
            return;
        }

        const doc = new jsPDF();
        let currentY = 10;

        doc.setFontSize(14).setFont("helvetica", "bold");
        doc.text(`Device: ${deviceCode}`, 14, currentY);
        currentY += 8;

        doc.setFontSize(11).setFont("helvetica", "normal");
        let subtitle = "";
        if (memberCode) subtitle += `Member: ${memberCode} | `;
        if (date) subtitle += `Date: ${formatDateDMY(date)} | `;
        if (fromDate && toDate) subtitle += `Period: ${formatDateDMY(fromDate)} to ${formatDateDMY(toDate)} | `;
        subtitle += `Shift: ${shift || "ALL"} | Milk Type: ${milkTypeFilter || "ALL"}`;

        doc.text(subtitle, 14, currentY);
        currentY += 8;

        doc.text(`Total Records: ${totalCount}`, 14, currentY);
        currentY += 8;

        if (allRecords.length) {
            const headers = [
                "S.No",
                "Code",
                "Member Name",
                "Milk Type",
                "Date",
                "Shift",
                "Fat",
                "SNF",
                "CLR",
                "Qty (L)",
                "Rate",
                "Amount",
                "Incentive",
                "Total",
            ];

            if (reportType === 'absent') {
                headers.push("Absent Dates", "Absent Days", "Last Present");
            }

            const body = allRecords.map((rec, i) => {
                const baseRow = [
                    i + 1,
                    String(rec?.CODE).padStart(4, "0"),
                    rec?.MEMBERNAME || "",
                    rec?.MILKTYPE,
                    formatDateDMY(rec?.SAMPLEDATE),
                    rec?.SHIFT,
                    rec?.FAT?.toFixed(1),
                    rec?.SNF?.toFixed(1),
                    rec?.CLR?.toFixed(1),
                    rec?.QTY?.toFixed(2),
                    rec?.RATE?.toFixed(2),
                    rec?.AMOUNT?.toFixed(2),
                    rec?.INCENTIVEAMOUNT?.toFixed(2),
                    rec?.TOTAL?.toFixed(2),
                ];

                if (reportType === 'absent') {
                    baseRow.push(
                        rec?.absentDates?.join(", ") || "",
                        rec?.totalAbsentDays || 0,
                        rec?.lastPresentDate ? formatDateDMY(rec.lastPresentDate) : ""
                    );
                }

                return baseRow;
            });

            autoTable(doc, {
                startY: currentY,
                head: [headers],
                body,
                styles: { fontSize: 7 },
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        if (allTotals.length) {
            doc.setFontSize(12).setFont("helvetica", "bold");
            doc.text("Milk Totals", 14, currentY);
            currentY += 6;

            const totalsTable = allTotals.map((t) => [
                t._id?.milkType,
                t.totalRecords,
                t.averageFat,
                t.averageSNF,
                t.averageCLR,
                t.totalQuantity?.toFixed(2),
                t.averageRate,
                t.totalAmount?.toFixed(2),
                t.totalIncentive?.toFixed(2),
                ((t.totalAmount || 0) + (t.totalIncentive || 0)).toFixed(2),
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [
                    [
                        "Milk Type",
                        "Total Records",
                        "Avg FAT",
                        "Avg SNF",
                        "Avg CLR",
                        "Total Qty",
                        "Avg Rate",
                        "Total Amount",
                        "Incentive",
                        "Grand Total",
                    ],
                ],
                body: totalsTable,
                styles: { fontSize: 8 },
                theme: "striped",
            });
        }

        const pdfOutput = doc.output("arraybuffer");
        const fileName = getFileName();
        const path = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;

        await RNFetchBlob.fs.writeFile(
            path,
            new Uint8Array(pdfOutput).toString(),
            "ascii"
        );

        saveAndShareFile(path, "application/pdf");
    };

    return { handleExportCSV, handleExportPDF };
}; 