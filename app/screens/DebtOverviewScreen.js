import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
  Modal,
  SafeAreaView,
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  LinearGradient,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getDebtorsOverview, payDebt, createDebtor } from "../services/api";
import { getUserData } from "../services/auth";

const { width, height } = Dimensions.get("window");
const isTablet = width > 768;
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size) => {
  const baseWidth = 375;
  return (width / baseWidth) * size;
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Animated Statistics Card Component
const StatCard = ({ icon, label, value, color, delay = 0, trend, trendValue }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.statCardContent}>
        <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
          <Icon name={icon} size={moderateScale(28)} color={color} />
        </View>
        
        <View style={styles.statInfo}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {trend && (
            <View style={styles.trendContainer}>
              <Icon
                name={trend === "up" ? "trending-up" : "trending-down"}
                size={moderateScale(14)}
                color={trend === "up" ? "#10B981" : "#EF4444"}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: trend === "up" ? "#10B981" : "#EF4444" },
                ]}
              >
                {trendValue}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Decorative corner accent */}
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
    </Animated.View>
  );
};

const DebtorItem = React.memo(
  ({ item, onPay, onPayFull, isProcessingPayment }) => {
    const [amount, setAmount] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [animatedHeight] = useState(new Animated.Value(0));
    const [animatedOpacity] = useState(new Animated.Value(0));

    if (!item) return null;

    const handlePayment = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert(
          "Invalid Amount",
          "Please enter a valid amount greater than 0"
        );
        return;
      }

      const paymentAmount = parseFloat(amount);
      if (paymentAmount > item.balance_due) {
        Alert.alert(
          "Invalid Amount",
          "Payment amount cannot exceed the outstanding balance"
        );
        return;
      }

      setIsPaying(true);
      try {
        await onPay(item.id, paymentAmount);
        setAmount("");
        setIsExpanded(false);
      } catch (error) {
        console.error("Payment error:", error);
      } finally {
        setIsPaying(false);
      }
    };

    const toggleExpanded = () => {
      const willExpand = !isExpanded;
      setIsExpanded(willExpand);

      Animated.parallel([
        Animated.spring(animatedHeight, {
          toValue: willExpand ? 1 : 0,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(animatedOpacity, {
          toValue: willExpand ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency: "TZS",
        minimumFractionDigits: 0,
      }).format(value);
    };

    const getDebtSeverity = (amount) => {
      if (amount > 1000000)
        return {
          color: "#DC2626",
          label: "Critical",
          bgColor: "#FEE2E2",
        };
      if (amount > 500000)
        return {
          color: "#F59E0B",
          label: "High",
          bgColor: "#FEF3C7",
        };
      return {
        color: "#10B981",
        label: "Normal",
        bgColor: "#D1FAE5",
      };
    };

    const debtSeverity = getDebtSeverity(item.balance_due);

    const expandedHeight = animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 350],
    });

    return (
      <Pressable
        style={({ pressed }) => [
          styles.debtorCard,
          pressed && styles.debtorCardPressed,
          isExpanded && styles.debtorCardExpanded,
        ]}
        onPress={toggleExpanded}
        android_ripple={{ color: "#F1F5F9", borderless: false }}
      >
        <View style={styles.debtorHeader}>
          <View style={styles.debtorMainInfo}>
            <View
              style={[
                styles.debtorAvatar,
                { backgroundColor: debtSeverity.bgColor },
              ]}
            >
              <Text style={[styles.avatarText, { color: debtSeverity.color }]}>
                {(item.debtor_name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.debtorDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.debtorName} numberOfLines={1}>
                  {item.debtor_name || "Unknown Debtor"}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: debtSeverity.bgColor },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: debtSeverity.color },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: debtSeverity.color }]}
                  >
                    {debtSeverity.label}
                  </Text>
                </View>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.debtLabel}>Outstanding</Text>
                <Text style={styles.debtAmount}>
                  {formatCurrency(item.balance_due || 0)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.expandButton,
              isExpanded && styles.expandButtonActive,
            ]}
            onPress={toggleExpanded}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={isExpanded ? "expand-less" : "expand-more"}
              size={moderateScale(24)}
              color={isExpanded ? "#3B82F6" : "#94A3B8"}
            />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{
            maxHeight: expandedHeight,
            opacity: animatedOpacity,
            overflow: "hidden",
          }}
        >
          <View style={styles.expandedContent}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Icon name="phone" size={moderateScale(18)} color="#3B82F6" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>
                    {item.phone || "Not provided"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Icon
                    name="calendar-today"
                    size={moderateScale(18)}
                    color="#10B981"
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Created</Text>
                  <Text style={styles.infoValue}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {item.balance_due > 0 && (
              <View style={styles.paymentSection}>
                <TouchableOpacity
                  style={styles.quickPayButton}
                  onPress={() => onPayFull(item.id, item.balance_due)}
                  disabled={isProcessingPayment}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickPayContent}>
                    <Icon
                      name="flash-on"
                      size={moderateScale(20)}
                      color="#FFFFFF"
                    />
                    <View style={styles.quickPayText}>
                      <Text style={styles.quickPayLabel}>Quick Pay</Text>
                      <Text style={styles.quickPayAmount}>
                        {formatCurrency(item.balance_due)}
                      </Text>
                    </View>
                  </View>
                  <Icon
                    name="arrow-forward"
                    size={moderateScale(20)}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <View style={styles.customPaymentContainer}>
                  <Text style={styles.customPaymentLabel}>Custom Amount</Text>
                  <View style={styles.customPaymentRow}>
                    <View style={styles.customInputWrapper}>
                      <Text style={styles.inputCurrency}>TSh</Text>
                      <TextInput
                        style={styles.customInput}
                        placeholder="0"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={(text) => {
                          const cleanText = text.replace(/[^0-9.]/g, "");
                          const parts = cleanText.split(".");
                          if (parts.length > 2) return;
                          if (parts[1] && parts[1].length > 2) return;
                          setAmount(cleanText);
                        }}
                        editable={!isPaying && !isProcessingPayment}
                        returnKeyType="done"
                        onSubmitEditing={handlePayment}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.customPayButton,
                        (isPaying ||
                          isProcessingPayment ||
                          !amount ||
                          parseFloat(amount) <= 0) &&
                          styles.customPayButtonDisabled,
                      ]}
                      onPress={handlePayment}
                      disabled={
                        isPaying ||
                        isProcessingPayment ||
                        !amount ||
                        parseFloat(amount) <= 0
                      }
                      activeOpacity={0.7}
                    >
                      {isPaying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Icon
                          name="check"
                          size={moderateScale(20)}
                          color="#FFFFFF"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    );
  }
);

