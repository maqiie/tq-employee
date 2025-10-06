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
      50: '#F5F3FF',
      100: '#EDE9FE',
      500: '#7C3AED',
      600: '#6D28D9',
      700: '#5B21B6',
      900: '#4C1D95',
    },
    secondary: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
    },
    accent: {
      pink: '#EC4899',
      amber: '#F59E0B',
      orange: '#F97316',
      rose: '#F43F5E',
      violet: '#8B5CF6',
      blue: '#3B82F6',
      cyan: '#06B6D4',
      emerald: '#10B981',
      red: '#EF4444',
      teal: '#14B8A6',
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FE',
      tertiary: '#F3F4F6',
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F8F9FE',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    }
  },
  shadows: {
    small: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    large: {
      shadowColor: '#7C3AED',
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
      fontWeight: '800',
      lineHeight: 40,
    },
    h1: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    captionMedium: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
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
        <View style={[styles.donutCenter, { width: size * 0.55, height: size * 0.55, borderRadius: size * 0.275 }]}>
          <Text style={styles.donutCenterValue}>{total}</Text>
          <Text style={styles.donutCenterLabel}>{subtitle}</Text>
        </View>
        
        {/* Visual ring segments */}
        {data.map((item, index) => {
          const previousSum = data.slice(0, index).reduce((sum, d) => sum + d.value, 0);
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
                  borderColor: 'transparent',
                  borderTopColor: item.color,
                  borderRightColor: sweepAngle > 90 ? item.color : 'transparent',
                  borderBottomColor: sweepAngle > 180 ? item.color : 'transparent',
                  borderLeftColor: sweepAngle > 270 ? item.color : 'transparent',
                  transform: [{ rotate: `${startAngle}deg` }],
                  position: 'absolute',
                }
              ]}
            />
          );
        })}
      </View>
      <View style={styles.donutLegends}>
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
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
const ModernBarChart = ({ data, title, color = theme.colors.primary[500], height = 140 }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1);
  const [animatedValues] = useState(data.map(() => new Animated.Value(0)));

  useEffect(() => {
    const animations = animatedValues.map((anim, index) => 
      Animated.timing(anim, {
        toValue: data[index].value,
        duration: 1200 + (index * 150),
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
                      outputRange: ['4%', '100%'],
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: color,
                  }
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
  const performance = agent.closing_balance > 0 
    ? Math.min((agent.closing_balance / (agent.opening_balance || 1)) * 100, 100)
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
          }
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
            borderColor: 'transparent',
            borderTopColor: theme.colors.secondary[500],
            transform: [{ rotate: `${(performance / 100) * 360 - 90}deg` }],
          }
        ]}
      />
      <View style={styles.performanceRingCenter}>
        <Text style={[
          styles.performancePercentage, 
          { 
            fontSize: size * 0.14,
            color: theme.colors.text.primary,
            fontWeight: '700',
          }
        ]}>
          {Math.round(performance)}%
        </Text>
      </View>
    </View>
  );
};

