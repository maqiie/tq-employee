import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
  getAgents,
  getDebtorsOverview,
} from "../services/api";
import { format } from "date-fns";
import { getUserData } from "../services/auth";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Modern Purple Theme
const theme = {
  colors: {
    primary: {
      50: "#F5F3FF",
      100: "#EDE9FE",
      500: "#7C3AED",
      600: "#6D28D9",
      700: "#5B21B6",
      900: "#4C1D95",
    },
    secondary: {
      50: "#ECFDF5",
      100: "#D1FAE5",
      500: "#10B981",
      600: "#059669",
      700: "#047857",
    },
    accent: {
      pink: "#EC4899",
      amber: "#F59E0B",
      orange: "#F97316",
      rose: "#F43F5E",
      violet: "#8B5CF6",
      blue: "#3B82F6",
      cyan: "#06B6D4",
      emerald: "#10B981",
      red: "#EF4444",
      teal: "#14B8A6",
    },
    neutral: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#E5E5E5",
      300: "#D4D4D4",
      400: "#A3A3A3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    background: {
      primary: "#FFFFFF",
      secondary: "#F8F9FE",
      tertiary: "#F3F4F6",
    },
    surface: {
      primary: "#FFFFFF",
      secondary: "#F8F9FE",
      elevated: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
      tertiary: "#9CA3AF",
      inverse: "#FFFFFF",
    },
  },
  shadows: {
    small: {
      shadowColor: "#7C3AED",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    large: {
      shadowColor: "#7C3AED",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    colored: (color) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    }),
  },
  typography: {
    display: {
      fontSize: 32,
      fontWeight: "800",
      lineHeight: 40,
    },
    h1: {
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 32,
    },
    h2: {
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 16,
    },
    captionMedium: {
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
    },
    label: {
      fontSize: 11,
      fontWeight: "600",
      lineHeight: 14,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
  },
};

