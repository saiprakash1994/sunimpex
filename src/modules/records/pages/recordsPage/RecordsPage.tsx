import React, { useState } from "react";
import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { TEXT_COLORS, THEME_COLORS } from "../../../../globalStyle/GlobalStyles";
import DeviceRecords from "../deviceRecords/DeviceRecords";
import MemberRecords from "../memberRecords/MemberRecords";
import AbsentMemberRecords from "../memberRecords/AbsentMemberRecords";
import CumulativeRecords from "../memberRecords/CumilativeRecords";
import DatewiseDetailedRecords from "../memberRecords/DatewiseDetailedRecords";
import DatewiseSummaryRecords from "../memberRecords/DatewiseSummaryRecords";

const RecordsPage: React.FC = () => {



  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "records", title: "Daywise" },
    { key: "memberRecords", title: "Memberwise" },
    { key: "absentRecords", title: "Absent List" },
    { key: "cumilativeRecords", title: "Payment Register" },
    { key: "datewiseDetailed", title: "Datewise Detailed" },
    { key: "datewiseSummary", title: "Datewise Summary" }
  ]);

  const renderScene = SceneMap({
    records: DeviceRecords,
    memberRecords: MemberRecords,
    absentRecords: AbsentMemberRecords,
    cumilativeRecords: CumulativeRecords,
    datewiseDetailed: DatewiseDetailedRecords,
    datewiseSummary: DatewiseSummaryRecords
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          scrollEnabled
          indicatorStyle={styles.indicator}
          style={styles.tabBar}
          activeColor={THEME_COLORS.secondary}
          inactiveColor={TEXT_COLORS.secondary}
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    backgroundColor: THEME_COLORS.primary,

  },
  indicator: {
    backgroundColor: THEME_COLORS.secondary,
    height: 3,
  },
  label: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  labelActive: {
    color: THEME_COLORS.secondary,
  },
});

export default RecordsPage;