// Modern Metric Card
const ModernMetricCard = ({ icon, value, label, trend, gradient = [theme.colors.primary[500], theme.colors.primary[600]] }) => {
  return (
    <View style={[styles.modernMetricCard, theme.shadows.large]}>
      <View style={[styles.metricGradientBackground, { backgroundColor: gradient[0] }]}>
        <View style={[styles.metricGradientOverlay, { backgroundColor: gradient[1] }]} />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <View style={styles.metricIconContainer}>
            <Icon name={icon} size={26} color={theme.colors.text.inverse} />
          </View>
          {trend !== undefined && (
            <View style={[
              styles.trendBadge,
              { backgroundColor: trend > 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)' }
            ]}>
              <Icon 
                name={trend > 0 ? "trending-up" : "trending-down"} 
                size={12} 
                color={theme.colors.text.inverse} 
              />
              <Text style={styles.trendText}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
};

// Modern Debtor Card Component
const ModernDebtorCard = ({ debtor, formatCurrency, onPress }) => {
  const riskLevel = debtor.balance_due > 1000000 ? 'high' : debtor.balance_due > 500000 ? 'medium' : 'low';
  const riskColors = {
    high: theme.colors.error,
    medium: theme.colors.warning,
    low: theme.colors.success,
  };

  return (
    <TouchableOpacity style={[styles.modernDebtorCard, theme.shadows.medium]} onPress={onPress}>
      <View style={styles.debtorCardHeader}>
        <View style={styles.debtorInfo}>
          <View style={[
            styles.debtorAvatar,
            { backgroundColor: riskColors[riskLevel] + '20' }
          ]}>
            <Text style={[styles.debtorAvatarText, { color: riskColors[riskLevel] }]}>
              {debtor.debtor_name?.charAt(0)?.toUpperCase() || 'D'}
            </Text>
          </View>
          <View style={styles.debtorDetails}>
            <Text style={styles.debtorName}>{debtor.debtor_name || 'Unknown Debtor'}</Text>
            <Text style={styles.debtorAgent}>Agent: {debtor.agent_name || 'Unknown'}</Text>
            {debtor.phone && (
              <Text style={styles.debtorPhone}>{debtor.phone}</Text>
            )}
          </View>
        </View>
        
        <View style={[
          styles.riskBadge,
          { backgroundColor: riskColors[riskLevel] }
        ]}>
          <Text style={styles.riskBadgeText}>
            {riskLevel.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.debtorMetrics}>
        <View style={styles.debtorMetric}>
          <Text style={styles.debtorMetricLabel}>Amount Due</Text>
          <Text style={[styles.debtorMetricValue, { color: riskColors[riskLevel] }]}>
            {formatCurrency(debtor.balance_due || 0)}
          </Text>
        </View>
        
        <View style={styles.debtorMetric}>
          <Text style={styles.debtorMetricLabel}>Status</Text>
          <Text style={[
            styles.debtorStatus,
            { color: debtor.balance_due > 0 ? theme.colors.error : theme.colors.success }
          ]}>
            {debtor.balance_due > 0 ? 'Outstanding' : 'Paid'}
          </Text>
        </View>
      </View>
      
      <View style={styles.debtorProgress}>
        <View style={styles.debtorProgressBar}>
          <View style={[
            styles.debtorProgressFill,
            { 
              width: debtor.balance_due > 0 ? '100%' : '0%',
              backgroundColor: riskColors[riskLevel],
            }
          ]} />
        </View>
        <Text style={styles.debtorProgressText}>
          {debtor.balance_due > 0 ? 'Needs Collection' : 'Completed'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Agent Comparison Chart
const AgentComparisonChart = ({ agents, formatCurrency }) => {
  const sortedAgents = agents.sort((a, b) => (b.closing_balance || 0) - (a.closing_balance || 0));
  const topAgents = sortedAgents.slice(0, 5);

  return (
    <View style={styles.agentComparisonContainer}>
      <Text style={styles.modernChartTitle}>Top Performing Agents</Text>
      {topAgents.map((agent, index) => {
        const maxBalance = Math.max(...topAgents.map(a => a.closing_balance || 0));
        const percentage = maxBalance > 0 ? ((agent.closing_balance || 0) / maxBalance) * 100 : 0;
        const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', theme.colors.primary[500], theme.colors.primary[400]];
        
        return (
          <View key={agent.id} style={styles.agentComparisonItem}>
            <View style={styles.agentRankContainer}>
              <View style={[
                styles.agentRank,
                { 
                  backgroundColor: rankColors[index],
                  ...theme.shadows.small,
                }
              ]}>
                <Text style={styles.agentRankText}>{index + 1}</Text>
              </View>
              <View style={styles.agentInfo}>
                <Text style={styles.agentComparisonName}>{agent.name}</Text>
                <Text style={styles.agentComparisonBalance}>
                  {formatCurrency(agent.closing_balance || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.agentPerformanceBarContainer}>
              <View style={styles.agentPerformanceBarTrack}>
                <View
                  style={[
                    styles.agentPerformanceBarFill,
                    { 
                      width: `${percentage}%`,
                      backgroundColor: index === 0 ? theme.colors.secondary[500] : 
                                     index === 1 ? theme.colors.primary[500] : 
                                     theme.colors.accent.violet,
                    }
                  ]}
                />
              </View>
              <AgentPerformanceRing agent={agent} size={36} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// Enhanced Progress Ring
const EnhancedProgressRing = ({ progress, size = 140, title, subtitle, color = theme.colors.secondary[500] }) => {
  return (
    <View style={styles.enhancedProgressContainer}>
      <View style={[styles.progressRingContainer, { width: size, height: size }]}>
        <View
          style={[
            styles.progressRingBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 10,
              borderColor: theme.colors.neutral[200],
            }
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
              borderColor: 'transparent',
              borderTopColor: color,
              transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
            }
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
              {agentCount} agents • {user?.name?.split(' ')[0]}
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
        'access-token': userData.userToken,
        client: userData.client,
        uid: userData.uid,
        'Content-Type': 'application/json',
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  }, []);

  const fetchMyAgents = useCallback(async () => {
    try {
      const userData = await getUserData();
      if (!userData) return;

      const headers = {
        'access-token': userData.userToken,
        client: userData.client,
        uid: userData.uid,
        'Content-Type': 'application/json',
      };

      const agentsData = await getAgents(headers);
      const agents = Array.isArray(agentsData) 
        ? agentsData 
        : (agentsData.agents || agentsData.data || []);

      const validatedAgents = agents
        .filter(agent => agent && agent.id)
        .map(agent => ({
          ...agent,
          id: agent.id,
          name: agent.name || agent.full_name || 'Unknown Agent',
          type: agent.type || agent.agent_type || 'Agent',
          phone: agent.phone || agent.phone_number || null,
          status: agent.status || 'active',
          opening_balance: parseFloat(agent.opening_balance || 0),
          closing_balance: parseFloat(agent.closing_balance || agent.balance || 0),
          total_commissions: parseFloat(agent.total_commissions || agent.commissions || 0),
          active_debtors: parseInt(agent.active_debtors || agent.debtors_count || 0),
          created_at: agent.created_at || new Date().toISOString(),
          updated_at: agent.updated_at || new Date().toISOString(),
        }));

      setMyAgents(validatedAgents);

      if (validatedAgents.length > 0) {
        const totalOpeningBalance = validatedAgents.reduce((sum, agent) => sum + (agent.opening_balance || 0), 0);
        const totalClosingBalance = validatedAgents.reduce((sum, agent) => sum + (agent.closing_balance || 0), 0);
        
        setAgentBalances({
          totalOpeningBalance,
          totalClosingBalance,
          agentCount: validatedAgents.length,
        });
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      Alert.alert("Error", error.message || "Failed to load agents");
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
      
      if (typeof getDebtorsOverview !== 'function') {
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
                agent_name: item.agent_name || 'Unknown Agent',
                name: item.debtor_name || "Unknown Debtor",
                total_debt: parseFloat(item.balance_due || 0),
                amount: parseFloat(item.balance_due || 0),
                total_paid: 0,
                amount_paid: 0,
                status: item.balance_due > 0 ? 'active' : 'paid',
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
  }, [fetchDashboardData, fetchMyAgents, fetchWeeklyStats, fetchMonthlyStats, fetchAllDebtors]);

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

  const navigateTo = useCallback((screen) => {
    setMenuOpen(false);
    navigation.navigate(screen);
  }, [navigation]);

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

  const metrics = useMemo(() => {
    const { dailyStats, quickStats } = dashboardData;
    
    const netChange = agentBalances.totalClosingBalance - agentBalances.totalOpeningBalance;
    
    return {
      totalBalance: agentBalances.totalClosingBalance,
      totalTransactions: dailyStats.agentTransactions,
      totalCommissions: dailyStats.totalCommissions,
      activeAgents: myAgents.length,
      netChange: netChange,
      balanceTrend: netChange > 0 ? 15 : -8,
      transactionsTrend: 12,
      commissionsTrend: 25,
    };
  }, [dashboardData, agentBalances, myAgents]);

  const chartData = useMemo(() => {
    const { dailyStats, quickStats } = dashboardData;
    
    // Show top 5 agents by balance with real names
    const topAgents = myAgents
      .sort((a, b) => (b.closing_balance || 0) - (a.closing_balance || 0))
      .slice(0, 5);
    
    // Get agent name abbreviation (first name or first 8 chars)
    const getAgentLabel = (name) => {
      if (!name) return 'Agent';
      const firstName = name.split(' ')[0];
      return firstName.length > 8 ? firstName.substring(0, 8) : firstName;
    };
    
    return {
      balanceComparison: topAgents.map((agent) => ({
        label: getAgentLabel(agent.name),
        value: agent.closing_balance || 0,
        displayValue: formatCurrency(agent.closing_balance || 0),
        fullName: agent.name
      })),
      transactionChart: topAgents.map((agent) => ({
        label: getAgentLabel(agent.name),
        value: agent.active_debtors || 0,
        displayValue: `${agent.active_debtors || 0} debtors`,
        fullName: agent.name
      })),
      debtorsPieChart: [
        { 
          label: 'High Risk', 
          value: allDebtors.filter(d => d.balance_due > 1000000).length,
          displayValue: allDebtors.filter(d => d.balance_due > 1000000).length.toString(),
          color: theme.colors.error
        },
        { 
          label: 'Medium Risk', 
          value: allDebtors.filter(d => d.balance_due > 500000 && d.balance_due <= 1000000).length,
          displayValue: allDebtors.filter(d => d.balance_due > 500000 && d.balance_due <= 1000000).length.toString(),
          color: theme.colors.warning
        },
        { 
          label: 'Low Risk', 
          value: allDebtors.filter(d => d.balance_due <= 500000 && d.balance_due > 0).length,
          displayValue: allDebtors.filter(d => d.balance_due <= 500000 && d.balance_due > 0).length.toString(),
          color: theme.colors.success
        },
      ],
      agentPerformancePie: [
        {
          label: 'Growing',
          value: myAgents.filter(a => a.closing_balance > a.opening_balance).length,
          displayValue: myAgents.filter(a => a.closing_balance > a.opening_balance).length.toString(),
          color: theme.colors.secondary[500]
        },
        {
          label: 'Stable',
          value: myAgents.filter(a => a.closing_balance === a.opening_balance).length,
          displayValue: myAgents.filter(a => a.closing_balance === a.opening_balance).length.toString(),
          color: theme.colors.accent.blue
        },
        {
          label: 'Declining',
          value: myAgents.filter(a => a.closing_balance < a.opening_balance).length,
          displayValue: myAgents.filter(a => a.closing_balance < a.opening_balance).length.toString(),
          color: theme.colors.error
        },
      ],
    };
  }, [dashboardData, formatCurrency, myAgents, allDebtors]);

  const debtCollectionRate = useMemo(() => {
    const { totalDebtOutstanding, totalDebtCollected } = dashboardData.quickStats;
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

  const { dailyStats, recentActivity, quickStats, agentsSummary, debtorsSummary, lastUpdated } = dashboardData;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[600]} />
      
      <ModernDashboardHeader 
        user={user}
        onMenuPress={toggleMenu}
        onLogout={logout}
        agentCount={myAgents.length}
      />

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
            <View style={styles.modernMenuHeader}>
              <View style={styles.menuProfileSection}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                  <Text style={styles.profileRole}>Agent Manager</Text>
                  <View style={styles.profileStatusIndicator}>
                    <View style={styles.statusDotOnline} />
                    <Text style={styles.profileStatus}>Managing {myAgents.length} agents</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity onPress={toggleMenu} style={styles.modernCloseButton}>
                <Icon name="close" size={20} color={theme.colors.text.secondary} />
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
                  { screen: "Dashboard", icon: "dashboard", label: "Dashboard", isActive: true },
                  { screen: "Transactions", icon: "receipt", label: "Agent Transactions", badge: dailyStats.agentTransactions },
                  { screen: "Agents", icon: "people", label: "My Agents", badge: myAgents.length },
                  { screen: "Commissions", icon: "attach-money", label: "Commissions" },
                  { screen: "Debtors", icon: "account-balance", label: "Managed Debtors", badge: quickStats.activeDebtors },
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
                        { backgroundColor: item.isActive ? theme.colors.primary[500] : theme.colors.primary[50] },
                      ]}>
                        <Icon 
                          name={item.icon} 
                          size={18} 
                          color={item.isActive ? theme.colors.text.inverse : theme.colors.primary[500]} 
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
                      color={item.isActive ? theme.colors.primary[500] : theme.colors.text.tertiary} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.menuStatsSection}>
                <Text style={styles.menuSectionTitle}>TODAY'S SUMMARY</Text>
                
                <View style={styles.menuStatItem}>
                  <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.secondary[500] }]}>
                    <Icon name="account-balance-wallet" size={16} color={theme.colors.text.inverse} />
                  </View>
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>Agent Total Balance</Text>
                    <Text style={styles.menuStatValue}>
                      {formatCurrency(metrics.totalBalance)}
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatItem}>
                  <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.primary[500] }]}>
                    <Icon name="people" size={16} color={theme.colors.text.inverse} />
                  </View>
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>Agents Performance</Text>
                    <Text style={styles.menuStatValue}>
                      {myAgents.filter(a => a.closing_balance > a.opening_balance).length}/{myAgents.length} Growing
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatItem}>
                  <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.error }]}>
                    <Icon name="warning" size={16} color={theme.colors.text.inverse} />
                  </View>
                  <View style={styles.menuStatContent}>
                    <Text style={styles.menuStatLabel}>High Risk Debtors</Text>
                    <Text style={styles.menuStatValue}>
                      {allDebtors.filter(d => d.balance_due > 1000000).length} debtors
                    </Text>
                  </View>
                </View>

                <View style={styles.menuStatItem}>
                  <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.accent.amber }]}>
                    <Icon name="trending-up" size={16} color={theme.colors.text.inverse} />
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
                <TouchableOpacity style={styles.menuFooterItem} onPress={() => navigateTo("Settings")}>
                  <Icon name="settings" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.menuFooterText}>Settings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.logoutMenuItem} onPress={logout}>
                  <Icon name="exit-to-app" size={18} color={theme.colors.error} />
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
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'analytics', label: 'Analytics', icon: 'analytics' },
          { key: 'agents', label: 'My Agents', icon: 'people' },
          { key: 'debtors', label: 'Debtors', icon: 'account-balance' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.modernTab, activeTab === tab.key && styles.modernActiveTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon name={tab.icon} size={18} color={activeTab === tab.key ? theme.colors.primary[500] : theme.colors.text.secondary} />
            <Text style={[styles.modernTabText, activeTab === tab.key && styles.modernActiveTabText]}>
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
        <Animated.View style={[
          styles.contentContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          
          {activeTab === 'overview' && (
            <>
              <View style={[
                styles.modernStatusCard,
                { 
                  backgroundColor: myAgents.length > 0 ? theme.colors.primary[600] : theme.colors.error,
                },
                theme.shadows.large,
              ]}>
                <View style={styles.statusCardGradient}>
                  <View style={[
                    styles.statusCardGradientOverlay,
                    { backgroundColor: myAgents.length > 0 ? theme.colors.primary[700] : theme.colors.error }
                  ]} />
                </View>
                <View style={styles.modernStatusHeader}>
                  <View>
                    <View style={styles.statusDateBadge}>
                      <Icon name="calendar-today" size={14} color={theme.colors.text.inverse} />
                      <Text style={styles.modernStatusDate}>{new Date().toDateString()}</Text>
                    </View>
                    <Text style={styles.modernStatusUpdate}>
                      Last sync: {lastUpdated ? formatTime(lastUpdated) : 'Never'}
                    </Text>
                  </View>
                  <View style={styles.modernStatusIcon}>
                    <Icon name={myAgents.length > 0 ? 'check-circle' : 'warning'} size={32} color={theme.colors.text.inverse} />
                  </View>
                </View>
                <View style={styles.statusMetricsRow}>
                  <View style={styles.statusMetricItem}>
                    <Icon name="people" size={20} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.statusMetricValue}>{myAgents.length}</Text>
                    <Text style={styles.statusMetricLabel}>Agents</Text>
                  </View>
                  <View style={styles.statusMetricDivider} />
                  <View style={styles.statusMetricItem}>
                    <Icon name="account-balance-wallet" size={20} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.statusMetricValue}>{formatCurrency(metrics.totalBalance)}</Text>
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
                  gradient={[theme.colors.primary[500], theme.colors.primary[600]]}
                />
                
                <ModernMetricCard
                  icon="receipt"
                  value={metrics.totalTransactions}
                  label="Agent Transactions"
                  trend={metrics.transactionsTrend}
                  gradient={[theme.colors.secondary[500], theme.colors.secondary[600]]}
                />
                
                <ModernMetricCard
                  icon="attach-money"
                  value={formatCurrency(metrics.totalCommissions)}
                  label="Total Commissions"
                  trend={metrics.commissionsTrend}
                  gradient={[theme.colors.accent.amber, theme.colors.accent.orange]}
                />
                
                <ModernMetricCard
                  icon="people"
                  value={myAgents.length}
                  label="Active Agents"
                  gradient={[theme.colors.accent.violet, '#7C3AED']}
                />
              </View>

              <View style={styles.modernCard}>
                <Text style={styles.modernCardTitle}>Agent Balance Overview</Text>
                
                <View style={styles.balanceComparisonContainer}>
                  <View style={styles.balanceSection}>
                    <Text style={styles.balanceSectionTitle}>Combined Agent Balances ({myAgents.length} agents)</Text>
                    <View style={styles.balanceRow}>
                      <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Opening</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(agentBalances.totalOpeningBalance)}</Text>
                      </View>
                      <Icon name="arrow-forward" size={24} color={theme.colors.text.secondary} />
                      <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Current</Text>
                        <Text style={[styles.balanceValue, { color: theme.colors.secondary[500] }]}>
                          {formatCurrency(agentBalances.totalClosingBalance)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.netChangeContainer}>
                  <View style={styles.netChangeItem}>
                    <Text style={styles.netChangeLabel}>Net Change Today</Text>
                    <Text style={[
                      styles.netChangeValue,
                      { color: metrics.netChange >= 0 ? theme.colors.secondary[500] : theme.colors.error }
                    ]}>
                      {metrics.netChange >= 0 ? '+' : ''}{formatCurrency(metrics.netChange)}
                    </Text>
                  </View>
                </View>
              </View>

              {myAgents.length > 0 && (
                <View style={styles.modernCard}>
                  <AgentComparisonChart agents={myAgents} formatCurrency={formatCurrency} />
                </View>
              )}

              <View style={styles.modernCard}>
                <Text style={styles.modernCardTitle}>Quick Actions</Text>
                <View style={styles.modernActionsGrid}>
                  <TouchableOpacity 
                    style={styles.modernActionButton}
                    onPress={() => navigation.navigate("Agents")}
                  >
                    <View style={[styles.modernActionGradient, { backgroundColor: theme.colors.primary[500] }]}>
                      <Icon name="people" size={24} color={theme.colors.text.inverse} />
                      <Text style={styles.modernActionText}>View Agents</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modernActionButton}
                    onPress={() => navigation.navigate("CreateAgent")}
                  >
                    <View style={[styles.modernActionGradient, { backgroundColor: theme.colors.secondary[500] }]}>
                      <Icon name="person-add" size={24} color={theme.colors.text.inverse} />
                      <Text style={styles.modernActionText}>Add Agent</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {activeTab === 'analytics' && (
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
                  subtitle={`${formatCurrency(dashboardData.quickStats.totalDebtCollected)} collected`}
                  color={theme.colors.secondary[500]}
                />
              </View>

              <View style={[styles.modernCard, styles.elevatedCard]}>
                <View style={styles.cardHeaderWithIcon}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: theme.colors.primary[500] }]}>
                    <Icon name="analytics" size={24} color={theme.colors.text.inverse} />
                  </View>
                  <Text style={styles.modernCardTitle}>Performance Analytics</Text>
                </View>
                <View style={styles.performanceMetricsGrid}>
                  <View style={styles.performanceMetric}>
                    <View style={[styles.performanceMetricIcon, { backgroundColor: theme.colors.secondary[500] }]}>
                      <Icon name="trending-up" size={28} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.performanceMetricValue}>
                      {myAgents.filter(a => a.closing_balance > a.opening_balance).length}
                    </Text>
                    <Text style={styles.performanceMetricLabel}>Growing Agents</Text>
                    <View style={styles.performanceMetricBar}>
                      <View style={[
                        styles.performanceMetricBarFill,
                        { 
                          width: myAgents.length > 0 
                            ? `${(myAgents.filter(a => a.closing_balance > a.opening_balance).length / myAgents.length) * 100}%`
                            : '0%',
                          backgroundColor: theme.colors.secondary[500]
                        }
                      ]} />
                    </View>
                  </View>
                  
                  <View style={styles.performanceMetric}>
                    <View style={[styles.performanceMetricIcon, { backgroundColor: theme.colors.accent.amber }]}>
                      <Icon name="star" size={28} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.performanceMetricValue}>
                      {Math.round(debtCollectionRate)}%
                    </Text>
                    <Text style={styles.performanceMetricLabel}>Collection Rate</Text>
                    <View style={styles.performanceMetricBar}>
                      <View style={[
                        styles.performanceMetricBarFill,
                        { 
                          width: `${debtCollectionRate}%`,
                          backgroundColor: theme.colors.accent.amber
                        }
                      ]} />
                    </View>
                  </View>
                  
                  <View style={styles.performanceMetric}>
                    <View style={[styles.performanceMetricIcon, { backgroundColor: theme.colors.error }]}>
                      <Icon name="warning" size={28} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.performanceMetricValue}>
                      {allDebtors.filter(d => d.balance_due > 1000000).length}
                    </Text>
                    <Text style={styles.performanceMetricLabel}>High Risk</Text>
                    <View style={styles.performanceMetricBar}>
                      <View style={[
                        styles.performanceMetricBarFill,
                        { 
                          width: allDebtors.length > 0 
                            ? `${(allDebtors.filter(d => d.balance_due > 1000000).length / allDebtors.length) * 100}%`
                            : '0%',
                          backgroundColor: theme.colors.error
                        }
                      ]} />
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === 'agents' && (
            <>
              <View style={styles.modernCard}>
                <Text style={styles.modernCardTitle}>My Agents Overview</Text>
                <View style={styles.modernSummaryRow}>
                  <View style={styles.modernSummaryItem}>
                    <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.primary[500] }]}>
                      <Icon name="people" size={24} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernSummaryValue}>{myAgents.length}</Text>
                    <Text style={styles.modernSummaryLabel}>Total Agents</Text>
                  </View>
                  
                  <View style={styles.modernSummaryItem}>
                    <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.secondary[500] }]}>
                      <Icon name="account-balance-wallet" size={24} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {formatCurrency(agentBalances.totalClosingBalance)}
                    </Text>
                    <Text style={styles.modernSummaryLabel}>Combined Balance</Text>
                  </View>
                  
                  <View style={styles.modernSummaryItem}>
                    <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.accent.amber }]}>
                      <Icon name="trending-up" size={24} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {myAgents.filter(a => a.closing_balance > a.opening_balance).length}
                    </Text>
                    <Text style={styles.modernSummaryLabel}>Growing</Text>
                  </View>
                </View>
              </View>

              {myAgents.length > 0 ? (
                <FlatList
                  data={myAgents}
                  renderItem={({ item, index }) => (
                    <View style={[styles.modernAgentCard, theme.shadows.medium]}>
                      <View style={styles.modernAgentHeader}>
                        <View style={styles.modernAgentInfo}>
                          <View style={[
                            styles.modernAgentAvatar,
                            { backgroundColor: index < 3 ? theme.colors.secondary[500] : theme.colors.primary[500] }
                          ]}>
                            <Text style={styles.modernAgentAvatarText}>
                              {item.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.modernAgentName}>{item.name}</Text>
                            <Text style={styles.modernAgentType}>{item.type || 'Agent'}</Text>
                            {item.phone && (
                              <Text style={styles.modernAgentPhone}>{item.phone}</Text>
                            )}
                          </View>
                        </View>
                        
                        <View style={[
                          styles.modernAgentStatus,
                          { backgroundColor: item.status === 'active' ? theme.colors.secondary[500] : theme.colors.error }
                        ]}>
                          <Text style={styles.modernAgentStatusText}>
                            {item.status === 'active' ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.modernAgentMetrics}>
                        <View style={styles.modernAgentMetric}>
                          <Text style={styles.modernAgentMetricLabel}>Opening</Text>
                          <Text style={styles.modernAgentMetricValue}>
                            {formatCurrency(item.opening_balance || 0)}
                          </Text>
                        </View>
                        <View style={styles.modernAgentMetric}>
                          <Text style={styles.modernAgentMetricLabel}>Current</Text>
                          <Text style={[
                            styles.modernAgentMetricValue,
                            { color: theme.colors.secondary[500] }
                          ]}>
                            {formatCurrency(item.closing_balance || 0)}
                          </Text>
                        </View>
                        <View style={styles.modernAgentMetric}>
                          <Text style={styles.modernAgentMetricLabel}>Debtors</Text>
                          <Text style={styles.modernAgentMetricValue}>{item.active_debtors || 0}</Text>
                        </View>
                      </View>

                      <View style={styles.modernAgentProgress}>
                        <AgentPerformanceRing agent={item} size={60} />
                        <View style={styles.modernAgentNetChange}>
                          <Text style={styles.modernAgentNetChangeLabel}>Net Change</Text>
                          <Text style={[
                            styles.modernAgentNetChangeValue,
                            { 
                              color: ((item.closing_balance || 0) - (item.opening_balance || 0)) >= 0 
                                ? theme.colors.secondary[500] 
                                : theme.colors.error 
                            }
                          ]}>
                            {((item.closing_balance || 0) - (item.opening_balance || 0)) >= 0 ? '+' : ''}
                            {formatCurrency((item.closing_balance || 0) - (item.opening_balance || 0))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.modernCard}>
                  <View style={styles.modernEmptyState}>
                    <View style={[styles.modernEmptyIcon, { backgroundColor: theme.colors.primary[500] }]}>
                      <Icon name="people" size={48} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernEmptyTitle}>No Agents Yet</Text>
                    <Text style={styles.modernEmptySubtitle}>
                      Add your first agent to start managing transactions and tracking performance
                    </Text>
                    <TouchableOpacity 
                      style={styles.modernEmptyButton}
                      onPress={() => navigation.navigate("CreateAgent")}
                    >
                      <View style={[styles.modernEmptyButtonGradient, { backgroundColor: theme.colors.primary[500] }]}>
                        <Icon name="person-add" size={20} color={theme.colors.text.inverse} />
                        <Text style={styles.modernEmptyButtonText}>Add First Agent</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'debtors' && (
            <>
              <View style={styles.modernCard}>
                <Text style={styles.modernCardTitle}>Debtors Overview</Text>
                <View style={styles.modernSummaryRow}>
                  <View style={styles.modernSummaryItem}>
                    <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.accent.blue }]}>
                      <Icon name="account-balance" size={24} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernSummaryValue}>{allDebtors.length}</Text>
                    <Text style={styles.modernSummaryLabel}>Total Debtors</Text>
                  </View>
                  
                  <View style={styles.modernSummaryItem}>
                    <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.error }]}>
                      <Icon name="warning" size={24} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {allDebtors.filter(d => d.balance_due > 1000000).length}
                    </Text>
                    <Text style={styles.modernSummaryLabel}>High Risk</Text>
                  </View>
                  
                  <View style={styles.modernSummaryItem}>
                    <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.secondary[500] }]}>
                      <Icon name="check-circle" size={24} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernSummaryValue}>
                      {Math.round(debtCollectionRate)}%
                    </Text>
                    <Text style={styles.modernSummaryLabel}>Collection Rate</Text>
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
                  <Text style={styles.modernCardTitle}>All Debtors ({allDebtors.length})</Text>
                  
                  <FlatList
                    data={allDebtors}
                    renderItem={({ item }) => (
                      <ModernDebtorCard
                        debtor={item}
                        formatCurrency={formatCurrency}
                        onPress={() => {
                          console.log('Debtor pressed:', item.debtor_name);
                        }}
                      />
                    )}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              ) : (
                <View style={styles.modernCard}>
                  <View style={styles.modernEmptyState}>
                    <View style={[styles.modernEmptyIcon, { backgroundColor: theme.colors.accent.blue }]}>
                      <Icon name="account-balance" size={48} color={theme.colors.text.inverse} />
                    </View>
                    <Text style={styles.modernEmptyTitle}>No Debtors Found</Text>
                    <Text style={styles.modernEmptySubtitle}>
                      Debtors will appear here once your agents start managing them
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
    backgroundColor: theme.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.primary[600],
    ...theme.shadows.large,
  },
  modernMenuButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modernHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modernHeaderTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
  },
  modernHeaderSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  modernHeaderSubtitle: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing.xs,
  },
  modernLogoutButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    backgroundColor: theme.colors.surface.primary,
    ...theme.shadows.large,
  },
  modernMenuHeader: {
    paddingTop: 50,
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.primary[600],
  },
  menuProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.colored(theme.colors.primary[500]),
  },
  profileAvatarText: {
    ...theme.typography.h3,
    color: theme.colors.text.inverse,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...theme.typography.h3,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    ...theme.typography.captionMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.sm,
  },
  profileStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[500],
    marginRight: theme.spacing.sm,
  },
  profileStatus: {
    ...theme.typography.caption,
    color: theme.colors.secondary[500],
    fontWeight: '600',
  },
  modernCloseButton: {
    position: 'absolute',
    top: 50,
    right: theme.spacing.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuScrollContainer: {
    flex: 1,
  },
  menuItemsContainer: {
    paddingTop: theme.spacing.xxl,
  },
  menuSectionTitle: {
    ...theme.typography.label,
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
  },
  modernMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  modernMenuItemActive: {
    backgroundColor: theme.colors.primary[50],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernMenuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  modernMenuItemText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    flex: 1,
    fontWeight: '600',
  },
  modernMenuItemTextActive: {
    color: theme.colors.primary[600],
  },
  menuItemBadge: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.md,
    minWidth: 24,
    alignItems: 'center',
  },
  menuItemBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '700',
  },
  menuStatsSection: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxl,
    backgroundColor: theme.colors.background.tertiary,
  },
  menuStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  menuStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.small,
  },
  menuStatContent: {
    flex: 1,
  },
  menuStatLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  menuStatValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  menuFooter: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  menuFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  menuFooterText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.md,
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
  },
  logoutMenuText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
    fontWeight: '600',
    marginLeft: theme.spacing.md,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: '85%',
    right: 0,
    bottom: 0,
  },
  modernTabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.small,
  },
  modernTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    position: 'relative',
  },
  modernActiveTab: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary[500],
  },
  modernTabText: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  modernActiveTabText: {
    color: theme.colors.primary[500],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  modernCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xxxl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  modernCardTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
    fontWeight: '800',
  },
  modernStatusCard: {
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  statusCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statusCardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  modernStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  statusDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  modernStatusDate: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.inverse,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
  },
  modernStatusUpdate: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: theme.spacing.xs,
  },
  modernStatusIcon: {
    padding: theme.spacing.sm,
  },
  statusMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  statusMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusMetricValue: {
    ...theme.typography.h3,
    color: theme.colors.text.inverse,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  statusMetricLabel: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusMetricDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernStatusText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
  modernMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  modernMetricCard: {
    width: '48%',
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
  },
  metricGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  metricGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  metricContent: {
    padding: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  metricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.small,
  },
  trendText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '700',
    marginLeft: theme.spacing.xs,
  },
  metricValue: {
    ...theme.typography.h2,
    color: theme.colors.text.inverse,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricLabel: {
    ...theme.typography.captionMedium,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  donutContainer: {
    alignItems: 'center',
  },
  donutTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
    fontWeight: '700',
  },
  donutChart: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  donutSegment: {
    position: 'absolute',
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.primary,
    ...theme.shadows.large,
    zIndex: 10,
  },
  donutCenterValue: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    fontWeight: '800',
  },
  donutCenterLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  donutLegends: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
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
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  legendValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '800',
    marginRight: theme.spacing.xs,
  },
  legendPercent: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  modernChartContainer: {
    marginBottom: theme.spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  chartLegendText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  modernChartTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  modernChartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
  },
  modernBar: {
    width: '100%',
    minHeight: 8,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
    overflow: 'hidden',
    position: 'relative',
  },
  barGlowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  modernBarLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: theme.spacing.xs,
  },
  modernBarValue: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  balanceComparisonContainer: {
    marginBottom: theme.spacing.xl,
  },
  balanceSection: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  balanceSectionTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  balanceValue: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  netChangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  netChangeItem: {
    alignItems: 'center',
  },
  netChangeLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  netChangeValue: {
    ...theme.typography.h2,
    fontWeight: '800',
  },
  agentComparisonContainer: {
    marginBottom: theme.spacing.lg,
  },
  agentComparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  agentRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  agentRankText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.inverse,
    fontWeight: '800',
  },
  agentInfo: {
    flex: 1,
  },
  agentComparisonName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  agentComparisonBalance: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  agentPerformanceBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  agentPerformanceBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    marginRight: theme.spacing.md,
  },
  agentPerformanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceRing: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  performanceRingBackground: {
    position: 'absolute',
  },
  performanceRingFill: {
    position: 'absolute',
  },
  performanceRingCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  performancePercentage: {
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  enhancedProgressContainer: {
    alignItems: 'center',
  },
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: theme.spacing.xl,
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
    color: theme.colors.text.primary,
  },
  progressLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  progressSubtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  modernActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modernActionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  modernActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  modernActionText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.inverse,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
  },
  modernSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modernSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  modernSummaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  modernSummaryValue: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  modernSummaryLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  modernAgentCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  modernAgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  modernAgentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernAgentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  modernAgentAvatarText: {
    ...theme.typography.h3,
    color: theme.colors.text.inverse,
    fontWeight: '800',
  },
  modernAgentName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  modernAgentType: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modernAgentPhone: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  modernAgentStatus: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  modernAgentStatusText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '700',
  },
  modernAgentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  modernAgentMetric: {
    alignItems: 'center',
  },
  modernAgentMetricLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modernAgentMetricValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  modernAgentProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  modernAgentNetChange: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  modernAgentNetChangeLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modernAgentNetChangeValue: {
    ...theme.typography.bodyMedium,
    fontWeight: '800',
  },
  modernDebtorCard: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
  },
  debtorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  debtorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debtorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.small,
  },
  debtorAvatarText: {
    ...theme.typography.bodyMedium,
    fontWeight: '800',
  },
  debtorDetails: {
    flex: 1,
  },
  debtorName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  debtorAgent: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  debtorPhone: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  riskBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.text.inverse,
    fontWeight: '700',
  },
  debtorMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  debtorMetric: {
    alignItems: 'center',
    flex: 1,
  },
  debtorMetricLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  debtorMetricValue: {
    ...theme.typography.bodyMedium,
    fontWeight: '700',
  },
  debtorStatus: {
    ...theme.typography.bodyMedium,
    fontWeight: '700',
  },
  debtorProgress: {
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  debtorProgressBar: {
    height: 6,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 3,
    marginBottom: theme.spacing.sm,
  },
  debtorProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  debtorProgressText: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  modernEmptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.large,
  },
  modernEmptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modernEmptySubtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.xl,
  },
  modernEmptyButton: {
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.xl,
  },
  modernEmptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  modernEmptyButtonText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text.inverse,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
  },
  performanceMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
  },
  performanceMetric: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  performanceMetricIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  performanceMetricValue: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  performanceMetricLabel: {
    ...theme.typography.captionMedium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  performanceMetricBar: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 3,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  performanceMetricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  elevatedCard: {
    ...theme.shadows.large,
    borderWidth: 0,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  cardHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  bottomSpacing: {
    height: theme.spacing.xxxl * 2,
  },
});

