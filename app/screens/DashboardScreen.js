import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getDashboardData,
  getWeeklyStats,
  getMonthlyStats,
  getAgentsPerformance,
} from "../services/api";
import { format } from "date-fns";
import { getUserData } from "../services/auth";

const DashboardScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    dailyStats: {
      openingBalance: 0,
      closingBalance: 0,
      employeeTransactions: 0,
      agentTransactions: 0,
      totalCommissions: 0,
      activeDebtors: 0,
      netChange: 0,
      hasTodayTransaction: false,
    },
    recentActivity: [],
    quickStats: {
      totalAgents: 0,
      activeDebtors: 0,
      monthlyCommissions: 0,
      weeklyTransactions: 0,
      totalDebtOutstanding: 0,
      totalDebtCollected: 0,
    },
    agentsSummary: {
      agents: [],
      summary: {
        totalAgents: 0,
        agentsUpdatedToday: 0,
        totalBalance: 0,
        totalCommissions: 0,
      },
    },
    debtorsSummary: {
      debtors: [],
      summary: {
        totalDebtors: 0,
        outstandingDebtors: 0,
        paidOffDebtors: 0,
        totalDebtOutstanding: 0,
        totalDebtCollected: 0,
        collectionRate: 0,
      },
    },
    lastUpdated: null,
  });

  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [agentsPerformance, setAgentsPerformance] = useState({
    agents_summary: [],
    summary_stats: {},
  });

  const fetchDashboardData = async () => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      client: userData.client,
      uid: userData.uid,
      'Content-Type': 'application/json',
    };
    const data = await getDashboardData(headers);
    console.log('Raw Dashboard Data:', data);

    // Transform the backend data to match the expected frontend structure
    const transformedData = {
      daily_stats: data.daily_stats || {},
      recent_activity: data.recent_activity || [],
      quick_stats: data.quick_stats || {},
      agents_summary: {
        agents: data.agents_summary || [],
        summary: data.summary_stats || {}
      },
      debtors_summary: data.debtors_summary || {},
      last_updated: data.last_updated || null
    };

    console.log('Transformed Dashboard Data:', transformedData);

    setDashboardData({
      dailyStats: {
        openingBalance: transformedData.daily_stats.opening_balance || 0,
        closingBalance: transformedData.daily_stats.closing_balance || 0,
        employeeTransactions: transformedData.daily_stats.employee_transactions || 0,
        agentTransactions: transformedData.daily_stats.agent_transactions || 0,
        totalCommissions: transformedData.daily_stats.total_commissions || 0,
        activeDebtors: transformedData.daily_stats.active_debtors || 0,
        netChange: transformedData.daily_stats.net_change || 0,
        hasTodayTransaction: transformedData.daily_stats.has_today_transaction || false
      },
      recentActivity: transformedData.recent_activity,
      quickStats: {
        totalAgents: transformedData.quick_stats.total_agents || 0,
        activeDebtors: transformedData.quick_stats.active_debtors || 0,
        monthlyCommissions: transformedData.quick_stats.monthly_commissions || 0,
        weeklyTransactions: transformedData.quick_stats.weekly_transactions || 0,
        totalDebtOutstanding: transformedData.quick_stats.total_debt_outstanding || 0,
        totalDebtCollected: transformedData.quick_stats.total_debt_collected || 0
      },
      agentsSummary: {
        agents: transformedData.agents_summary.agents,
        summary: {
          totalAgents: transformedData.agents_summary.summary.total_agents || 0,
          agentsUpdatedToday: transformedData.agents_summary.summary.agents_updated_today || 0,
          totalBalance: transformedData.agents_summary.summary.total_balance || 0,
          totalCommissions: transformedData.agents_summary.summary.total_commissions || 0
        }
      },
      debtorsSummary: {
        debtors: transformedData.debtors_summary.debtors || [],
        summary: {
          totalDebtors: transformedData.debtors_summary.summary?.total_debtors || 0,
          outstandingDebtors: transformedData.debtors_summary.summary?.outstanding_debtors || 0,
          paidOffDebtors: transformedData.debtors_summary.summary?.paid_off_debtors || 0,
          totalDebtOutstanding: transformedData.debtors_summary.summary?.total_debt_outstanding || 0,
          totalDebtCollected: transformedData.debtors_summary.summary?.total_debt_collected || 0,
          collectionRate: transformedData.debtors_summary.summary?.collection_rate || 0
        }
      },
      lastUpdated: transformedData.last_updated
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    Alert.alert(
      'Error',
      'Failed to load dashboard data. Please try again.',
      [{ text: 'OK' }]
    );
  }
};


  const fetchWeeklyStats = async () => {
    try {
      const userData = await getUserData();
      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
        "Content-Type": "application/json",
      };
      const data = await getWeeklyStats(headers);
      setWeeklyStats(data);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const userData = await getUserData();
      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
        "Content-Type": "application/json",
      };
      const data = await getMonthlyStats(headers);
      setMonthlyStats(data);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
    }
  };

  const fetchAgentsPerformance = async () => {
    try {
      const userData = await getUserData();
      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
        "Content-Type": "application/json",
      };
      const data = await getAgentsPerformance(headers);
      setAgentsPerformance(data);
    } catch (error) {
      console.error("Error fetching agents performance:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchWeeklyStats(),
        fetchMonthlyStats(),
        fetchAgentsPerformance(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const toggleMenu = () => {
    if (menuOpen) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const navigateTo = (screen) => {
    toggleMenu();
    navigation.navigate(screen);
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getActivityIcon = (activity) => {
    const iconMap = {
      "account-balance-wallet": "account-balance-wallet",
      people: "people",
      "attach-money": "attach-money",
      "money-off": "money-off",
      receipt: "receipt",
      "account-balance": "account-balance",
      "swap-horiz": "swap-horiz",
      payment: "payment",
    };
    return iconMap[activity.icon] || "receipt";
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={20} color="#fff" />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View
        style={[
          styles.activityIcon,
          { backgroundColor: item.color || "#4299E1" },
        ]}
      >
        <Icon name={getActivityIcon(item)} size={20} color="#fff" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDescription}>{item.description}</Text>
      </View>
      <View style={styles.activityMeta}>
        <Text style={styles.activityAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    </View>
  );

  const renderAgentItem = ({ item }) => (
    <View style={styles.agentItem}>
      <View style={styles.agentHeader}>
        <Text style={styles.agentName}>{item.name}</Text>
        <Text
          style={[
            styles.agentStatus,
            { color: item.status === "updated_today" ? "#48BB78" : "#F56565" },
          ]}
        >
          {item.status === "updated_today" ? "Updated today" : "Needs update"}
        </Text>
      </View>
      <View style={styles.agentStats}>
        <View style={styles.agentStat}>
          <Text style={styles.agentStatLabel}>Balance</Text>
          <Text style={styles.agentStatValue}>
            {formatCurrency(item.latest_balance)}
          </Text>
        </View>
        <View style={styles.agentStat}>
          <Text style={styles.agentStatLabel}>Commissions</Text>
          <Text style={styles.agentStatValue}>
            {formatCurrency(item.total_commissions)}
          </Text>
        </View>
        <View style={styles.agentStat}>
          <Text style={styles.agentStatLabel}>Debtors</Text>
          <Text style={styles.agentStatValue}>{item.active_debtors}</Text>
        </View>
      </View>
    </View>
  );

  const renderDebtorItem = ({ item }) => (
    <View style={styles.debtorItem}>
      <View style={styles.debtorHeader}>
        <Text style={styles.debtorName}>{item.name}</Text>
        <Text
          style={[
            styles.debtorStatus,
            { color: item.status === "outstanding" ? "#F56565" : "#48BB78" },
          ]}
        >
          {item.status === "outstanding" ? "Outstanding" : "Paid off"}
        </Text>
      </View>
      <View style={styles.debtorStats}>
        <View style={styles.debtorStat}>
          <Text style={styles.debtorStatLabel}>Original Debt</Text>
          <Text style={styles.debtorStatValue}>
            {formatCurrency(item.original_debt)}
          </Text>
        </View>
        <View style={styles.debtorStat}>
          <Text style={styles.debtorStatLabel}>Paid</Text>
          <Text style={styles.debtorStatValue}>
            {formatCurrency(item.total_paid)}
          </Text>
        </View>
        <View style={styles.debtorStat}>
          <Text style={styles.debtorStatLabel}>Remaining</Text>
          <Text style={styles.debtorStatValue}>
            {formatCurrency(item.current_debt)}
          </Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBar, { width: `${item.payment_percentage}%` }]}
        />
      </View>
      <Text style={styles.progressText}>{item.payment_percentage}% paid</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    dailyStats,
    recentActivity,
    quickStats,
    agentsSummary,
    debtorsSummary,
    lastUpdated,
  } = dashboardData;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu}>
          <Icon name="menu" size={28} color="#4A5568" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Dashboard</Text>
        <TouchableOpacity onPress={logout}>
          <Icon name="exit-to-app" size={28} color="#4A5568" />
        </TouchableOpacity>
      </View>

      {/* Side Menu */}
      {menuOpen && (
        <Animated.View style={[styles.menuContainer, { opacity: fadeAnim }]}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Transactions")}
            >
              <Icon name="receipt" size={24} color="#4299E1" />
              <Text style={styles.menuText}>My Transactions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Agents")}
            >
              <Icon name="people" size={24} color="#4299E1" />
              <Text style={styles.menuText}>My Agents</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Commissions")}
            >
              <Icon name="attach-money" size={24} color="#4299E1" />
              <Text style={styles.menuText}>Commissions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Debtors")}
            >
              <Icon name="money-off" size={24} color="#4299E1" />
              <Text style={styles.menuText}>Debtors</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.menuOverlay} onPress={toggleMenu} />
        </Animated.View>
      )}

      {/* Dashboard Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back, {user?.name}</Text>
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Last updated: {formatTime(lastUpdated)}
            </Text>
          )}
          {!dailyStats.hasTodayTransaction && (
            <View style={styles.alertBanner}>
              <Icon name="warning" size={16} color="#F56565" />
              <Text style={styles.alertText}>
                No transaction recorded today
              </Text>
            </View>
          )}
        </View>

        {/* Time Period Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "today" && styles.activeTab]}
            onPress={() => setActiveTab("today")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "today" && styles.activeTabText,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "week" && styles.activeTab]}
            onPress={() => setActiveTab("week")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "week" && styles.activeTabText,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "month" && styles.activeTab]}
            onPress={() => setActiveTab("month")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "month" && styles.activeTabText,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Balance Summary */}
        {activeTab === "today" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Balance</Text>
              <View style={styles.statsRow}>
                {renderStatCard(
                  "Opening Balance",
                  formatCurrency(dailyStats.openingBalance),
                  "account-balance-wallet",
                  "#4299E1"
                )}
                {renderStatCard(
                  "Closing Balance",
                  formatCurrency(dailyStats.closingBalance),
                  "account-balance",
                  "#48BB78"
                )}
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate("RecordTransaction")}
                >
                  <View style={styles.actionIcon}>
                    <Icon name="add" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionText}>
                    Record Daily Transaction
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate("CreateAgent")}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#9F7AEA" }]}
                  >
                    <Icon name="person-add" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionText}>Add New Agent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Today's Stats */}
        {activeTab === "today" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              {renderStatCard(
                "Transactions",
                `${
                  dailyStats.employeeTransactions + dailyStats.agentTransactions
                }`,
                "receipt",
                "#4299E1"
              )}
              {renderStatCard(
                "Commissions",
                formatCurrency(dailyStats.totalCommissions),
                "attach-money",
                "#48BB78"
              )}
              {renderStatCard(
                "Active Debtors",
                dailyStats.activeDebtors.toString(),
                "people",
                "#9F7AEA"
              )}
              {renderStatCard(
                "Net Change",
                formatCurrency(dailyStats.netChange),
                "trending-up",
                dailyStats.netChange >= 0 ? "#48BB78" : "#F56565"
              )}
            </View>
          </View>
        )}

        {/* Weekly Stats */}
        {activeTab === "week" && weeklyStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Weekly Overview ({weeklyStats.period})
            </Text>
            <View style={styles.statsGrid}>
              {renderStatCard(
                "Employee Transactions",
                weeklyStats.employee_transactions?.toString() || "0",
                "receipt",
                "#4299E1"
              )}
              {renderStatCard(
                "Agent Transactions",
                weeklyStats.agent_transactions?.toString() || "0",
                "people",
                "#9F7AEA"
              )}
              {renderStatCard(
                "Total Commissions",
                formatCurrency(weeklyStats.total_commissions),
                "attach-money",
                "#48BB78"
              )}
              {renderStatCard(
                "Total Transactions",
                (
                  (weeklyStats.employee_transactions || 0) +
                  (weeklyStats.agent_transactions || 0)
                ).toString(),
                "swap-horiz",
                "#ED8936"
              )}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Daily Breakdown
            </Text>
            <View style={styles.dailyBreakdown}>
              {weeklyStats.daily_breakdown?.map((day, index) => (
                <View key={index} style={styles.dayCard}>
                  <Text style={styles.dayName}>{day.day}</Text>
                  <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                  <View style={styles.dayStats}>
                    <Text style={styles.dayStat}>
                      <Icon name="person" size={14} color="#4A5568" />{" "}
                      {day.employee_transactions || 0}
                    </Text>
                    <Text style={styles.dayStat}>
                      <Icon name="people" size={14} color="#4A5568" />{" "}
                      {day.agent_transactions || 0}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Stats */}
        {activeTab === "month" && monthlyStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Monthly Overview ({monthlyStats.period})
            </Text>
            <View style={styles.statsGrid}>
              {renderStatCard(
                "Employee Transactions",
                monthlyStats.employee_transactions?.toString() || "0",
                "receipt",
                "#4299E1"
              )}
              {renderStatCard(
                "Agent Transactions",
                monthlyStats.agent_transactions?.toString() || "0",
                "people",
                "#9F7AEA"
              )}
              {renderStatCard(
                "Total Commissions",
                formatCurrency(monthlyStats.total_commissions),
                "attach-money",
                "#48BB78"
              )}
              {renderStatCard(
                "Debt Collected",
                formatCurrency(monthlyStats.debt_collected),
                "money-off",
                "#4299E1"
              )}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Statistics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              "Outstanding Debt",
              formatCurrency(quickStats.totalDebtOutstanding),
              "account-balance-wallet",
              "#4299E1"
            )}
            {renderStatCard(
              "Collected Debt",
              formatCurrency(quickStats.totalDebtCollected),
              "money",
              "#48BB78"
            )}
            {renderStatCard(
              "Active Debtors",
              quickStats.activeDebtors?.toString() || "0",
              "people",
              "#9F7AEA"
            )}
            {renderStatCard(
              "Collection Rate",
              `${debtorsSummary.summary.collectionRate?.toString() || "0"}%`,
              "trending-up",
              "#ED8936"
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Activity")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length > 0 ? (
            <FlatList
              data={recentActivity}
              renderItem={renderActivityItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noActivity}>
              <Icon name="info" size={24} color="#A0AEC0" />
              <Text style={styles.noActivityText}>No recent activity</Text>
            </View>
          )}
        </View>

        {/* Agents Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agents Summary</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Agents")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>My Agents</Text>
              <Text style={styles.summaryCount}>
                {agentsSummary.summary.totalAgents?.toString() || "0"}
              </Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Updated Today</Text>
                <Text style={styles.summaryStatValue}>
                  {agentsSummary.summary.agentsUpdatedToday?.toString() || "0"}
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Total Balance</Text>
                <Text style={styles.summaryStatValue}>
                  {formatCurrency(agentsSummary.summary.totalBalance)}
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Commissions</Text>
                <Text style={styles.summaryStatValue}>
                  {formatCurrency(agentsSummary.summary.totalCommissions)}
                </Text>
              </View>
            </View>
          </View>

         {Array.isArray(agentsPerformance) && agentsPerformance.length > 0 && (
  <>
    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Agents Performance</Text>
    <FlatList
      data={agentsPerformance.slice(0, 3)}
      renderItem={({ item }) => (
        <View style={styles.agentPerformanceItem}>
          <View style={styles.agentPerformanceHeader}>
            <Text style={styles.agentPerformanceName}>{item.name}</Text>
            <Text style={styles.agentPerformanceScore}>{item.performance_score?.toString() || '0'}/100</Text>
          </View>
          <View style={styles.agentPerformanceStats}>
            <View style={styles.agentPerformanceStat}>
              <Text style={styles.agentPerformanceStatLabel}>Transactions</Text>
              <Text style={styles.agentPerformanceStatValue}>{item.monthly_transactions?.toString() || '0'}</Text>
            </View>
            <View style={styles.agentPerformanceStat}>
              <Text style={styles.agentPerformanceStatLabel}>Commissions</Text>
              <Text style={styles.agentPerformanceStatValue}>{formatCurrency(item.monthly_commissions)}</Text>
            </View>
            <View style={styles.agentPerformanceStat}>
              <Text style={styles.agentPerformanceStatLabel}>Debtors</Text>
              <Text style={styles.agentPerformanceStatValue}>{item.managed_debtors?.toString() || '0'}</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${item.performance_score || 0}%` }]} />
          </View>
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
    />
  </>
)}

        </View>

        {/* Debtors Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Debtors Summary</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Debtors")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Debtors Overview</Text>
              <Text style={styles.summaryCount}>
                {debtorsSummary.summary.totalDebtors?.toString() || "0"}
              </Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Outstanding</Text>
                <Text style={styles.summaryStatValue}>
                  {debtorsSummary.summary.outstandingDebtors?.toString() || "0"}
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Paid Off</Text>
                <Text style={styles.summaryStatValue}>
                  {debtorsSummary.summary.paidOffDebtors?.toString() || "0"}
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Outstanding Debt</Text>
                <Text style={styles.summaryStatValue}>
                  {formatCurrency(debtorsSummary.summary.totalDebtOutstanding)}
                </Text>
              </View>
            </View>
          </View>

          {debtorsSummary.debtors.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                Recent Debtors
              </Text>
              <FlatList
                data={debtorsSummary.debtors.slice(0, 3)}
                renderItem={renderDebtorItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A5568',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '75%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menu: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#1A365D',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: '75%',
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEEBC8',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#B45309',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#4299E1',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    marginBottom: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dailyBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A365D',
  },
  dayDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  dayStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayStat: {
    fontSize: 12,
    color: '#4A5568',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A365D',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A365D',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  noActivityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4299E1',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  agentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  agentStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4299E1',
  },
  agentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  agentStat: {
    alignItems: 'center',
  },
  agentStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  agentStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  debtorItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  debtorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  debtorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  debtorStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E53E3E',
  },
  debtorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  debtorStat: {
    alignItems: 'center',
  },
  debtorStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  debtorStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4299E1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  agentPerformanceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  agentPerformanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  agentPerformanceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  agentPerformanceScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4299E1',
  },
  agentPerformanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  agentPerformanceStat: {
    alignItems: 'center',
  },
  agentPerformanceStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  agentPerformanceStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
});


export default DashboardScreen;
