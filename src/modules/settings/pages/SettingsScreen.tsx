import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { UserTypeHook } from '../../../shared/hooks/userTypeHook';
import { roles } from '../../../shared/utils/appRoles';
import { useEditDeviceMutation, useGetAllDevicesQuery, useGetDeviceByCodeQuery, useGetDeviceByIdQuery } from '../../device/store/deviceEndPoint';
import { useToast } from 'react-native-toast-notifications';
import { ShowToster } from '../../../shared/components/ShowToster';
import { Picker } from '@react-native-picker/picker';
import { TEXT_COLORS, THEME_COLORS } from '../../../globalStyle/GlobalStyles';


// Types
interface SettingsType {
    serverControl: boolean;
    weightMode: 'AUTO' | 'MANUAL';
    fatMode: 'AUTO' | 'MANUAL';
    analyzer: string;
    useCowSnf: boolean;
    useBufSnf: boolean;
    highFatAccept: boolean;
    lowFatAccept: boolean;
    dpuMemberList: boolean;
    dpuRateTables: boolean;
    dpuCollectionModeControl: boolean;
    autoTransfer: boolean;
    autoShiftClose: boolean;
    mixedMilk: boolean;
    machineLock: boolean;
    commissionType: boolean;
    normalCommission: string;
    specialCommission: string[];
    clrBasedTable: boolean;
}

const analyzerOptions = [
    { value: 'EKO Ultra', label: 'EKO Ultra' },
    { value: 'Ultra Pro', label: 'Ultra Pro' },
    { value: 'Lacto Scan', label: 'Lacto Scan' },
    { value: 'Ksheera', label: 'Ksheera' },
    { value: 'Essae', label: 'Essae' },
    { value: 'Milk Tester', label: 'Milk Tester' },
];

const tabOptions = [
    { key: 'general', label: 'General', icon: 'cog' },
    { key: 'milk-analysis', label: 'Milk Analysis', icon: 'tint' },
    { key: 'dpu', label: 'DPU', icon: 'users' },
    { key: 'automation', label: 'Automation', icon: 'sync' },
    { key: 'commission', label: 'Commission', icon: 'calculator' },
    { key: 'security', label: 'Security', icon: 'shield-alt' },
];