export default DashboardScreen;

// import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
// import {
//   View,
//   Text,
//   SafeAreaView,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Animated,
//   StatusBar,
//   RefreshControl,
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Dimensions,
// } from "react-native";
// import { AuthContext } from "../context/AuthContext";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { useNavigation, useFocusEffect } from "@react-navigation/native";
// import {
//   getDashboardStats,
//   getWeeklyStats,
//   getMonthlyStats,
//   getAgents,
//   getDebtorsOverview,
// } from "../services/api";
// import { format } from "date-fns";
// import { getUserData } from "../services/auth";

// const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// // Modern Design Theme
// const theme = {
//   colors: {
//     // Primary Colors
//     primary: {
//       50: '#F0F4FF',
//       100: '#E0E7FF',
//       500: '#6366F1',
//       600: '#4F46E5',
//       700: '#4338CA',
//       900: '#312E81',
//     },
//     // Secondary Colors
//     secondary: {
//       50: '#F0FDF4',
//       100: '#DCFCE7',
//       500: '#10B981',
//       600: '#059669',
//       700: '#047857',
//     },
//     // Accent Colors
//     accent: {
//       amber: '#F59E0B',
//       orange: '#F97316',
//       rose: '#F43F5E',
//       violet: '#8B5CF6',
//       blue: '#3B82F6',
//       emerald: '#10B981',
//       red: '#EF4444',
//     },
//     // Neutral Colors
//     neutral: {
//       50: '#FAFAFA',
//       100: '#F5F5F5',
//       200: '#E5E5E5',
//       300: '#D4D4D4',
//       400: '#A3A3A3',
//       500: '#737373',
//       600: '#525252',
//       700: '#404040',
//       800: '#262626',
//       900: '#171717',
//     },
//     // Status Colors
//     success: '#10B981',
//     warning: '#F59E0B',
//     error: '#EF4444',
//     info: '#3B82F6',
//     // Background Colors
//     background: {
//       primary: '#FFFFFF',
//       secondary: '#FAFBFC',
//       tertiary: '#F8FAFC',
//     },
//     // Surface Colors
//     surface: {
//       primary: '#FFFFFF',
//       secondary: '#F8FAFC',
//       elevated: '#FFFFFF',
//     },
//     // Text Colors
//     text: {
//       primary: '#111827',
//       secondary: '#6B7280',
//       tertiary: '#9CA3AF',
//       inverse: '#FFFFFF',
//     }
//   },
//   shadows: {
//     small: {
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.05,
//       shadowRadius: 8,
//       elevation: 2,
//     },
//     medium: {
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.08,
//       shadowRadius: 12,
//       elevation: 4,
//     },
//     large: {
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 8 },
//       shadowOpacity: 0.12,
//       shadowRadius: 24,
//       elevation: 8,
//     },
//     colored: (color) => ({
//       shadowColor: color,
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.25,
//       shadowRadius: 12,
//       elevation: 6,
//     }),
//   },
//   typography: {
//     // Display
//     display: {
//       fontSize: 32,
//       fontWeight: '800',
//       lineHeight: 40,
//     },
//     // Headings
//     h1: {
//       fontSize: 24,
//       fontWeight: '700',
//       lineHeight: 32,
//     },
//     h2: {
//       fontSize: 20,
//       fontWeight: '600',
//       lineHeight: 28,
//     },
//     h3: {
//       fontSize: 18,
//       fontWeight: '600',
//       lineHeight: 24,
//     },
//     // Body
//     body: {
//       fontSize: 16,
//       fontWeight: '400',
//       lineHeight: 24,
//     },
//     bodyMedium: {
//       fontSize: 14,
//       fontWeight: '500',
//       lineHeight: 20,
//     },
//     // Caption
//     caption: {
//       fontSize: 12,
//       fontWeight: '400',
//       lineHeight: 16,
//     },
//     captionMedium: {
//       fontSize: 12,
//       fontWeight: '500',
//       lineHeight: 16,
//     },
//     // Labels
//     label: {
//       fontSize: 11,
//       fontWeight: '600',
//       lineHeight: 14,
//       letterSpacing: 0.5,
//       textTransform: 'uppercase',
//     },
//   },
//   spacing: {
//     xs: 4,
//     sm: 8,
//     md: 12,
//     lg: 16,
//     xl: 20,
//     xxl: 24,
//     xxxl: 32,
//   },
//   borderRadius: {
//     sm: 8,
//     md: 12,
//     lg: 16,
//     xl: 20,
//     xxl: 24,
//     full: 999,
//   },
// };

// // Enhanced Pie Chart Component
// const ModernPieChart = ({ data, size = 120, title, centerText }) => {
//   const radius = size / 2 - 10;
//   const circumference = 2 * Math.PI * radius;
  
//   const total = data.reduce((sum, item) => sum + item.value, 0);
//   let accumulatedPercentage = 0;
  
//   return (
//     <View style={styles.pieChartContainer}>
//       <Text style={styles.pieChartTitle}>{title}</Text>
//       <View style={[styles.pieChart, { width: size, height: size }]}>
//         <View style={[styles.pieChartBackground, { width: size, height: size, borderRadius: size / 2 }]} />
        
//         {data.map((item, index) => {
//           const percentage = total > 0 ? (item.value / total) * 100 : 0;
//           const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
//           const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
//           accumulatedPercentage += percentage;
          
//           return (
//             <View
//               key={index}
//               style={[
//                 styles.pieSlice,
//                 {
//                   width: size,
//                   height: size,
//                   borderRadius: size / 2,
//                   borderWidth: 8,
//                   borderColor: 'transparent',
//                   borderTopColor: item.color,
//                   transform: [{ rotate: `${(accumulatedPercentage - percentage) * 3.6 - 90}deg` }],
//                 }
//               ]}
//             />
//           );
//         })}
        
//         <View style={[styles.pieChartCenter, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3 }]}>
//           <Text style={styles.pieChartCenterText}>{centerText}</Text>
//         </View>
//       </View>
      
