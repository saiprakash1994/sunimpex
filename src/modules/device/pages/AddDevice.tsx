import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useToast } from "react-native-toast-notifications";

import { useCreateDeviceMutation, useEditDeviceMutation, useGetDeviceByIdQuery } from "../store/deviceEndPoint";
import { ShowToster } from "../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../globalStyle/GlobalStyles";
import { roles } from "../../../shared/utils/appRoles";
import { UserTypeHook } from "../../../shared/hooks/userTypeHook";
import { useGetAllDairysQuery } from "../../dairy/store/dairyEndPoint";
import { Picker } from "@react-native-picker/picker";

// Navigation types
type RootStackParamList = {
    DeviceAdd: { deviceId?: string };
};

type DeviceAddRouteProp = RouteProp<RootStackParamList, "DeviceAdd">;
type DeviceAddNavProp = NativeStackNavigationProp<RootStackParamList, "DeviceAdd">;

// Form and state types
interface FormState {
    deviceIdSuffix: string;
    email: string;
    status: "active" | "deactive";
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface AddDeviceProps {
    deviceId?: string;
    onClose?: () => void;
}

interface ErrorState {
    [key: string]: string;
}

interface ShowPasswordState {
    old: boolean;
    new: boolean;
    confirm: boolean;
}

const AddDevice = (props: AddDeviceProps) => {
    const navigation = useNavigation<DeviceAddNavProp>();
    const route = useRoute<DeviceAddRouteProp>();
    const id = props.deviceId || (route.params && route.params.deviceId);
    const toast = useToast();

    const userType = UserTypeHook();
    const [selectedDairyCode, setSelectedDairyCode] = useState("");

    const {
        data: deviceData,
        isSuccess,
        isLoading: fetching,
        isError,
    } = useGetDeviceByIdQuery(id!, { skip: !id });

    const {
        data: dairies = [],
        isLoading: dairiesLoading,
    } = useGetAllDairysQuery(undefined, { skip: userType !== roles.ADMIN });

    const [createDevice, { isLoading: creating }] = useCreateDeviceMutation();
    const [editDevice, { isLoading: updating }] = useEditDeviceMutation();

    const [form, setForm] = useState<FormState>({
        deviceIdSuffix: "",
        email: "",
        status: "active",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<ErrorState>({});
    const [showPassword, setShowPassword] = useState<ShowPasswordState>({
        old: false,
        new: false,
        confirm: false,
    });

    useEffect(() => {
        if (id && isSuccess && deviceData) {
            setSelectedDairyCode(deviceData?.dairyCode);
            setForm({
                deviceIdSuffix: deviceData.deviceid.slice(3),
                email: deviceData.email,
                status: deviceData.status,
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        }
    }, [id, deviceData, isSuccess]);

    useEffect(() => {
        if (id && isError) {
            ShowToster(toast, "Failed to fetch device data", "", "error");
        }
    }, [id, isError]);

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case "deviceIdSuffix":
                if (!/^\d{4}$/.test(value)) return "Enter 4 digit number.";
                return "";
            case "email":
                if (!value.trim()) return "Email is required.";
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return "Enter a valid email.";
                return "";
            case "oldPassword":
                if (id && form.newPassword && !value) return "Old password is required.";
                return "";
            case "newPassword":
                if (!id && (!value || value.length < 6)) return "Min 6 characters for password.";
                if (id && form.newPassword && !value) return "New password is required.";
                return "";
            case "confirmPassword":
                if (form.newPassword !== value) return "Passwords do not match.";
                return "";
            default:
                return "";
        }
    };

    const handleChange = (name: keyof FormState, value: string) => {
        let newValue = value;
        if (name === "deviceIdSuffix") {
            newValue = value.replace(/[^0-9]/g, "").slice(0, 4);
        }
        setForm((prev) => ({ ...prev, [name]: newValue }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }));
    };

    const onSave = async () => {
        const fields: (keyof FormState)[] = [
            "deviceIdSuffix",
            "email",
            "oldPassword",
            "newPassword",
            "confirmPassword",
        ];
        const errs: ErrorState = {};
        fields.forEach((field) => {
            errs[field] = validateField(field, form[field]);
        });
        if (!selectedDairyCode) errs["dairyCode"] = "Dairy code is required.";
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        try {
            const fullDeviceId = `${selectedDairyCode}${form.deviceIdSuffix}`;
            if (id) {
                const payload: any = {
                    email: form.email,
                    status: form.status,
                };
                if (form.newPassword) {
                    payload.password = form.newPassword;
                    payload.oldPassword = form.oldPassword;
                }
                await editDevice({ id, ...payload }).unwrap();
                ShowToster(toast, "Device updated successfully", "", "success");
            } else {
                await createDevice({
                    deviceid: fullDeviceId,
                    email: form.email,
                    status: form.status,
                    dairyCode: selectedDairyCode,
                    password: form.newPassword,
                }).unwrap();
                ShowToster(toast, "Device created successfully", "", "success");
            }
            if (props.onClose) {
                props.onClose();
            } else {
                navigation.goBack();
            }
        } catch (err: any) {
            const message = err?.data?.error || "Failed to save device.";
            ShowToster(toast, message, "", "error");
        }
    };

    const saving = creating || updating;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{id ? "Edit Device" : "Add Device"}</Text>

            {/* Dairy Code (only for admin and create flow) */}
            {userType === roles.ADMIN && !id && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Dairy Code</Text>
                    <TextInput
                        style={[styles.input, errors.dairyCode && styles.inputError]}
                        placeholder="e.g., SCT"
                        value={selectedDairyCode}
                        onChangeText={(value) =>
                            setSelectedDairyCode(value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3))
                        }
                        editable={!saving}
                    />
                    {errors.dairyCode && <Text style={styles.errorText}>{errors.dairyCode}</Text>}
                </View>
            )}