// Modern Donut Chart Component
const ModernDonutChart = ({ data, title, subtitle }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 160;

  return (
    <View style={styles.donutContainer}>
      <Text style={styles.donutTitle}>{title}</Text>
      <View style={[styles.donutChart, { width: size, height: size }]}>
        <View
          style={[
            styles.donutCenter,
            {
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: size * 0.275,
            },
          ]}
        >
          <Text style={styles.donutCenterValue}>{total}</Text>
          <Text style={styles.donutCenterLabel}>{subtitle}</Text>
        </View>

        {/* Visual ring segments */}
        {data.map((item, index) => {
          const previousSum = data
            .slice(0, index)
            .reduce((sum, d) => sum + d.value, 0);
          const startAngle = total > 0 ? (previousSum / total) * 360 - 90 : 0;
          const sweepAngle = total > 0 ? (item.value / total) * 360 : 0;

          return (
            <View
              key={index}
              style={[
                styles.donutSegment,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: 16,
                  borderColor: "transparent",
                  borderTopColor: item.color,
                  borderRightColor:
                    sweepAngle > 90 ? item.color : "transparent",
                  borderBottomColor:
                    sweepAngle > 180 ? item.color : "transparent",
                  borderLeftColor:
                    sweepAngle > 270 ? item.color : "transparent",
                  transform: [{ rotate: `${startAngle}deg` }],
                  position: "absolute",
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.donutLegends}>
        {data.map((item, index) => {
          const percentage =
            total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendText}>{item.label}</Text>
              <View style={styles.legendValueContainer}>
                <Text style={styles.legendValue}>{item.value}</Text>
                <Text style={styles.legendPercent}>({percentage}%)</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Modern Bar Chart Component
const ModernBarChart = ({
  data,
  title,
  color = theme.colors.primary[500],
  height = 140,
}) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const [animatedValues] = useState(data.map(() => new Animated.Value(0)));

  useEffect(() => {
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: data[index].value,
        duration: 1200 + index * 150,
        useNativeDriver: false,
      })
    );
    Animated.stagger(100, animations).start();
  }, [data]);

  return (
    <View style={[styles.modernChartContainer, { height: height + 140 }]}>
      <View style={styles.chartHeader}>
        <Text style={styles.modernChartTitle}>{title}</Text>
        <View style={styles.chartLegend}>
          <View style={[styles.chartLegendDot, { backgroundColor: color }]} />
          <Text style={styles.chartLegendText}>Current Balance</Text>
        </View>
      </View>
      <View style={[styles.modernChartBars, { height }]}>
        {data.map((item, index) => (
          <View key={index} style={styles.modernBarContainer}>
            <View style={styles.modernBarValueTop}>
              <Text style={[styles.modernBarValueTopText, { color }]}>
                {item.displayValue}
              </Text>
            </View>
            <View style={[styles.modernBarWrapper, { height: height - 80 }]}>
              <Animated.View
                style={[
                  styles.modernBar,
                  {
                    height: animatedValues[index].interpolate({
                      inputRange: [0, maxValue],
                      outputRange: ["4%", "100%"],
                      extrapolate: "clamp",
                    }),
                    backgroundColor: color,
                  },
                ]}
              >
                <View style={styles.barGlowEffect} />
              </Animated.View>
            </View>
            <Text style={styles.modernBarLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Agent Performance Ring
const AgentPerformanceRing = ({ agent, size = 100 }) => {
  const performance =
    agent.closing_balance > 0
      ? Math.min(
          (agent.closing_balance / (agent.opening_balance || 1)) * 100,
          100
        )
      : 0;

  return (
    <View style={[styles.performanceRing, { width: size, height: size }]}>
      <View
        style={[
          styles.performanceRingBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: size * 0.06,
            borderColor: theme.colors.neutral[200],
          },
        ]}
      />
      <View
        style={[
          styles.performanceRingFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: size * 0.06,
            borderColor: "transparent",
            borderTopColor: theme.colors.secondary[500],
            transform: [{ rotate: `${(performance / 100) * 360 - 90}deg` }],
          },
        ]}
      />
      <View style={styles.performanceRingCenter}>
        <Text
          style={[
            styles.performancePercentage,
            {
              fontSize: size * 0.14,
              color: theme.colors.text.primary,
              fontWeight: "700",
            },
          ]}
        >
          {Math.round(performance)}%
        </Text>
      </View>
    </View>
  );
};

// Modern Metric Card
const ModernMetricCard = ({
  icon,
  value,
  label,
  trend,
  gradient = [theme.colors.primary[500], theme.colors.primary[600]],
}) => {
  return (
    <View style={[styles.modernMetricCard, theme.shadows.large]}>
      <View
        style={[
          styles.metricGradientBackground,
          { backgroundColor: gradient[0] },
        ]}
      >
        <View
          style={[
            styles.metricGradientOverlay,
            { backgroundColor: gradient[1] },
          ]}
        />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <View style={styles.metricIconContainer}>
            <Icon name={icon} size={26} color={theme.colors.text.inverse} />
          </View>
          {trend !== undefined && (
            <View
              style={[
                styles.trendBadge,
                {
                  backgroundColor:
                    trend > 0
                      ? "rgba(16, 185, 129, 0.9)"
                      : "rgba(239, 68, 68, 0.9)",
                },
              ]}
            >
              <Icon
                name={trend > 0 ? "trending-up" : "trending-down"}
                size={12}
                color={theme.colors.text.inverse}
              />
              <Text style={styles.trendText}>{Math.abs(trend)}%</Text>
            </View>
          )}
        </View>
        <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
};

// Modern Debtor Card Component
const ModernDebtorCard = ({ debtor, formatCurrency, onPress }) => {
  const riskLevel =
    debtor.balance_due > 1000000
      ? "high"
      : debtor.balance_due > 500000
      ? "medium"
      : "low";
  const riskColors = {
    high: theme.colors.error,
    medium: theme.colors.warning,
    low: theme.colors.success,
  };

  return (
    <TouchableOpacity
      style={[styles.modernDebtorCard, theme.shadows.medium]}
      onPress={onPress}
    >
      <View style={styles.debtorCardHeader}>
        <View style={styles.debtorInfo}>
          <View
            style={[
              styles.debtorAvatar,
              { backgroundColor: riskColors[riskLevel] + "20" },
            ]}
          >
            <Text
              style={[
                styles.debtorAvatarText,
                { color: riskColors[riskLevel] },
              ]}
            >
              {debtor.debtor_name?.charAt(0)?.toUpperCase() || "D"}
            </Text>
          </View>
          <View style={styles.debtorDetails}>
            <Text style={styles.debtorName}>
              {debtor.debtor_name || "Unknown Debtor"}
            </Text>
            <Text style={styles.debtorAgent}>
              Agent: {debtor.agent_name || "Unknown"}
            </Text>
            {debtor.phone && (
              <Text style={styles.debtorPhone}>{debtor.phone}</Text>
            )}
          </View>
        </View>

        <View
          style={[styles.riskBadge, { backgroundColor: riskColors[riskLevel] }]}
        >
          <Text style={styles.riskBadgeText}>{riskLevel.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.debtorMetrics}>
        <View style={styles.debtorMetric}>
          <Text style={styles.debtorMetricLabel}>Amount Due</Text>
          <Text
            style={[styles.debtorMetricValue, { color: riskColors[riskLevel] }]}
          >
            {formatCurrency(debtor.balance_due || 0)}
          </Text>
        </View>

        <View style={styles.debtorMetric}>
          <Text style={styles.debtorMetricLabel}>Status</Text>
          <Text
            style={[
              styles.debtorStatus,
              {
                color:
                  debtor.balance_due > 0
                    ? theme.colors.error
                    : theme.colors.success,
              },
            ]}
          >
            {debtor.balance_due > 0 ? "Outstanding" : "Paid"}
          </Text>
        </View>
      </View>

      <View style={styles.debtorProgress}>
        <View style={styles.debtorProgressBar}>
          <View
            style={[
              styles.debtorProgressFill,
              {
                width: debtor.balance_due > 0 ? "100%" : "0%",
                backgroundColor: riskColors[riskLevel],
              },
            ]}
          />
        </View>
        <Text style={styles.debtorProgressText}>
          {debtor.balance_due > 0 ? "Needs Collection" : "Completed"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const AgentComparisonChart = ({ agents, formatCurrency }) => {
  // Add safety check
  if (!agents || agents.length === 0) {
    return null;
  }

  // Simple direct approach - just like how metrics.totalBalance works
  const agentsWithBalance = agents.map((agent) => ({
    ...agent,
    displayBalance: parseFloat(
      agent.latest_balance || agent.closing_balance || 0
    ),
  }));

  const sortedAgents = agentsWithBalance
    .filter((a) => a.displayBalance > 0)
    .sort((a, b) => b.displayBalance - a.displayBalance)
    .slice(0, 5);

  if (sortedAgents.length === 0) {
    return null;
  }

  const maxBalance = sortedAgents[0].displayBalance;

  return (
    <View style={styles.agentComparisonContainer}>
      <Text style={styles.modernChartTitle}>Top Performing Agents</Text>

      {sortedAgents.map((agent, index) => {
        const percentage = (agent.displayBalance / maxBalance) * 100;

        return (
          <View key={agent.id || index} style={styles.topAgentItem}>
            {/* Rank */}
            <View style={styles.topAgentRank}>
              <Text style={styles.topAgentRankText}>{index + 1}</Text>
            </View>

            {/* Name */}
            <View style={styles.topAgentInfo}>
              <Text style={styles.topAgentName} numberOfLines={1}>
                {agent.name}
              </Text>
              <View style={styles.topAgentBar}>
                <View
                  style={[styles.topAgentBarFill, { width: `${percentage}%` }]}
                />
              </View>
            </View>

            {/* Balance */}
            <View style={styles.topAgentBalanceBox}>
              <Text style={styles.topAgentBalance}>
                {formatCurrency(agent.displayBalance)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
// Enhanced Progress Ring
const EnhancedProgressRing = ({
  progress,
  size = 140,
  title,
  subtitle,
  color = theme.colors.secondary[500],
}) => {
  return (
    <View style={styles.enhancedProgressContainer}>
      <View
        style={[styles.progressRingContainer, { width: size, height: size }]}
      >
        <View
          style={[
            styles.progressRingBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 10,
              borderColor: theme.colors.neutral[200],
            },
          ]}
        />
        <View
          style={[
            styles.progressRingFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 10,
              borderColor: "transparent",
              borderTopColor: color,
              transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
            },
          ]}
        />
        <View style={styles.progressRingCenter}>
          <Text style={[styles.progressPercentage, { fontSize: size * 0.16 }]}>
            {Math.round(progress)}%
          </Text>
          <Text style={[styles.progressLabel, { fontSize: size * 0.09 }]}>
            Complete
          </Text>
        </View>
      </View>

      <View style={styles.progressInfo}>
        <Text style={styles.progressTitle}>{title}</Text>
        <Text style={styles.progressSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

// Modern Dashboard Header
const ModernDashboardHeader = ({ user, onMenuPress, onLogout, agentCount }) => {
  return (
    <View style={styles.modernHeader}>
      <TouchableOpacity onPress={onMenuPress} style={styles.modernMenuButton}>
        <Icon name="menu" size={24} color={theme.colors.text.inverse} />
      </TouchableOpacity>

      <View style={styles.modernHeaderCenter}>
        <Text style={styles.modernHeaderTitle}>Dashboard</Text>
        <View style={styles.modernHeaderSubtitleContainer}>
          <View style={styles.agentCountBadge}>
            <Icon name="people" size={14} color={theme.colors.text.inverse} />
            <Text style={styles.modernHeaderSubtitle}>
              {agentCount} agents • {user?.name?.split(" ")[0]}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={onLogout} style={styles.modernLogoutButton}>
        <Icon name="logout" size={24} color={theme.colors.text.inverse} />
      </TouchableOpacity>
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

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

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
  const [myAgents, setMyAgents] = useState([]);
  const [allDebtors, setAllDebtors] = useState([]);
  const [agentBalances, setAgentBalances] = useState({
    totalOpeningBalance: 0,
    totalClosingBalance: 0,
    agentCount: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const userData = await getUserData();
      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
        "Content-Type": "application/json",
      };

      const data = await getDashboardStats(headers);

      setDashboardData({
        dailyStats: {
          openingBalance: data.daily_stats?.opening_balance || 0,
          closingBalance: data.daily_stats?.closing_balance || 0,
          employeeTransactions: data.daily_stats?.employee_transactions || 0,
          agentTransactions: data.daily_stats?.agent_transactions || 0,
          totalCommissions: data.daily_stats?.total_commissions || 0,
          activeDebtors: data.daily_stats?.active_debtors || 0,
          netChange: data.daily_stats?.net_change || 0,
          hasTodayTransaction: data.daily_stats?.has_today_transaction || false,
        },
        recentActivity: data.recent_activity || [],
        quickStats: {
          totalAgents: data.quick_stats?.total_agents || 0,
          activeDebtors: data.quick_stats?.active_debtors || 0,
          monthlyCommissions: data.quick_stats?.monthly_commissions || 0,
          weeklyTransactions: data.quick_stats?.weekly_transactions || 0,
          totalDebtOutstanding: data.quick_stats?.total_debt_outstanding || 0,
          totalDebtCollected: data.quick_stats?.total_debt_collected || 0,
        },
        agentsSummary: {
          agents: data.agents_summary?.agents || [],
          summary: {
            totalAgents: data.agents_summary?.summary?.total_agents || 0,
            agentsWithUpdatesToday:
              data.agents_summary?.summary?.agents_with_updates_today || 0,
            totalActiveDebtors:
              data.agents_summary?.summary?.total_active_debtors || 0,
            totalDebtManaged:
              data.agents_summary?.summary?.total_debt_managed || 0,
          },
        },
        debtorsSummary: {
          debtors: data.debtors_summary?.debtors || [],
        },
        lastUpdated: data.last_updated,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    }
  }, []);

  const fetchMyAgents = useCallback(async () => {
    try {
      const userData = await getUserData();
      if (!userData) return;

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
        "Content-Type": "application/json",
      };

      console.log("Fetching agents...");
      // getAgents now returns the array directly, not a response object
      const agents = await getAgents(headers);

      console.log("Agents received:", agents);

      if (!Array.isArray(agents)) {
        console.error("Agents is not an array:", agents);
        setMyAgents([]);
        return;
      }

      const validatedAgents = agents
        .filter((agent) => agent && agent.id)
        .map((agent) => ({
          id: agent.id,
          name: agent.name || "Unknown Agent",
          type: agent.type_of_agent || "Agent",
          phone: agent.phone || null,
          status: agent.status || "active",
          opening_balance: parseFloat(agent.opening_balance || 0),
          closing_balance: parseFloat(agent.closing_balance || 0),
          total_commissions: parseFloat(agent.total_commissions || 0),
          active_debtors: parseInt(agent.active_debtors || 0),
          created_at: agent.created_at || new Date().toISOString(),
          updated_at: agent.updated_at || new Date().toISOString(),
        }));

      console.log("Validated agents:", validatedAgents);
      setMyAgents(validatedAgents);

      const totalClosing = validatedAgents.reduce(
        (sum, a) => sum + a.closing_balance,
        0
      );
      const totalOpening = validatedAgents.reduce(
        (sum, a) => sum + a.opening_balance,
        0
      );

      console.log("Calculated totals:", { totalClosing, totalOpening });

      setAgentBalances({
        totalOpeningBalance: totalOpening,
        totalClosingBalance: totalClosing,
        agentCount: validatedAgents.length,
      });
    } catch (error) {
      console.error("Error fetching agents:", error);
      setMyAgents([]);
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
      console.error("Error fetching weekly stats:", error);
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
      console.error("Error fetching monthly stats:", error);
    }
  }, []);

  const fetchAllDebtors = useCallback(async () => {
    try {
      const userData = await getUserData();
      if (!userData) return;

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
        "Content-Type": "application/json",
      };

      if (typeof getDebtorsOverview !== "function") {
        Alert.alert("Error", "Debtors overview function not available");
        return;
      }

      const response = await getDebtorsOverview(headers);
      const debtSummary = response?.debt_summary || [];

      const validatedDebtors = Array.isArray(debtSummary)
        ? debtSummary
            .map((item) => {
              if (item?.id === undefined) return null;
              return {
                ...item,
                id: item.id,
                balance_due: parseFloat(item.balance_due || 0),
                created_at: item.created_at || new Date().toISOString(),
                debtor_name: item.debtor_name || "Unknown Debtor",
                phone: item.phone || null,
                agent_name: item.agent_name || "Unknown Agent",
                name: item.debtor_name || "Unknown Debtor",
                total_debt: parseFloat(item.balance_due || 0),
                amount: parseFloat(item.balance_due || 0),
                total_paid: 0,
                amount_paid: 0,
                status: item.balance_due > 0 ? "active" : "paid",
                is_fully_paid: item.balance_due <= 0,
              };
            })
            .filter(Boolean)
        : [];

      setAllDebtors(validatedDebtors);
    } catch (error) {
      console.error("Error fetching all debtors:", error);
      Alert.alert("Error", error.message || "Failed to load debtors");
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchMyAgents(),
        fetchWeeklyStats(),
        fetchMonthlyStats(),
        fetchAllDebtors(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    fetchDashboardData,
    fetchMyAgents,
    fetchWeeklyStats,
    fetchMonthlyStats,
    fetchAllDebtors,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      fetchMyAgents();
    }, [fetchDashboardData, fetchMyAgents])
  );

  const toggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen]);

  const navigateTo = useCallback(
    (screen) => {
      setMenuOpen(false);
      navigation.navigate(screen);
    },
    [navigation]
  );

  const formatCurrency = useCallback((amount) => {
    const numAmount = Number(amount) || 0;
    return `TSh ${numAmount.toLocaleString("en-TZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
  const metrics = useMemo(() => {
    const { dailyStats, quickStats, agentsSummary } = dashboardData;

    console.log("=== METRICS CALCULATION DEBUG ===");
    console.log("agentsSummary.agents:", agentsSummary.agents);

    // Calculate cumulative balance using the LATEST_BALANCE from backend
    // This follows your pattern: latest_balance IS the closing_balance from the most recent transaction
    const cumulativeBalance = agentsSummary.agents.reduce((sum, agent) => {
      // Use latest_balance (which is the closing_balance from the agent's most recent transaction)
      // This matches your fetchAgentTransactions pattern where you get closing_balance from last transaction
      const balance = parseFloat(agent.latest_balance) || 0;
      console.log(`Agent ${agent.name}: latest_balance = ${balance}`);
      return sum + balance;
    }, 0);

    // Fallback: if agentsSummary is empty, calculate from myAgents
    const fallbackBalance = myAgents.reduce((sum, agent) => {
      const balance = parseFloat(agent.closing_balance) || 0;
      return sum + balance;
    }, 0);

    const totalBalance =
      agentsSummary.agents.length > 0 ? cumulativeBalance : fallbackBalance;

    console.log("CUMULATIVE BALANCE:", totalBalance);
    console.log("================================");

    // Calculate today's net change
    const netChange = dailyStats.closingBalance - dailyStats.openingBalance;

    return {
      // PRIMARY: Use cumulative balance (persists across days)
      // This is the sum of all agents' latest_balance (their most recent transaction's closing_balance)
      totalBalance: totalBalance,

      // TODAY'S STATS: Specific to current day
      todaysOpening: dailyStats.openingBalance,
      todaysClosing: dailyStats.closingBalance,
      todaysChange: netChange,

      // OTHER METRICS
      totalTransactions: quickStats.weeklyTransactions || 0,
      totalCommissions: quickStats.monthlyCommissions || 0,
      activeAgents: agentsSummary.agents.length || myAgents.length,

      // TRENDS
      balanceTrend:
        netChange > 0
          ? Math.round((netChange / (dailyStats.openingBalance || 1)) * 100)
          : 0,
      transactionsTrend: 12,
      commissionsTrend: 25,
    };
  }, [dashboardData, myAgents]);

  const chartData = useMemo(() => {
    const { agentsSummary } = dashboardData;

    console.log("=== CHART DATA DEBUG ===");
    console.log("Agents with balances:", agentsSummary.agents.length);

    // Use agentsSummary.agents - they have latest_balance from their most recent transactions
    const agentsWithBalances =
      agentsSummary.agents.length > 0 ? agentsSummary.agents : myAgents;

    // Sort by latest_balance (which IS the closing_balance from last transaction)
    const topAgents = [...agentsWithBalances]
      .sort((a, b) => {
        const balanceA = parseFloat(a.latest_balance || a.closing_balance) || 0;
        const balanceB = parseFloat(b.latest_balance || b.closing_balance) || 0;
        return balanceB - balanceA;
      })
      .slice(0, 5);

    console.log(
      "Top 5 agents:",
      topAgents.map((a) => ({
        name: a.name,
        latest_balance: a.latest_balance,
      }))
    );

    const getAgentLabel = (name) => {
      if (!name) return "Agent";
      const firstName = name.split(" ")[0];
      return firstName.length > 8 ? firstName.substring(0, 8) : firstName;
    };

    return {
      balanceComparison: topAgents.map((agent) => {
        // Use latest_balance - this is the closing_balance from the agent's most recent transaction
        const balance =
          parseFloat(agent.latest_balance || agent.closing_balance) || 0;
        return {
          label: getAgentLabel(agent.name),
          value: balance,
          displayValue: formatCurrency(balance),
          fullName: agent.name,
        };
      }),
      transactionChart: topAgents.map((agent) => ({
        label: getAgentLabel(agent.name),
        value: agent.active_debtors || 0,
        displayValue: `${agent.active_debtors || 0} debtors`,
        fullName: agent.name,
      })),
      debtorsPieChart: [
        {
          label: "High Risk",
          value: allDebtors.filter((d) => d.balance_due > 1000000).length,
          displayValue: allDebtors
            .filter((d) => d.balance_due > 1000000)
            .length.toString(),
          color: theme.colors.error,
        },
        {
          label: "Medium Risk",
          value: allDebtors.filter(
            (d) => d.balance_due > 500000 && d.balance_due <= 1000000
          ).length,
          displayValue: allDebtors
            .filter((d) => d.balance_due > 500000 && d.balance_due <= 1000000)
            .length.toString(),
          color: theme.colors.warning,
        },
        {
          label: "Low Risk",
          value: allDebtors.filter(
            (d) => d.balance_due <= 500000 && d.balance_due > 0
          ).length,
          displayValue: allDebtors
            .filter((d) => d.balance_due <= 500000 && d.balance_due > 0)
            .length.toString(),
          color: theme.colors.success,
        },
      ],
      agentPerformancePie: [
        {
          label: "Growing",
          value: agentsWithBalances.filter((a) => {
            const latest =
              parseFloat(a.latest_balance || a.closing_balance) || 0;
            const opening = parseFloat(a.opening_balance) || 0;
            return latest > opening;
          }).length,
          displayValue: agentsWithBalances
            .filter((a) => {
              const latest =
                parseFloat(a.latest_balance || a.closing_balance) || 0;
              const opening = parseFloat(a.opening_balance) || 0;
              return latest > opening;
            })
            .length.toString(),
          color: theme.colors.secondary[500],
        },
        {
          label: "Stable",
          value: agentsWithBalances.filter((a) => {
            const latest =
              parseFloat(a.latest_balance || a.closing_balance) || 0;
            const opening = parseFloat(a.opening_balance) || 0;
            return latest === opening;
          }).length,
          displayValue: agentsWithBalances
            .filter((a) => {
              const latest =
                parseFloat(a.latest_balance || a.closing_balance) || 0;
              const opening = parseFloat(a.opening_balance) || 0;
              return latest === opening;
            })
            .length.toString(),
          color: theme.colors.accent.blue,
        },
        {
          label: "Declining",
          value: agentsWithBalances.filter((a) => {
            const latest =
              parseFloat(a.latest_balance || a.closing_balance) || 0;
            const opening = parseFloat(a.opening_balance) || 0;
            return latest < opening;
          }).length,
          displayValue: agentsWithBalances
            .filter((a) => {
              const latest =
                parseFloat(a.latest_balance || a.closing_balance) || 0;
              const opening = parseFloat(a.opening_balance) || 0;
              return latest < opening;
            })
            .length.toString(),
          color: theme.colors.error,
        },
      ],
    };
  }, [dashboardData, formatCurrency, allDebtors, myAgents]);

  const debtCollectionRate = useMemo(() => {
    const { totalDebtOutstanding, totalDebtCollected } =
      dashboardData.quickStats;
    const total = totalDebtOutstanding + totalDebtCollected;
    return total > 0 ? (totalDebtCollected / total) * 100 : 0;
  }, [dashboardData.quickStats]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
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
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary[600]}
      />

      <ModernDashboardHeader
        user={user}
        onMenuPress={toggleMenu}
        onLogout={logout}
        agentCount={myAgents.length}
      />

      {menuOpen && (
        <Animated.View style={[styles.menuOverlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.modernMenu,
              {
                transform: [
                  {
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-300, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modernMenuHeader}>
              <View style={styles.menuProfileSection}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || "User"}</Text>
                  <Text style={styles.profileRole}>Agent Manager</Text>
                  <View style={styles.profileStatusIndicator}>
                    <View style={styles.statusDotOnline} />
                    <Text style={styles.profileStatus}>
                      Managing {myAgents.length} agents
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={toggleMenu}
                style={styles.modernCloseButton}
              >
                <Icon
                  name="close"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.menuScrollContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.menuItemsContainer}>
                <Text style={styles.menuSectionTitle}>AGENT MANAGEMENT</Text>

                {[
                  {
                    screen: "Dashboard",
                    icon: "dashboard",
                    label: "Dashboard",
                    isActive: true,
                  },
                  {
                    screen: "Transactions",
                    icon: "receipt",
                    label: "Agent Transactions",
                    badge: dailyStats.agentTransactions,
                  },
                  {
                    screen: "Agents",
                    icon: "people",
                    label: "My Agents",
                    badge: myAgents.length,
                  },
                  {
                    screen: "Commissions",
                    icon: "attach-money",
                    label: "Commissions",
                  },
                  {
                    screen: "Debtors",
                    icon: "account-balance",
                    label: "Managed Debtors",
                    badge: quickStats.activeDebtors,
                  },
                ].map((item, index) => (
                  <TouchableOpacity
                    key={item.screen}
                    style={[
                      styles.modernMenuItem,
                      item.isActive && styles.modernMenuItemActive,
                    ]}
                    onPress={() =>
                      item.screen === "Dashboard"
                        ? toggleMenu()
                        : navigateTo(item.screen)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemContent}>
                      <View
                        style={[
                          styles.modernMenuItemIcon,
                          {
                            backgroundColor: item.isActive
                              ? theme.colors.primary[500]
                              : theme.colors.primary[50],
                          },
                        ]}
                      >
                        <Icon
                          name={item.icon}
                          size={18}
                          color={
                            item.isActive
                              ? theme.colors.text.inverse
                              : theme.colors.primary[500]
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.modernMenuItemText,
                          item.isActive && styles.modernMenuItemTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {typeof item.badge === "number" && item.badge > 0 && (
                      <View style={styles.menuItemBadge}>
                        <Text style={styles.menuItemBadgeText}>
                          {item.badge > 99 ? "99+" : item.badge}
                        </Text>
                      </View>
                    )}

                    <Icon
                      name="chevron-right"
                      size={16}
                      color={
                        item.isActive
                          ? theme.colors.primary[500]
                          : theme.colors.text.tertiary
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.menuStatsSection}>
                <Text style={styles.menuSectionTitle}>TODAY'S SUMMARY</Text>

                <View style={styles.menuStatItem}>
                  <View
                    style={[
                      styles.menuStatIcon,
                      { backgroundColor: theme.colors.secondary[500] },
                    ]}
                  >
                    <Icon
                      name="account-balance-wallet"
                      size={16}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>
                      Agent Total Balance
                    </Text>
                    <Text style={styles.menuStatValue}>
                      {formatCurrency(metrics.totalBalance)}
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatItem}>
                  <View
                    style={[
                      styles.menuStatIcon,
                      { backgroundColor: theme.colors.primary[500] },
                    ]}
                  >
                    <Icon
                      name="people"
                      size={16}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>Agents Performance</Text>
                    <Text style={styles.menuStatValue}>
                      {
                        myAgents.filter(
                          (a) => a.closing_balance > a.opening_balance
                        ).length
                      }
                      /{myAgents.length} Growing
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatItem}>
                  <View
                    style={[
                      styles.menuStatIcon,
                      { backgroundColor: theme.colors.error },
                    ]}
                  >
                    <Icon
                      name="warning"
                      size={16}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>High Risk Debtors</Text>
                    <Text style={styles.menuStatValue}>
                      {allDebtors.filter((d) => d.balance_due > 1000000).length}{" "}
                      debtors
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatItem}>
                  <View
                    style={[
                      styles.menuStatIcon,
                      { backgroundColor: theme.colors.accent.amber },
                    ]}
                  >
                    <Icon
                      name="trending-up"
                      size={16}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>Collection Rate</Text>
                    <Text style={styles.menuStatValue}>
                      {Math.round(debtCollectionRate)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.menuFooter}>
                <TouchableOpacity
                  style={styles.menuFooterItem}
                  onPress={() => navigateTo("Settings")}
                >
                  <Icon
                    name="settings"
                    size={18}
                    color={theme.colors.text.secondary}
                  />
                  <Text style={styles.menuFooterText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutMenuItem}
                  onPress={logout}
                >
                  <Icon
                    name="exit-to-app"
                    size={18}
                    color={theme.colors.error}
                  />
                  <Text style={styles.logoutMenuText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>

          <TouchableOpacity
            style={styles.menuBackdrop}
            onPress={toggleMenu}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      <View style={styles.modernTabContainer}>
        {[
          { key: "overview", label: "Overview", icon: "dashboard" },
          { key: "analytics", label: "Analytics", icon: "analytics" },
          { key: "agents", label: "My Agents", icon: "people" },
          { key: "debtors", label: "Debtors", icon: "account-balance" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.modernTab,
              activeTab === tab.key && styles.modernActiveTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={18}
              color={
                activeTab === tab.key
                  ? theme.colors.primary[500]
                  : theme.colors.text.secondary
              }
            />
            <Text
              style={[
                styles.modernTabText,
                activeTab === tab.key && styles.modernActiveTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {activeTab === "overview" && (
            <>
              <View
                style={[
                  styles.modernStatusCard,
                  {
                    backgroundColor:
                      myAgents.length > 0
                        ? theme.colors.primary[600]
                        : theme.colors.error,
                  },
                  theme.shadows.large,
                ]}
              >
                <View style={styles.statusCardGradient}>
                  <View
                    style={[
                      styles.statusCardGradientOverlay,
                      {
                        backgroundColor:
                          myAgents.length > 0
                            ? theme.colors.primary[700]
                            : theme.colors.error,
                      },
                    ]}
                  />
                </View>
                <View style={styles.modernStatusHeader}>
                  <View>
                    <View style={styles.statusDateBadge}>
                      <Icon
                        name="calendar-today"
                        size={14}
                        color={theme.colors.text.inverse}
                      />
                      <Text style={styles.modernStatusDate}>
                        {new Date().toDateString()}
                      </Text>
                    </View>
                    <Text style={styles.modernStatusUpdate}>
                      Last sync:{" "}
                      {lastUpdated ? formatTime(lastUpdated) : "Never"}
                    </Text>
                  </View>
                  <View style={styles.modernStatusIcon}>
                    <Icon
                      name={myAgents.length > 0 ? "check-circle" : "warning"}
                      size={32}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                </View>
                <View style={styles.statusMetricsRow}>
                  <View style={styles.statusMetricItem}>
                    <Icon
                      name="people"
                      size={20}
                      color="rgba(255, 255, 255, 0.9)"
                    />
                    <Text style={styles.statusMetricValue}>
                      {myAgents.length}
                    </Text>
                    <Text style={styles.statusMetricLabel}>Agents</Text>
                  </View>
                  <View style={styles.statusMetricDivider} />
                  <View style={styles.statusMetricItem}>
                    <Icon
                      name="account-balance-wallet"
                      size={20}
                      color="rgba(255, 255, 255, 0.9)"
                    />
                    <Text style={styles.statusMetricValue}>
                      {formatCurrency(metrics.totalBalance)}
                    </Text>
                    <Text style={styles.statusMetricLabel}>Total Balance</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modernMetricsGrid}>
                <ModernMetricCard
                  icon="account-balance-wallet"
                  value={formatCurrency(metrics.totalBalance)}
                  label="Total Agent Balance"
                  trend={metrics.balanceTrend}
                  gradient={[
                    theme.colors.primary[500],
                    theme.colors.primary[600],
                  ]}
                />
                <ModernMetricCard
                  icon="receipt"
                  value={metrics.totalTransactions.toString()}
                  label="Agent Transactions"
                  trend={metrics.transactionsTrend}
                  gradient={[
                    theme.colors.secondary[500],
                    theme.colors.secondary[600],
                  ]}
                />
                <ModernMetricCard
                  icon="attach-money"
                  value={formatCurrency(metrics.totalCommissions)}
                  label="Total Commissions"
                  trend={metrics.commissionsTrend}
                  gradient={[
                    theme.colors.accent.amber,
                    theme.colors.accent.orange,
                  ]}
                />
                <ModernMetricCard
                  icon="people"
                  value={myAgents.length.toString()}
                  label="Active Agents"
                  gradient={[theme.colors.accent.violet, "#7C3AED"]}
                />
              </View>

              {/* UPDATED Balance Overview Card */}
              <View style={styles.modernCard}>
                <Text style={styles.modernCardTitle}>Balance Overview</Text>

                {/* PRIMARY: Cumulative Total Balance - THIS PERSISTS! */}
                <View style={styles.balancePrimarySection}>
                  <View style={styles.cumulativeBalanceHeader}>
                    <View style={styles.cumulativeIconContainer}>
                      <Icon
                        name="account-balance-wallet"
                        size={24}
                        color={theme.colors.primary[600]}
                      />
                    </View>
                    <Text style={styles.cumulativeBalanceTitle}>
                      TOTAL BALANCE - ALL AGENTS
                    </Text>
                  </View>
                  <Text style={styles.cumulativeBalanceValue}>
                    {formatCurrency(metrics.totalBalance)}
                  </Text>
                  <View style={styles.cumulativeStatsRow}>
                    <View style={styles.cumulativeStat}>
                      <Text style={styles.cumulativeStatLabel}>
                        Active Agents
                      </Text>
                      <Text style={styles.cumulativeStatValue}>
                        {myAgents.length}
                      </Text>
                    </View>
                    <View style={styles.cumulativeStatDivider} />
                    <View style={styles.cumulativeStat}>
                      <Text style={styles.cumulativeStatLabel}>
                        Last Update
                      </Text>
                      <Text style={styles.cumulativeStatValue}>
                        {lastUpdated
                          ? new Date(lastUpdated).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* SECONDARY: Today's Activity */}
                <View style={styles.balanceSection}>
                  <View style={styles.todayActivityHeader}>
                    <Text style={styles.balanceSectionTitle}>
                      Today's Activity
                    </Text>
                    {dailyStats.hasTodayTransaction && (
                      <View style={styles.hasTransactionBadge}>
                        <Icon
                          name="check-circle"
                          size={14}
                          color={theme.colors.success}
                        />
                        <Text style={styles.hasTransactionText}>Updated</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.balanceRow}>
                    <View style={styles.balanceItem}>
                      <Text style={styles.balanceLabel}>Opening</Text>
                      <Text style={styles.balanceValue}>
                        {formatCurrency(metrics.todaysOpening)}
                      </Text>
                    </View>
                    <Icon
                      name="arrow-forward"
                      size={24}
                      color={theme.colors.text.secondary}
                    />
                    <View style={styles.balanceItem}>
                      <Text style={styles.balanceLabel}>Closing</Text>
                      <Text
                        style={[
                          styles.balanceValue,
                          { color: theme.colors.secondary[500] },
                        ]}
                      >
                        {formatCurrency(metrics.todaysClosing)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Net Change */}
                <View style={styles.netChangeContainer}>
                  <View style={styles.netChangeItem}>
                    <Text style={styles.netChangeLabel}>
                      Today's Net Change
                    </Text>
                    <Text
                      style={[
                        styles.netChangeValue,
                        {
                          color:
                            metrics.todaysChange >= 0
                              ? theme.colors.secondary[500]
                              : theme.colors.error,
                        },
                      ]}
                    >
                      {metrics.todaysChange >= 0 ? "+" : ""}
                      {formatCurrency(metrics.todaysChange)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Only show if we have agents with balance data */}
              {/* Top Performing Agents - Use agentsSummary.agents for latest_balance */}
              {(dashboardData.agentsSummary.agents.length > 0 ||
                myAgents.length > 0) && (
                <View style={styles.modernCard}>
                  <AgentComparisonChart
                    agents={
                      dashboardData.agentsSummary.agents.length > 0
                        ? dashboardData.agentsSummary.agents
                        : myAgents
                    }
                    formatCurrency={formatCurrency}
                  />
                </View>
              )}

              {/* Recent Activities Section - replaces Quick Actions */}
              {recentActivity && recentActivity.length > 0 && (
                <View style={styles.modernCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.modernCardTitle}>
                      Recent Activities
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Transactions")}
                    >
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  </View>

                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <View
                      key={activity.id || index}
                      style={[styles.activityCard, theme.shadows.small]}
                    >
                      <View style={styles.activityCardHeader}>
                        <View
                          style={[
                            styles.activityIcon,
                            {
                              backgroundColor:
                                activity.type === "employee_created_transaction"
                                  ? theme.colors.primary[500] + "15"
                                  : theme.colors.secondary[500] + "15",
                            },
                          ]}
                        >
                          <Icon
                            name={
                              activity.type === "employee_created_transaction"
                                ? "add-circle"
                                : "swap-horiz"
                            }
                            size={24}
                            color={
                              activity.type === "employee_created_transaction"
                                ? theme.colors.primary[500]
                                : theme.colors.secondary[500]
                            }
                          />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityTitle}>
                            {activity.title}
                          </Text>
                          <Text style={styles.activityDescription}>
                            {activity.description}
                          </Text>
                          {activity.timestamp && (
                            <Text style={styles.activityTime}>
                              {formatTime(activity.timestamp)}
                            </Text>
                          )}
                        </View>
                        {activity.amount && (
                          <View style={styles.activityAmount}>
                            <Text
                              style={[
                                styles.activityAmountText,
                                {
                                  color:
                                    activity.amount > 0
                                      ? theme.colors.secondary[500]
                                      : theme.colors.error,
                                },
                              ]}
                            >
                              {activity.amount > 0 ? "+" : ""}
                              {formatCurrency(activity.amount)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === "analytics" && (
            <>
              <View style={styles.modernCard}>
                <ModernBarChart
                  data={chartData.balanceComparison}
                  title="Top Agent Balances"
                  color={theme.colors.primary[500]}
                  height={180}
                />
              </View>

              <View style={styles.modernCard}>
                <ModernBarChart
                  data={chartData.transactionChart}
                  title="Agents by Debtor Count"
                  color={theme.colors.secondary[500]}
                  height={180}
                />
              </View>

              <View style={styles.modernCard}>
                <ModernDonutChart
                  data={chartData.agentPerformancePie}
                  title="Agent Performance Distribution"
                  subtitle="Total"
                />
              </View>

              <View style={styles.modernCard}>
                <ModernDonutChart
                  data={chartData.debtorsPieChart}
                  title="Debtor Risk Analysis"
                  subtitle="Total"
                />
              </View>

              <View style={styles.modernCard}>
                <EnhancedProgressRing
                  progress={debtCollectionRate}
                  title="Debt Collection Rate"
                  subtitle={`${formatCurrency(
                    dashboardData.quickStats.totalDebtCollected
                  )} collected`}
                  color={theme.colors.secondary[500]}
                />
              </View>

              <View style={[styles.modernCard, styles.elevatedCard]}>
                <View style={styles.cardHeaderWithIcon}>
                  <View
                    style={[
                      styles.cardHeaderIcon,
                      { backgroundColor: theme.colors.primary[500] },
                    ]}
                  >
                    <Icon
                      name="analytics"
                      size={24}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                  <Text style={styles.modernCardTitle}>
                    Performance Analytics
                  </Text>
                </View>
                <View style={styles.performanceMetricsGrid}>
                  <View style={styles.performanceMetric}>
                    <View
                      style={[
                        styles.performanceMetricIcon,
                        { backgroundColor: theme.colors.secondary[500] },
                      ]}
                    >
                      <Icon
                        name="trending-up"
                        size={28}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.performanceMetricValue}>
                      {
                        myAgents.filter(
                          (a) => a.closing_balance > a.opening_balance
                        ).length
                      }
                    </Text>
                    <Text style={styles.performanceMetricLabel}>
                      Growing Agents
                    </Text>
                    <View style={styles.performanceMetricBar}>
                      <View
                        style={[
                          styles.performanceMetricBarFill,
                          {
                            width:
                              myAgents.length > 0
                                ? `${
                                    (myAgents.filter(
                                      (a) =>
                                        a.closing_balance > a.opening_balance
                                    ).length /
                                      myAgents.length) *
                                    100
                                  }%`
                                : "0%",
                            backgroundColor: theme.colors.secondary[500],
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.performanceMetric}>
                    <View
                      style={[
                        styles.performanceMetricIcon,
                        { backgroundColor: theme.colors.accent.amber },
                      ]}
                    >
                      <Icon
                        name="star"
                        size={28}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.performanceMetricValue}>
                      {Math.round(debtCollectionRate)}%
                    </Text>
                    <Text style={styles.performanceMetricLabel}>
                      Collection Rate
                    </Text>
                    <View style={styles.performanceMetricBar}>
                      <View
                        style={[
                          styles.performanceMetricBarFill,
                          {
                            width: `${debtCollectionRate}%`,
                            backgroundColor: theme.colors.accent.amber,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.performanceMetric}>
                    <View
                      style={[
                        styles.performanceMetricIcon,
                        { backgroundColor: theme.colors.error },
                      ]}
                    >
                      <Icon
                        name="warning"
                        size={28}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.performanceMetricValue}>
                      {allDebtors.filter((d) => d.balance_due > 1000000).length}
                    </Text>
                    <Text style={styles.performanceMetricLabel}>High Risk</Text>
                    <View style={styles.performanceMetricBar}>
                      <View
                        style={[
                          styles.performanceMetricBarFill,
                          {
                            width:
                              allDebtors.length > 0
                                ? `${
                                    (allDebtors.filter(
                                      (d) => d.balance_due > 1000000
                                    ).length /
                                      allDebtors.length) *
                                    100
                                  }%`
                                : "0%",
                            backgroundColor: theme.colors.error,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === "agents" && (
            <>
              <View style={styles.modernCard}>
                <Text style={styles.modernCardTitle}>My Agents Overview</Text>
                <View style={styles.modernSummaryRow}>
                  <View style={styles.modernSummaryItem}>
                    <View
                      style={[
                        styles.modernSummaryIcon,
                        { backgroundColor: theme.colors.primary[500] },
                      ]}
                    >
                      <Icon
                        name="people"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {dashboardData.agentsSummary.agents.length}
                    </Text>
                    <Text style={styles.modernSummaryLabel}>Total Agents</Text>
                  </View>
                  <View style={styles.modernSummaryItem}>
                    <View
                      style={[
                        styles.modernSummaryIcon,
                        { backgroundColor: theme.colors.secondary[500] },
                      ]}
                    >
                      <Icon
                        name="account-balance-wallet"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {formatCurrency(metrics.totalBalance)}{" "}
                      {/* Use metrics.totalBalance instead of dailyStats.closingBalance */}
                    </Text>
                    <Text style={styles.modernSummaryLabel}>
                      Combined Balance
                    </Text>
                  </View>
                  <View style={styles.modernSummaryItem}>
                    <View
                      style={[
                        styles.modernSummaryIcon,
                        { backgroundColor: theme.colors.accent.amber },
                      ]}
                    >
                      <Icon
                        name="trending-up"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {
                        dashboardData.agentsSummary.agents.filter(
                          (a) =>
                            (a.closing_balance || 0) > (a.opening_balance || 0)
                        ).length
                      }
                    </Text>
                    <Text style={styles.modernSummaryLabel}>Growing</Text>
                  </View>
                </View>
              </View>
              {dashboardData.agentsSummary.agents.length > 0 ? (
                <FlatList
                  data={dashboardData.agentsSummary.agents}
                  renderItem={({ item, index }) => {
                    // Use latest_balance (which is the closing_balance from most recent transaction)
                    const latestBalance = parseFloat(item.latest_balance) || 0;
                    const openingBalance =
                      parseFloat(item.opening_balance) || 0;
                    const netChange = latestBalance - openingBalance;

                    return (
                      <View
                        style={[styles.modernAgentCard, theme.shadows.medium]}
                      >
                        <View style={styles.modernAgentHeader}>
                          <View style={styles.modernAgentInfo}>
                            <View
                              style={[
                                styles.modernAgentAvatar,
                                {
                                  backgroundColor:
                                    index < 3
                                      ? theme.colors.secondary[500]
                                      : theme.colors.primary[500],
                                },
                              ]}
                            >
                              <Text style={styles.modernAgentAvatarText}>
                                {item.name?.charAt(0)?.toUpperCase() || "A"}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.modernAgentName}>
                                {item.name || "Unknown Agent"}
                              </Text>
                              <Text style={styles.modernAgentType}>
                                {item.type || "Agent"}
                              </Text>
                              {item.phone && (
                                <Text style={styles.modernAgentPhone}>
                                  {item.phone}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View
                            style={[
                              styles.modernAgentStatus,
                              { backgroundColor: theme.colors.secondary[500] },
                            ]}
                          >
                            <Text style={styles.modernAgentStatusText}>
                              Active
                            </Text>
                          </View>
                        </View>

                        <View style={styles.modernAgentMetrics}>
                          <View style={styles.modernAgentMetric}>
                            <Text style={styles.modernAgentMetricLabel}>
                              Opening
                            </Text>
                            <Text style={styles.modernAgentMetricValue}>
                              {formatCurrency(openingBalance)}
                            </Text>
                          </View>
                          <View style={styles.modernAgentMetric}>
                            <Text style={styles.modernAgentMetricLabel}>
                              Current
                            </Text>
                            <Text
                              style={[
                                styles.modernAgentMetricValue,
                                { color: theme.colors.secondary[500] },
                              ]}
                            >
                              {formatCurrency(latestBalance)}
                            </Text>
                          </View>
                          <View style={styles.modernAgentMetric}>
                            <Text style={styles.modernAgentMetricLabel}>
                              Debtors
                            </Text>
                            <Text style={styles.modernAgentMetricValue}>
                              {item.active_debtors || 0}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.modernAgentProgress}>
                          <AgentPerformanceRing
                            agent={{
                              opening_balance: openingBalance,
                              closing_balance: latestBalance,
                            }}
                            size={60}
                          />
                          <View style={styles.modernAgentNetChange}>
                            <Text style={styles.modernAgentNetChangeLabel}>
                              Net Change
                            </Text>
                            <Text
                              style={[
                                styles.modernAgentNetChangeValue,
                                {
                                  color:
                                    netChange >= 0
                                      ? theme.colors.secondary[500]
                                      : theme.colors.error,
                                },
                              ]}
                            >
                              {netChange >= 0 ? "+" : ""}
                              {formatCurrency(netChange)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }}
                  keyExtractor={(item) =>
                    item.id?.toString() || Math.random().toString()
                  }
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.modernCard}>
                  <View style={styles.modernEmptyState}>
                    <View
                      style={[
                        styles.modernEmptyIcon,
                        { backgroundColor: theme.colors.primary[500] },
                      ]}
                    >
                      <Icon
                        name="people"
                        size={48}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernEmptyTitle}>No Agents Yet</Text>
                    <Text style={styles.modernEmptySubtitle}>
                      Add your first agent to start managing transactions and
                      tracking performance
                    </Text>
                    <TouchableOpacity
                      style={styles.modernEmptyButton}
                      onPress={() => navigation.navigate("CreateAgent")}
                    >
                      <View
                        style={[
                          styles.modernEmptyButtonGradient,
                          { backgroundColor: theme.colors.primary[500] },
                        ]}
                      >
                        <Icon
                          name="person-add"
                          size={20}
                          color={theme.colors.text.inverse}
                        />
                        <Text style={styles.modernEmptyButtonText}>
                          Add First Agent
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === "debtors" && (
            <>
              <View style={styles.modernCard}>
                <Text style={styles.modernCardTitle}>Debtors Overview</Text>
                <View style={styles.modernSummaryRow}>
                  <View style={styles.modernSummaryItem}>
                    <View
                      style={[
                        styles.modernSummaryIcon,
                        { backgroundColor: theme.colors.accent.blue },
                      ]}
                    >
                      <Icon
                        name="account-balance"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {allDebtors.length}
                    </Text>
                    <Text style={styles.modernSummaryLabel}>Total Debtors</Text>
                  </View>

                  <View style={styles.modernSummaryItem}>
                    <View
                      style={[
                        styles.modernSummaryIcon,
                        { backgroundColor: theme.colors.error },
                      ]}
                    >
                      <Icon
                        name="warning"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {allDebtors.filter((d) => d.balance_due > 1000000).length}
                    </Text>
                    <Text style={styles.modernSummaryLabel}>High Risk</Text>
                  </View>

                  <View style={styles.modernSummaryItem}>
                    <View
                      style={[
                        styles.modernSummaryIcon,
                        { backgroundColor: theme.colors.secondary[500] },
                      ]}
                    >
                      <Icon
                        name="check-circle"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {Math.round(debtCollectionRate)}%
                    </Text>
                    <Text style={styles.modernSummaryLabel}>
                      Collection Rate
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.modernCard}>
                <ModernDonutChart
                  data={chartData.debtorsPieChart}
                  title="Debt Risk Distribution"
                  subtitle="Total Debtors"
                />
              </View>

              {allDebtors.length > 0 ? (
                <View style={styles.modernCard}>
                  <Text style={styles.modernCardTitle}>
                    All Debtors ({allDebtors.length})
                  </Text>

                  <FlatList
                    data={allDebtors}
                    renderItem={({ item }) => (
                      <ModernDebtorCard
                        debtor={item}
                        formatCurrency={formatCurrency}
                        onPress={() => {
                          console.log("Debtor pressed:", item.debtor_name);
                        }}
                      />
                    )}
                    keyExtractor={(item) =>
                      item.id?.toString() || Math.random().toString()
                    }
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              ) : (
                <View style={styles.modernCard}>
                  <View style={styles.modernEmptyState}>
                    <View
                      style={[
                        styles.modernEmptyIcon,
                        { backgroundColor: theme.colors.accent.blue },
                      ]}
                    >
                      <Icon
                        name="account-balance"
                        size={48}
                        color={theme.colors.text.inverse}
                      />
                    </View>
                    <Text style={styles.modernEmptyTitle}>
                      No Debtors Found
                    </Text>
                    <Text style={styles.modernEmptySubtitle}>
                      Debtors will appear here once your agents start managing
                      them
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
// Modern Activity Card Component (add after ModernDebtorCard)
const ModernActivityCard = ({ activity, formatCurrency, formatTime }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case "employee_created_transaction":
        return "add-circle";
      case "agent_transaction":
        return "swap-horiz";
      case "commission_earned":
        return "attach-money";
      case "debtor_payment":
        return "payment";
      default:
        return "info";
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "employee_created_transaction":
        return theme.colors.primary[500];
      case "agent_transaction":
        return theme.colors.secondary[500];
      case "commission_earned":
        return theme.colors.accent.amber;
      case "debtor_payment":
        return theme.colors.success;
      default:
        return theme.colors.accent.blue;
    }
  };

  return (
    <View style={[styles.activityCard, theme.shadows.small]}>
      <View style={styles.activityCardHeader}>
        <View
          style={[
            styles.activityIcon,
            { backgroundColor: getActivityColor(activity.type) + "15" },
          ]}
        >
          <Icon
            name={getActivityIcon(activity.type)}
            size={24}
            color={getActivityColor(activity.type)}
          />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
          {activity.created_at && (
            <Text style={styles.activityTime}>
              {format(new Date(activity.created_at), "MMM d, h:mm a")}
            </Text>
          )}
        </View>
        {activity.amount && (
          <View style={styles.activityAmount}>
            <Text
              style={[
                styles.activityAmountText,
                {
                  color:
                    activity.amount > 0
                      ? theme.colors.secondary[500]
                      : theme.colors.error,
                },
              ]}
            >
              {activity.amount > 0 ? "+" : ""}
              {formatCurrency(activity.amount)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ==================== CONTAINER STYLES ====================
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.xl,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xl,
  },
  bottomSpacing: {
    height: theme.spacing.xxxl * 2,
  },

  // ==================== HEADER STYLES ====================
  modernHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.primary[600],
    ...theme.shadows.large,
  },
  modernMenuButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modernHeaderCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
  },
  modernHeaderTitle: {
    fontSize: screenWidth < 768 ? 18 : 20,
    fontWeight: "700",
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
  },
  modernHeaderSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  agentCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  modernHeaderSubtitle: {
    fontSize: screenWidth < 768 ? 11 : 12,
    fontWeight: "500",
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing.xs,
  },
  modernLogoutButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  // ==================== SIDEBAR MENU STYLES ====================
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modernMenu: {
    width: screenWidth < 768 ? "85%" : "320px",
    maxWidth: 400,
    height: "100%",
    backgroundColor: theme.colors.surface.primary,
    ...theme.shadows.large,
  },
  modernMenuHeader: {
    paddingTop: 50,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.primary[600],
  },
  menuProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  profileAvatarText: {
    fontSize: 20,
    color: theme.colors.text.inverse,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: theme.spacing.sm,
  },
  profileStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[500],
    marginRight: theme.spacing.sm,
  },
  profileStatus: {
    fontSize: 11,
    color: theme.colors.secondary[500],
    fontWeight: "600",
  },
  modernCloseButton: {
    position: "absolute",
    top: 50,
    right: theme.spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuScrollContainer: {
    flex: 1,
  },
  menuItemsContainer: {
    paddingTop: theme.spacing.xl,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    textTransform: "uppercase",
  },
  modernMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "transparent",
    minHeight: 56,
  },
  modernMenuItemActive: {
    backgroundColor: theme.colors.primary[50],
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernMenuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
  },
  modernMenuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary,
    flex: 1,
  },
  modernMenuItemTextActive: {
    color: theme.colors.primary[600],
    fontWeight: "700",
  },
  menuItemBadge: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    marginRight: theme.spacing.md,
    minWidth: 24,
    minHeight: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemBadgeText: {
    fontSize: 11,
    color: theme.colors.text.inverse,
    fontWeight: "700",
  },
  menuStatsSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    backgroundColor: theme.colors.background.tertiary,
    marginTop: theme.spacing.lg,
  },
  menuStatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  menuStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
    ...theme.shadows.small,
  },
  menuStatContent: {
    flex: 1,
  },
  menuStatLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  menuStatValue: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: "700",
  },
  menuFooter: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    marginTop: "auto",
  },
  menuFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  menuFooterText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.md,
    fontWeight: "500",
  },
  logoutMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
    minHeight: 48,
  },
  logoutMenuText: {
    fontSize: 15,
    color: theme.colors.error,
    fontWeight: "600",
    marginLeft: theme.spacing.md,
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: screenWidth < 768 ? "85%" : "320px",
    right: 0,
    bottom: 0,
  },

  // ==================== TAB NAVIGATION STYLES ====================
  modernTabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.small,
  },
  modernTab: {
    flex: 1,
    flexDirection: screenWidth < 768 ? "column" : "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    minHeight: 56,
  },
  modernActiveTab: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary[500],
  },
  modernTabText: {
    fontSize: screenWidth < 768 ? 10 : 12,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginLeft: screenWidth < 768 ? 0 : theme.spacing.sm,
    marginTop: screenWidth < 768 ? 4 : 0,
    textAlign: "center",
  },
  modernActiveTabText: {
    color: theme.colors.primary[500],
    fontWeight: "700",
  },

  // ==================== CARD STYLES ====================
  modernCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  modernCardTitle: {
    fontSize: screenWidth < 768 ? 18 : 20,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  elevatedCard: {
    ...theme.shadows.large,
    borderWidth: 0,
  },
  cardHeaderWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  cardHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary[500],
    fontWeight: "600",
  },

  // ==================== STATUS CARD STYLES ====================
  modernStatusCard: {
    borderRadius: theme.borderRadius.xl,
    padding: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
    position: "relative",
    ...theme.shadows.large,
  },
  statusCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statusCardGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  modernStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  statusDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  modernStatusDate: {
    fontSize: screenWidth < 768 ? 12 : 14,
    fontWeight: "700",
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing.sm,
  },
  modernStatusUpdate: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: theme.spacing.xs,
    fontWeight: "500",
  },
  modernStatusIcon: {
    padding: theme.spacing.sm,
  },
  statusMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  statusMetricItem: {
    alignItems: "center",
    flex: 1,
  },
  statusMetricValue: {
    fontSize: screenWidth < 768 ? 16 : 18,
    fontWeight: "800",
    color: theme.colors.text.inverse,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  statusMetricLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  statusMetricDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: theme.spacing.md,
  },

  // ==================== METRIC CARD STYLES ====================
  modernMetricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  modernMetricCard: {
    width: screenWidth < 768 ? "48%" : "48%",
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    position: "relative",
    minHeight: screenWidth < 768 ? 130 : 140,
    ...theme.shadows.large,
  },
  metricGradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  metricGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  metricContent: {
    padding: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.small,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.small,
  },
  trendText: {
    fontSize: 10,
    color: theme.colors.text.inverse,
    fontWeight: "700",
    marginLeft: 4,
  },
  metricValue: {
    fontSize: screenWidth < 768 ? 16 : 18,
    color: theme.colors.text.inverse,
    fontWeight: "800",
    marginBottom: theme.spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 14,
  },

  // ==================== BALANCE OVERVIEW STYLES ====================
  balancePrimarySection: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.xl,
    padding: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    ...theme.shadows.medium,
  },
  cumulativeBalanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
  },
  cumulativeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  cumulativeBalanceTitle: {
    fontSize: screenWidth < 768 ? 11 : 13,
    color: theme.colors.text.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  cumulativeBalanceValue: {
    fontSize: screenWidth < 768 ? 32 : 44,
    color: theme.colors.primary[600],
    textAlign: "center",
    marginVertical: theme.spacing.lg,
    fontWeight: "900",
    letterSpacing: -1.5,
    textShadowColor: "rgba(124, 58, 237, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cumulativeStatsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary[200],
    flexWrap: "wrap",
  },
  cumulativeStat: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    minWidth: screenWidth < 768 ? "45%" : "auto",
    marginVertical: theme.spacing.xs,
  },
  cumulativeStatLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  cumulativeStatValue: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: "800",
  },
  cumulativeStatDivider: {
    width: 2,
    height: 40,
    backgroundColor: theme.colors.primary[200],
    borderRadius: 1,
    marginHorizontal: theme.spacing.md,
    display: screenWidth < 768 ? "none" : "flex",
  },
  balanceSection: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  balanceSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  todayActivityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
  },
  hasTransactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.success + "20",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  hasTransactionText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: "700",
    marginLeft: theme.spacing.xs,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  balanceItem: {
    alignItems: "center",
    flex: 1,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: screenWidth < 768 ? 16 : 18,
    color: theme.colors.text.primary,
    fontWeight: "800",
  },
  netChangeContainer: {
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  netChangeItem: {
    alignItems: "center",
  },
  netChangeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  netChangeValue: {
    fontSize: screenWidth < 768 ? 18 : 20,
    fontWeight: "900",
  },

  // ==================== TOP AGENT STYLES (NEW SIMPLIFIED DESIGN) ====================
  agentComparisonContainer: {
    marginBottom: theme.spacing.lg,
  },
  topAgentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: screenWidth < 768 ? theme.spacing.md : theme.spacing.lg,
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
    ...theme.shadows.small,
  },
  topAgentRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  topAgentRankText: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text.inverse,
  },
  topAgentInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  topAgentName: {
    fontSize: screenWidth < 768 ? 14 : 15,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  topAgentBar: {
    height: 6,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 3,
    overflow: "hidden",
  },
  topAgentBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary[500],
    borderRadius: 3,
  },
  topAgentBalanceBox: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: screenWidth < 768 ? theme.spacing.sm : theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: screenWidth < 768 ? 100 : 120,
    alignItems: "flex-end",
  },
  topAgentBalance: {
    fontSize: screenWidth < 768 ? 13 : 15,
    fontWeight: "800",
    color: theme.colors.text.primary,
    textAlign: "right",
  },

  // ==================== CHART STYLES ====================
  modernChartContainer: {
    marginBottom: theme.spacing.lg,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
  },
  modernChartTitle: {
    fontSize: screenWidth < 768 ? 18 : 20,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: screenWidth < 768 ? theme.spacing.sm : 0,
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  chartLegendText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  modernChartBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing.sm,
  },
  modernBarContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
    minWidth: 40,
  },
  modernBarValueTop: {
    marginBottom: theme.spacing.xs,
    minHeight: 32,
    justifyContent: "center",
  },
  modernBarValueTopText: {
    fontSize: screenWidth < 768 ? 10 : 11,
    fontWeight: "800",
    textAlign: "center",
  },
  modernBarWrapper: {
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modernBar: {
    width: "100%",
    minHeight: 8,
    borderRadius: theme.borderRadius.sm,
    ...theme.shadows.small,
    overflow: "hidden",
  },
  barGlowEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  modernBarLabel: {
    fontSize: screenWidth < 768 ? 10 : 12,
    fontWeight: "800",
    color: theme.colors.text.primary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },

  // ==================== DONUT CHART STYLES ====================
  donutContainer: {
    alignItems: "center",
  },
  donutTitle: {
    fontSize: screenWidth < 768 ? 16 : 18,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  donutChart: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  donutSegment: {
    position: "absolute",
  },
  donutCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surface.primary,
    ...theme.shadows.large,
    zIndex: 10,
  },
  donutCenterValue: {
    fontSize: screenWidth < 768 ? 20 : 24,
    color: theme.colors.text.primary,
    fontWeight: "900",
  },
  donutCenterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  donutLegends: {
    width: "100%",
    paddingHorizontal: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  legendValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: "900",
    marginRight: theme.spacing.xs,
  },
  legendPercent: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  // ==================== PERFORMANCE RING STYLES ====================
  performanceRing: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  performanceRingBackground: {
    position: "absolute",
  },
  performanceRingFill: {
    position: "absolute",
  },
  performanceRingCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  performancePercentage: {
    fontWeight: "900",
    color: theme.colors.text.primary,
  },
  enhancedProgressContainer: {
    alignItems: "center",
  },
  progressRingContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: theme.spacing.xl,
  },
  progressRingBackground: {
    position: "absolute",
  },
  progressRingFill: {
    position: "absolute",
  },
  progressRingCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontWeight: "900",
    color: theme.colors.text.primary,
  },
  progressLabel: {
    color: theme.colors.text.secondary,
    fontWeight: "600",
    marginTop: theme.spacing.xs,
    fontSize: 12,
  },
  progressInfo: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  progressTitle: {
    fontSize: screenWidth < 768 ? 16 : 18,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  progressSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  // ==================== SUMMARY ROW STYLES ====================
  modernSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  modernSummaryItem: {
    alignItems: "center",
    flex: 1,
    minWidth: screenWidth < 768 ? "30%" : "auto",
    marginVertical: theme.spacing.sm,
  },
  modernSummaryIcon: {
    width: screenWidth < 768 ? 48 : 56,
    height: screenWidth < 768 ? 48 : 56,
    borderRadius: screenWidth < 768 ? 24 : 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    ...theme.shadows.large,
  },
  modernSummaryValue: {
    fontSize: screenWidth < 768 ? 16 : 18,
    fontWeight: "900",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  modernSummaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // ==================== AGENT CARD STYLES ====================
  modernAgentCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
    ...theme.shadows.medium,
  },
  modernAgentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
  },
  modernAgentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: theme.spacing.md,
    marginBottom: screenWidth < 768 ? theme.spacing.sm : 0,
  },
  modernAgentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
    ...theme.shadows.medium,
  },
  modernAgentAvatarText: {
    fontSize: 18,
    color: theme.colors.text.inverse,
    fontWeight: "900",
  },
  modernAgentName: {
    fontSize: screenWidth < 768 ? 15 : 16,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modernAgentType: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modernAgentPhone: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: "500",
  },
  modernAgentStatus: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.small,
  },
  modernAgentStatusText: {
    fontSize: 10,
    color: theme.colors.text.inverse,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernAgentMetrics: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    flexWrap: "wrap",
  },
  modernAgentMetric: {
    alignItems: "center",
    flex: 1,
    minWidth: screenWidth < 768 ? "30%" : "auto",
    marginVertical: theme.spacing.xs,
  },
  modernAgentMetricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernAgentMetricValue: {
    fontSize: screenWidth < 768 ? 14 : 15,
    color: theme.colors.text.primary,
    fontWeight: "900",
  },
  modernAgentProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    flexWrap: "wrap",
  },
  modernAgentNetChange: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  modernAgentNetChangeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernAgentNetChangeValue: {
    fontSize: screenWidth < 768 ? 16 : 18,
    fontWeight: "900",
  },
  // ==================== DEBTOR CARD STYLES ====================
  modernDebtorCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: screenWidth < 768 ? theme.spacing.lg : theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    ...theme.shadows.medium,
  },
  debtorCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
  },
  debtorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: theme.spacing.md,
    marginBottom: screenWidth < 768 ? theme.spacing.sm : 0,
  },
  debtorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  debtorAvatarText: {
    fontSize: 18,
    fontWeight: "900",
  },
  debtorDetails: {
    flex: 1,
  },
  debtorName: {
    fontSize: screenWidth < 768 ? 14 : 15,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  debtorAgent: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  debtorPhone: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: "500",
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.small,
  },
  riskBadgeText: {
    fontSize: 10,
    color: theme.colors.text.inverse,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  debtorMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
  },
  debtorMetric: {
    alignItems: "center",
    flex: 1,
  },
  debtorMetricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  debtorMetricValue: {
    fontSize: screenWidth < 768 ? 13 : 14,
    fontWeight: "900",
  },
  debtorStatus: {
    fontSize: screenWidth < 768 ? 13 : 14,
    fontWeight: "900",
  },
  debtorProgress: {
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  debtorProgressBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
  },
  debtorProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  debtorProgressText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  // ==================== ACTIVITY CARD STYLES ====================
  activityCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
    ...theme.shadows.small,
  },
  activityCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: screenWidth < 768 ? 14 : 15,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  activityDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 16,
    fontWeight: "500",
  },
  activityTime: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: "600",
  },
  activityAmount: {
    alignItems: "flex-end",
    marginLeft: theme.spacing.md,
  },
  activityAmountText: {
    fontSize: screenWidth < 768 ? 13 : 14,
    fontWeight: "900",
  },
  // ==================== PERFORMANCE METRICS STYLES ====================
  performanceMetricsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.lg,
    flexWrap: "wrap",
  },
  performanceMetric: {
    alignItems: "center",
    flex: 1,
    minWidth: screenWidth < 768 ? "30%" : "auto",
    paddingHorizontal: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  performanceMetricIcon: {
    width: screenWidth < 768 ? 56 : 64,
    height: screenWidth < 768 ? 56 : 64,
    borderRadius: screenWidth < 768 ? 28 : 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    ...theme.shadows.large,
  },
  performanceMetricValue: {
    fontSize: screenWidth < 768 ? 20 : 24,
    color: theme.colors.text.primary,
    fontWeight: "900",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  performanceMetricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  performanceMetricBar: {
    width: "100%",
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    marginTop: theme.spacing.sm,
    overflow: "hidden",
  },
  performanceMetricBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  // ==================== EMPTY STATE STYLES ====================
  modernEmptyState: {
    alignItems: "center",
    paddingVertical:
      screenWidth < 768 ? theme.spacing.xxxl : theme.spacing.xxxl * 1.5,
    paddingHorizontal: theme.spacing.lg,
  },
  modernEmptyIcon: {
    width: screenWidth < 768 ? 80 : 96,
    height: screenWidth < 768 ? 80 : 96,
    borderRadius: screenWidth < 768 ? 40 : 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xxl,
    ...theme.shadows.large,
  },
  modernEmptyTitle: {
    fontSize: screenWidth < 768 ? 18 : 20,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  modernEmptySubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xxl,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.lg,
  },
  modernEmptyButton: {
    alignSelf: "stretch",
    marginHorizontal: theme.spacing.xl,
  },
  modernEmptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    minHeight: 56,
    ...theme.shadows.medium,
  },
  modernEmptyButtonText: {
    fontSize: 15,
    color: theme.colors.text.inverse,
    fontWeight: "800",
    marginLeft: theme.spacing.sm,
  },
});

export default DashboardScreen;