//       <View style={styles.pieChartLegend}>
//         {data.map((item, index) => (
//           <View key={index} style={styles.pieChartLegendItem}>
//             <View style={[styles.pieChartLegendDot, { backgroundColor: item.color }]} />
//             <Text style={styles.pieChartLegendText}>{item.label}</Text>
//             <Text style={styles.pieChartLegendValue}>{item.displayValue}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// // Enhanced Donut Chart for better visualization
// const ModernDonutChart = ({ data, size = 140, title, subtitle }) => {
//   const total = data.reduce((sum, item) => sum + item.value, 0);
//   let currentAngle = -90; // Start from top
  
//   return (
//     <View style={styles.donutContainer}>
//       <Text style={styles.donutTitle}>{title}</Text>
//       <View style={[styles.donutChart, { width: size, height: size }]}>
//         {data.map((item, index) => {
//           const percentage = total > 0 ? (item.value / total) * 100 : 0;
//           const angle = (percentage / 100) * 360;
//           const nextAngle = currentAngle + angle;
          
//           const startAngleRad = (currentAngle * Math.PI) / 180;
//           const endAngleRad = (nextAngle * Math.PI) / 180;
          
//           currentAngle = nextAngle;
          
//           return (
//             <View
//               key={index}
//               style={[
//                 styles.donutSlice,
//                 {
//                   width: size,
//                   height: size,
//                   borderRadius: size / 2,
//                   borderWidth: 12,
//                   borderColor: 'transparent',
//                   borderTopColor: item.color,
//                   transform: [{ rotate: `${currentAngle - angle}deg` }],
//                   opacity: 0.9,
//                 }
//               ]}
//             />
//           );
//         })}
        
//         <View style={[styles.donutCenter, { width: size * 0.55, height: size * 0.55, borderRadius: size * 0.275 }]}>
//           <Text style={styles.donutCenterValue}>{total}</Text>
//           <Text style={styles.donutCenterLabel}>{subtitle}</Text>
//         </View>
//       </View>
//     </View>
//   );
// };

// // Enhanced Bar Chart Component with modern styling
// const ModernBarChart = ({ data, title, color = theme.colors.primary[500], height = 140 }) => {
//   const maxValue = Math.max(...data.map(item => item.value));
//   const [animatedValues] = useState(data.map(() => new Animated.Value(0)));

//   useEffect(() => {
//     const animations = animatedValues.map((anim, index) => 
//       Animated.timing(anim, {
//         toValue: data[index].value,
//         duration: 1200 + (index * 150),
//         useNativeDriver: false,
//       })
//     );
//     Animated.stagger(100, animations).start();
//   }, [data]);

//   return (
//     <View style={[styles.modernChartContainer, { height: height + 120 }]}>
//       <Text style={styles.modernChartTitle}>{title}</Text>
//       <View style={[styles.modernChartBars, { height }]}>
//         {data.map((item, index) => (
//           <View key={index} style={styles.modernBarContainer}>
//             <View style={[styles.modernBarWrapper, { height: height - 60 }]}>
//               <Animated.View
//                 style={[
//                   styles.modernBar,
//                   {
//                     height: animatedValues[index].interpolate({
//                       inputRange: [0, maxValue || 1],
//                       outputRange: ['4%', '100%'],
//                       extrapolate: 'clamp',
//                     }),
//                     backgroundColor: color,
//                   }
//                 ]}
//               />
//               <View style={[styles.modernBarGlow, { backgroundColor: color + '20' }]} />
//             </View>
//             <Text style={styles.modernBarLabel}>{item.label}</Text>
//             <Text style={styles.modernBarValue}>{item.displayValue}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// // Enhanced Agent Performance Ring
// const AgentPerformanceRing = ({ agent, size = 100 }) => {
//   const performance = agent.closing_balance > 0 
//     ? Math.min((agent.closing_balance / (agent.opening_balance || 1)) * 100, 100)
//     : 0;
  
//   return (
//     <View style={[styles.performanceRing, { width: size, height: size }]}>
//       <View
//         style={[
//           styles.performanceRingBackground,
//           { 
//             width: size, 
//             height: size, 
//             borderRadius: size / 2,
//             borderWidth: size * 0.06,
//             borderColor: theme.colors.neutral[200],
//           }
//         ]}
//       />
//       <View
//         style={[
//           styles.performanceRingFill,
//           {
//             width: size,
//             height: size,
//             borderRadius: size / 2,
//             borderWidth: size * 0.06,
//             borderColor: 'transparent',
//             borderTopColor: theme.colors.secondary[500],
//             transform: [{ rotate: `${(performance / 100) * 360 - 90}deg` }],
//           }
//         ]}
//       />
//       <View style={styles.performanceRingCenter}>
//         <Text style={[
//           styles.performancePercentage, 
//           { 
//             fontSize: size * 0.14,
//             color: theme.colors.text.primary,
//             fontWeight: '700',
//           }
//         ]}>
//           {Math.round(performance)}%
//         </Text>
//       </View>
//     </View>
//   );
// };

// // Modern Metric Card with glass morphism effect
// const ModernMetricCard = ({ icon, value, label, trend, gradient = ['#6366F1', '#8B5CF6'] }) => {
//   return (
//     <View style={[styles.modernMetricCard, theme.shadows.medium]}>
//       <View style={[styles.metricGradientBackground, { backgroundColor: gradient[0] }]} />
//       <View style={styles.metricContent}>
//         <View style={styles.metricHeader}>
//           <View style={styles.metricIconContainer}>
//             <Icon name={icon} size={24} color={theme.colors.text.inverse} />
//           </View>
//           {trend !== undefined && (
//             <View style={[
//               styles.trendBadge,
//               { backgroundColor: trend > 0 ? theme.colors.secondary[500] : theme.colors.error }
//             ]}>
//               <Icon 
//                 name={trend > 0 ? "trending-up" : "trending-down"} 
//                 size={14} 
//                 color={theme.colors.text.inverse} 
//               />
//               <Text style={styles.trendText}>
//                 {Math.abs(trend)}%
//               </Text>
//             </View>
//           )}
//         </View>
//         <Text style={styles.metricValue}>{value}</Text>
//         <Text style={styles.metricLabel}>{label}</Text>
//       </View>
//     </View>
//   );
// };

// // Enhanced Debtor Card Component
// const ModernDebtorCard = ({ debtor, formatCurrency, onPress }) => {
//   const riskLevel = debtor.balance_due > 1000000 ? 'high' : debtor.balance_due > 500000 ? 'medium' : 'low';
//   const riskColors = {
//     high: theme.colors.error,
//     medium: theme.colors.warning,
//     low: theme.colors.success,
//   };

//   return (
//     <TouchableOpacity style={[styles.modernDebtorCard, theme.shadows.medium]} onPress={onPress}>
//       <View style={styles.debtorCardHeader}>
//         <View style={styles.debtorInfo}>
//           <View style={[
//             styles.debtorAvatar,
//             { backgroundColor: riskColors[riskLevel] }
//           ]}>
//             <Text style={styles.debtorAvatarText}>
//               {debtor.debtor_name?.charAt(0)?.toUpperCase() || 'D'}
//             </Text>
//           </View>
//           <View style={styles.debtorDetails}>
//             <Text style={styles.debtorName}>{debtor.debtor_name || 'Unknown Debtor'}</Text>
//             <Text style={styles.debtorAgent}>Agent: {debtor.agent_name || 'Unknown'}</Text>
//             {debtor.phone && (
//               <Text style={styles.debtorPhone}>{debtor.phone}</Text>
//             )}
//           </View>
//         </View>
        
//         <View style={[
//           styles.riskBadge,
//           { backgroundColor: riskColors[riskLevel] }
//         ]}>
//           <Text style={styles.riskBadgeText}>
//             {riskLevel.toUpperCase()}
//           </Text>
//         </View>
//       </View>
      
//       <View style={styles.debtorMetrics}>
//         <View style={styles.debtorMetric}>
//           <Text style={styles.debtorMetricLabel}>Amount Due</Text>
//           <Text style={[styles.debtorMetricValue, { color: riskColors[riskLevel] }]}>
//             {formatCurrency(debtor.balance_due || 0)}
//           </Text>
//         </View>
        
//         <View style={styles.debtorMetric}>
//           <Text style={styles.debtorMetricLabel}>Status</Text>
//           <Text style={[
//             styles.debtorStatus,
//             { color: debtor.balance_due > 0 ? theme.colors.error : theme.colors.success }
//           ]}>
//             {debtor.balance_due > 0 ? 'Outstanding' : 'Paid'}
//           </Text>
//         </View>
//       </View>
      
//       <View style={styles.debtorProgress}>
//         <View style={styles.debtorProgressBar}>
//           <View style={[
//             styles.debtorProgressFill,
//             { 
//               width: debtor.balance_due > 0 ? '100%' : '0%',
//               backgroundColor: riskColors[riskLevel],
//             }
//           ]} />
//         </View>
//         <Text style={styles.debtorProgressText}>
//           {debtor.balance_due > 0 ? 'Needs Collection' : 'Completed'}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
// };

// // Enhanced Agent Comparison Chart
// const AgentComparisonChart = ({ agents, formatCurrency }) => {
//   const sortedAgents = agents.sort((a, b) => (b.closing_balance || 0) - (a.closing_balance || 0));
//   const topAgents = sortedAgents.slice(0, 5);

//   return (
//     <View style={styles.agentComparisonContainer}>
//       <Text style={styles.modernChartTitle}>Top Performing Agents</Text>
//       {topAgents.map((agent, index) => {
//         const maxBalance = Math.max(...topAgents.map(a => a.closing_balance || 0));
//         const percentage = maxBalance > 0 ? ((agent.closing_balance || 0) / maxBalance) * 100 : 0;
//         const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', theme.colors.primary[500], theme.colors.primary[400]];
        
//         return (
//           <View key={agent.id} style={styles.agentComparisonItem}>
//             <View style={styles.agentRankContainer}>
//               <View style={[
//                 styles.agentRank,
//                 { 
//                   backgroundColor: rankColors[index],
//                   ...theme.shadows.small,
//                 }
//               ]}>
//                 <Text style={styles.agentRankText}>{index + 1}</Text>
//               </View>
//               <View style={styles.agentInfo}>
//                 <Text style={styles.agentComparisonName}>{agent.name}</Text>
//                 <Text style={styles.agentComparisonBalance}>
//                   {formatCurrency(agent.closing_balance || 0)}
//                 </Text>
//               </View>
//             </View>
//             <View style={styles.agentPerformanceBarContainer}>
//               <View style={styles.agentPerformanceBarTrack}>
//                 <Animated.View
//                   style={[
//                     styles.agentPerformanceBarFill,
//                     { 
//                       width: `${percentage}%`,
//                       backgroundColor: index === 0 ? theme.colors.secondary[500] : 
//                                      index === 1 ? theme.colors.primary[500] : 
//                                      theme.colors.accent.violet,
//                     }
//                   ]}
//                 />
//               </View>
//               <AgentPerformanceRing agent={agent} size={36} />
//             </View>
//           </View>
//         );
//       })}
//     </View>
//   );
// };

// // Enhanced Progress Ring
// const EnhancedProgressRing = ({ progress, size = 140, title, subtitle, color = theme.colors.secondary[500] }) => {
//   return (
//     <View style={styles.enhancedProgressContainer}>
//       <View style={[styles.progressRingContainer, { width: size, height: size }]}>
//         <View
//           style={[
//             styles.progressRingBackground,
//             {
//               width: size,
//               height: size,
//               borderRadius: size / 2,
//               borderWidth: 10,
//               borderColor: theme.colors.neutral[200],
//             }
//           ]}
//         />
//         <View
//           style={[
//             styles.progressRingFill,
//             {
//               width: size,
//               height: size,
//               borderRadius: size / 2,
//               borderWidth: 10,
//               borderColor: 'transparent',
//               borderTopColor: color,
//               transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
//             }
//           ]}
//         />
//         <View style={styles.progressRingCenter}>
//           <Text style={[styles.progressPercentage, { fontSize: size * 0.16 }]}>
//             {Math.round(progress)}%
//           </Text>
//           <Text style={[styles.progressLabel, { fontSize: size * 0.09 }]}>
//             Complete
//           </Text>
//         </View>
//       </View>
      
//       <View style={styles.progressInfo}>
//         <Text style={styles.progressTitle}>{title}</Text>
//         <Text style={styles.progressSubtitle}>{subtitle}</Text>
//       </View>
//     </View>
//   );
// };

// // Modern Dashboard Header
// const ModernDashboardHeader = ({ user, onMenuPress, onLogout, agentCount }) => {
//   return (
//     <View style={styles.modernHeader}>
//       <TouchableOpacity onPress={onMenuPress} style={styles.modernMenuButton}>
//         <Icon name="menu" size={24} color={theme.colors.text.inverse} />
//       </TouchableOpacity>
      
//       <View style={styles.modernHeaderCenter}>
//         <Text style={styles.modernHeaderTitle}>Agent Manager</Text>
//         <View style={styles.modernHeaderSubtitleContainer}>
//           <View style={styles.agentCountBadge}>
//             <Icon name="people" size={14} color={theme.colors.secondary[500]} />
//             <Text style={styles.modernHeaderSubtitle}>
//               {agentCount} agents • {user?.name?.split(' ')[0]}
//             </Text>
//           </View>
//         </View>
//       </View>

//       <TouchableOpacity onPress={onLogout} style={styles.modernLogoutButton}>
//         <Icon name="logout" size={24} color={theme.colors.text.inverse} />
//       </TouchableOpacity>
//     </View>
//   );
// };

// const DashboardScreen = () => {
//   const { user, logout } = useContext(AuthContext);
//   const navigation = useNavigation();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeTab, setActiveTab] = useState("overview");

//   // Animation values
//   const fadeAnim = useState(new Animated.Value(0))[0];
//   const slideAnim = useState(new Animated.Value(30))[0];

//   // Dashboard data state
//   const [dashboardData, setDashboardData] = useState({
//     dailyStats: {
//       openingBalance: 0,
//       closingBalance: 0,
//       employeeTransactions: 0,
//       agentTransactions: 0,
//       totalCommissions: 0,
//       activeDebtors: 0,
//       netChange: 0,
//       hasTodayTransaction: false,
//     },
//     recentActivity: [],
//     quickStats: {
//       totalAgents: 0,
//       activeDebtors: 0,
//       monthlyCommissions: 0,
//       weeklyTransactions: 0,
//       totalDebtOutstanding: 0,
//       totalDebtCollected: 0,
//     },
//     agentsSummary: {
//       agents: [],
//       summary: {
//         totalAgents: 0,
//         agentsWithUpdatesToday: 0,
//         totalActiveDebtors: 0,
//         totalDebtManaged: 0,
//       },
//     },
//     debtorsSummary: {
//       debtors: [],
//     },
//     lastUpdated: null,
//   });

//   const [weeklyStats, setWeeklyStats] = useState(null);
//   const [monthlyStats, setMonthlyStats] = useState(null);
//   const [myAgents, setMyAgents] = useState([]);
//   const [allDebtors, setAllDebtors] = useState([]);
//   const [agentBalances, setAgentBalances] = useState({
//     totalOpeningBalance: 0,
//     totalClosingBalance: 0,
//     agentCount: 0,
//   });

//   // Data fetching functions (keeping the same logic)
//   const fetchDashboardData = useCallback(async () => {
//     try {
//       const userData = await getUserData();
//       const headers = {
//         'access-token': userData.userToken,
//         client: userData.client,
//         uid: userData.uid,
//         'Content-Type': 'application/json',
//       };

//       console.log('🔄 Fetching employee dashboard data...');
//       const data = await getDashboardStats(headers);
//       console.log('📊 Raw Dashboard Data:', data);

