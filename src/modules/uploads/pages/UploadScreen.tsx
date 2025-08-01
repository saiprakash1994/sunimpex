import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";

import FileUploadCard, { FileUploadCardRef } from "../components/FileUploadCard";
import {
    useUploadFatBufMutation,
    useUploadFatCowMutation,
    useUploadSnfBufMutation,
    useUploadSnfCowMutation,
    useUploadMemberMutation,
    useUploadClrBufMutation,
    useUploadClrCowMutation,
} from "../store/uploadEndPoint";
import { useGetDeviceByIdQuery } from "../../device/store/deviceEndPoint";
import { roles } from "../../../shared/utils/appRoles";
import { THEME_COLORS } from "../../../globalStyle/GlobalStyles";

const UploadScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const userInfo = useSelector((state: any) => state.userInfoSlice.userInfo);
    const { csv, filename, deviceId, preferredUploadTab } = route.params || {};
    const deviceid = deviceId || userInfo?.deviceid;

    const { data: deviceData } = useGetDeviceByIdQuery(deviceid, {
        skip: !deviceid,
    });
    const isDeviceUser = !!deviceId || userInfo?.role === roles.DEVICE;
    const isDairyUser = !isDeviceUser && userInfo?.role === roles.DAIRY;

    // Mutations
    const [uploadSnfBufTable] = useUploadSnfBufMutation();
    const [uploadSnfCowTable] = useUploadSnfCowMutation();
    const [uploadFatBufTable] = useUploadFatBufMutation();
    const [uploadFatCowTable] = useUploadFatCowMutation();
    const [uploadMemberTable] = useUploadMemberMutation();
    const [uploadClrBufTable] = useUploadClrBufMutation();
    const [uploadClrCowTable] = useUploadClrCowMutation();

    // Refs
    const snfBufRef = useRef<FileUploadCardRef>(null);
    const snfCowRef = useRef<FileUploadCardRef>(null);
    const fatBufRef = useRef<FileUploadCardRef>(null);
    const fatCowRef = useRef<FileUploadCardRef>(null);
    const clrBufRef = useRef<FileUploadCardRef>(null);
    const clrCowRef = useRef<FileUploadCardRef>(null);
    const memberRef = useRef<FileUploadCardRef>(null);

    const uploadCategories = [
        {
            key: "fat-buf",
            title: "FAT BUF TABLE",
            icon: "tint",
            ref: fatBufRef,
            onUpload: uploadFatBufTable,
            toastMsg: "FAT Buf table uploaded successfully",
            showDate: true,
            dateFieldName: "fatBufEffectiveDate",
            description: "Buffalo milk FAT rates",
            categoryColor: THEME_COLORS.secondary,
        },
        {
            key: "fat-cow",
            title: "FAT COW TABLE",
            icon: "tint",
            ref: fatCowRef,
            onUpload: uploadFatCowTable,
            toastMsg: "FAT Cow table uploaded successfully",
            showDate: true,
            dateFieldName: "fatCowEffectiveDate",
            description: "Cow milk FAT rates",
            categoryColor: THEME_COLORS.secondary,
        },
        {
            key: "snf-buf",
            title: "SNF BUF TABLE",
            icon: "chart-line",
            ref: snfBufRef,
            onUpload: uploadSnfBufTable,
            toastMsg: "SNF Buf table uploaded successfully",
            showDate: true,
            dateFieldName: "snfBufEffectiveDate",
            description: "Buffalo milk SNF rates",
            categoryColor: THEME_COLORS.secondary,
        },
        {
            key: "snf-cow",
            title: "SNF COW TABLE",
            icon: "chart-line",
            ref: snfCowRef,
            onUpload: uploadSnfCowTable,
            toastMsg: "SNF Cow table uploaded successfully",
            showDate: true,
            dateFieldName: "snfCowEffectiveDate",
            description: "Cow milk SNF rates",
            categoryColor: THEME_COLORS.secondary,
        },
        {
            key: "clr-buf",
            title: "CLR BUF TABLE",
            icon: "chart-line",
            ref: clrBufRef,
            onUpload: uploadClrBufTable,
            toastMsg: "CLR Buf table uploaded successfully",
            showDate: true,
            dateFieldName: "clrBufEffectiveDate",
            description: "Buffalo milk CLR rates",
            categoryColor: THEME_COLORS.secondary,
        },
        {
            key: "clr-cow",
            title: "CLR COW TABLE",
            icon: "chart-line",
            ref: clrCowRef,
            onUpload: uploadClrCowTable,
            toastMsg: "CLR Cow table uploaded successfully",
            showDate: true,
            dateFieldName: "clrCowEffectiveDate",
            description: "Cow milk CLR rates",
            categoryColor: THEME_COLORS.secondary,
        },
        ...(isDeviceUser
            ? [
                {
                    key: "member",
                    title: "MEMBER TABLE",
                    icon: "users",
                    ref: memberRef,
                    onUpload: uploadMemberTable,
                    toastMsg: "Member table uploaded successfully",
                    showDate: false,
                    description: "Member information and details",
                    categoryColor: THEME_COLORS.secondary,
                },
            ]
            : []),
    ];

    const [activeKey, setActiveKey] = useState(
        preferredUploadTab &&
            uploadCategories.some((cat) => cat.key === preferredUploadTab)
            ? preferredUploadTab
            : uploadCategories[0]?.key
    );

    // Handle auto-upload (CSV passed via navigation)
    useEffect(() => {
        if (csv && filename) {
            const file: any = { uri: csv, name: filename, type: "text/csv" };
            if (filename.includes("SNF_BUF")) snfBufRef.current?.autoUploadFromParent(file);
            else if (filename.includes("SNF_COW")) snfCowRef.current?.autoUploadFromParent(file);
            else if (filename.includes("CLR_BUF")) clrBufRef.current?.autoUploadFromParent(file);
            else if (filename.includes("CLR_COW")) clrCowRef.current?.autoUploadFromParent(file);
            else if (filename.includes("FAT_BUF")) fatBufRef.current?.autoUploadFromParent(file);
            else if (filename.includes("FAT_COW")) fatCowRef.current?.autoUploadFromParent(file);
            else if (filename.includes("MEMBER")) memberRef.current?.autoUploadFromParent(file);
        }
    }, [csv, filename]);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>
                <Icon name="cloud-upload-alt" size={20} /> Uploads
            </Text>

            {/* Sidebar Tabs */}
            <View style={styles.tabBar}>
                {uploadCategories.map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        style={[
                            styles.tabButton,
                            activeKey === cat.key && styles.tabButtonActive,
                        ]}
                        onPress={() => setActiveKey(cat.key)}
                    >
                        <Icon name={cat.icon} size={16} color="#fff" />
                        <Text style={styles.tabButtonText}>{cat.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Active Tab Content */}
            <View style={styles.tabContent}>
                {uploadCategories
                    .filter((cat) => cat.key === activeKey)
                    .map((category) => (
                        <FileUploadCard
                            key={category.key}
                            ref={category.ref}
                            title={category.title}
                            onUpload={category.onUpload}
                            toastMsg={category.toastMsg}
                            showDate={category.showDate}
                            dateFieldName={category.dateFieldName}
                            icon={category.icon}
                            description={category.description}
                            categoryColor={category.categoryColor}
                            deviceId={deviceId}
                        />
                    ))}
            </View>

            {/* Guidelines */}
            <View style={styles.guidelinesCard}>
                <Text style={styles.guidelineTitle}>
                    <Icon name="file-alt" size={16} /> Upload Guidelines
                </Text>
                <View style={styles.guidelineItem}>
                    <Icon name="file-alt" size={14} />
                    <Text style={styles.guidelineText}>
                        Ensure your files are in CSV format as specified for each type.
                    </Text>
                </View>
                <View style={styles.guidelineItem}>
                    <Icon name="database" size={14} />
                    <Text style={styles.guidelineText}>
                        Verify that your data meets validation criteria before uploading.
                    </Text>
                </View>
                <View style={styles.guidelineItem}>
                    <Icon name="cloud-upload-alt" size={14} />
                    <Text style={styles.guidelineText}>
                        Set appropriate effective dates for rate tables.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9fafb", padding: 12 },
    headerTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
    tabBar: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 16,
    },
    tabButton: {
        backgroundColor: "#6b7280",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        margin: 4,
        flexDirection: "row",
        alignItems: "center",
    },
    tabButtonActive: { backgroundColor: THEME_COLORS.secondary },
    tabButtonText: { color: "#fff", marginLeft: 6 },
    tabContent: { marginBottom: 20 },
    guidelinesCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        shadowOpacity: 0.1,
        elevation: 3,
        marginBottom: 20,
    },
    guidelineTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
    guidelineItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    guidelineText: { marginLeft: 8, color: "#374151" },
});



export default UploadScreen