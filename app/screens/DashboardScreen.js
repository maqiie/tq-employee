import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
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
  Dimensions,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getDashboardStats,
  getWeeklyStats,
  getMonthlyStats,
  getAgentsPerformance,
  getDebtors,
} from "../services/api";
import { format } from "date-fns";
import { getUserData } from "../services/auth";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Simple Chart Component (since we can't use external chart libraries)
const SimpleBarChart = ({ data, title, color = "#6366F1" }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartBars}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '2%',
                    backgroundColor: color,
                  }
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
            <Text style={styles.barValue}>{item.displayValue}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Enhanced Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 10, color = "#6366F1", backgroundColor = "#F3F4F6" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      {/* Background Circle */}
      <View
        style={[
          styles.progressRingBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]}
      />
      
      {/* Progress Circle */}
      <View
        style={[
          styles.progressRingFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: color,
            transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
          }
        ]}
      />
      
      {/* Center Content */}
      <View style={styles.progressRingCenter}>
        <Text style={[styles.progressPercentage, { fontSize: size * 0.15 }]}>
          {Math.round(progress)}%
        </Text>
        <Text style={[styles.progressLabel, { fontSize: size * 0.08 }]}>
          Collected
        </Text>
      </View>
      
      {/* Glow Effect */}
      <View
        style={[
          styles.progressRingGlow,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            backgroundColor: color + '20',
          }
        ]}
      />
    </View>
  );
};