//       setDashboardData({
//         dailyStats: {
//           openingBalance: data.daily_stats?.opening_balance || 0,
//           closingBalance: data.daily_stats?.closing_balance || 0,
//           employeeTransactions: data.daily_stats?.employee_transactions || 0,
//           agentTransactions: data.daily_stats?.agent_transactions || 0,
//           totalCommissions: data.daily_stats?.total_commissions || 0,
//           activeDebtors: data.daily_stats?.active_debtors || 0,
//           netChange: data.daily_stats?.net_change || 0,
//           hasTodayTransaction: data.daily_stats?.has_today_transaction || false
//         },
//         recentActivity: data.recent_activity || [],
//         quickStats: {
//           totalAgents: data.quick_stats?.total_agents || 0,
//           activeDebtors: data.quick_stats?.active_debtors || 0,
//           monthlyCommissions: data.quick_stats?.monthly_commissions || 0,
//           weeklyTransactions: data.quick_stats?.weekly_transactions || 0,
//           totalDebtOutstanding: data.quick_stats?.total_debt_outstanding || 0,
//           totalDebtCollected: data.quick_stats?.total_debt_collected || 0
//         },
//         agentsSummary: {
//           agents: data.agents_summary?.agents || [],
//           summary: {
//             totalAgents: data.agents_summary?.summary?.total_agents || 0,
//             agentsWithUpdatesToday: data.agents_summary?.summary?.agents_with_updates_today || 0,
//             totalActiveDebtors: data.agents_summary?.summary?.total_active_debtors || 0,
//             totalDebtManaged: data.agents_summary?.summary?.total_debt_managed || 0,
//           }
//         },
//         debtorsSummary: {
//           debtors: data.debtors_summary?.debtors || [],
//         },
//         lastUpdated: data.last_updated
//       });

//       console.log('✅ Dashboard data processed successfully');
//     } catch (error) {
//       console.error('❌ Error fetching dashboard data:', error);
//       Alert.alert('Error', 'Failed to load dashboard data');
//     }
//   }, []);

//   const fetchMyAgents = useCallback(async () => {
//     try {
//       const userData = await getUserData();
//       if (!userData) {
//         console.error("❌ No user data available");
//         return;
//       }

//       const headers = {
//         'access-token': userData.userToken,
//         client: userData.client,
//         uid: userData.uid,
//         'Content-Type': 'application/json',
//       };

//       console.log('👥 Fetching employee\'s agents...');
//       const agentsData = await getAgents(headers);
//       console.log('📊 Agents data received:', agentsData);

//       const agents = Array.isArray(agentsData) 
//         ? agentsData 
//         : (agentsData.agents || agentsData.data || []);

//       const validatedAgents = agents
//         .filter(agent => agent && agent.id)
//         .map(agent => ({
//           ...agent,
//           id: agent.id,
//           name: agent.name || agent.full_name || 'Unknown Agent',
//           type: agent.type || agent.agent_type || 'Agent',
//           phone: agent.phone || agent.phone_number || null,
//           status: agent.status || 'active',
//           opening_balance: parseFloat(agent.opening_balance || 0),
//           closing_balance: parseFloat(agent.closing_balance || agent.balance || 0),
//           total_commissions: parseFloat(agent.total_commissions || agent.commissions || 0),
//           active_debtors: parseInt(agent.active_debtors || agent.debtors_count || 0),
//           created_at: agent.created_at || new Date().toISOString(),
//           updated_at: agent.updated_at || new Date().toISOString(),
//         }));

//       setMyAgents(validatedAgents);

//       if (validatedAgents.length > 0) {
//         const totalOpeningBalance = validatedAgents.reduce((sum, agent) => sum + (agent.opening_balance || 0), 0);
//         const totalClosingBalance = validatedAgents.reduce((sum, agent) => sum + (agent.closing_balance || 0), 0);
        
//         setAgentBalances({
//           totalOpeningBalance,
//           totalClosingBalance,
//           agentCount: validatedAgents.length,
//         });
//       }

//       console.log(`✅ Processed ${validatedAgents.length} agents for employee`);
//     } catch (error) {
//       console.error("❌ Error fetching employee's agents:", error);
//       Alert.alert("Error", error.message || "Failed to load agents");
//     }
//   }, []);

//   const fetchWeeklyStats = useCallback(async () => {
//     try {
//       const userData = await getUserData();
//       const headers = {
//         "access-token": userData.userToken,
//         client: userData.client,
//         uid: userData.uid,
//         "Content-Type": "application/json",
//       };
      
//       const data = await getWeeklyStats(headers);
//       setWeeklyStats(data);
//     } catch (error) {
//       console.error("❌ Error fetching weekly stats:", error);
//     }
//   }, []);

//   const fetchMonthlyStats = useCallback(async () => {
//     try {
//       const userData = await getUserData();
//       const headers = {
//         "access-token": userData.userToken,
//         client: userData.client,
//         uid: userData.uid,
//         "Content-Type": "application/json",
//       };
      
//       const data = await getMonthlyStats(headers);
//       setMonthlyStats(data);
//     } catch (error) {
//       console.error("❌ Error fetching monthly stats:", error);
//     }
//   }, []);

//   const fetchAllDebtors = useCallback(async () => {
//     try {
//       const userData = await getUserData();
//       if (!userData) {
//         console.error("❌ No user data available");
//         return;
//       }
      
//       const headers = {
//         "access-token": userData.userToken,
//         client: userData.client,
//         uid: userData.uid,
//         "Content-Type": "application/json",
//       };
      
//       console.log('👥 Fetching all debtors managed by employee...');
      
//       if (typeof getDebtorsOverview !== 'function') {
//         console.error("❌ getDebtorsOverview is not a function:", typeof getDebtorsOverview);
//         Alert.alert("Error", "Debtors overview function not available");
//         return;
//       }
      
//       const response = await getDebtorsOverview(headers);
//       console.log('📊 Debtors overview received:', response);
      
//       const debtSummary = response?.debt_summary || [];
//       const validatedDebtors = Array.isArray(debtSummary)
//         ? debtSummary
//             .map((item) => {
//               if (item?.id === undefined) {
//                 console.error("Debtor is missing an ID:", item);
//                 return null;
//               }
//               return {
//                 ...item,
//                 id: item.id,
//                 balance_due: parseFloat(item.balance_due || 0),
//                 created_at: item.created_at || new Date().toISOString(),
//                 debtor_name: item.debtor_name || "Unknown Debtor",
//                 phone: item.phone || null,
//                 agent_name: item.agent_name || 'Unknown Agent',
//                 name: item.debtor_name || "Unknown Debtor",
//                 total_debt: parseFloat(item.balance_due || 0),
//                 amount: parseFloat(item.balance_due || 0),
//                 total_paid: 0,
//                 amount_paid: 0,
//                 status: item.balance_due > 0 ? 'active' : 'paid',
//                 is_fully_paid: item.balance_due <= 0,
//               };
//             })
//             .filter(Boolean)
//         : [];
      
//       setAllDebtors(validatedDebtors);
//       console.log(`✅ Processed ${validatedDebtors.length} debtors managed by employee`);
//     } catch (error) {
//       console.error("❌ Error fetching all debtors:", error);
//       Alert.alert("Error", error.message || "Failed to load debtors");
//     }
//   }, []);

//   const loadDashboardData = useCallback(async () => {
//     try {
//       setLoading(true);
//       await Promise.all([
//         fetchDashboardData(),
//         fetchMyAgents(),
//         fetchWeeklyStats(),
//         fetchMonthlyStats(),
//         fetchAllDebtors(),
//       ]);
//     } catch (error) {
//       console.error("❌ Error loading dashboard data:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [fetchDashboardData, fetchMyAgents, fetchWeeklyStats, fetchMonthlyStats, fetchAllDebtors]);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await loadDashboardData();
//     setRefreshing(false);
//   }, [loadDashboardData]);

//   useEffect(() => {
//     loadDashboardData();
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [loadDashboardData]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchDashboardData();
//       fetchMyAgents();
//     }, [fetchDashboardData, fetchMyAgents])
//   );

//   const toggleMenu = useCallback(() => {
//     setMenuOpen(!menuOpen);
//   }, [menuOpen]);

//   const navigateTo = useCallback((screen) => {
//     setMenuOpen(false);
//     navigation.navigate(screen);
//   }, [navigation]);

//   // Format currency
//   const formatCurrency = useCallback((amount) => {
//     const numAmount = Number(amount) || 0;
//     return `TSh ${numAmount.toLocaleString('en-TZ', { 
//       minimumFractionDigits: 0, 
//       maximumFractionDigits: 0 
//     })}`;
//   }, []);

//   const formatTime = useCallback((timestamp) => {
//     if (!timestamp) return "";
//     return new Date(timestamp).toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });
//   }, []);

//   // Calculate metrics and trends
//   const metrics = useMemo(() => {
//     const { dailyStats, quickStats } = dashboardData;
    
//     return {
//       totalBalance: dailyStats.closingBalance + agentBalances.totalClosingBalance,
//       balanceTrend: dailyStats.netChange > 0 ? 15 : -8,
//       transactionsTrend: 12,
//       commissionsTrend: 25,
//       debtorsTrend: -5,
//     };
//   }, [dashboardData, agentBalances]);

//   // Prepare chart data
//   const chartData = useMemo(() => {
//     const { dailyStats, quickStats } = dashboardData;
    
//     return {
//       balanceComparison: [
//         { label: 'Employee', value: dailyStats.closingBalance, displayValue: formatCurrency(dailyStats.closingBalance) },
//         { label: 'Agent 1', value: myAgents[0]?.closing_balance || 0, displayValue: formatCurrency(myAgents[0]?.closing_balance || 0) },
//         { label: 'Agent 2', value: myAgents[1]?.closing_balance || 0, displayValue: formatCurrency(myAgents[1]?.closing_balance || 0) },
//         { label: 'Agent 3', value: myAgents[2]?.closing_balance || 0, displayValue: formatCurrency(myAgents[2]?.closing_balance || 0) },
//       ],
//       transactionChart: [
//         { label: 'Employee', value: dailyStats.employeeTransactions, displayValue: dailyStats.employeeTransactions.toString() },
//         { label: 'Agents', value: dailyStats.agentTransactions, displayValue: dailyStats.agentTransactions.toString() },
//         { label: 'Total', value: dailyStats.employeeTransactions + dailyStats.agentTransactions, displayValue: (dailyStats.employeeTransactions + dailyStats.agentTransactions).toString() },
//       ],
//       debtorsPieChart: [
//         { 
//           label: 'High Risk', 
//           value: allDebtors.filter(d => d.balance_due > 1000000).length,
//           displayValue: allDebtors.filter(d => d.balance_due > 1000000).length.toString(),
//           color: theme.colors.error
//         },
//         { 
//           label: 'Medium Risk', 
//           value: allDebtors.filter(d => d.balance_due > 500000 && d.balance_due <= 1000000).length,
//           displayValue: allDebtors.filter(d => d.balance_due > 500000 && d.balance_due <= 1000000).length.toString(),
//           color: theme.colors.warning
//         },
//         { 
//           label: 'Low Risk', 
//           value: allDebtors.filter(d => d.balance_due <= 500000 && d.balance_due > 0).length,
//           displayValue: allDebtors.filter(d => d.balance_due <= 500000 && d.balance_due > 0).length.toString(),
//           color: theme.colors.success
//         },
//       ],
//       agentPerformancePie: [
//         {
//           label: 'Growing',
//           value: myAgents.filter(a => a.closing_balance > a.opening_balance).length,
//           displayValue: myAgents.filter(a => a.closing_balance > a.opening_balance).length.toString(),
//           color: theme.colors.secondary[500]
//         },
//         {
//           label: 'Stable',
//           value: myAgents.filter(a => a.closing_balance === a.opening_balance).length,
//           displayValue: myAgents.filter(a => a.closing_balance === a.opening_balance).length.toString(),
//           color: theme.colors.accent.blue
//         },
//         {
//           label: 'Declining',
//           value: myAgents.filter(a => a.closing_balance < a.opening_balance).length,
//           displayValue: myAgents.filter(a => a.closing_balance < a.opening_balance).length.toString(),
//           color: theme.colors.error
//         },
//       ],
//     };
//   }, [dashboardData, formatCurrency, myAgents, allDebtors]);

//   // Calculate debt collection rate
//   const debtCollectionRate = useMemo(() => {
//     const { totalDebtOutstanding, totalDebtCollected } = dashboardData.quickStats;
//     const total = totalDebtOutstanding + totalDebtCollected;
//     return total > 0 ? (totalDebtCollected / total) * 100 : 0;
//   }, [dashboardData.quickStats]);

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={theme.colors.primary[500]} />
//           <Text style={styles.loadingText}>Loading Dashboard...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const { dailyStats, recentActivity, quickStats, agentsSummary, debtorsSummary, lastUpdated } = dashboardData;

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.colors.neutral[900]} />
      
//       {/* Modern Header */}
//       <ModernDashboardHeader 
//         user={user}
//         onMenuPress={toggleMenu}
//         onLogout={logout}
//         agentCount={myAgents.length}
//       />

//       {/* Enhanced Side Menu with ScrollView */}
//       {menuOpen && (
//         <Animated.View style={[styles.menuOverlay, { opacity: fadeAnim }]}>
//           <Animated.View style={[
//             styles.modernMenu,
//             {
//               transform: [{
//                 translateX: fadeAnim.interpolate({
//                   inputRange: [0, 1],
//                   outputRange: [-300, 0],
//                 })
//               }]
//             }
//           ]}>
//             <View style={styles.modernMenuHeader}>
//               <View style={styles.menuProfileSection}>
//                 <View style={styles.profileAvatar}>
//                   <Text style={styles.profileAvatarText}>
//                     {user?.name?.charAt(0)?.toUpperCase() || 'U'}
//                   </Text>
//                 </View>
//                 <View style={styles.profileInfo}>
//                   <Text style={styles.profileName}>{user?.name || 'User'}</Text>
//                   <Text style={styles.profileRole}>Agent Manager</Text>
//                   <View style={styles.profileStatusIndicator}>
//                     <View style={styles.statusDotOnline} />
//                     <Text style={styles.profileStatus}>Managing {myAgents.length} agents</Text>
//                   </View>
//                 </View>
//               </View>
              
//               <TouchableOpacity onPress={toggleMenu} style={styles.modernCloseButton}>
//                 <Icon name="close" size={20} color={theme.colors.text.secondary} />
//               </TouchableOpacity>
//             </View>

//             {/* FIXED: Added ScrollView to menu items */}
//             <ScrollView 
//               style={styles.menuScrollContainer}
//               showsVerticalScrollIndicator={false}
//               bounces={false}
//             >
//               <View style={styles.menuItemsContainer}>
//                 <Text style={styles.menuSectionTitle}>AGENT MANAGEMENT</Text>
                
