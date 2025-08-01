import React from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/FontAwesome5";
import { THEME_COLORS } from "../../../../globalStyle/GlobalStyles";

type FilterConfig = {
    deviceCode?: boolean;
    date?: boolean;
    shift?: boolean;
    milkType?: boolean;
    viewMode?: boolean;
};

type Props = {
    isAdmin: boolean;
    isDairy: boolean;
    isDevice: boolean;
    deviceList: { deviceid: string }[];

    // filter values
    filterDeviceCode: string;
    setFilterDeviceCode: (val: string) => void;
    deviceCode: string;
    filterDate?: string;
    setFilterDate?: (val: string) => void;

    filterShift?: string;
    setFilterShift?: (val: string) => void;

    filterMilkTypeFilter?: string;
    setFilterMilkTypeFilter?: (val: string) => void;

    filterViewMode?: string;
    setFilterViewMode?: (val: string) => void;

    handleSearch: () => void;
    isFetching: boolean;

    filtersConfig: FilterConfig;
};

const DeviceRecordsFilterSection: React.FC<Props> = ({
    isAdmin,
    isDairy,
    isDevice,
    deviceList,
    filterDeviceCode,
    setFilterDeviceCode,
    deviceCode,



    filterDate,
    setFilterDate,


    filterShift,
    setFilterShift,

    filterMilkTypeFilter,
    setFilterMilkTypeFilter,

    filterViewMode,
    setFilterViewMode,

    handleSearch,
    isFetching,
    filtersConfig,
}) => {
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [showFromDatePicker, setShowFromDatePicker] = React.useState(false);
    const [showToDatePicker, setShowToDatePicker] = React.useState(false);

    return (
        <View style={styles.container}>
            {/* Device Code */}
            {filtersConfig.deviceCode && (
                <>
                    {(isAdmin || isDairy) ? (
                        <View style={styles.field}>
                            <Text style={styles.label}>Device Code</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="desktop" size={16} color="#2b50a1" style={styles.icon} />
                                <Picker
                                    selectedValue={filterDeviceCode}
                                    onValueChange={setFilterDeviceCode}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Device" value="" />
                                    {deviceList?.map((dev) => (
                                        <Picker.Item
                                            key={dev.deviceid}
                                            label={dev.deviceid}
                                            value={dev.deviceid}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.field}>
                            <Text style={styles.label}>Device Code</Text>
                            <View style={styles.inputWrapper}>
                                <Icon name="desktop" size={16} color="#2b50a1" style={styles.icon} />
                                <TextInput style={styles.input} value={deviceCode} editable={false} />
                            </View>
                        </View>
                    )}
                </>
            )}



            {/* Single Date */}
            {filtersConfig.date && filterDate && setFilterDate && (
                <View style={styles.field}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Icon name="calendar" size={16} color="#2b50a1" style={styles.icon} />
                        <Text style={styles.dateText}>{filterDate}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date(filterDate)}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            maximumDate={new Date()}
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) setFilterDate(date.toISOString().split("T")[0]);
                            }}
                        />
                    )}
                </View>
            )}



            {/* Shift */}
            {filtersConfig.shift && filterShift !== undefined && setFilterShift && (
                <View style={styles.field}>
                    <Text style={styles.label}>Shift</Text>
                    <View style={styles.inputWrapper}>
                        <Icon name="clock" size={16} color="#2b50a1" style={styles.icon} />
                        <Picker
                            selectedValue={filterShift}
                            onValueChange={setFilterShift}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Shifts" value="" />
                            <Picker.Item label="MORNING" value="MORNING" />
                            <Picker.Item label="EVENING" value="EVENING" />
                        </Picker>
                    </View>
                </View>
            )}

            {/* Milk Type */}
            {filtersConfig.milkType && filterMilkTypeFilter && setFilterMilkTypeFilter && (
                <View style={styles.field}>
                    <Text style={styles.label}>Milk Type</Text>
                    <View style={styles.inputWrapper}>
                        <Icon name="tint" size={16} color="#2b50a1" style={styles.icon} />
                        <Picker
                            selectedValue={filterMilkTypeFilter}
                            onValueChange={setFilterMilkTypeFilter}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Milk Types" value="ALL" />
                            <Picker.Item label="COW" value="COW" />
                            <Picker.Item label="BUF" value="BUF" />
                        </Picker>
                    </View>
                </View>
            )}

            {/* View Mode */}
            {filtersConfig.viewMode && filterViewMode && setFilterViewMode && (
                <View style={styles.field}>
                    <Text style={styles.label}>View Mode</Text>
                    <View style={styles.inputWrapper}>
                        <Icon name="eye" size={16} color="#2b50a1" style={styles.icon} />
                        <Picker
                            selectedValue={filterViewMode}
                            onValueChange={setFilterViewMode}
                            style={styles.picker}
                        >
                            <Picker.Item label="Show All" value="ALL" />
                            <Picker.Item label="Only Records" value="RECORDS" />
                            <Picker.Item label="Only Totals" value="TOTALS" />
                        </Picker>
                    </View>
                </View>
            )}

            {/* Search Button */}
            <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleSearch}
                disabled={isFetching}
            >
                {isFetching ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Icon name="search" size={16} color="#fff" />
                )}
                <Text style={styles.searchText}> Search</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        backgroundColor: "#fff",
        borderRadius: 10,
        elevation: 2,
        marginBottom: 10,
    },
    field: { marginBottom: 12 },
    label: { fontWeight: "600", marginBottom: 6, color: "#333" },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    icon: { marginRight: 8 },
    input: { flex: 1, height: 40, color: "#333" },
    picker: { flex: 1, height: 50, color: "#333", fontSize: 16, paddingVertical: 5 },
    dateText: { flex: 1, color: "#333", paddingVertical: 10 },
    searchBtn: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: THEME_COLORS.secondary,
        padding: 12,
        borderRadius: 6,
        marginTop: 10,
    },
    searchText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
});

export default DeviceRecordsFilterSection;