// Modern Pie Chart Component
const ModernPieChart = ({ data, size = 160, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <View style={styles.pieChartContainer}>
      <Text style={styles.pieChartTitle}>{title}</Text>
      <View style={[styles.pieChart, { width: size, height: size }]}>
        {/* Background Circle */}
        <View
          style={[
            styles.pieChartBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            }
          ]}
        />
        
        {/* Data Segments */}
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const angle = (percentage / 100) * 360;
          const rotation = currentAngle;
          currentAngle += angle;

          return (
            <View
              key={index}
              style={[
                styles.pieSlice,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: size / 4,
                  borderColor: 'transparent',
                  borderTopColor: item.color,
                  transform: [{ rotate: `${rotation}deg` }],
                  position: 'absolute',
                }
              ]}
            />
          );
        })}
        
        {/* Center Content */}
        <View style={styles.pieChartCenter}>
          <Text style={styles.pieChartCenterText}>Total</Text>
          <Text style={styles.pieChartCenterValue}>
            {data.reduce((sum, item) => sum + item.value, 0)}
          </Text>
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.pieChartLegend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendValue}>{item.displayValue}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const DashboardScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Animation values
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
        agentsWithUpdatesToday: 0,
        totalActiveDebtors: 0,
        totalDebtManaged: 0,
      },
    },
    debtorsSummary: {
      debtors: [],
    },
    lastUpdated: null,
  });

  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [agentsPerformance, setAgentsPerformance] = useState({
    agents_summary: [],
    summary_stats: {},
  });
  const [allDebtors, setAllDebtors] = useState([]);
  const [agentBalances, setAgentBalances] = useState({
    totalOpeningBalance: 0,
    totalClosingBalance: 0,
    agentCount: 0,
  });

  // Data fetching functions
  const fetchDashboardData = useCallback(async () => {
    try {
      const userData = await getUserData();
      const headers = {
        'access-token': userData.userToken,
        client: userData.client,
        uid: userData.uid,
        'Content-Type': 'application/json',
      };

      console.log('🔄 Fetching employee dashboard data...');
      const data = await getDashboardStats(headers);
      console.log('📊 Raw Dashboard Data:', data);

      setDashboardData({
        dailyStats: {
          openingBalance: data.daily_stats?.opening_balance || 0,
          closingBalance: data.daily_stats?.closing_balance || 0,
          employeeTransactions: data.daily_stats?.employee_transactions || 0,
          agentTransactions: data.daily_stats?.agent_transactions || 0,
          totalCommissions: data.daily_stats?.total_commissions || 0,
          activeDebtors: data.daily_stats?.active_debtors || 0,
          netChange: data.daily_stats?.net_change || 0,
          hasTodayTransaction: data.daily_stats?.has_today_transaction || false
        },
        recentActivity: data.recent_activity || [],
        quickStats: {
          totalAgents: data.quick_stats?.total_agents || 0,
          activeDebtors: data.quick_stats?.active_debtors || 0,
          monthlyCommissions: data.quick_stats?.monthly_commissions || 0,
          weeklyTransactions: data.quick_stats?.weekly_transactions || 0,
          totalDebtOutstanding: data.quick_stats?.total_debt_outstanding || 0,
          totalDebtCollected: data.quick_stats?.total_debt_collected || 0
        },
        agentsSummary: {
          agents: data.agents_summary?.agents || [],
          summary: {
            totalAgents: data.agents_summary?.summary?.total_agents || 0,
            agentsWithUpdatesToday: data.agents_summary?.summary?.agents_with_updates_today || 0,
            totalActiveDebtors: data.agents_summary?.summary?.total_active_debtors || 0,
            totalDebtManaged: data.agents_summary?.summary?.total_debt_managed || 0,
          }
        },
        debtorsSummary: {
          debtors: data.debtors_summary?.debtors || [],
        },
        lastUpdated: data.last_updated
      });

      console.log('✅ Dashboard data processed successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  }, []);

  const fetchWeeklyStats = useCallback(async () => {
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
      console.error("❌ Error fetching weekly stats:", error);
    }
  }, []);

  const fetchMonthlyStats = useCallback(async () => {
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
      console.error("❌ Error fetching monthly stats:", error);
    }
  }, []);

  const fetchAgentsPerformance = useCallback(async () => {
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
      
      // Calculate agent balances
      if (data.agents_summary) {
        const totalOpeningBalance = data.agents_summary.reduce((sum, agent) => sum + (agent.opening_balance || 0), 0);
        const totalClosingBalance = data.agents_summary.reduce((sum, agent) => sum + (agent.closing_balance || 0), 0);
        
        setAgentBalances({
          totalOpeningBalance,
          totalClosingBalance,
          agentCount: data.agents_summary.length,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching agents performance:", error);
    }
  }, []);

  const fetchAllDebtors = useCallback(async () => {
    try {
      const userData = await getUserData();
      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
        "Content-Type": "application/json",
      };
      
      console.log('👥 Fetching all debtors...');
      const data = await getDebtors(headers);
      console.log('📊 All debtors received:', data);
      setAllDebtors(data.debtors || data || []);
    } catch (error) {
      console.error("❌ Error fetching all debtors:", error);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchWeeklyStats(),
        fetchMonthlyStats(),
        fetchAgentsPerformance(),
        fetchAllDebtors(),
      ]);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData, fetchWeeklyStats, fetchMonthlyStats, fetchAgentsPerformance, fetchAllDebtors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const toggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen]);

  const navigateTo = useCallback((screen) => {
    setMenuOpen(false);
    navigation.navigate(screen);
  }, [navigation]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    const numAmount = Number(amount) || 0;
    return `TSh ${numAmount.toLocaleString('en-TZ', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  }, []);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // Prepare chart data
  const chartData = useMemo(() => {
    const { dailyStats, quickStats } = dashboardData;
    
    return {
      balanceChart: [
        { label: 'Employee Opening', value: dailyStats.openingBalance, displayValue: formatCurrency(dailyStats.openingBalance) },
        { label: 'Employee Closing', value: dailyStats.closingBalance, displayValue: formatCurrency(dailyStats.closingBalance) },
        { label: 'Agent Opening', value: agentBalances.totalOpeningBalance, displayValue: formatCurrency(agentBalances.totalOpeningBalance) },
        { label: 'Agent Closing', value: agentBalances.totalClosingBalance, displayValue: formatCurrency(agentBalances.totalClosingBalance) },
      ],
      transactionChart: [
        { label: 'Employee', value: dailyStats.employeeTransactions, displayValue: dailyStats.employeeTransactions.toString() },
        { label: 'Agent', value: dailyStats.agentTransactions, displayValue: dailyStats.agentTransactions.toString() },
        { label: 'Total', value: dailyStats.employeeTransactions + dailyStats.agentTransactions, displayValue: (dailyStats.employeeTransactions + dailyStats.agentTransactions).toString() },
      ],
      debtChart: [
        { label: 'Outstanding', value: quickStats.totalDebtOutstanding, displayValue: formatCurrency(quickStats.totalDebtOutstanding) },
        { label: 'Collected', value: quickStats.totalDebtCollected, displayValue: formatCurrency(quickStats.totalDebtCollected) },
      ],
      pieChartData: [
        { 
          label: 'Outstanding Debt', 
          value: quickStats.totalDebtOutstanding, 
          displayValue: formatCurrency(quickStats.totalDebtOutstanding),
          color: '#EF4444'
        },
        { 
          label: 'Collected Debt', 
          value: quickStats.totalDebtCollected, 
          displayValue: formatCurrency(quickStats.totalDebtCollected),
          color: '#10B981'
        },
      ],
      agentStatusPie: [
        {
          label: 'Updated Today',
          value: dashboardData.agentsSummary.summary.agentsWithUpdatesToday,
          displayValue: dashboardData.agentsSummary.summary.agentsWithUpdatesToday.toString(),
          color: '#10B981'
        },
        {
          label: 'Pending Updates',
          value: dashboardData.agentsSummary.summary.totalAgents - dashboardData.agentsSummary.summary.agentsWithUpdatesToday,
          displayValue: (dashboardData.agentsSummary.summary.totalAgents - dashboardData.agentsSummary.summary.agentsWithUpdatesToday).toString(),
          color: '#F59E0B'
        },
      ],
    };
  }, [dashboardData, formatCurrency, agentBalances]);

  // Calculate debt collection rate
  const debtCollectionRate = useMemo(() => {
    const { totalDebtOutstanding, totalDebtCollected } = dashboardData.quickStats;
    const total = totalDebtOutstanding + totalDebtCollected;
    return total > 0 ? (totalDebtCollected / total) * 100 : 0;
  }, [dashboardData.quickStats]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { dailyStats, recentActivity, quickStats, agentsSummary, debtorsSummary, lastUpdated } = dashboardData;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Icon name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.name?.split(' ')[0]}</Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modern Side Menu */}
      {menuOpen && (
        <Animated.View style={[styles.menuOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[
            styles.modernMenu,
            {
              transform: [{
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-300, 0],
                })
              }]
            }
          ]}>
            {/* Menu Header with User Profile */}
            <View style={styles.modernMenuHeader}>
              <View style={styles.menuProfileSection}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                  <Text style={styles.profileRole}>Employee</Text>
                  <View style={styles.profileStatusIndicator}>
                    <View style={styles.statusDotOnline} />
                    <Text style={styles.profileStatus}>Online</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity onPress={toggleMenu} style={styles.modernCloseButton}>
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItemsContainer}>
              <Text style={styles.menuSectionTitle}>NAVIGATION</Text>
              
              {[
                { screen: "Dashboard", icon: "dashboard", label: "Dashboard", isActive: true },
                { screen: "Transactions", icon: "receipt", label: "Transactions", badge: dailyStats.employeeTransactions + dailyStats.agentTransactions },
                { screen: "Agents", icon: "people", label: "My Agents", badge: quickStats.totalAgents },
                { screen: "Commissions", icon: "attach-money", label: "Commissions" },
                { screen: "Debtors", icon: "account-balance", label: "Debtors", badge: quickStats.activeDebtors },
              ].map((item, index) => (
                <TouchableOpacity
                  key={item.screen}
                  style={[
                    styles.modernMenuItem,
                    item.isActive && styles.modernMenuItemActive
                  ]}
                  onPress={() => item.screen === "Dashboard" ? toggleMenu() : navigateTo(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <View style={[
                      styles.modernMenuItemIcon,
                      item.isActive && styles.modernMenuItemIconActive
                    ]}>
                      <Icon 
                        name={item.icon} 
                        size={18} 
                        color={item.isActive ? "#FFFFFF" : "#6366F1"} 
                      />
                    </View>
                    <Text style={[
                      styles.modernMenuItemText,
                      item.isActive && styles.modernMenuItemTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  
                  {item.badge && item.badge > 0 && (
                    <View style={styles.menuItemBadge}>
                      <Text style={styles.menuItemBadgeText}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </Text>
                    </View>
                  )}
                  
                  <Icon 
                    name="chevron-right" 
                    size={16} 
                    color={item.isActive ? "#FFFFFF" : "#9CA3AF"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Stats Section */}
            <View style={styles.menuStatsSection}>
              <Text style={styles.menuSectionTitle}>TODAY'S SUMMARY</Text>
              
              <View style={styles.menuStatItem}>
                <View style={styles.menuStatIcon}>
                  <Icon name="account-balance-wallet" size={16} color="#10B981" />
                </View>
                <View style={styles.menuStatContent}>
                  <Text style={styles.menuStatLabel}>Net Change</Text>
                  <Text style={[
                    styles.menuStatValue,
                    { color: dailyStats.netChange >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {dailyStats.netChange >= 0 ? '+' : ''}{formatCurrency(dailyStats.netChange)}
                  </Text>
                </View>
              </View>

              <View style={styles.menuStatItem}>
                <View style={styles.menuStatIcon}>
                  <Icon name="attach-money" size={16} color="#6366F1" />
                </View>
                <View style={styles.menuStatContent}>
                  <Text style={styles.menuStatLabel}>Commissions</Text>
                  <Text style={styles.menuStatValue}>
                    {formatCurrency(dailyStats.totalCommissions)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Menu Footer */}
            <View style={styles.menuFooter}>
              <TouchableOpacity style={styles.menuFooterItem} onPress={() => navigateTo("Settings")}>
                <Icon name="settings" size={18} color="#6B7280" />
                <Text style={styles.menuFooterText}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuFooterItem} onPress={() => navigateTo("Help")}>
                <Icon name="help" size={18} color="#6B7280" />
                <Text style={styles.menuFooterText}>Help & Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.logoutMenuItem} onPress={logout}>
                <Icon name="exit-to-app" size={18} color="#EF4444" />
                <Text style={styles.logoutMenuText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* Enhanced Backdrop */}
          <TouchableOpacity 
            style={styles.menuBackdrop} 
            onPress={toggleMenu}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'analytics', label: 'Analytics', icon: 'analytics' },
          { key: 'agents', label: 'Agents', icon: 'people' },
          { key: 'debtors', label: 'Debtors', icon: 'account-balance' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon name={tab.icon} size={18} color={activeTab === tab.key ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <View>
                    <Text style={styles.statusDate}>{new Date().toDateString()}</Text>
                    <Text style={styles.statusUpdate}>
                      Last updated: {lastUpdated ? formatTime(lastUpdated) : 'Never'}
                    </Text>
                  </View>
                  <View style={[styles.statusIndicator, { 
                    backgroundColor: dailyStats.hasTodayTransaction ? '#10B981' : '#EF4444' 
                  }]}>
                    <Icon name={dailyStats.hasTodayTransaction ? 'check-circle' : 'warning'} size={16} color="#FFFFFF" />
                    <Text style={styles.statusText}>
                      {dailyStats.hasTodayTransaction ? 'Up to date' : 'Needs update'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Balance Overview */}
              <View style={styles.fullWidthCard}>
                <Text style={styles.cardTitle}>Today's Balance Overview</Text>
                
                {/* Employee Balances */}
                <Text style={styles.subSectionTitle}>Employee Balance</Text>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Opening</Text>
                    <Text style={styles.balanceValue}>{formatCurrency(dailyStats.openingBalance)}</Text>
                  </View>
                  <Icon name="arrow-forward" size={24} color="#6B7280" />
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Closing</Text>
                    <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                      {formatCurrency(dailyStats.closingBalance)}
                    </Text>
                  </View>
                </View>
                
                {/* Agent Balances */}
                <Text style={styles.subSectionTitle}>Agents Total Balance</Text>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Opening</Text>
                    <Text style={styles.balanceValue}>{formatCurrency(agentBalances.totalOpeningBalance)}</Text>
                  </View>
                  <Icon name="arrow-forward" size={24} color="#6B7280" />
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>Closing</Text>
                    <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                      {formatCurrency(agentBalances.totalClosingBalance)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.netChangeContainer}>
                  <Text style={styles.netChangeLabel}>Employee Net Change</Text>
                  <Text style={[
                    styles.netChangeValue,
                    { color: dailyStats.netChange >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {dailyStats.netChange >= 0 ? '+' : ''}{formatCurrency(dailyStats.netChange)}
                  </Text>
                </View>
                
                <View style={styles.netChangeContainer}>
                  <Text style={styles.netChangeLabel}>Agents Net Change</Text>
                  <Text style={[
                    styles.netChangeValue,
                    { color: (agentBalances.totalClosingBalance - agentBalances.totalOpeningBalance) >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {(agentBalances.totalClosingBalance - agentBalances.totalOpeningBalance) >= 0 ? '+' : ''}{formatCurrency(agentBalances.totalClosingBalance - agentBalances.totalOpeningBalance)}
                  </Text>
                </View>
              </View>

              {/* Key Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Icon name="receipt" size={24} color="#6366F1" />
                  <Text style={styles.metricValue}>{dailyStats.employeeTransactions + dailyStats.agentTransactions}</Text>
                  <Text style={styles.metricLabel}>Total Transactions</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Icon name="attach-money" size={24} color="#10B981" />
                  <Text style={styles.metricValue}>{formatCurrency(dailyStats.totalCommissions)}</Text>
                  <Text style={styles.metricLabel}>Commissions</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Icon name="people" size={24} color="#F59E0B" />
                  <Text style={styles.metricValue}>{quickStats.totalAgents}</Text>
                  <Text style={styles.metricLabel}>Total Agents</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Icon name="warning" size={24} color="#EF4444" />
                  <Text style={styles.metricValue}>{quickStats.activeDebtors}</Text>
                  <Text style={styles.metricLabel}>Active Debtors</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.fullWidthCard}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
                    onPress={() => navigation.navigate("RecordTransaction")}
                  >
                    <Icon name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Record Transaction</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => navigation.navigate("CreateAgent")}
                  >
                    <Icon name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Add Agent</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recent Activity */}
              <View style={styles.fullWidthCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Recent Activity</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Activity")}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                
                {recentActivity.length > 0 ? (
                  <FlatList
                    data={recentActivity.slice(0, 5)}
                    renderItem={({ item }) => (
                      <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: item.color || '#6366F1' }]}>
                          <Icon name={item.icon || 'receipt'} size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityTitle}>{item.title}</Text>
                          <Text style={styles.activityDescription}>{item.description}</Text>
                          <Text style={styles.activityTime}>{item.time}</Text>
                        </View>
                        <Text style={[
                          styles.activityAmount,
                          { color: parseFloat(item.amount) >= 0 ? '#10B981' : '#EF4444' }
                        ]}>
                          {formatCurrency(item.amount)}
                        </Text>
                      </View>
                    )}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="inbox" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyStateText}>No recent activity</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <>
              {/* Balance Chart */}
              <View style={styles.fullWidthCard}>
                <SimpleBarChart 
                  data={chartData.balanceChart}
                  title="Balance Overview (Employee vs Agents)"
                  color="#6366F1"
                />
              </View>

              {/* Transaction Chart */}
              <View style={styles.fullWidthCard}>
                <SimpleBarChart 
                  data={chartData.transactionChart}
                  title="Transaction Breakdown"
                  color="#10B981"
                />
              </View>

              {/* Debt Collection Progress with Enhanced Progress Ring */}
              <View style={styles.fullWidthCard}>
                <Text style={styles.cardTitle}>Debt Collection Progress</Text>
                <View style={styles.progressContainer}>
                  <ProgressRing 
                    progress={debtCollectionRate}
                    size={140}
                    strokeWidth={12}
                    color="#10B981"
                    backgroundColor="#F3F4F6"
                  />
                  <View style={styles.progressDetails}>
                    <View style={styles.progressDetailItem}>
                      <Text style={styles.progressDetailLabel}>Collected</Text>
                      <Text style={[styles.progressDetailValue, { color: '#10B981' }]}>
                        {formatCurrency(quickStats.totalDebtCollected)}
                      </Text>
                    </View>
                    <View style={styles.progressDetailItem}>
                      <Text style={styles.progressDetailLabel}>Outstanding</Text>
                      <Text style={[styles.progressDetailValue, { color: '#EF4444' }]}>
                        {formatCurrency(quickStats.totalDebtOutstanding)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Debt Management Pie Chart */}
              <View style={styles.fullWidthCard}>
                <ModernPieChart 
                  data={chartData.pieChartData}
                  title="Debt Distribution"
                  size={180}
                />
              </View>

              {/* Agent Status Pie Chart */}
              <View style={styles.fullWidthCard}>
                <ModernPieChart 
                  data={chartData.agentStatusPie}
                  title="Agent Update Status"
                  size={160}
                />
              </View>

              {/* Debt Chart */}
              <View style={styles.fullWidthCard}>
                <SimpleBarChart 
                  data={chartData.debtChart}
                  title="Debt Management"
                  color="#EF4444"
                />
              </View>

              {/* Weekly vs Monthly Stats */}
              {weeklyStats && monthlyStats && (
                <View style={styles.fullWidthCard}>
                  <Text style={styles.cardTitle}>Performance Comparison</Text>
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Weekly</Text>
                      <Text style={styles.comparisonValue}>
                        {weeklyStats.transactions_last_7_days || 0} transactions
                      </Text>
                      <Text style={styles.comparisonSubvalue}>
                        {formatCurrency(weeklyStats.commissions_last_7_days || 0)} commissions
                      </Text>
                    </View>
                    <View style={styles.comparisonDivider} />
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Monthly</Text>
                      <Text style={styles.comparisonValue}>
                        {monthlyStats.transactions_this_month || 0} transactions
                      </Text>
                      <Text style={styles.comparisonSubvalue}>
                        {formatCurrency(monthlyStats.commissions_this_month || 0)} commissions
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Agent Balance Summary */}
              <View style={styles.fullWidthCard}>
                <Text style={styles.cardTitle}>Agent Balance Summary</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{agentBalances.agentCount}</Text>
                    <Text style={styles.summaryLabel}>Total Agents</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#6366F1' }]}>
                      {formatCurrency(agentBalances.totalOpeningBalance)}
                    </Text>
                    <Text style={styles.summaryLabel}>Opening Balance</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                      {formatCurrency(agentBalances.totalClosingBalance)}
                    </Text>
                    <Text style={styles.summaryLabel}>Closing Balance</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <>
              {/* Agents Summary */}
              <View style={styles.fullWidthCard}>
                <Text style={styles.cardTitle}>Agents Overview</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{agentsSummary.summary.totalAgents}</Text>
                    <Text style={styles.summaryLabel}>Total Agents</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{agentsSummary.summary.agentsWithUpdatesToday}</Text>
                    <Text style={styles.summaryLabel}>Updated Today</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{agentsSummary.summary.totalActiveDebtors}</Text>
                    <Text style={styles.summaryLabel}>Total Debtors</Text>
                  </View>
                </View>
              </View>

              {/* Agents List */}
              {agentsSummary.agents.length > 0 ? (
                <FlatList
                  data={agentsSummary.agents}
                  renderItem={({ item }) => (
                    <View style={styles.fullWidthCard}>
                      <View style={styles.agentHeader}>
                        <View>
                          <Text style={styles.agentName}>{item.name}</Text>
                          <Text style={styles.agentType}>{item.type || 'Agent'}</Text>
                        </View>
                        <View style={[
                          styles.agentStatus,
                          { backgroundColor: item.status === 'updated_today' ? '#10B981' : '#EF4444' }
                        ]}>
                          <Text style={styles.agentStatusText}>
                            {item.status === 'updated_today' ? 'Updated' : 'Pending'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.agentMetrics}>
                        <View style={styles.agentMetric}>
                          <Text style={styles.agentMetricLabel}>Balance</Text>
                          <Text style={styles.agentMetricValue}>
                            {formatCurrency(item.latest_balance || 0)}
                          </Text>
                        </View>
                        <View style={styles.agentMetric}>
                          <Text style={styles.agentMetricLabel}>Commissions</Text>
                          <Text style={styles.agentMetricValue}>
                            {formatCurrency(item.total_commissions || 0)}
                          </Text>
                        </View>
                        <View style={styles.agentMetric}>
                          <Text style={styles.agentMetricLabel}>Debtors</Text>
                          <Text style={styles.agentMetricValue}>{item.active_debtors || 0}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.fullWidthCard}>
                  <View style={styles.emptyState}>
                    <Icon name="people" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyStateText}>No agents found</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Debtors Tab */}
          {activeTab === 'debtors' && (
            <>
              {/* Debtors Summary */}
              <View style={styles.fullWidthCard}>
                <Text style={styles.cardTitle}>Debt Overview</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{allDebtors.length}</Text>
                    <Text style={styles.summaryLabel}>Total Debtors</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                      {formatCurrency(quickStats.totalDebtOutstanding)}
                    </Text>
                    <Text style={styles.summaryLabel}>Outstanding</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                      {formatCurrency(quickStats.totalDebtCollected)}
                    </Text>
                    <Text style={styles.summaryLabel}>Collected</Text>
                  </View>
                </View>
              </View>

              {/* Debt Distribution Chart */}
              <View style={styles.fullWidthCard}>
                <ModernPieChart 
                  data={chartData.pieChartData}
                  title="Debt Distribution Overview"
                  size={180}
                />
              </View>

              {/* All Debtors List */}
              {allDebtors.length > 0 ? (
                <>
                  <View style={styles.fullWidthCard}>
                    <Text style={styles.cardTitle}>All Debtors ({allDebtors.length})</Text>
                  </View>
                  
                  <FlatList
                    data={allDebtors}
                    renderItem={({ item }) => (
                      <View style={styles.fullWidthCard}>
                        <View style={styles.debtorHeader}>
                          <View>
                            <Text style={styles.debtorName}>{item.name || 'Unknown'}</Text>
                            <Text style={styles.debtorPhone}>{item.phone || item.phone_number || 'No phone'}</Text>
                            {item.agent_name && (
                              <Text style={styles.debtorAgent}>via {item.agent_name}</Text>
                            )}
                            {item.created_at && (
                              <Text style={styles.debtorDate}>
                                Created: {new Date(item.created_at).toLocaleDateString()}
                              </Text>
                            )}
                          </View>
                          <View style={[
                            styles.debtorStatus,
                            { backgroundColor: (item.status === 'active' || !item.is_fully_paid) ? '#EF4444' : '#10B981' }
                          ]}>
                            <Text style={styles.debtorStatusText}>
                              {(item.status === 'active' || !item.is_fully_paid) ? 'Active' : 'Paid'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.debtorMetrics}>
                          <View style={styles.debtorMetric}>
                            <Text style={styles.debtorMetricLabel}>Total Debt</Text>
                            <Text style={styles.debtorMetricValue}>
                              {formatCurrency(item.total_debt || item.amount || 0)}
                            </Text>
                          </View>
                          <View style={styles.debtorMetric}>
                            <Text style={styles.debtorMetricLabel}>Paid</Text>
                            <Text style={[styles.debtorMetricValue, { color: '#10B981' }]}>
                              {formatCurrency(item.total_paid || item.amount_paid || 0)}
                            </Text>
                          </View>
                          <View style={styles.debtorMetric}>
                            <Text style={styles.debtorMetricLabel}>Remaining</Text>
                            <Text style={[styles.debtorMetricValue, { color: '#EF4444' }]}>
                              {formatCurrency(
                                (item.total_debt || item.amount || 0) - (item.total_paid || item.amount_paid || 0)
                              )}
                            </Text>
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { 
                                  width: `${
                                    (item.total_debt || item.amount) > 0 
                                      ? (((item.total_paid || item.amount_paid || 0) / (item.total_debt || item.amount)) * 100) 
                                      : 0
                                  }%` 
                                }
                              ]}
                            />
                          </View>
                          <Text style={styles.progressBarText}>
                            {(item.total_debt || item.amount) > 0 
                              ? (((item.total_paid || item.amount_paid || 0) / (item.total_debt || item.amount)) * 100).toFixed(1) 
                              : 0}% paid
                          </Text>
                        </View>

                        {/* Additional Details */}
                        {(item.description || item.purpose) && (
                          <View style={styles.debtorDescription}>
                            <Text style={styles.debtorDescriptionLabel}>Description:</Text>
                            <Text style={styles.debtorDescriptionText}>
                              {item.description || item.purpose}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    keyExtractor={(item) => (item.id || item.debtor_id || Math.random()).toString()}
                    scrollEnabled={false}
                  />
                </>
              ) : (
                <View style={styles.fullWidthCard}>
                  <View style={styles.emptyState}>
                    <Icon name="account-balance" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyStateText}>No debtors found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Debtors will appear here when they are added
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modernMenu: {
    width: '85%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modernMenuHeader: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  profileStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  profileStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  modernCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemsContainer: {
    flex: 1,
    paddingTop: 24,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  modernMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  modernMenuItemActive: {
    backgroundColor: '#6366F1',
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernMenuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernMenuItemIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  modernMenuItemTextActive: {
    color: '#FFFFFF',
  },
  menuItemBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  menuItemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuStatsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  menuStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuStatContent: {
    flex: 1,
  },
  menuStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  menuStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  menuFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  menuFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuFooterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutMenuText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 12,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: '85%',
    right: 0,
    bottom: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusUpdate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  fullWidthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  netChangeContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  netChangeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  netChangeValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 12,
  },
  
  // Chart Styles
  chartContainer: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 24,
    minHeight: 4,
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Enhanced Progress Ring Styles
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRingBackground: {
    position: 'absolute',
  },
  progressRingFill: {
    position: 'absolute',
  },
  progressRingCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontWeight: '800',
    color: '#111827',
    lineHeight: 24,
  },
  progressLabel: {
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  progressRingGlow: {
    position: 'absolute',
    zIndex: -1,
  },

  // Modern Pie Chart Styles
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  pieChart: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pieChartBackground: {
    backgroundColor: '#F9FAFB',
    position: 'absolute',
  },
  pieSlice: {
    borderWidth: 0,
  },
  pieChartCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pieChartCenterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  pieChartCenterValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pieChartLegend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Enhanced Debtor Styles
  debtorDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  debtorDescription: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  debtorDescriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  debtorDescriptionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progressDetails: {
    flex: 1,
    marginLeft: 20,
  },
  progressDetailItem: {
    marginBottom: 12,
  },
  progressDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  progressDetailValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Comparison Styles
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  comparisonSubvalue: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Summary Styles
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Agent Styles
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  agentType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  agentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  agentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  agentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  agentMetric: {
    alignItems: 'center',
  },
  agentMetricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  agentMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Debtor Styles
  debtorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  debtorPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  debtorAgent: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  debtorStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  debtorStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  debtorMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  debtorMetric: {
    alignItems: 'center',
  },
  debtorMetricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  debtorMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressBarText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default DashboardScreen;