//                 {[
//                   { screen: "Dashboard", icon: "dashboard", label: "Dashboard", isActive: true },
//                   { screen: "Transactions", icon: "receipt", label: "Agent Transactions", badge: dailyStats.agentTransactions },
//                   { screen: "Agents", icon: "people", label: "My Agents", badge: myAgents.length },
//                   { screen: "Commissions", icon: "attach-money", label: "Commissions" },
//                   { screen: "Debtors", icon: "account-balance", label: "Managed Debtors", badge: quickStats.activeDebtors },
//                 ].map((item, index) => (
//                   <TouchableOpacity
//                     key={item.screen}
//                     style={[
//                       styles.modernMenuItem,
//                       item.isActive && styles.modernMenuItemActive
//                     ]}
//                     onPress={() => item.screen === "Dashboard" ? toggleMenu() : navigateTo(item.screen)}
//                     activeOpacity={0.7}
//                   >
//                     <View style={styles.menuItemContent}>
//                       <View style={[
//                         styles.modernMenuItemIcon,
//                         { backgroundColor: item.isActive ? theme.colors.primary[500] : theme.colors.primary[50] },
//                       ]}>
//                         <Icon 
//                           name={item.icon} 
//                           size={18} 
//                           color={item.isActive ? theme.colors.text.inverse : theme.colors.primary[500]} 
//                         />
//                       </View>
//                       <Text style={[
//                         styles.modernMenuItemText,
//                         item.isActive && styles.modernMenuItemTextActive
//                       ]}>
//                         {item.label}
//                       </Text>
//                     </View>
                    
//                     {item.badge && item.badge > 0 && (
//                       <View style={styles.menuItemBadge}>
//                         <Text style={styles.menuItemBadgeText}>
//                           {item.badge > 99 ? '99+' : item.badge}
//                         </Text>
//                       </View>
//                     )}
                    
//                     <Icon 
//                       name="chevron-right" 
//                       size={16} 
//                       color={item.isActive ? theme.colors.primary[500] : theme.colors.text.tertiary} 
//                     />
//                   </TouchableOpacity>
//                 ))}
//               </View>

//               <View style={styles.menuStatsSection}>
//                 <Text style={styles.menuSectionTitle}>TODAY'S SUMMARY</Text>
                
//                 <View style={styles.menuStatItem}>
//                   <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.secondary[500] }]}>
//                     <Icon name="account-balance-wallet" size={16} color={theme.colors.text.inverse} />
//                   </View>
//                   <View style={styles.menuStatContent}>
//                     <Text style={styles.menuStatLabel}>Total Balance</Text>
//                     <Text style={styles.menuStatValue}>
//                       {formatCurrency(metrics.totalBalance)}
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.menuStatItem}>
//                   <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.primary[500] }]}>
//                     <Icon name="people" size={16} color={theme.colors.text.inverse} />
//                   </View>
//                   <View style={styles.menuStatContent}>
//                     <Text style={styles.menuStatLabel}>Agents Performance</Text>
//                     <Text style={styles.menuStatValue}>
//                       {myAgents.filter(a => a.closing_balance > a.opening_balance).length}/{myAgents.length} Growing
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.menuStatItem}>
//                   <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.error }]}>
//                     <Icon name="warning" size={16} color={theme.colors.text.inverse} />
//                   </View>
//                   <View style={styles.menuStatContent}>
//                     <Text style={styles.menuStatLabel}>High Risk Debtors</Text>
//                     <Text style={styles.menuStatValue}>
//                       {allDebtors.filter(d => d.balance_due > 1000000).length} debtors
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.menuStatItem}>
//                   <View style={[styles.menuStatIcon, { backgroundColor: theme.colors.accent.amber }]}>
//                     <Icon name="trending-up" size={16} color={theme.colors.text.inverse} />
//                   </View>
//                   <View style={styles.menuStatContent}>
//                     <Text style={styles.menuStatLabel}>Collection Rate</Text>
//                     <Text style={styles.menuStatValue}>
//                       {Math.round(debtCollectionRate)}%
//                     </Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.menuFooter}>
//                 <TouchableOpacity style={styles.menuFooterItem} onPress={() => navigateTo("Settings")}>
//                   <Icon name="settings" size={18} color={theme.colors.text.secondary} />
//                   <Text style={styles.menuFooterText}>Settings</Text>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity style={styles.logoutMenuItem} onPress={logout}>
//                   <Icon name="exit-to-app" size={18} color={theme.colors.error} />
//                   <Text style={styles.logoutMenuText}>Sign Out</Text>
//                 </TouchableOpacity>
//               </View>
//             </ScrollView>
//           </Animated.View>
          
//           <TouchableOpacity 
//             style={styles.menuBackdrop} 
//             onPress={toggleMenu}
//             activeOpacity={1}
//           />
//         </Animated.View>
//       )}

//       {/* Modern Tab Navigation */}
//       <View style={styles.modernTabContainer}>
//         {[
//           { key: 'overview', label: 'Overview', icon: 'dashboard' },
//           { key: 'analytics', label: 'Analytics', icon: 'analytics' },
//           { key: 'agents', label: 'My Agents', icon: 'people' },
//           { key: 'debtors', label: 'Debtors', icon: 'account-balance' },
//         ].map((tab) => (
//           <TouchableOpacity
//             key={tab.key}
//             style={[styles.modernTab, activeTab === tab.key && styles.modernActiveTab]}
//             onPress={() => setActiveTab(tab.key)}
//           >
//             <Icon name={tab.icon} size={18} color={activeTab === tab.key ? theme.colors.primary[500] : theme.colors.text.secondary} />
//             <Text style={[styles.modernTabText, activeTab === tab.key && styles.modernActiveTabText]}>
//               {tab.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <ScrollView
//         style={styles.content}
//         refreshControl={
//           <RefreshControl 
//             refreshing={refreshing} 
//             onRefresh={onRefresh}
//             colors={[theme.colors.primary[500]]}
//             tintColor={theme.colors.primary[500]}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         <Animated.View style={[
//           styles.contentContainer, 
//           { 
//             opacity: fadeAnim,
//             transform: [{ translateY: slideAnim }]
//           }
//         ]}>
          
//           {/* Overview Tab */}
//           {activeTab === 'overview' && (
//             <>
//               {/* Modern Status Card */}
//               <View style={[
//                 styles.modernStatusCard,
//                 { backgroundColor: dailyStats.hasTodayTransaction ? theme.colors.secondary[500] : theme.colors.error },
//                 theme.shadows.large,
//               ]}>
//                 <View style={styles.modernStatusHeader}>
//                   <View>
//                     <Text style={styles.modernStatusDate}>{new Date().toDateString()}</Text>
//                     <Text style={styles.modernStatusUpdate}>
//                       Last updated: {lastUpdated ? formatTime(lastUpdated) : 'Never'}
//                     </Text>
//                   </View>
//                   <View style={styles.modernStatusIcon}>
//                     <Icon name={dailyStats.hasTodayTransaction ? 'check-circle' : 'warning'} size={28} color={theme.colors.text.inverse} />
//                   </View>
//                 </View>
//                 <Text style={styles.modernStatusText}>
//                   {dailyStats.hasTodayTransaction ? 'All systems up to date' : 'Needs attention'}
//                 </Text>
//               </View>

//               {/* Modern Metrics Grid */}
//               <View style={styles.modernMetricsGrid}>
//                 <ModernMetricCard
//                   icon="account-balance-wallet"
//                   value={formatCurrency(metrics.totalBalance)}
//                   label="Total Balance"
//                   trend={metrics.balanceTrend}
//                   gradient={[theme.colors.primary[500], theme.colors.primary[600]]}
//                 />
                
//                 <ModernMetricCard
//                   icon="receipt"
//                   value={dailyStats.employeeTransactions + dailyStats.agentTransactions}
//                   label="Total Transactions"
//                   trend={metrics.transactionsTrend}
//                   gradient={[theme.colors.secondary[500], theme.colors.secondary[600]]}
//                 />
                
//                 <ModernMetricCard
//                   icon="attach-money"
//                   value={formatCurrency(dailyStats.totalCommissions)}
//                   label="Commissions"
//                   trend={metrics.commissionsTrend}
//                   gradient={[theme.colors.accent.amber, theme.colors.accent.orange]}
//                 />
                
//                 <ModernMetricCard
//                   icon="people"
//                   value={myAgents.length}
//                   label="Active Agents"
//                   gradient={[theme.colors.accent.violet, '#7C3AED']}
//                 />
//               </View>

//               {/* Agent vs Employee Balance Comparison */}
//               <View style={styles.modernCard}>
//                 <Text style={styles.modernCardTitle}>Balance Overview</Text>
                
//                 <View style={styles.balanceComparisonContainer}>
//                   <View style={styles.balanceSection}>
//                     <Text style={styles.balanceSectionTitle}>Employee Balance</Text>
//                     <View style={styles.balanceRow}>
//                       <View style={styles.balanceItem}>
//                         <Text style={styles.balanceLabel}>Opening</Text>
//                         <Text style={styles.balanceValue}>{formatCurrency(dailyStats.openingBalance)}</Text>
//                       </View>
//                       <Icon name="arrow-forward" size={24} color={theme.colors.text.secondary} />
//                       <View style={styles.balanceItem}>
//                         <Text style={styles.balanceLabel}>Closing</Text>
//                         <Text style={[styles.balanceValue, { color: theme.colors.secondary[500] }]}>
//                           {formatCurrency(dailyStats.closingBalance)}
//                         </Text>
//                       </View>
//                     </View>
//                   </View>

//                   <View style={styles.balanceSection}>
//                     <Text style={styles.balanceSectionTitle}>Agents Combined ({myAgents.length} agents)</Text>
//                     <View style={styles.balanceRow}>
//                       <View style={styles.balanceItem}>
//                         <Text style={styles.balanceLabel}>Opening</Text>
//                         <Text style={styles.balanceValue}>{formatCurrency(agentBalances.totalOpeningBalance)}</Text>
//                       </View>
//                       <Icon name="arrow-forward" size={24} color={theme.colors.text.secondary} />
//                       <View style={styles.balanceItem}>
//                         <Text style={styles.balanceLabel}>Closing</Text>
//                         <Text style={[styles.balanceValue, { color: theme.colors.secondary[500] }]}>
//                           {formatCurrency(agentBalances.totalClosingBalance)}
//                         </Text>
//                       </View>
//                     </View>
//                   </View>
//                 </View>

//                 <View style={styles.netChangeContainer}>
//                   <View style={styles.netChangeItem}>
//                     <Text style={styles.netChangeLabel}>Employee Net Change</Text>
//                     <Text style={[
//                       styles.netChangeValue,
//                       { color: dailyStats.netChange >= 0 ? theme.colors.secondary[500] : theme.colors.error }
//                     ]}>
//                       {dailyStats.netChange >= 0 ? '+' : ''}{formatCurrency(dailyStats.netChange)}
//                     </Text>
//                   </View>
                  
//                   <View style={styles.netChangeItem}>
//                     <Text style={styles.netChangeLabel}>Agents Net Change</Text>
//                     <Text style={[
//                       styles.netChangeValue,
//                       { color: (agentBalances.totalClosingBalance - agentBalances.totalOpeningBalance) >= 0 ? theme.colors.secondary[500] : theme.colors.error }
//                     ]}>
//                       {(agentBalances.totalClosingBalance - agentBalances.totalOpeningBalance) >= 0 ? '+' : ''}
//                       {formatCurrency(agentBalances.totalClosingBalance - agentBalances.totalOpeningBalance)}
//                     </Text>
//                   </View>
//                 </View>
//               </View>

//               {/* Top Performing Agents */}
//               {myAgents.length > 0 && (
//                 <View style={styles.modernCard}>
//                   <AgentComparisonChart agents={myAgents} formatCurrency={formatCurrency} />
//                 </View>
//               )}

//               {/* Quick Actions */}
//               <View style={styles.modernCard}>
//                 <Text style={styles.modernCardTitle}>Quick Actions</Text>
//                 <View style={styles.modernActionsGrid}>
//                   <TouchableOpacity 
//                     style={styles.modernActionButton}
//                     onPress={() => navigation.navigate("RecordTransaction")}
//                   >
//                     <View style={[styles.modernActionGradient, { backgroundColor: theme.colors.primary[500] }]}>
//                       <Icon name="add" size={24} color={theme.colors.text.inverse} />
//                       <Text style={styles.modernActionText}>Record Transaction</Text>
//                     </View>
//                   </TouchableOpacity>
                  
//                   <TouchableOpacity 
//                     style={styles.modernActionButton}
//                     onPress={() => navigation.navigate("CreateAgent")}
//                   >
//                     <View style={[styles.modernActionGradient, { backgroundColor: theme.colors.secondary[500] }]}>
//                       <Icon name="person-add" size={24} color={theme.colors.text.inverse} />
//                       <Text style={styles.modernActionText}>Add Agent</Text>
//                     </View>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </>
//           )}

//           {/* Analytics Tab */}
//           {activeTab === 'analytics' && (
//             <>
//               <View style={styles.modernCard}>
//                 <ModernBarChart 
//                   data={chartData.balanceComparison}
//                   title="Balance Comparison: Employee vs Top Agents"
//                   color={theme.colors.primary[500]}
//                   height={160}
//                 />
//               </View>

//               <View style={styles.modernCard}>
//                 <ModernBarChart 
//                   data={chartData.transactionChart}
//                   title="Transaction Management Overview"
//                   color={theme.colors.secondary[500]}
//                   height={140}
//                 />
//               </View>

//               {/* Agent Performance Pie Chart */}
//               <View style={styles.modernCard}>
//                 <ModernPieChart
//                   data={chartData.agentPerformancePie}
//                   title="Agent Performance Distribution"
//                   centerText={`${myAgents.length} Agents`}
//                   size={160}
//                 />
//               </View>

//               {/* Debt Risk Analysis Pie Chart */}
//               <View style={styles.modernCard}>
//                 <ModernPieChart
//                   data={chartData.debtorsPieChart}
//                   title="Debtor Risk Analysis"
//                   centerText={`${allDebtors.length} Debtors`}
//                   size={160}
//                 />
//               </View>

//               <View style={styles.modernCard}>
//                 <EnhancedProgressRing 
//                   progress={debtCollectionRate}
//                   title="Debt Collection Rate"
//                   subtitle={`${formatCurrency(dashboardData.quickStats.totalDebtCollected)} collected`}
//                   color={theme.colors.secondary[500]}
//                 />
//               </View>

//               <View style={styles.modernCard}>
//                 <Text style={styles.modernCardTitle}>Performance Metrics</Text>
//                 <View style={styles.performanceMetricsGrid}>
//                   <View style={styles.performanceMetric}>
//                     <Icon name="trending-up" size={32} color={theme.colors.secondary[500]} />
//                     <Text style={styles.performanceMetricValue}>
//                       {myAgents.filter(a => a.closing_balance > a.opening_balance).length}
//                     </Text>
//                     <Text style={styles.performanceMetricLabel}>Growing Agents</Text>
//                   </View>
                  
//                   <View style={styles.performanceMetric}>
//                     <Icon name="star" size={32} color={theme.colors.accent.amber} />
//                     <Text style={styles.performanceMetricValue}>
//                       {Math.round(debtCollectionRate)}%
//                     </Text>
//                     <Text style={styles.performanceMetricLabel}>Collection Rate</Text>
//                   </View>
                  
//                   <View style={styles.performanceMetric}>
//                     <Icon name="account-balance" size={32} color={theme.colors.error} />
//                     <Text style={styles.performanceMetricValue}>
//                       {allDebtors.filter(d => d.balance_due > 1000000).length}
//                     </Text>
//                     <Text style={styles.performanceMetricLabel}>High Risk Debtors</Text>
//                   </View>
//                 </View>
//               </View>
//             </>
//           )}