const DebtOverviewScreen = () => {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalDebt, setTotalDebt] = useState(0);
  const [showCreateDebtorForm, setShowCreateDebtorForm] = useState(false);
  const [newDebtorName, setNewDebtorName] = useState("");
  const [newDebtorPhone, setNewDebtorPhone] = useState("");
  const [newDebtorAmount, setNewDebtorAmount] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [agents, setAgents] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("amount");

  const filteredAndSortedDebtors = useMemo(() => {
    let filtered = debtors.filter(
      (debtor) =>
        debtor.debtor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (debtor.phone && debtor.phone.includes(searchQuery))
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.balance_due - a.balance_due;
        case "name":
          return a.debtor_name.localeCompare(b.debtor_name);
        case "date":
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });
  }, [debtors, searchQuery, sortBy]);

  const fetchAgents = async () => {
    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error("User data not available");
      }

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
      };

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "https://tq-backend-main.fly.dev"
        }/employees/agents`,
        {
          method: "GET",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch agents");
      }

      const data = await response.json();
      const agentsList = Array.isArray(data) ? data : [];
      setAgents(agentsList);

      if (agentsList.length === 1) {
        setSelectedAgentId(agentsList[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to load agents. Please try again."
      );
      setAgents([]);
    }
  };

  const fetchDebtors = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      if (!userData) {
        throw new Error("User data not available");
      }

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
      };

      const response = await getDebtorsOverview(headers);
      const debtSummary = response?.debt_summary || [];

      const validatedDebtors = Array.isArray(debtSummary)
        ? debtSummary
            .map((item) => {
              if (item?.id === undefined) {
                console.error("Debtor is missing an ID:", item);
                return null;
              }
              return {
                ...item,
                id: item.id,
                balance_due: parseFloat(item.balance_due || 0),
                created_at: item.created_at || new Date().toISOString(),
                debtor_name: item.debtor_name || "Unknown Debtor",
                phone: item.phone || null,
              };
            })
            .filter(Boolean)
        : [];

      setDebtors(validatedDebtors);
      setTotalDebt(parseFloat(response?.total_debt || 0));
    } catch (error) {
      console.error("Error fetching debtors:", error);
      Alert.alert("Error", error.message || "Failed to load debtors");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDebtors();
  }, []);

  const handlePayment = async (debtorId, amount) => {
    setIsProcessingPayment(true);
    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error("User data not available");
      }

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
      };

      const response = await payDebt(debtorId, { amount }, headers);

      Alert.alert(
        "Success",
        `Payment of TSh ${amount.toLocaleString()} recorded successfully`
      );
      fetchDebtors();
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.errors?.[0] ||
          error.message ||
          "Failed to record payment"
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayFull = async (debtorId, amount) => {
    const id = parseInt(debtorId, 10);
    if (isNaN(id) || id <= 0) {
      Alert.alert("Error", "Invalid debtor ID");
      return;
    }

    Alert.alert(
      "Confirm Full Payment",
      `Are you sure you want to pay the full amount of TSh ${amount.toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setIsProcessingPayment(true);
              await handlePayment(id, amount);
            } catch (error) {
              console.error("Payment error:", error);
            } finally {
              setIsProcessingPayment(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateDebtor = async () => {
    if (!newDebtorName.trim()) {
      Alert.alert("Error", "Please enter a name for the debtor");
      return;
    }

    if (!selectedAgentId) {
      Alert.alert("Error", "Please select an agent/service provider");
      return;
    }

    const amount = parseFloat(newDebtorAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0");
      return;
    }

    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error("User data not available");
      }

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
      };

      const debtorData = {
        debtor: {
          name: newDebtorName.trim(),
          phone: newDebtorPhone.trim() || null,
          debt_amount: amount,
          agent_id: parseInt(selectedAgentId),
        },
      };

      await createDebtor(debtorData, headers);

      Alert.alert("Success", "Debtor created successfully");
      setShowCreateDebtorForm(false);
      setNewDebtorName("");
      setNewDebtorPhone("");
      setNewDebtorAmount("");
      setSelectedAgentId("");
      fetchDebtors();
    } catch (error) {
      console.error("Error creating debtor:", error);
      Alert.alert(
        "Error",
        error.response?.data?.errors ||
          error.response?.data?.error ||
          error.message ||
          "Failed to create debtor"
      );
    }
  };

  const renderDebtorItem = ({ item }) => (
    <DebtorItem
      item={item}
      onPay={handlePayment}
      onPayFull={handlePayFull}
      isProcessingPayment={isProcessingPayment}
    />
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    fetchDebtors();
    fetchAgents();
  }, []);

  const totalPaid = debtors.reduce((sum, d) => sum + (d.total_paid || 0), 0);
  const averageDebt = debtors.length > 0 ? totalDebt / debtors.length : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      <View style={styles.container}>
        {/* Modern Header with Gradient Background */}
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerGreeting}>Debt Overview</Text>
                <Text style={styles.headerSubtitle}>
                  Monitor and manage all outstanding debts
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCreateDebtorForm(true)}
              >
                <Icon name="add" size={moderateScale(24)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* New Statistics Cards */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="account-balance-wallet"
                label="Total Outstanding"
                value={formatCurrency(totalDebt)}
                color="#EF4444"
                delay={0}
              />
              <StatCard
                icon="groups"
                label="Active Debtors"
                value={debtors.length.toString()}
                color="#3B82F6"
                delay={100}
              />
              <StatCard
                icon="bar-chart"
                label="Average Debt"
                value={formatCurrency(averageDebt)}
                color="#10B981"
                delay={200}
              />
            </View>
          </View>
        </View>

        {/* Search and Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Icon name="search" size={moderateScale(20)} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close" size={moderateScale(20)} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                "Sort By",
                "Choose sorting option",
                [
                  {
                    text: "Amount (High to Low)",
                    onPress: () => setSortBy("amount"),
                  },
                  { text: "Name (A-Z)", onPress: () => setSortBy("name") },
                  {
                    text: "Date (Newest)",
                    onPress: () => setSortBy("date"),
                  },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            }}
          >
            <Icon name="filter-list" size={moderateScale(20)} color="#3B82F6" />
            <Text style={styles.filterText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Debtors List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading debtors...</Text>
          </View>
        ) : filteredAndSortedDebtors.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#3B82F6"]}
                tintColor="#3B82F6"
              />
            }
          >
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name="receipt-long" size={moderateScale(60)} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No Results Found" : "No Active Debtors"}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Start by adding a new debtor using the + button above"}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={filteredAndSortedDebtors}
            renderItem={renderDebtorItem}
            keyExtractor={(item) => `debtor-${item.id}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#3B82F6"]}
                tintColor="#3B82F6"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Create Debtor Modal */}
        <Modal
          visible={showCreateDebtorForm}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowCreateDebtorForm(false);
            setSelectedAgentId("");
            setNewDebtorName("");
            setNewDebtorPhone("");
            setNewDebtorAmount("");
          }}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Add New Debtor</Text>
                    <Text style={styles.modalSubtitle}>
                      Fill in the details below
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowCreateDebtorForm(false);
                      setSelectedAgentId("");
                      setNewDebtorName("");
                      setNewDebtorPhone("");
                      setNewDebtorAmount("");
                    }}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={moderateScale(24)} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Agent Selection */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Service Provider</Text>
                      <Text style={styles.requiredStar}>*</Text>
                    </View>
                    {agents.length === 0 ? (
                      <View style={styles.noAgentsWarning}>
                        <Icon
                          name="info-outline"
                          size={moderateScale(20)}
                          color="#F59E0B"
                        />
                        <Text style={styles.noAgentsText}>
                          No agents available. Contact your administrator.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.agentsList}>
                        {agents.map((agent) => (
                          <TouchableOpacity
                            key={agent.id}
                            style={[
                              styles.agentCard,
                              selectedAgentId === agent.id.toString() &&
                                styles.agentCardSelected,
                            ]}
                            onPress={() =>
                              setSelectedAgentId(agent.id.toString())
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.agentCardContent}>
                              <View
                                style={[
                                  styles.agentIconCircle,
                                  selectedAgentId === agent.id.toString() && {
                                    backgroundColor: "#3B82F6",
                                  },
                                ]}
                              >
                                <Icon
                                  name="store"
                                  size={moderateScale(18)}
                                  color={
                                    selectedAgentId === agent.id.toString()
                                      ? "#FFFFFF"
                                      : "#64748B"
                                  }
                                />
                              </View>
                              <View style={styles.agentInfo}>
                                <Text
                                  style={[
                                    styles.agentCardName,
                                    selectedAgentId === agent.id.toString() &&
                                      styles.agentCardNameSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {agent.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.agentCardType,
                                    selectedAgentId === agent.id.toString() &&
                                      styles.agentCardTypeSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {agent.type_of_agent}
                                </Text>
                              </View>
                            </View>
                            {selectedAgentId === agent.id.toString() && (
                              <Icon
                                name="check-circle"
                                size={moderateScale(24)}
                                color="#3B82F6"
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Name Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Debtor Name</Text>
                      <Text style={styles.requiredStar}>*</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="person-outline"
                        size={moderateScale(20)}
                        color="#64748B"
                      />
                      <TextInput
                        style={styles.textInput}
                        value={newDebtorName}
                        onChangeText={setNewDebtorName}
                        placeholder="Enter full name"
                        placeholderTextColor="#94A3B8"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Phone Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="phone-iphone"
                        size={moderateScale(20)}
                        color="#64748B"
                      />
                      <TextInput
                        style={styles.textInput}
                        value={newDebtorPhone}
                        onChangeText={setNewDebtorPhone}
                        placeholder="Enter phone number (optional)"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Amount Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Initial Debt Amount</Text>
                      <Text style={styles.requiredStar}>*</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                      <View style={styles.currencyBadge}>
                        <Text style={styles.currencyText}>TSh</Text>
                      </View>
                      <TextInput
                        style={[styles.textInput, styles.amountInput]}
                        keyboardType="numeric"
                        value={newDebtorAmount}
                        onChangeText={(text) => {
                          const cleanText = text.replace(/[^0-9.]/g, "");
                          const parts = cleanText.split(".");
                          if (parts.length > 2) return;
                          if (parts[1] && parts[1].length > 2) return;
                          setNewDebtorAmount(cleanText);
                        }}
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                        returnKeyType="done"
                        onSubmitEditing={handleCreateDebtor}
                      />
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowCreateDebtorForm(false);
                      setSelectedAgentId("");
                      setNewDebtorName("");
                      setNewDebtorPhone("");
                      setNewDebtorAmount("");
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalSubmitButton,
                      (!newDebtorName.trim() ||
                        !newDebtorAmount ||
                        !selectedAgentId) &&
                        styles.modalSubmitButtonDisabled,
                    ]}
                    onPress={handleCreateDebtor}
                    disabled={
                      !newDebtorName.trim() ||
                      !newDebtorAmount ||
                      !selectedAgentId
                    }
                  >
                    <Icon name="check" size={moderateScale(18)} color="#FFFFFF" />
                    <Text style={styles.modalSubmitText}>Add Debtor</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E293B",
  },
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  
  // Header Styles
  headerGradient: {
    backgroundColor: "#1E293B",
    paddingBottom: moderateScale(24),
  },
  headerContent: {
    paddingTop: moderateScale(16),
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: moderateScale(28),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: moderateScale(4),
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: "#CBD5E1",
    opacity: 0.9,
  },
  addButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // Stats Grid
  statsGrid: {
    paddingHorizontal: moderateScale(20),
    gap: moderateScale(12),
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(16),
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "600",
    marginBottom: moderateScale(4),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: moderateScale(24),
    fontWeight: "800",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(4),
  },
  trendText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginLeft: moderateScale(4),
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: moderateScale(80),
    height: moderateScale(4),
    borderBottomLeftRadius: moderateScale(8),
  },

  // Search Section
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    gap: moderateScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#1E293B",
    marginLeft: moderateScale(12),
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  filterText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#3B82F6",
  },

  // List Content
  listContent: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: moderateScale(80),
  },
  loadingText: {
    fontSize: moderateScale(15),
    color: "#64748B",
    marginTop: moderateScale(16),
    fontWeight: "600",
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(40),
    paddingTop: moderateScale(80),
  },
  emptyIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(24),
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#475569",
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: moderateScale(14),
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: moderateScale(20),
  },

  // Debtor Card Styles
  debtorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  debtorCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  debtorCardExpanded: {
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowOpacity: 0.15,
  },
  debtorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: moderateScale(16),
  },
  debtorMainInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  debtorAvatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(16),
  },
  avatarText: {
    fontSize: moderateScale(22),
    fontWeight: "800",
  },
  debtorDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
    gap: moderateScale(8),
  },
  debtorName: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: moderateScale(6),
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: moderateScale(8),
  },
  debtLabel: {
    fontSize: moderateScale(11),
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  debtAmount: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#EF4444",
  },
  expandButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  expandButtonActive: {
    backgroundColor: "#EFF6FF",
  },

  // Expanded Content
  expandedContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  infoGrid: {
    flexDirection: "row",
    gap: moderateScale(12),
    marginTop: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
  },
  infoIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(10),
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: moderateScale(2),
  },
  infoValue: {
    fontSize: moderateScale(13),
    color: "#1E293B",
    fontWeight: "700",
  },

  // Payment Section
  paymentSection: {
    gap: moderateScale(12),
  },
  quickPayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3B82F6",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickPayContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  quickPayText: {
    gap: moderateScale(2),
  },
  quickPayLabel: {
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  quickPayAmount: {
    fontSize: moderateScale(18),
    color: "#FFFFFF",
    fontWeight: "800",
  },
  customPaymentContainer: {
    backgroundColor: "#F8FAFC",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  customPaymentLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: moderateScale(12),
    letterSpacing: 0.5,
  },
  customPaymentRow: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  customInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputCurrency: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#64748B",
    marginRight: moderateScale(8),
  },
  customInput: {
    flex: 1,
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(16),
    color: "#1E293B",
    fontWeight: "700",
  },
  customPayButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  customPayButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(4),
  },
  modalSubtitle: {
    fontSize: moderateScale(13),
    color: "#64748B",
  },
  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollContent: {
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(24),
  },
  inputGroup: {
    marginBottom: moderateScale(24),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#374151",
  },
  requiredStar: {
    fontSize: moderateScale(14),
    color: "#EF4444",
    marginLeft: moderateScale(4),
    fontWeight: "700",
  },
  noAgentsWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    gap: moderateScale(12),
  },
  noAgentsText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#92400E",
    lineHeight: moderateScale(18),
  },
  agentsList: {
    gap: moderateScale(12),
  },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  agentCardSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  agentCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  agentIconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  agentInfo: {
    flex: 1,
  },
  agentCardName: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(2),
  },
  agentCardNameSelected: {
    color: "#3B82F6",
  },
  agentCardType: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "600",
  },
  agentCardTypeSelected: {
    color: "#60A5FA",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  textInput: {
    flex: 1,
    paddingVertical: moderateScale(14),
    fontSize: moderateScale(15),
    color: "#1E293B",
    marginLeft: moderateScale(12),
  },
  currencyBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  currencyText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#475569",
  },
  amountInput: {
    fontWeight: "700",
    fontSize: moderateScale(17),
  },
  modalFooter: {
    flexDirection: "row",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(20),
    paddingBottom:
      Platform.OS === "ios" ? moderateScale(34) : moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  modalButton: {
    flex: 1,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalCancelText: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#64748B",
  },
  modalSubmitButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#CBD5E1",
    opacity: 0.6,
  },
  modalSubmitText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
});

export default DebtOverviewScreen;