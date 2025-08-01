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
    date: string;
    shift?: string;
    milkTypeFilter: string;
    triggerGetRecords: any; // RTK Query hook
    totalCount: number;
};

export const useExportHandlers = ({
    deviceCode,
    date,
    shift,
    milkTypeFilter,
    triggerGetRecords,
    totalCount,
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

    const handleExportCSV = async () => {
        if (!deviceCode || !date) {
            Alert.alert("Validation", "Please select device and date");
            return;
        }

        let allRecords: any[] = [];
        let allTotals: any[] = [];

        try {
            const formattedDate = date.split("-").reverse().join("/");
            const result = await triggerGetRecords({
                params: {
                    date: formattedDate,
                    deviceCode,
                    ...(shift && { shift }),
                    page: 1,
                    limit: 10000,
                },
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

        const sortedRecords = [...allRecords].sort((a, b) => {
            const dateA = new Date(a.SAMPLEDATE).getTime();
            const dateB = new Date(b.SAMPLEDATE).getTime();
            if (dateA !== dateB) return dateA - dateB;
            const shiftA = shiftOrder[a.SHIFT?.toUpperCase()] || 99;
            const shiftB = shiftOrder[b.SHIFT?.toUpperCase()] || 99;
            if (shiftA !== shiftB) return shiftA - shiftB;
            return String(a.CODE || "").localeCompare(String(b.CODE || ""));
        });

        let combinedCSV = "";

        if (sortedRecords.length) {
            const recordsData = sortedRecords.map((rec, i) => ({
                "S.No": i + 1,
                "Member Code": String(rec?.CODE).padStart(4, "0"),
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
            }));
            combinedCSV += `Device Code: ${deviceCode}\nDate: ${formatDateDMY(
                date
            )}\n`;
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
            combinedCSV += `Milk Totals for ${deviceCode}\nDate: ${formatDateDMY(
                date
            )}\n`;
            combinedCSV += Papa.unparse(totalsData);
        }

        const path = `${RNFS.DocumentDirectoryPath}/Daywise_Report_${deviceCode}_${formatDateDMY(
            date
        ).replace(/\//g, "-")}.csv`;

        await RNFS.writeFile(path, combinedCSV, "utf8");
        saveAndShareFile(path, "text/csv");
    };

    const handleExportPDF = async () => {
        if (!deviceCode || !date) {
            Alert.alert("Validation", "Please select device and date");
            return;
        }

        let allRecords: any[] = [];
        let allTotals: any[] = [];

        try {
            const formattedDate = date.split("-").reverse().join("/");
            const result = await triggerGetRecords({
                params: {
                    date: formattedDate,
                    deviceCode,
                    ...(shift && { shift }),
                    page: 1,
                    limit: 10000,
                },
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
        doc.text(
            `Date: ${formatDateDMY(date)} | Shift: ${shift || "ALL"} | Milk Type: ${milkTypeFilter || "ALL"
            }`,
            14,
            currentY
        );
        currentY += 8;

        doc.text(`Total Records: ${totalCount}`, 14, currentY);
        currentY += 8;

        if (allRecords.length) {
            const body = allRecords.map((rec, i) => [
                i + 1,
                String(rec?.CODE).padStart(4, "0"),
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
            ]);
            autoTable(doc, {
                startY: currentY,
                head: [
                    [
                        "S.No",
                        "Code",
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
                    ],
                ],
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
        const path = `${RNFS.DocumentDirectoryPath}/Daywise_Report_${deviceCode}_${formatDateDMY(
            date
        ).replace(/\//g, "-")}.pdf`;

        await RNFetchBlob.fs.writeFile(
            path,
            new Uint8Array(pdfOutput).toString(),
            "ascii"
        );

        saveAndShareFile(path, "application/pdf");
    };

    return { handleExportCSV, handleExportPDF };
};
