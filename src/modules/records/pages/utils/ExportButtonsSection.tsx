import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

type Props = {
  handleExportCSV: () => void;
  handleExportPDF: () => void;
  isFetching: boolean;
  isExporting: boolean;
};

const ExportButtonsSection: React.FC<Props> = ({
  handleExportCSV,
  handleExportPDF,
  isFetching,
  isExporting,
}) => {
  return (
    <View style={styles.container}>
      {/* CSV Button */}
      <TouchableOpacity
        style={[styles.button, isFetching && styles.disabled]}
        onPress={handleExportCSV}
        disabled={isFetching}
      >
        {isFetching ? (
          <ActivityIndicator color="#2b50a1" />
        ) : (
          <Icon name="file-csv" size={18} color="#2b50a1" />
        )}
        <Text style={styles.text}> Export CSV</Text>
      </TouchableOpacity>

      {/* PDF Button */}
      <TouchableOpacity
        style={[
          styles.button,
          (isExporting || isFetching) && styles.disabled,
        ]}
        onPress={handleExportPDF}
        disabled={isExporting || isFetching}
      >
        {isExporting || isFetching ? (
          <ActivityIndicator color="#2b50a1" />
        ) : (
          <Icon name="file-pdf" size={18} color="#2b50a1" />
        )}
        <Text style={styles.text}> Export PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginVertical: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2b50a1",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  text: {
    color: "#2b50a1",
    fontWeight: "600",
    marginLeft: 6,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ExportButtonsSection;
