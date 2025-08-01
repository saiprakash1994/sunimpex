import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";

type TotalRecord = {
  _id: { milkType: string };
  totalRecords: number;
  averageFat: string;
  averageSNF: string;
  averageCLR: string;
  totalQuantity: number;
  averageRate: number;
  totalAmount: number;
  totalIncentive: number;
};

type Props = {
  filteredTotals: TotalRecord[];
};

const DeviceRecordsTotalsSection: React.FC<Props> = ({ filteredTotals }) => {
  if (!filteredTotals?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No totals found</Text>
      </View>
    );
  }


  const renderItem = ({ item }: { item: TotalRecord }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item?._id.milkType} Milk</Text>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Samples:</Text>
        <Text style={styles.value}>{item?.totalRecords}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Avg Fat:</Text>
        <Text style={styles.value}>{item?.averageFat}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Avg SNF:</Text>
        <Text style={styles.value}>{item?.averageSNF}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Avg CLR:</Text>
        <Text style={styles.value}>{item?.averageCLR}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Qty (L):</Text>
        <Text style={styles.value}>{item?.totalQuantity.toFixed(2)}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Rate:</Text>
        <Text style={styles.value}>₹{item?.averageRate}</Text>
      </View>
      <View style={styles.cardRow}>

        <Text style={styles.label}>Amount:</Text>
        <Text style={styles.value}>₹{item?.totalAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={[styles.value, { color: "green" }]}>Incentive:</Text>
        <Text style={[styles.value, { color: "green" }]}>
          ₹{item?.totalIncentive.toFixed(2)}
        </Text>
      </View>
      <View style={[styles.cardRow, styles.grandTotalRow]}>
        <Text style={styles.grandTotalLabel}>Grand Total:</Text>
        <Text style={styles.grandTotalValue}>
          ₹{(item?.totalAmount + item?.totalIncentive).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <View>
      {/* Card List */}
      <FlatList
        data={filteredTotals}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    color: "gray",
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: "#f8faff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  summaryText: {
    fontSize: 14,
    color: THEME_COLORS.secondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME_COLORS.secondary,
    marginTop: 6,
  },
  card: {
    backgroundColor: "#f8faff",
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME_COLORS.secondary,
    marginBottom: 8,
    textAlign: "center",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginTop: 6,
    paddingTop: 6,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME_COLORS.secondary,
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e40af",
  },
});

export default DeviceRecordsTotalsSection;