//           {/* My Agents Tab */}
//           {activeTab === 'agents' && (
//             <>
//               <View style={styles.modernCard}>
//                 <Text style={styles.modernCardTitle}>My Agents Overview</Text>
//                 <View style={styles.modernSummaryRow}>
//                   <View style={styles.modernSummaryItem}>
//                     <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.primary[500] }]}>
//                       <Icon name="people" size={24} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernSummaryValue}>{myAgents.length}</Text>
//                     <Text style={styles.modernSummaryLabel}>Total Agents</Text>
//                   </View>
                  
//                   <View style={styles.modernSummaryItem}>
//                     <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.secondary[500] }]}>
//                       <Icon name="account-balance-wallet" size={24} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernSummaryValue}>
//                       {formatCurrency(agentBalances.totalClosingBalance)}
//                     </Text>
//                     <Text style={styles.modernSummaryLabel}>Combined Balance</Text>
//                   </View>
                  
//                   <View style={styles.modernSummaryItem}>
//                     <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.accent.amber }]}>
//                       <Icon name="trending-up" size={24} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernSummaryValue}>
//                       {myAgents.filter(a => a.closing_balance > a.opening_balance).length}
//                     </Text>
//                     <Text style={styles.modernSummaryLabel}>Growing</Text>
//                   </View>
//                 </View>
//               </View>

//               {myAgents.length > 0 ? (
//                 <FlatList
//                   data={myAgents}
//                   renderItem={({ item, index }) => (
//                     <View style={[styles.modernAgentCard, theme.shadows.medium]}>
//                       <View style={styles.modernAgentHeader}>
//                         <View style={styles.modernAgentInfo}>
//                           <View style={[
//                             styles.modernAgentAvatar,
//                             { backgroundColor: index < 3 ? theme.colors.secondary[500] : theme.colors.primary[500] }
//                           ]}>
//                             <Text style={styles.modernAgentAvatarText}>
//                               {item.name.charAt(0).toUpperCase()}
//                             </Text>
//                           </View>
//                           <View>
//                             <Text style={styles.modernAgentName}>{item.name}</Text>
//                             <Text style={styles.modernAgentType}>{item.type || 'Agent'}</Text>
//                             {item.phone && (
//                               <Text style={styles.modernAgentPhone}>{item.phone}</Text>
//                             )}
//                           </View>
//                         </View>
                        
//                         <View style={[
//                           styles.modernAgentStatus,
//                           { backgroundColor: item.status === 'active' ? theme.colors.secondary[500] : theme.colors.error }
//                         ]}>
//                           <Text style={styles.modernAgentStatusText}>
//                             {item.status === 'active' ? 'Active' : 'Inactive'}
//                           </Text>
//                         </View>
//                       </View>
                      
//                       <View style={styles.modernAgentMetrics}>
//                         <View style={styles.modernAgentMetric}>
//                           <Text style={styles.modernAgentMetricLabel}>Opening</Text>
//                           <Text style={styles.modernAgentMetricValue}>
//                             {formatCurrency(item.opening_balance || 0)}
//                           </Text>
//                         </View>
//                         <View style={styles.modernAgentMetric}>
//                           <Text style={styles.modernAgentMetricLabel}>Current</Text>
//                           <Text style={[
//                             styles.modernAgentMetricValue,
//                             { color: theme.colors.secondary[500] }
//                           ]}>
//                             {formatCurrency(item.closing_balance || 0)}
//                           </Text>
//                         </View>
//                         <View style={styles.modernAgentMetric}>
//                           <Text style={styles.modernAgentMetricLabel}>Debtors</Text>
//                           <Text style={styles.modernAgentMetricValue}>{item.active_debtors || 0}</Text>
//                         </View>
//                       </View>

//                       <View style={styles.modernAgentProgress}>
//                         <AgentPerformanceRing agent={item} size={60} />
//                         <View style={styles.modernAgentNetChange}>
//                           <Text style={styles.modernAgentNetChangeLabel}>Net Change</Text>
//                           <Text style={[
//                             styles.modernAgentNetChangeValue,
//                             { 
//                               color: ((item.closing_balance || 0) - (item.opening_balance || 0)) >= 0 
//                                 ? theme.colors.secondary[500] 
//                                 : theme.colors.error 
//                             }
//                           ]}>
//                             {((item.closing_balance || 0) - (item.opening_balance || 0)) >= 0 ? '+' : ''}
//                             {formatCurrency((item.closing_balance || 0) - (item.opening_balance || 0))}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   )}
//                   keyExtractor={(item) => item.id.toString()}
//                   scrollEnabled={false}
//                 />
//               ) : (
//                 <View style={styles.modernCard}>
//                   <View style={styles.modernEmptyState}>
//                     <View style={[styles.modernEmptyIcon, { backgroundColor: theme.colors.primary[500] }]}>
//                       <Icon name="people" size={48} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernEmptyTitle}>No Agents Yet</Text>
//                     <Text style={styles.modernEmptySubtitle}>
//                       Add your first agent to start managing transactions and tracking performance
//                     </Text>
//                     <TouchableOpacity 
//                       style={styles.modernEmptyButton}
//                       onPress={() => navigation.navigate("CreateAgent")}
//                     >
//                       <View style={[styles.modernEmptyButtonGradient, { backgroundColor: theme.colors.primary[500] }]}>
//                         <Icon name="person-add" size={20} color={theme.colors.text.inverse} />
//                         <Text style={styles.modernEmptyButtonText}>Add First Agent</Text>
//                       </View>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               )}
//             </>
//           )}

//           {/* Enhanced Debtors Tab */}
//           {activeTab === 'debtors' && (
//             <>
//               <View style={styles.modernCard}>
//                 <Text style={styles.modernCardTitle}>Debtors Overview</Text>
//                 <View style={styles.modernSummaryRow}>
//                   <View style={styles.modernSummaryItem}>
//                     <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.accent.blue }]}>
//                       <Icon name="account-balance" size={24} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernSummaryValue}>{allDebtors.length}</Text>
//                     <Text style={styles.modernSummaryLabel}>Total Debtors</Text>
//                   </View>
                  
//                   <View style={styles.modernSummaryItem}>
//                     <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.error }]}>
//                       <Icon name="warning" size={24} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernSummaryValue}>
//                       {allDebtors.filter(d => d.balance_due > 1000000).length}
//                     </Text>
//                     <Text style={styles.modernSummaryLabel}>High Risk</Text>
//                   </View>
                  
//                   <View style={styles.modernSummaryItem}>
//                     <View style={[styles.modernSummaryIcon, { backgroundColor: theme.colors.secondary[500] }]}>
//                       <Icon name="check-circle" size={24} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernSummaryValue}>
//                       {Math.round(debtCollectionRate)}%
//                     </Text>
//                     <Text style={styles.modernSummaryLabel}>Collection Rate</Text>
//                   </View>
//                 </View>
//               </View>

//               {/* Debt Risk Pie Chart */}
//               <View style={styles.modernCard}>
//                 <ModernDonutChart
//                   data={chartData.debtorsPieChart}
//                   title="Debt Risk Distribution"
//                   subtitle="Total Debtors"
//                   size={180}
//                 />
//               </View>

//               {/* Debtors List */}
//               {allDebtors.length > 0 ? (
//                 <View style={styles.modernCard}>
//                   <Text style={styles.modernCardTitle}>All Debtors ({allDebtors.length})</Text>
                  
//                   <FlatList
//                     data={allDebtors}
//                     renderItem={({ item }) => (
//                       <ModernDebtorCard
//                         debtor={item}
//                         formatCurrency={formatCurrency}
//                         onPress={() => {
//                           // Navigate to debtor details if needed
//                           console.log('Debtor pressed:', item.debtor_name);
//                         }}
//                       />
//                     )}
//                     keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//                     scrollEnabled={false}
//                     showsVerticalScrollIndicator={false}
//                   />
//                 </View>
//               ) : (
//                 <View style={styles.modernCard}>
//                   <View style={styles.modernEmptyState}>
//                     <View style={[styles.modernEmptyIcon, { backgroundColor: theme.colors.accent.blue }]}>
//                       <Icon name="account-balance" size={48} color={theme.colors.text.inverse} />
//                     </View>
//                     <Text style={styles.modernEmptyTitle}>No Debtors Found</Text>
//                     <Text style={styles.modernEmptySubtitle}>
//                       Debtors will appear here once your agents start managing them
//                     </Text>
//                   </View>
//                 </View>
//               )}
//             </>
//           )}

//           <View style={styles.bottomSpacing} />
//         </Animated.View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background.secondary,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: theme.colors.background.secondary,
//   },
//   loadingText: {
//     marginTop: theme.spacing.lg,
//     ...theme.typography.body,
//     color: theme.colors.text.primary,
//     fontWeight: '600',
//   },

//   // Modern Header Styles
//   modernHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: theme.spacing.xl,
//     paddingVertical: theme.spacing.lg,
//     backgroundColor: theme.colors.neutral[900],
//     ...theme.shadows.large,
//   },
//   modernMenuButton: {
//     padding: theme.spacing.md,
//     borderRadius: theme.borderRadius.md,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//   },
//   modernHeaderCenter: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   modernHeaderTitle: {
//     ...theme.typography.h2,
//     color: theme.colors.text.inverse,
//     marginBottom: theme.spacing.xs,
//   },
//   modernHeaderSubtitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   agentCountBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     paddingHorizontal: theme.spacing.md,
//     paddingVertical: theme.spacing.xs,
//     borderRadius: theme.borderRadius.full,
//   },
//   modernHeaderSubtitle: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.inverse,
//     marginLeft: theme.spacing.xs,
//   },
//   modernLogoutButton: {
//     padding: theme.spacing.md,
//     borderRadius: theme.borderRadius.md,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//   },

//   // Modern Menu Styles
//   menuOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 1000,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//   },
//   modernMenu: {
//     width: '85%',
//     height: '100%',
//     backgroundColor: theme.colors.surface.primary,
//     ...theme.shadows.large,
//   },
//   modernMenuHeader: {
//     paddingTop: 50,
//     paddingHorizontal: theme.spacing.xxl,
//     paddingBottom: theme.spacing.xxl,
//     backgroundColor: theme.colors.neutral[900],
//   },
//   menuProfileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: theme.spacing.lg,
//   },
//   profileAvatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: theme.colors.primary[500],
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: theme.spacing.lg,
//     ...theme.shadows.colored(theme.colors.primary[500]),
//   },
//   profileAvatarText: {
//     ...theme.typography.h3,
//     color: theme.colors.text.inverse,
//     fontWeight: '800',
//   },
//   profileInfo: {
//     flex: 1,
//   },
//   profileName: {
//     ...theme.typography.h3,
//     color: theme.colors.text.inverse,
//     marginBottom: theme.spacing.xs,
//   },
//   profileRole: {
//     ...theme.typography.captionMedium,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginBottom: theme.spacing.sm,
//   },
//   profileStatusIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusDotOnline: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: theme.colors.secondary[500],
//     marginRight: theme.spacing.sm,
//   },
//   profileStatus: {
//     ...theme.typography.caption,
//     color: theme.colors.secondary[500],
//     fontWeight: '600',
//   },
//   modernCloseButton: {
//     position: 'absolute',
//     top: 50,
//     right: theme.spacing.xl,
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   // FIXED: Added scrollable container for menu
//   menuScrollContainer: {
//     flex: 1,
//   },
//   menuItemsContainer: {
//     paddingTop: theme.spacing.xxl,
//   },
//   menuSectionTitle: {
//     ...theme.typography.label,
//     color: theme.colors.text.tertiary,
//     paddingHorizontal: theme.spacing.xxl,
//     marginBottom: theme.spacing.lg,
//   },
//   modernMenuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: theme.spacing.xxl,
//     paddingVertical: theme.spacing.lg,
//     marginHorizontal: theme.spacing.md,
//     marginVertical: theme.spacing.xs,
//     borderRadius: theme.borderRadius.lg,
//     backgroundColor: 'transparent',
//   },
//   modernMenuItemActive: {
//     backgroundColor: theme.colors.primary[50],
//   },
//   menuItemContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   modernMenuItemIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: theme.spacing.lg,
//   },
//   modernMenuItemText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     flex: 1,
//     fontWeight: '600',
//   },
//   modernMenuItemTextActive: {
//     color: theme.colors.primary[600],
//   },
//   menuItemBadge: {
//     backgroundColor: theme.colors.error,
//     borderRadius: theme.borderRadius.full,
//     paddingHorizontal: theme.spacing.sm,
//     paddingVertical: theme.spacing.xs,
//     marginRight: theme.spacing.md,
//     minWidth: 24,
//     alignItems: 'center',
//   },
//   menuItemBadgeText: {
//     ...theme.typography.caption,
//     color: theme.colors.text.inverse,
//     fontWeight: '700',
//   },
//   menuStatsSection: {
//     paddingHorizontal: theme.spacing.xxl,
//     paddingVertical: theme.spacing.xxl,
//     backgroundColor: theme.colors.background.tertiary,
//   },
//   menuStatItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: theme.spacing.lg,
//   },
//   menuStatIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: theme.spacing.lg,
//     ...theme.shadows.small,
//   },
//   menuStatContent: {
//     flex: 1,
//   },
//   menuStatLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.xs,
//   },
//   menuStatValue: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//   },
//   menuFooter: {
//     paddingHorizontal: theme.spacing.xxl,
//     paddingVertical: theme.spacing.xl,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.neutral[200],
//   },
//   menuFooterItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: theme.spacing.md,
//   },
//   menuFooterText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.secondary,
//     marginLeft: theme.spacing.md,
//   },
//   logoutMenuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: theme.spacing.md,
//     marginTop: theme.spacing.sm,
//     paddingTop: theme.spacing.lg,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.neutral[100],
//   },
//   logoutMenuText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.error,
//     fontWeight: '600',
//     marginLeft: theme.spacing.md,
//   },
//   menuBackdrop: {
//     position: 'absolute',
//     top: 0,
//     left: '85%',
//     right: 0,
//     bottom: 0,
//   },

//   // Modern Tab Styles
//   modernTabContainer: {
//     flexDirection: 'row',
//     backgroundColor: theme.colors.surface.primary,
//     borderBottomWidth: 1,
//     borderBottomColor: theme.colors.neutral[200],
//     ...theme.shadows.small,
//   },
//   modernTab: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: theme.spacing.lg,
//     paddingHorizontal: theme.spacing.sm,
//     position: 'relative',
//   },
//   modernActiveTab: {
//     borderBottomWidth: 3,
//     borderBottomColor: theme.colors.primary[500],
//   },
//   modernTabText: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginLeft: theme.spacing.sm,
//     fontWeight: '600',
//   },
//   modernActiveTabText: {
//     color: theme.colors.primary[500],
//   },

//   // Content Styles
//   content: {
//     flex: 1,
//   },
//   contentContainer: {
//     padding: theme.spacing.lg,
//   },

//   // Modern Card Styles
//   modernCard: {
//     backgroundColor: theme.colors.surface.primary,
//     borderRadius: theme.borderRadius.xl,
//     padding: theme.spacing.xxl,
//     marginBottom: theme.spacing.lg,
//     ...theme.shadows.medium,
//   },
//   modernCardTitle: {
//     ...theme.typography.h2,
//     color: theme.colors.text.primary,
//     marginBottom: theme.spacing.xl,
//   },

