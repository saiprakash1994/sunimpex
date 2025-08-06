import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Image,
    Alert,
    ImageBackground,
    ScrollView
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../store/authenticateEndPoints";
import { adduserInfo } from "../../store/userInfoSlice";
import { roles } from "../../../../shared/utils/appRoles";
import { setItemToLocalStorage, AppConstants } from "../../../../shared/utils/localStorage";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faEye,
    faEyeSlash,
    faEnvelope,
    faLock,
    faArrowRight,
    faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";
const backgroundImg = require('../../../../assets/login_bg.png');
import { useToast } from 'react-native-toast-notifications';
import { ShowToster } from "../../../../shared/components/ShowToster";
type RootStackParamList = {
    login: undefined;
    main: undefined;
};

const LoginScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const dispatch = useDispatch();
    const toast = useToast();

    const [login, { isLoading }] = useLoginMutation();

    const [loginInfo, setLoginInfo] = useState<{ email: string; password: string }>({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [isFormValid, setIsFormValid] = useState<boolean>(false);

    useEffect(() => {
        const email = loginInfo.email.trim();
        const password = loginInfo.password.trim();

        const newErrors: { email?: string; password?: string } = {};

        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (password && password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        setIsFormValid(email !== "" && password !== "" && Object.keys(newErrors).length === 0);
    }, [loginInfo]);

    const handleChange = (field: "email" | "password", value: string): void => {
        setLoginInfo((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        const email = loginInfo.email.trim();
        const password = loginInfo.password.trim();

        if (!email || !password) {
            Alert.alert("Validation Error", "Email and password are required");
            return false;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            Alert.alert("Validation Error", "Please enter a valid email");
            return false;
        }

        if (password.length < 6) {
            Alert.alert("Validation Error", "Password must be at least 6 characters");
            return false;
        }

        return true;
    };

    const handleLogin = async (): Promise<void> => {
        if (!validateForm()) return;

        try {
            const response: any = await login({
                email: loginInfo.email.trim(),
                password: loginInfo.password.trim(),
            }).unwrap(); // unwrap will throw if there's an error
            if (response?.error) {
                ShowToster(toast, "Invalid credentials. Please try again.", "", 'error');
                return;
            }
            const { message, accessToken, refreshToken, role, dairyName, dairyCode, deviceName, deviceid } = response;

            ShowToster(toast, message, '', 'success');

            const userInfo = {
                role,
                ...(role === roles.ADMIN || role === roles.DAIRY
                    ? { dairyName, dairyCode }
                    : { deviceName, deviceid, dairyCode }),
            };

            // Save tokens & user info
            await setItemToLocalStorage(AppConstants.accessToken, accessToken);
            await setItemToLocalStorage(AppConstants.refreshToken, refreshToken);
            await setItemToLocalStorage(AppConstants.userInfo, JSON.stringify(userInfo));

            dispatch(adduserInfo(userInfo));

            setLoginInfo({ email: "", password: "" });

        } catch (err: any) {
            console.error("Login error:", err);
            ShowToster(toast, "Login Failed. Invalid credentials.", '', "error");
        }
    };


    return (
        <ImageBackground source={backgroundImg}
            style={{ height: '100%', width: '100%' }}>
            <ScrollView showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps='always'>
                <View style={styles.container}>
                    {/* Top Image */}
                    <View style={styles.imageSection}>
                        <Text style={styles.title}>SunImpex Dairy Management</Text>
                        <Text style={styles.subtitle}>Intelligent dairy operations and monitoring system</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formSection}>
                        {/* <Image source={require("../../../../assets/smatrchipLogo.png")} style={styles.logo} resizeMode="contain" /> */}
                        <Text style={styles.signInTitle}>Sign in to your account</Text>
                        <View style={styles.securityBadge}>
                            <FontAwesomeIcon icon={faShieldAlt} size={14} color={TEXT_COLORS.whiteColor} />
                            <Text style={styles.securityText}>Secure Login</Text>
                        </View>

                        <View style={styles.inputWrapper}>
                            <FontAwesomeIcon icon={faEnvelope} size={18} color={THEME_COLORS.secondary} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Email Address"
                                placeholderTextColor={TEXT_COLORS.primary}
                                value={loginInfo.email}
                                onChangeText={(text) => handleChange("email", text)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={[styles.input, errors.email && styles.inputError]}
                                editable={!isLoading}
                            />
                        </View>
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <FontAwesomeIcon icon={faLock} size={18} color={THEME_COLORS.secondary} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor={TEXT_COLORS.primary}
                                value={loginInfo.password}
                                onChangeText={(text) => handleChange("password", text)}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                style={[styles.input, errors.password && styles.inputError]}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword((prev) => !prev)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} size={18} color={THEME_COLORS.secondary} />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                        <TouchableOpacity
                            style={[styles.loginButton, !isFormValid && styles.disabledButton]}
                            onPress={handleLogin}
                            disabled={isLoading || !isFormValid}
                        >
                            {isLoading ? (
                                <Text style={styles.loginButtonText}>Signing in...<ActivityIndicator color="#fff" /></Text>
                            ) : (
                                <Text style={styles.loginButtonText}>Sign in <FontAwesomeIcon icon={faArrowRight} size={14} color="#fff" /></Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default LoginScreen;




const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: '3%'
    },
    container: {
        width: '100%',
        // flex: 1,
        backgroundColor: "#fff",
        // justifyContent: "center",
    },
    imageSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    mainImage: {
        width: 200,
        height: 150,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: THEME_COLORS.secondary,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: TEXT_COLORS.secondary,
        textAlign: "center",
        marginTop: 5,
    },
    formSection: {
        paddingHorizontal: 20,
    },
    logo: {
        width: 80,
        height: 80,
        alignSelf: "center",
        marginBottom: 15,
    },
    signInTitle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
        color: THEME_COLORS.secondary
    },
    securityBadge: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#28a745",
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: "center",
        shadowColor: "#28a745",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    securityText: {
        fontSize: 12,
        color: TEXT_COLORS.whiteColor,
        fontWeight: "500",
        marginLeft: 6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ced4da",
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 16,
        color: TEXT_COLORS.primary
    },
    inputError: {
        borderColor: "red",
    },
    inputIcon: {
        marginRight: 8,
    },
    eyeIcon: {
        paddingHorizontal: 5,
    },
    errorText: {
        color: TEXT_COLORS.error,
        fontSize: 12,
        marginBottom: 5,
        marginLeft: 5,
    },
    loginButton: {
        backgroundColor: THEME_COLORS.secondary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: TEXT_COLORS.secondary,
    },
    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
