import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useCreateDairyMutation, useEditDairyMutation, useGetDairyByIdQuery } from "../store/dairyEndPoint";
import { useToast } from "react-native-toast-notifications";
import { ShowToster } from "../../../shared/components/ShowToster";
import { TEXT_COLORS, THEME_COLORS } from "../../../globalStyle/GlobalStyles";

// Navigation types
type RootStackParamList = {
    DairyAdd: { dairyCode?: string };
};

type DairyAddRouteProp = RouteProp<RootStackParamList, "DairyAdd">;
type DairyAddNavProp = NativeStackNavigationProp<RootStackParamList, "DairyAdd">;

// Form and state types
interface FormState {
    dairyCode: string;
    dairyName: string;
    email: string;
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface AddDairyProps {
    dairyCode?: string;
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

const DairyAdd = (props: AddDairyProps) => {
    const navigation = useNavigation<DairyAddNavProp>();
    const route = useRoute<DairyAddRouteProp>();
    const id = props.dairyCode || (route.params && route.params.dairyCode);
    const toast = useToast();

    const {
        data: dairyData,
        isSuccess,
        isLoading: fetching,
        isError,
    } = useGetDairyByIdQuery(id, { skip: !id });

    const [createDairy, { isLoading: creating }] = useCreateDairyMutation();
    const [editDairy, { isLoading: updating }] = useEditDairyMutation();

    const [form, setForm] = useState<FormState>({
        dairyCode: "",
        dairyName: "",
        email: "",
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
        if (id && isSuccess && dairyData) {
            setForm({
                dairyCode: dairyData?.dairyCode || "",
                dairyName: dairyData?.dairyName || "",
                email: dairyData?.email || "",
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        }
    }, [id, dairyData, isSuccess]);

    useEffect(() => {
        if (id && isError) {
            ShowToster(toast, "Failed to fetch dairy data", "", "error");
        }
    }, [id, isError]);

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case "dairyCode":
                if (!/^[A-Z]{3}$/.test(value)) return "Must be 3 uppercase letters (A-Z)";
                return "";
            case "dairyName":
                if (!value.trim()) return "Dairy name is required.";
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
                if (!id && (!value || value.length < 6)) return "Min 6 characters for password";
                if (id && form.newPassword && !value) return "New password is required.";
                return "";
            case "confirmPassword":
                if (!id && (!value || value.length < 6)) return "Confirm the new password";
                if (form.newPassword !== value) return "Passwords do not match.";
                return "";
            default:
                return "";
        }
    };

    const handleChange = (name: keyof FormState, value: string) => {
        let newValue = value;
        if (name === "dairyCode") {
            newValue = value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3);
        }
        setForm((prev) => ({ ...prev, [name]: newValue }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }));
    };

    const onSave = async () => {
        const fields: (keyof FormState)[] = [
            "dairyCode",
            "dairyName",
            "email",
            "oldPassword",
            "newPassword",
            "confirmPassword",
        ];
        const errs: ErrorState = {};
        fields.forEach((field) => {
            errs[field] = validateField(field, form[field]);
        });
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        try {
            if (id) {
                const payload: any = {
                    dairyName: form.dairyName,
                    email: form.email,
                };
                if (form.newPassword) {
                    payload.password = form.newPassword;
                    payload.oldPassword = form.oldPassword;
                }
                await editDairy({ id, ...payload }).unwrap();
                ShowToster(toast, "Dairy updated successfully", "", "success");
            } else {
                await createDairy({
                    dairyCode: form.dairyCode,
                    dairyName: form.dairyName,
                    email: form.email,
                    password: form.newPassword,
                }).unwrap();
                ShowToster(toast, "Dairy created successfully", "", "success");
            }
            if (props.onClose) {
                props.onClose();
            } else {
                navigation.goBack();
            }
        } catch (err: any) {
            const message = err?.data?.error || "Failed to save dairy.";
            ShowToster(toast, message, "", "error");
        }
    };

    const saving = creating || updating;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{id ? "Edit Dairy" : "Add Dairy"}</Text>

            {!id && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Dairy Code</Text>
                    <TextInput
                        style={[styles.input, errors.dairyCode && styles.inputError]}
                        placeholder="ABC"
                        value={form.dairyCode}
                        maxLength={3}
                        onChangeText={(value) => handleChange("dairyCode", value)}
                        editable={!saving}
                    />
                    {errors.dairyCode && <Text style={styles.errorText}>{errors.dairyCode}</Text>}
                </View>
            )}

            {/* Dairy Name */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Dairy Name</Text>
                <TextInput
                    style={[styles.input, errors.dairyName && styles.inputError]}
                    placeholder="Enter Dairy Name"
                    value={form.dairyName}
                    onChangeText={(value) => handleChange("dairyName", value)}
                    editable={!saving}
                />
                {errors.dairyName && <Text style={styles.errorText}>{errors.dairyName}</Text>}
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

            {/* Password Section */}
            {/* <Text style={styles.sectionTitle}>Set Password</Text> */}
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
                <Text style={styles.label}>New Password</Text>
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
                            name={showPassword.confirm ? "eye-slash" : "eye"}
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
    inputSuccess: {
        borderColor: "#28a745", // green
    },
    errorText: {
        color: "#dc3545",
        fontSize: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: TEXT_COLORS.whiteColor,
        marginTop: 24,
        marginBottom: 8,
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
export default DairyAdd;