//   // Modern Status Card
//   modernStatusCard: {
//     borderRadius: theme.borderRadius.xl,
//     padding: theme.spacing.xxl,
//     marginBottom: theme.spacing.lg,
//   },
//   modernStatusHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: theme.spacing.md,
//   },
//   modernStatusDate: {
//     ...theme.typography.h3,
//     color: theme.colors.text.inverse,
//   },
//   modernStatusUpdate: {
//     ...theme.typography.captionMedium,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: theme.spacing.xs,
//   },
//   modernStatusIcon: {
//     padding: theme.spacing.sm,
//   },
//   modernStatusText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.inverse,
//     fontWeight: '600',
//   },

//   // Modern Metrics Grid
//   modernMetricsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginBottom: theme.spacing.lg,
//   },
//   modernMetricCard: {
//     width: '48%',
//     borderRadius: theme.borderRadius.lg,
//     marginBottom: theme.spacing.md,
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   metricGradientBackground: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   metricContent: {
//     padding: theme.spacing.xl,
//   },
//   metricHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: theme.spacing.md,
//   },
//   metricIconContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   trendBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: theme.spacing.sm,
//     paddingVertical: theme.spacing.xs,
//     borderRadius: theme.borderRadius.full,
//   },
//   trendText: {
//     ...theme.typography.caption,
//     color: theme.colors.text.inverse,
//     fontWeight: '600',
//     marginLeft: theme.spacing.xs,
//   },
//   metricValue: {
//     ...theme.typography.h2,
//     color: theme.colors.text.inverse,
//     fontWeight: '800',
//     marginBottom: theme.spacing.xs,
//   },
//   metricLabel: {
//     ...theme.typography.captionMedium,
//     color: 'rgba(255, 255, 255, 0.9)',
//     fontWeight: '600',
//   },

//   // Pie Chart Styles
//   pieChartContainer: {
//     alignItems: 'center',
//     marginBottom: theme.spacing.lg,
//   },
//   pieChartTitle: {
//     ...theme.typography.h3,
//     color: theme.colors.text.primary,
//     marginBottom: theme.spacing.xl,
//     textAlign: 'center',
//   },
//   pieChart: {
//     position: 'relative',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xl,
//   },
//   pieChartBackground: {
//     position: 'absolute',
//     backgroundColor: theme.colors.neutral[100],
//   },
//   pieSlice: {
//     position: 'absolute',
//   },
//   pieChartCenter: {
//     position: 'absolute',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: theme.colors.surface.primary,
//   },
//   pieChartCenterText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   pieChartLegend: {
//     width: '100%',
//   },
//   pieChartLegendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: theme.spacing.sm,
//   },
//   pieChartLegendDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: theme.spacing.md,
//   },
//   pieChartLegendText: {
//     flex: 1,
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//   },
//   pieChartLegendValue: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//   },

//   // Donut Chart Styles
//   donutContainer: {
//     alignItems: 'center',
//   },
//   donutTitle: {
//     ...theme.typography.h3,
//     color: theme.colors.text.primary,
//     marginBottom: theme.spacing.xl,
//     textAlign: 'center',
//   },
//   donutChart: {
//     position: 'relative',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   donutSlice: {
//     position: 'absolute',
//   },
//   donutCenter: {
//     position: 'absolute',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: theme.colors.surface.primary,
//   },
//   donutCenterValue: {
//     ...theme.typography.h2,
//     color: theme.colors.text.primary,
//     fontWeight: '800',
//   },
//   donutCenterLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginTop: theme.spacing.xs,
//   },

//   // Modern Chart Styles
//   modernChartContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   modernChartTitle: {
//     ...theme.typography.h3,
//     color: theme.colors.text.primary,
//     marginBottom: theme.spacing.xl,
//     textAlign: 'center',
//   },
//   modernChartBars: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'flex-end',
//     paddingHorizontal: theme.spacing.md,
//   },
//   modernBarContainer: {
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: theme.spacing.sm,
//   },
//   modernBarWrapper: {
//     justifyContent: 'flex-end',
//     marginBottom: theme.spacing.md,
//     position: 'relative',
//   },
//   modernBar: {
//     width: 32,
//     minHeight: 8,
//     borderRadius: theme.borderRadius.lg,
//     ...theme.shadows.small,
//   },
//   modernBarGlow: {
//     position: 'absolute',
//     bottom: -2,
//     left: -4,
//     right: -4,
//     height: 6,
//     borderRadius: theme.spacing.xs,
//     zIndex: -1,
//   },
//   modernBarLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.primary,
//     textAlign: 'center',
//     marginBottom: theme.spacing.xs,
//     fontWeight: '600',
//   },
//   modernBarValue: {
//     ...theme.typography.caption,
//     color: theme.colors.text.secondary,
//     textAlign: 'center',
//   },

//   // Balance Comparison Styles
//   balanceComparisonContainer: {
//     marginBottom: theme.spacing.xl,
//   },
//   balanceSection: {
//     marginBottom: theme.spacing.xxl,
//   },
//   balanceSectionTitle: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//     marginBottom: theme.spacing.lg,
//   },
//   balanceRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-around',
//   },
//   balanceItem: {
//     alignItems: 'center',
//   },
//   balanceLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.sm,
//   },
//   balanceValue: {
//     ...theme.typography.h3,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//   },
//   netChangeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingTop: theme.spacing.xl,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.neutral[200],
//   },
//   netChangeItem: {
//     alignItems: 'center',
//   },
//   netChangeLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.sm,
//   },
//   netChangeValue: {
//     ...theme.typography.h2,
//     fontWeight: '800',
//   },

//   // Agent Comparison Styles
//   agentComparisonContainer: {
//     marginBottom: theme.spacing.lg,
//   },
//   agentComparisonItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: theme.spacing.lg,
//     borderBottomWidth: 1,
//     borderBottomColor: theme.colors.neutral[200],
//   },
//   agentRankContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   agentRank: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: theme.spacing.lg,
//   },
//   agentRankText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.inverse,
//     fontWeight: '800',
//   },
//   agentInfo: {
//     flex: 1,
//   },
//   agentComparisonName: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//     marginBottom: theme.spacing.xs,
//   },
//   agentComparisonBalance: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     fontWeight: '600',
//   },
//   agentPerformanceBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     marginLeft: theme.spacing.lg,
//   },
//   agentPerformanceBarTrack: {
//     flex: 1,
//     height: 8,
//     backgroundColor: theme.colors.neutral[200],
//     borderRadius: 4,
//     marginRight: theme.spacing.md,
//   },
//   agentPerformanceBarFill: {
//     height: '100%',
//     borderRadius: 4,
//   },

//   // Performance Ring Styles
//   performanceRing: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative',
//   },
//   performanceRingBackground: {
//     position: 'absolute',
//   },
//   performanceRingFill: {
//     position: 'absolute',
//   },
//   performanceRingCenter: {
//     position: 'absolute',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   performancePercentage: {
//     fontWeight: '800',
//     color: theme.colors.text.primary,
//   },

//   // Enhanced Progress Ring Styles
//   enhancedProgressContainer: {
//     alignItems: 'center',
//   },
//   progressRingContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative',
//     marginBottom: theme.spacing.xl,
//   },
//   progressRingBackground: {
//     position: 'absolute',
//   },
//   progressRingFill: {
//     position: 'absolute',
//   },
//   progressRingCenter: {
//     position: 'absolute',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   progressPercentage: {
//     fontWeight: '800',
//     color: theme.colors.text.primary,
//   },
//   progressLabel: {
//     color: theme.colors.text.secondary,
//     fontWeight: '600',
//     marginTop: theme.spacing.xs,
//   },
//   progressInfo: {
//     alignItems: 'center',
//   },
//   progressTitle: {
//     ...theme.typography.h3,
//     color: theme.colors.text.primary,
//     marginBottom: theme.spacing.xs,
//   },
//   progressSubtitle: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.secondary,
//     textAlign: 'center',
//   },

//   // Modern Actions Grid
//   modernActionsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   modernActionButton: {
//     flex: 1,
//     marginHorizontal: theme.spacing.sm,
//   },
//   modernActionGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: theme.spacing.lg,
//     paddingHorizontal: theme.spacing.xl,
//     borderRadius: theme.borderRadius.lg,
//     ...theme.shadows.medium,
//   },
//   modernActionText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.inverse,
//     fontWeight: '700',
//     marginLeft: theme.spacing.sm,
//   },

//   // Modern Summary Styles
//   modernSummaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   modernSummaryItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   modernSummaryIcon: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: theme.spacing.md,
//     ...theme.shadows.medium,
//   },
//   modernSummaryValue: {
//     ...theme.typography.h3,
//     color: theme.colors.text.primary,
//     fontWeight: '800',
//     marginBottom: theme.spacing.xs,
//   },
//   modernSummaryLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     textAlign: 'center',
//     fontWeight: '600',
//   },

//   // Modern Agent Card Styles
//   modernAgentCard: {
//     backgroundColor: theme.colors.surface.primary,
//     borderRadius: theme.borderRadius.xl,
//     padding: theme.spacing.xl,
//     marginBottom: theme.spacing.md,
//     borderLeftWidth: 4,
//     borderLeftColor: theme.colors.primary[500],
//   },
//   modernAgentHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: theme.spacing.lg,
//   },
//   modernAgentInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   modernAgentAvatar: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: theme.spacing.lg,
//     ...theme.shadows.medium,
//   },
//   modernAgentAvatarText: {
//     ...theme.typography.h3,
//     color: theme.colors.text.inverse,
//     fontWeight: '800',
//   },
//   modernAgentName: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//     marginBottom: theme.spacing.xs,
//   },
//   modernAgentType: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.xs,
//   },
//   modernAgentPhone: {
//     ...theme.typography.caption,
//     color: theme.colors.text.tertiary,
//   },
//   modernAgentStatus: {
//     paddingHorizontal: theme.spacing.md,
//     paddingVertical: theme.spacing.sm,
//     borderRadius: theme.borderRadius.full,
//   },
//   modernAgentStatusText: {
//     ...theme.typography.caption,
//     color: theme.colors.text.inverse,
//     fontWeight: '700',
//   },
//   modernAgentMetrics: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: theme.spacing.lg,
//   },
//   modernAgentMetric: {
//     alignItems: 'center',
//   },
//   modernAgentMetricLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.xs,
//   },
//   modernAgentMetricValue: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//   },
//   modernAgentProgress: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingTop: theme.spacing.lg,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.neutral[200],
//   },
//   modernAgentNetChange: {
//     alignItems: 'flex-end',
//     flex: 1,
//     marginLeft: theme.spacing.lg,
//   },
//   modernAgentNetChangeLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.xs,
//   },
//   modernAgentNetChangeValue: {
//     ...theme.typography.bodyMedium,
//     fontWeight: '800',
//   },

//   // Modern Debtor Card Styles
//   modernDebtorCard: {
//     backgroundColor: theme.colors.surface.primary,
//     borderRadius: theme.borderRadius.xl,
//     padding: theme.spacing.xl,
//     marginBottom: theme.spacing.md,
//     borderLeftWidth: 4,
//     borderLeftColor: theme.colors.accent.blue,
//   },
//   debtorCardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: theme.spacing.lg,
//   },
//   debtorInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   debtorAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: theme.spacing.lg,
//     ...theme.shadows.small,
//   },
//   debtorAvatarText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.inverse,
//     fontWeight: '800',
//   },
//   debtorDetails: {
//     flex: 1,
//   },
//   debtorName: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//     marginBottom: theme.spacing.xs,
//   },
//   debtorAgent: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.xs,
//   },
//   debtorPhone: {
//     ...theme.typography.caption,
//     color: theme.colors.text.tertiary,
//   },
//   riskBadge: {
//     paddingHorizontal: theme.spacing.md,
//     paddingVertical: theme.spacing.sm,
//     borderRadius: theme.borderRadius.full,
//   },
//   riskBadgeText: {
//     ...theme.typography.caption,
//     color: theme.colors.text.inverse,
//     fontWeight: '700',
//   },
//   debtorMetrics: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: theme.spacing.lg,
//   },
//   debtorMetric: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   debtorMetricLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     marginBottom: theme.spacing.xs,
//   },
//   debtorMetricValue: {
//     ...theme.typography.bodyMedium,
//     fontWeight: '700',
//   },
//   debtorStatus: {
//     ...theme.typography.bodyMedium,
//     fontWeight: '700',
//   },
//   debtorProgress: {
//     paddingTop: theme.spacing.lg,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.neutral[200],
//   },
//   debtorProgressBar: {
//     height: 6,
//     backgroundColor: theme.colors.neutral[200],
//     borderRadius: 3,
//     marginBottom: theme.spacing.sm,
//   },
//   debtorProgressFill: {
//     height: '100%',
//     borderRadius: 3,
//   },
//   debtorProgressText: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     textAlign: 'center',
//   },

//   // Modern Empty State
//   modernEmptyState: {
//     alignItems: 'center',
//     paddingVertical: theme.spacing.xxxl,
//   },
//   modernEmptyIcon: {
//     width: 88,
//     height: 88,
//     borderRadius: 44,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: theme.spacing.xl,
//     ...theme.shadows.large,
//   },
//   modernEmptyTitle: {
//     ...theme.typography.h2,
//     color: theme.colors.text.primary,
//     marginBottom: theme.spacing.sm,
//   },
//   modernEmptySubtitle: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.secondary,
//     textAlign: 'center',
//     marginBottom: theme.spacing.xxl,
//     lineHeight: 22,
//   },
//   modernEmptyButton: {
//     alignSelf: 'stretch',
//   },
//   modernEmptyButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: theme.spacing.lg,
//     paddingHorizontal: theme.spacing.xxl,
//     borderRadius: theme.borderRadius.lg,
//     ...theme.shadows.medium,
//   },
//   modernEmptyButtonText: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.inverse,
//     fontWeight: '700',
//     marginLeft: theme.spacing.sm,
//   },

//   // Performance Styles
//   performanceMetricsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   performanceMetric: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   performanceMetricValue: {
//     ...theme.typography.h2,
//     color: theme.colors.text.primary,
//     fontWeight: '800',
//     marginTop: theme.spacing.sm,
//     marginBottom: theme.spacing.xs,
//   },
//   performanceMetricLabel: {
//     ...theme.typography.captionMedium,
//     color: theme.colors.text.secondary,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   performanceOverviewGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   performanceOverviewItem: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: theme.spacing.xl,
//     paddingHorizontal: theme.spacing.lg,
//     borderRadius: theme.borderRadius.lg,
//     marginHorizontal: theme.spacing.sm,
//     ...theme.shadows.medium,
//   },
//   performanceOverviewValue: {
//     ...theme.typography.h2,
//     color: theme.colors.text.inverse,
//     fontWeight: '800',
//     marginTop: theme.spacing.sm,
//     marginBottom: theme.spacing.xs,
//   },
//   performanceOverviewLabel: {
//     ...theme.typography.captionMedium,
//     color: 'rgba(255, 255, 255, 0.9)',
//     textAlign: 'center',
//     fontWeight: '600',
//   },

//   // Debt Performance Styles
//   debtPerformanceContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-around',
//   },
//   debtBreakdown: {
//     flex: 1,
//     marginLeft: theme.spacing.xl,
//   },
//   debtBreakdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: theme.spacing.md,
//   },
//   debtBreakdownDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: theme.spacing.md,
//   },
//   debtBreakdownLabel: {
//     flex: 1,
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//   },
//   debtBreakdownValue: {
//     ...theme.typography.bodyMedium,
//     color: theme.colors.text.primary,
//     fontWeight: '700',
//   },

//   bottomSpacing: {
//     height: theme.spacing.xxxl,
//   },
// });

// export default DashboardScreen;