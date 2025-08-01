import React, {
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useToast } from "react-native-toast-notifications";
import { ShowToster } from "../../../shared/components/ShowToster";

// ✅ new package import
import { pick, types } from "@react-native-documents/picker";

interface FileUploadCardProps {
    title: string;
    onUpload: (payload: { formData: FormData }) => Promise<any>;
    toastMsg?: string;
    showDate?: boolean;
    dateFieldName?: string;
    icon?: string;
    description?: string;
    categoryColor?: string;
    disabled?: boolean;
    disableFileInput?: boolean;
    suppressNoFileError?: boolean;
    autoRedirectAfterUpload?: boolean;
    hideFileInputArea?: boolean;
    deviceId?: string;
}

export interface FileUploadCardRef {
    setSelectedFileFromParent: (file: any) => void;
    autoUploadFromParent: (file: any) => void;
}

const FileUploadCard = forwardRef<FileUploadCardRef, FileUploadCardProps>(
    (
        {
            title,
            onUpload,
            toastMsg = "Upload successful",
            showDate = false,
            dateFieldName = "effectiveDate",
            icon,
            description,
            categoryColor = "#4f46e5",
            disabled = false,
            disableFileInput = false,
            suppressNoFileError = false,
            autoRedirectAfterUpload = false,
            hideFileInputArea = false,
            deviceId,
        },
        ref
    ) => {
        const navigation = useNavigation();
        const [selectedFile, setSelectedFile] = useState<any | null>(null);
        const [uploading, setUploading] = useState(false);
        const [selectedDate, setSelectedDate] = useState<Date>(new Date());
        const [showDatePicker, setShowDatePicker] = useState(false);
        const toast = useToast();

        useEffect(() => {
            if (showDate) {
                setSelectedDate(new Date());
            }
        }, [showDate]);

        useImperativeHandle(ref, () => ({
            setSelectedFileFromParent: (file) => {
                setSelectedFile(file);
            },
            autoUploadFromParent: (file) => {
                setSelectedFile(file);
                setTimeout(() => {
                    handleUpload();
                }, 0);
            },
        }));

        const handleFilePick = async () => {
            if (disableFileInput) return;
            try {
                const [result] = await pick({
                    type: [types.allFiles],
                });
                if (result) setSelectedFile(result);
            } catch (err: any) {
                console.error("File pick error:", err);
                ShowToster(toast, "Failed to pick file", "", "error");
            }
        };

        const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
            if (event.type === "set" && date) {
                setSelectedDate(date);
            }
            setShowDatePicker(false);
        };

        const handleUpload = async () => {
            if (!selectedFile) {
                if (!suppressNoFileError) {
                    ShowToster(toast, "Please select a file.", "", "error");
                }
                return;
            }

            if (showDate && !selectedDate) {
                ShowToster(toast, "Please select an effective date.", "", "error");
                return;
            }

            const formData = new FormData();
            formData.append("file", {
                uri:
                    Platform.OS === "ios"
                        ? selectedFile.uri.replace("file://", "")
                        : selectedFile.uri,
                type: selectedFile.mimeType ?? "application/octet-stream",
                name: selectedFile.name ?? "upload",
            } as any);

            if (showDate) {
                formData.append(
                    dateFieldName,
                    selectedDate.toISOString().slice(0, 10)
                );
            }
            if (deviceId) {
                formData.append("deviceId", deviceId);
            }

            try {
                setUploading(true);
                await onUpload({ formData });
                ShowToster(toast, toastMsg, "", "success");

                setSelectedFile(null);
                if (showDate) setSelectedDate(new Date());

                if (autoRedirectAfterUpload) {
                    setTimeout(() => {
                        navigation.navigate("RateTable" as never);
                    }, 1000);
                }
            } catch (error: any) {
                console.error("Upload failed:", error);
                const errorMessage =
                    error?.message || error?.data?.message || "Upload failed";
                ShowToster(toast, errorMessage, "", "error");
            } finally {
                setUploading(false);
            }
        };

        return (
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    {icon && <Icon name={icon} size={24} color={categoryColor} />}
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.title}>{title}</Text>
                        {description && (
                            <Text style={styles.description}>{description}</Text>
                        )}
                    </View>
                </View>

                {/* File Picker */}
                {!hideFileInputArea && (
                    <TouchableOpacity
                        style={[styles.filePicker, disableFileInput && { opacity: 0.5 }]}
                        disabled={disableFileInput}
                        onPress={handleFilePick}
                    >
                        <Icon name="cloud-upload-alt" size={28} color={categoryColor} />
                        <Text style={styles.filePickerText}>
                            {selectedFile ? selectedFile.name : "Tap to select file"}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Date Picker */}
                {showDate && (
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateLabel}>Effective Date:</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateText}>
                                {selectedDate.toDateString()}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                minimumDate={new Date()}
                                onChange={handleDateChange}
                            />
                        )}
                    </View>
                )}

                {/* Upload Button */}
                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        { backgroundColor: disabled ? "#ccc" : categoryColor },
                    ]}
                    onPress={handleUpload}
                    disabled={uploading || disabled || !selectedFile}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.uploadText}>Upload {title}</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        margin: 12,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
    },
    description: {
        fontSize: 14,
        color: "#555",
        marginTop: 4,
    },
    filePicker: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderStyle: "dashed",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    filePickerText: {
        marginTop: 8,
        color: "#444",
        fontSize: 14,
    },
    dateContainer: {
        marginBottom: 16,
    },
    dateLabel: {
        fontSize: 14,
        color: "#333",
        marginBottom: 8,
    },
    dateButton: {
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        alignItems: "center",
    },
    dateText: {
        fontSize: 16,
        color: "#111",
    },
    uploadButton: {
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    uploadText: {
        color: "#fff",
        fontWeight: "600",
    },
});

export default FileUploadCard;