            {/* Device ID */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Device ID (4-digit)</Text>
                <TextInput
                    style={[styles.input, errors.deviceIdSuffix && styles.inputError]}
                    placeholder="0001"
                    value={form.deviceIdSuffix}
                    keyboardType="numeric"
                    maxLength={4}
                    onChangeText={(value) => handleChange("deviceIdSuffix", value)}
                    editable={!id && !saving}
                />
                {errors.deviceIdSuffix && <Text style={styles.errorText}>{errors.deviceIdSuffix}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter Email"
                    keyboardType="email-address"
                    value={form.email}
                    onChangeText={(value) => handleChange("email", value)}
                    editable={!saving}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            {/* Status */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={form.status}
                        onValueChange={(value) => handleChange("status", value)}
                        enabled={!saving}
                    >
                        <Picker.Item label="Active" value="active" />
                        <Picker.Item label="Deactive" value="deactive" />
                    </Picker>
                </View>
            </View>
            {/* Password Section */}
            {id && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Old Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, errors.oldPassword && styles.inputError, { flex: 1 }]}
                            placeholder="Enter Old Password"
                            secureTextEntry={!showPassword.old}
                            value={form.oldPassword}
                            onChangeText={(value) => handleChange("oldPassword", value)}
                            editable={!saving}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword((prev) => ({ ...prev, old: !prev.old }))}
                        >
                            <Icon
                                name={showPassword.old ? "eye" : "eye-slash"}
                                size={18}
                                color={THEME_COLORS.secondary}
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.oldPassword && <Text style={styles.errorText}>{errors.oldPassword}</Text>}
                </View>
            )}

            <View style={styles.inputGroup}>
                <Text style={styles.label}>{id ? "New Password" : "Password"}</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, errors.newPassword && styles.inputError, { flex: 1 }]}
                        placeholder="Enter New Password"
                        secureTextEntry={!showPassword.new}
                        value={form.newPassword}
                        onChangeText={(value) => handleChange("newPassword", value)}
                        editable={!saving}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                    >
                        <Icon
                            name={showPassword.new ? "eye" : "eye-slash"}
                            size={18}
                            color={THEME_COLORS.secondary}
                        />
                    </TouchableOpacity>
                </View>
                {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, errors.confirmPassword && styles.inputError, { flex: 1 }]}
                        placeholder="Confirm Password"
                        secureTextEntry={!showPassword.confirm}
                        value={form.confirmPassword}
                        onChangeText={(value) => handleChange("confirmPassword", value)}
                        editable={!saving}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    >
                        <Icon
                            name={showPassword.confirm ? "eye" : "eye-slash"}
                            size={18}
                            color={THEME_COLORS.secondary}
                        />
                    </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={onSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>{id ? "Update" : "Create"}</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={props.onClose ? props.onClose : () => navigation.goBack()}
                    disabled={saving}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: THEME_COLORS.primary,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: THEME_COLORS.secondary,
        textAlign: "center",
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: THEME_COLORS.secondary,
        marginBottom: 6,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: "#333",
    },
    inputError: {
        borderColor: "#dc3545", // red
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
    },
    errorText: {
        color: "#dc3545",
        fontSize: 12,
        marginTop: 4,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
        paddingHorizontal: 12,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 4,
    },
    saveButton: {
        backgroundColor: THEME_COLORS.secondary,
    },
    cancelButton: {
        backgroundColor: "#6c757d",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default AddDevice;