const SettingsScreen: React.FC = () => {
    const userType = UserTypeHook();
    const userInfo = useSelector((state: any) => state.userInfoSlice.userInfo);
    const navigation = useNavigation();
    const toast = useToast();
    const route = useRoute<any>();
    const isDairy = userType === roles.DAIRY;
    const isDevice = userType === roles.DEVICE;
    const isAdmin = userType === roles.ADMIN;

    const deviceid = userInfo?.deviceid;
    const dairyCode = userInfo?.dairyCode;
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>((isDevice ? deviceid : ''));
    const [originalSettings, setOriginalSettings] = useState<Partial<SettingsType>>({});
    const [settings, setSettings] = useState<Partial<SettingsType>>({});
    const [activeTab, setActiveTab] = useState<string>('general');
    const idToFetch = isDevice ? deviceid : selectedDeviceId;
    const { data: allDevices = [] } = useGetAllDevicesQuery(undefined, { skip: !isAdmin });

    const { data: dairyDevices = [] } = useGetDeviceByCodeQuery(dairyCode, {
        skip: !isDairy || !dairyCode,
    });
    const deviceList = isAdmin ? allDevices : isDairy ? dairyDevices : [];
    const {
        data: deviceData,
        isLoading,
        isError,
        refetch,
    } = useGetDeviceByIdQuery(idToFetch, {
        skip: !idToFetch,
    });
    console.log(allDevices, dairyDevices, deviceData)

    const [editDevice] = useEditDeviceMutation();

    const isValidCommission = (value: string) =>
        /^\d{1,2}(\.\d{0,2})?$/.test(value) && parseFloat(value) <= 99.99;

    const formatCommission = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 99.99) return '00.00';
        return num.toFixed(2).padStart(5, '0');
    };

    useEffect(() => {
        if (deviceData && deviceData.serverSettings) {
            const server = deviceData.serverSettings;
            const mapped: SettingsType = {
                serverControl: server.serverControl === 'Y',
                weightMode: server.weightMode === '1' ? 'AUTO' : 'MANUAL',
                fatMode: server.fatMode === '1' ? 'AUTO' : 'MANUAL',
                analyzer:
                    server.analyzer === 'U'
                        ? 'EKO Ultra'
                        : server.analyzer === 'P'
                            ? 'Ultra Pro'
                            : server.analyzer === 'L'
                                ? 'Lacto Scan'
                                : server.analyzer === 'K'
                                    ? 'Ksheera'
                                    : server.analyzer === 'E'
                                        ? 'Essae'
                                        : 'Milk Tester',
                useCowSnf: server.useCowSnf === 'Y',
                useBufSnf: server.useBufSnf === 'Y',
                highFatAccept: server.highFatAccept === 'Y',
                lowFatAccept: server.lowFatAccept === 'Y',
                dpuMemberList: server.dpuMemberList === 'Y',
                dpuRateTables: server.dpuRateTables === 'Y',
                dpuCollectionModeControl: server.dpuCollectionModeControl === 'Y',
                autoTransfer: server.autoTransfer === 'Y',
                autoShiftClose: server.autoShiftClose === 'Y',
                mixedMilk: server.mixedMilk === 'Y',
                machineLock: server.machineLock === 'Y',
                commissionType: server.commissionType === 'Y',
                normalCommission: server.normalCommission || '00.00',
                specialCommission: Array.isArray(server.specialCommission)
                    ? [...server.specialCommission, ...Array(9).fill('00.00')].slice(0, 9)
                    : Array(9).fill(server.specialCommission || '00.00'),
                clrBasedTable: server.clrBasedTable === 'Y',
            };
            setSettings(mapped);
            setOriginalSettings(mapped);
        }
    }, [deviceData]);



    const handleChange = (field: keyof SettingsType, value: any) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleSpecialCommissionChange = (index: number, value: string) => {
        setSettings((prev) => {
            const updated = [...(prev.specialCommission || [])];
            updated[index] = value;
            return { ...prev, specialCommission: updated };
        });
    };

    const areSettingsEqual = (a: any, b: any) => {
        return JSON.stringify(a) === JSON.stringify(b);
    };

    const handleSave = async () => {
        const hasInvalidSpecial = settings.specialCommission?.some(
            (val) => !isValidCommission(val)
        );
        if (!isValidCommission(settings.normalCommission || '') || hasInvalidSpecial) {
            ShowToster(toast, 'Please enter valid commission values (00.00 to 99.99)', '', 'error');
            return;
        }
        const payload = {
            serverSettings: {
                serverControl: settings.serverControl ? 'Y' : 'N',
                weightMode: settings.weightMode === 'AUTO' ? '1' : '0',
                fatMode: settings.fatMode === 'AUTO' ? '1' : '0',
                analyzer:
                    settings.analyzer === 'EKO Ultra'
                        ? 'U'
                        : settings.analyzer === 'Ultra Pro'
                            ? 'P'
                            : settings.analyzer === 'Lacto Scan'
                                ? 'L'
                                : settings.analyzer === 'Ksheera'
                                    ? 'K'
                                    : settings.analyzer === 'Essae'
                                        ? 'E'
                                        : 'M',
                useCowSnf: settings.useCowSnf ? 'Y' : 'N',
                useBufSnf: settings.useBufSnf ? 'Y' : 'N',
                highFatAccept: settings.highFatAccept ? 'Y' : 'N',
                lowFatAccept: settings.lowFatAccept ? 'Y' : 'N',
                dpuMemberList: settings.dpuMemberList ? 'Y' : 'N',
                dpuRateTables: settings.dpuRateTables ? 'Y' : 'N',
                dpuCollectionModeControl: settings.dpuCollectionModeControl ? 'Y' : 'N',
                autoTransfer: settings.autoTransfer ? 'Y' : 'N',
                autoShiftClose: settings.autoShiftClose ? 'Y' : 'N',
                mixedMilk: settings.mixedMilk ? 'Y' : 'N',
                machineLock: settings.machineLock ? 'Y' : 'N',
                commissionType: settings.commissionType ? 'Y' : 'N',
                normalCommission: formatCommission(settings.normalCommission || ''),
                specialCommission: (settings.specialCommission || [])
                    .filter((val) => val.trim() !== '')
                    .map(formatCommission),
                clrBasedTable: settings.clrBasedTable ? 'Y' : 'N',
            },
        };
        try {
            await editDevice({ id: idToFetch, ...payload }).unwrap();
            ShowToster(toast, 'Settings saved successfully!', '', 'success');
            navigation.navigate('Dashboard' as never);
            refetch();
        } catch (err) {
            ShowToster(toast, 'Error saving settings.', '', 'error');
        }
    };

    // Device selection for Dairy users
    const renderDeviceSelection = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>
                <Icon name="desktop" size={18} color={THEME_COLORS.secondary} /> Select Device
            </Text>
            <View style={{ marginVertical: 8 }}>
                <Picker
                    selectedValue={selectedDeviceId}
                    onValueChange={(value) => setSelectedDeviceId(value)}
                    style={styles.pickerModern}

                >
                    <Picker.Item label="-- Select Device --" value="" />
                    {deviceList?.map((dev: any) => (
                        <Picker.Item key={dev.deviceid} label={dev.deviceid} value={dev.deviceid} />
                    ))}
                </Picker>
            </View>
        </View>
    );

    // Tab bar
    const renderTabs = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
            <View style={styles.tabBar}>
                {tabOptions.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Icon name={tab.icon} size={16} color={activeTab === tab.key ? THEME_COLORS.secondary : '#888'} />
                        <Text style={[styles.tabButtonText, activeTab === tab.key && { color: THEME_COLORS.secondary }]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    // Switch control
    const SwitchControl = ({ label, value, onValueChange, icon, description }: { label: string; value: boolean; onValueChange: (v: boolean) => void; icon: string; description?: string }) => (
        <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}><Icon name={icon} size={16} /> {label}</Text>
                {description ? <Text style={styles.switchDesc}>{description}</Text> : null}
            </View>
            <Switch value={!!value} onValueChange={onValueChange} />
        </View>
    );

    // Tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <View>
                        <SwitchControl
                            label="Server Control"
                            value={!!settings.serverControl}
                            onValueChange={(v) => handleChange('serverControl', v)}
                            icon="server"
                            description="Enable server-based control for this device"
                        />
                        <SwitchControl
                            label="Machine Lock"
                            value={!!settings.machineLock}
                            onValueChange={(v) => handleChange('machineLock', v)}
                            icon="lock"
                            description="Lock the machine to prevent unauthorized access"
                        />
                    </View>
                );
            case 'milk-analysis':
                return (
                    <View>
                        <Text style={styles.sectionTitle}><Icon name="chart-line" size={16} /> Milk Analyzer</Text>
                        <ScrollView horizontal style={{ marginVertical: 8 }}>
                            {analyzerOptions.map((analyzer) => (
                                <TouchableOpacity
                                    key={analyzer.value}
                                    style={[
                                        styles.analyzerButton,
                                        settings.analyzer === analyzer.value && styles.analyzerButtonSelected,
                                    ]}
                                    onPress={() => handleChange('analyzer', analyzer.value)}
                                >
                                    <Text style={styles.analyzerButtonText}>{analyzer.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label={`Weight Mode (${settings.weightMode === 'AUTO' ? 'AUTO' : 'MANUAL'})`}
                                    value={settings.weightMode === 'AUTO'}
                                    onValueChange={(v) => handleChange('weightMode', v ? 'AUTO' : 'MANUAL')}
                                    icon="weight-hanging"
                                    description="Toggle between AUTO and MANUAL weight mode"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label={`Analyzer Mode (${settings.fatMode === 'AUTO' ? 'AUTO' : 'MANUAL'})`}
                                    value={settings.fatMode === 'AUTO'}
                                    onValueChange={(v) => handleChange('fatMode', v ? 'AUTO' : 'MANUAL')}
                                    icon="chart-line"
                                    description="Toggle between AUTO and MANUAL analyzer mode"
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label="CLR Based Table"
                                    value={!!settings.clrBasedTable}
                                    onValueChange={(v) => handleChange('clrBasedTable', v)}
                                    icon="table"
                                    description="Enable CLR based rate table for milk analysis"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label="Mixed Milk"
                                    value={!!settings.mixedMilk}
                                    onValueChange={(v) => handleChange('mixedMilk', v)}
                                    icon="layer-group"
                                    description="Allow processing of mixed milk types"
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label={settings.clrBasedTable ? 'Use Cow CLR' : 'Use Cow SNF'}
                                    value={!!settings.useCowSnf}
                                    onValueChange={(v) => handleChange('useCowSnf', v)}
                                    icon="tint"
                                    description={settings.clrBasedTable ? 'Enable CLR calculation for cow milk' : 'Enable SNF calculation for cow milk'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label={settings.clrBasedTable ? 'Use Buf CLR' : 'Use Buf SNF'}
                                    value={!!settings.useBufSnf}
                                    onValueChange={(v) => handleChange('useBufSnf', v)}
                                    icon="tint"
                                    description={settings.clrBasedTable ? 'Enable CLR calculation for buffalo milk' : 'Enable SNF calculation for buffalo milk'}
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label="High FAT Accept"
                                    value={!!settings.highFatAccept}
                                    onValueChange={(v) => handleChange('highFatAccept', v)}
                                    icon="tint"
                                    description="Accept milk with high fat content"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <SwitchControl
                                    label="Low FAT Accept"
                                    value={!!settings.lowFatAccept}
                                    onValueChange={(v) => handleChange('lowFatAccept', v)}
                                    icon="tint"
                                    description="Accept milk with low fat content"
                                />
                            </View>
                        </View>
                    </View>
                );
            case 'dpu':
                return (
                    <View>
                        <SwitchControl
                            label="DPU Member List"
                            value={!!settings.dpuMemberList}
                            onValueChange={(v) => handleChange('dpuMemberList', v)}
                            icon="users"
                            description="Enable DPU member list functionality"
                        />
                        <SwitchControl
                            label="DPU Rate Tables"
                            value={!!settings.dpuRateTables}
                            onValueChange={(v) => handleChange('dpuRateTables', v)}
                            icon="table"
                            description="Enable DPU rate table management"
                        />
                        <SwitchControl
                            label="DPU Collection Mode Control"
                            value={!!settings.dpuCollectionModeControl}
                            onValueChange={(v) => handleChange('dpuCollectionModeControl', v)}
                            icon="users"
                            description="Enable DPU collection mode control"
                        />
                    </View>
                );
            case 'automation':
                return (
                    <View>
                        <SwitchControl
                            label="Auto Transfer"
                            value={!!settings.autoTransfer}
                            onValueChange={(v) => handleChange('autoTransfer', v)}
                            icon="exchange-alt"
                            description="Enable automatic data transfer"
                        />
                        <SwitchControl
                            label="Auto Shift Close"
                            value={!!settings.autoShiftClose}
                            onValueChange={(v) => handleChange('autoShiftClose', v)}
                            icon="clock"
                            description="Automatically close shifts at scheduled times"
                        />
                    </View>
                );
            case 'commission':
                return (
                    <View>
                        <SwitchControl
                            label="Commission Type"
                            value={!!settings.commissionType}
                            onValueChange={(v) => handleChange('commissionType', v)}
                            icon="calculator"
                            description="Enable or disable commission calculations"
                        />
                        <View style={{ marginVertical: 8 }}>
                            <Text style={styles.inputLabel}><Icon name="calculator" size={16} /> Normal Commission</Text>
                            <TextInput
                                style={[styles.input, !settings.commissionType && styles.inputDisabled]}
                                placeholder="00.00"
                                value={settings.normalCommission}
                                onChangeText={(v) => handleChange('normalCommission', v)}
                                onBlur={() => handleChange('normalCommission', formatCommission(settings.normalCommission || ''))}
                                editable={!!settings.commissionType}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <Text style={styles.inputLabel}><Icon name="calculator" size={16} /> Special Commissions</Text>
                        <View style={styles.specialCommissionRow}>
                            {(settings.specialCommission || []).map((val, i) => (
                                <TextInput
                                    key={i}
                                    style={[styles.input, !settings.commissionType && styles.inputDisabled, { width: 80, margin: 4 }]}
                                    placeholder="00.00"
                                    value={val}
                                    onChangeText={(v) => handleSpecialCommissionChange(i, v)}
                                    onBlur={() => handleSpecialCommissionChange(i, formatCommission(val))}
                                    editable={!!settings.commissionType}
                                    keyboardType="decimal-pad"
                                />
                            ))}
                        </View>
                        {!settings.commissionType && (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoBoxText}><Icon name="calculator" size={16} /> Commission calculations are currently disabled. Enable "Commission Type" to configure commission rates.</Text>
                            </View>
                        )}
                    </View>
                );
            case 'security':
                return (
                    <View>
                        <SwitchControl
                            label="Machine Lock"
                            value={!!settings.machineLock}
                            onValueChange={(v) => handleChange('machineLock', v)}
                            icon="lock"
                            description="Lock the machine to prevent unauthorized access"
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    // Save button
    const renderSaveButton = () => (
        <TouchableOpacity
            style={[styles.saveButton, areSettingsEqual(settings, originalSettings) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={areSettingsEqual(settings, originalSettings)}
        >
            <Icon name="save" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
    );

    // Main render
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            {!isDevice && !selectedDeviceId && renderDeviceSelection()}
            {isLoading && (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={THEME_COLORS.secondary} />
                    <Text style={{ marginTop: 8 }}>Loading settings...</Text>
                </View>
            )}
            {isError && (
                <View style={styles.errorBox}>
                    <Text style={{ color: 'red' }}>Error loading settings.</Text>
                </View>
            )}
            {!isLoading && deviceData && selectedDeviceId && (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                            <Text style={styles.cardTitle}>
                                <Icon name="cog" size={18} /> Device Configuration
                            </Text>
                            <View style={styles.deviceIdBadge}>
                                <Text style={styles.deviceIdBadgeText}>{selectedDeviceId}</Text>
                            </View>
                            {!isDevice && (
                                <TouchableOpacity onPress={() => setSelectedDeviceId('')} style={styles.changeDeviceBtn}>
                                    <Icon name="desktop" size={16} />
                                    <Text style={{ marginLeft: 4 }}>Change Device</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    {renderTabs()}
                    <View style={styles.tabContent}>{renderTabContent()}</View>
                </View>
            )}
            {!isLoading && deviceData && selectedDeviceId && (
                <View style={styles.card}>
                    <Text style={styles.saveInfo}>
                        {areSettingsEqual(settings, originalSettings)
                            ? 'No changes detected. Settings are up to date.'
                            : 'You have unsaved changes. Click save to apply your configuration.'}
                    </Text>
                    {renderSaveButton()}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME_COLORS.primary },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    deviceIdBadge: {
        backgroundColor: THEME_COLORS.secondary,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        marginLeft: 8,
    },
    deviceIdBadgeText: { color: '#fff', fontWeight: 'bold' },
    changeDeviceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9ecef',
        borderRadius: 8,
        padding: 6,
        marginLeft: 8,
    },
    pickerModern: { color: TEXT_COLORS.primary },

    tabBarScroll: { marginVertical: 8 },
    tabBar: { flexDirection: 'row' },
    tabButton: { minWidth: 90, alignItems: 'center', padding: 10, flexDirection: 'row', justifyContent: 'center', borderRadius: 8, marginRight: 8 },
    tabButtonActive: { backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: THEME_COLORS.secondary },
    tabButtonText: { marginLeft: 6, fontWeight: 'bold', color: '#888' },
    tabContent: { marginTop: 12 },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    switchLabel: { fontWeight: 'bold', fontSize: 16, flexDirection: 'row', alignItems: 'center' },
    switchDesc: { color: '#666', fontSize: 12 },
    sectionTitle: { fontWeight: 'bold', fontSize: 16, marginVertical: 8 },
    analyzerButton: { backgroundColor: '#e9ecef', borderRadius: 8, padding: 8, marginRight: 8 },
    analyzerButtonSelected: { backgroundColor: THEME_COLORS.secondary },
    analyzerButtonText: { color: TEXT_COLORS.whiteColor, fontWeight: 'bold' },
    inputLabel: { fontWeight: 'bold', marginTop: 8 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginVertical: 4, backgroundColor: '#fff' },
    inputDisabled: { backgroundColor: '#e9ecef', color: '#aaa' },
    specialCommissionRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
    infoBox: { backgroundColor: '#e9ecef', borderRadius: 8, padding: 8, marginVertical: 8 },
    infoBoxText: { color: '#333', fontSize: 13 },
    saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME_COLORS.secondary, borderRadius: 8, padding: 12, justifyContent: 'center', marginTop: 12 },
    saveButtonDisabled: { backgroundColor: '#aaa' },
    saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    saveInfo: { marginBottom: 8, color: '#333', fontSize: 14 },
    loadingBox: { alignItems: 'center', justifyContent: 'center', padding: 32 },
    errorBox: { alignItems: 'center', justifyContent: 'center', padding: 32 },
    deviceButton: { backgroundColor: '#e9ecef', borderRadius: 8, padding: 10, marginRight: 8 },
    deviceButtonSelected: { backgroundColor: THEME_COLORS.secondary },
    deviceButtonText: { color: '#333', fontWeight: 'bold' },
});

export default SettingsScreen;