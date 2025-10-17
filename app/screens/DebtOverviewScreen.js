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
      if (amount > 1000000) return { color: "#DC2626", label: "High", gradient: ["#DC2626", "#EF4444"] };
      if (amount > 500000) return { color: "#F59E0B", label: "Medium", gradient: ["#F59E0B", "#FBBF24"] };
      return { color: "#10B981", label: "Low", gradient: ["#10B981", "#34D399"] };
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
          <View style={styles.debtorInfo}>
            <View style={styles.nameRow}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {(item.debtor_name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.debtorName} numberOfLines={1}>
                  {item.debtor_name || "Unknown Debtor"}
                </Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: debtSeverity.color + "15" },
                  ]}
                >
                  <View
                    style={[
                      styles.severityDot,
                      { backgroundColor: debtSeverity.color },
                    ]}
                  />
                  <Text
                    style={[styles.severityText, { color: debtSeverity.color }]}
                  >
                    {debtSeverity.label}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.debtAmount}>{formatCurrency(item.balance_due || 0)}</Text>
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
              color={isExpanded ? "#3B82F6" : "#64748B"}
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
            <View style={styles.debtorDetails}>
              <View style={styles.detailCard}>
                <Icon name="phone" size={moderateScale(20)} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailText}>
                    {item.phone || "No phone number"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Icon name="calendar-today" size={moderateScale(20)} color="#10B981" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailText}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {item.balance_due > 0 && (
              <View style={styles.paymentSection}>
                <TouchableOpacity
                  style={styles.payFullButton}
                  onPress={() => onPayFull(item.id, item.balance_due)}
                  disabled={isProcessingPayment}
                  activeOpacity={0.7}
                >
                  <View style={styles.payFullButtonContent}>
                    <Icon name="payment" size={moderateScale(20)} color="#FFFFFF" />
                    <Text style={styles.payFullButtonText}>
                      Pay Full Amount
                    </Text>
                  </View>
                  <Text style={styles.payFullAmount}>
                    {formatCurrency(item.balance_due)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.partialPaymentContainer}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Partial Payment</Text>
                    <View style={styles.inputWithIcon}>
                      <Text style={styles.currencySymbol}>TSh</Text>
                      <TextInput
                        style={styles.paymentInput}
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
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      (isPaying ||
                        isProcessingPayment ||
                        !amount ||
                        parseFloat(amount) <= 0) &&
                        styles.payButtonDisabled,
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
                      <>
                        <Icon name="send" size={moderateScale(18)} color="#FFFFFF" />
                        <Text style={styles.payButtonText}>Pay</Text>
                      </>
                    )}
                  </TouchableOpacity>
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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

  // Fetch accessible agents from the API
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
      `${process.env.REACT_APP_API_URL || "https://tq-backend-main.fly.dev"}/employees/agents`,
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

    // Auto-select first agent if only one exists
    if (agentsList.length === 1) {
      setSelectedAgentId(agentsList[0].id.toString());
    }
  } catch (error) {
    console.error("Error fetching agents:", error);
    Alert.alert(
      "Error",
      error.message || "Failed to load agents. Please try again."
    );
    setAgents([]); // Set empty array on error
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Modern Header with Gradient */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Debt Management</Text>
              <Text style={styles.headerSubtitle}>
                Track and manage outstanding debts
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowCreateDebtorForm(true)}
            >
              <Icon name="add" size={moderateScale(24)} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Summary Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryContainer}
        >
          <View style={[styles.summaryCard, styles.totalDebtCard]}>
            <View style={styles.summaryIconContainer}>
              <Icon name="trending-down" size={moderateScale(28)} color="#EF4444" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Outstanding</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalDebt)}</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.debtorsCard]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: "#DBEAFE" }]}>
              <Icon name="people" size={moderateScale(28)} color="#3B82F6" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Active Debtors</Text>
              <Text style={[styles.summaryValue, { color: "#3B82F6" }]}>
                {debtors.length}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.avgCard]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: "#D1FAE5" }]}>
              <Icon name="analytics" size={moderateScale(28)} color="#10B981" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Average Debt</Text>
              <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                {debtors.length > 0
                  ? formatCurrency(totalDebt / debtors.length)
                  : "TSh 0"}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={moderateScale(20)} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search debtors..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="close" size={moderateScale(20)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const sortOptions = [
                { label: "Amount (High to Low)", value: "amount" },
                { label: "Name (A-Z)", value: "name" },
                { label: "Date (Newest)", value: "date" },
              ];
              Alert.alert(
                "Sort By",
                "Choose sorting option",
                sortOptions.map((option) => ({
                  text: option.label,
                  onPress: () => setSortBy(option.value),
                }))
              );
            }}
          >
            <Icon name="tune" size={moderateScale(20)} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* List or Empty State */}
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
            <View style={styles.emptyIllustration}>
              <Icon name="money-off" size={moderateScale(80)} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? "No matching debtors found" : "No active debtors"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try adjusting your search"
                : "Tap the + button to add a new debtor"}
            </Text>
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

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateDebtorForm(true)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={moderateScale(28)} color="#FFFFFF" />
        </TouchableOpacity>

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
                {/* Modal Header */}
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
                  contentContainerStyle={styles.scrollViewContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Agent Selection */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Agent/Service Provider</Text>
                      <Text style={styles.required}>*</Text>
                    </View>
                    {agents.length === 0 ? (
                      <View style={styles.noAgentsContainer}>
                        <Icon name="warning" size={moderateScale(24)} color="#F59E0B" />
                        <Text style={styles.noAgentsText}>
                          No agents available. Please contact your admin.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.agentsGrid}>
                        {agents.map((agent) => (
                          <TouchableOpacity
                            key={agent.id}
                            style={[
                              styles.agentOption,
                              selectedAgentId === agent.id.toString() &&
                                styles.agentOptionSelected,
                            ]}
                            onPress={() =>
                              setSelectedAgentId(agent.id.toString())
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.agentOptionHeader}>
                              <View
                                style={[
                                  styles.agentIcon,
                                  selectedAgentId === agent.id.toString() && {
                                    backgroundColor: "#3B82F6",
                                  },
                                ]}
                              >
                                <Icon
                                  name="business"
                                  size={moderateScale(20)}
                                  color={
                                    selectedAgentId === agent.id.toString()
                                      ? "#FFFFFF"
                                      : "#64748B"
                                  }
                                />
                              </View>
                              {selectedAgentId === agent.id.toString() && (
                                <View style={styles.checkmark}>
                                  <Icon
                                    name="check-circle"
                                    size={moderateScale(22)}
                                    color="#3B82F6"
                                  />
                                </View>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.agentName,
                                selectedAgentId === agent.id.toString() &&
                                  styles.agentNameSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {agent.name}
                            </Text>
                            <Text
                              style={[
                                styles.agentType,
                                selectedAgentId === agent.id.toString() &&
                                  styles.agentTypeSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {agent.type_of_agent}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Name Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Full Name</Text>
                      <Text style={styles.required}>*</Text>
                    </View>
                    <View style={styles.inputContainer}>
                      <Icon
                        name="person"
                        size={moderateScale(20)}
                        color="#64748B"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={newDebtorName}
                        onChangeText={setNewDebtorName}
                        placeholder="Enter debtor's full name"
                        placeholderTextColor="#94A3B8"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Phone Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                      <Icon
                        name="phone"
                        size={moderateScale(20)}
                        color="#64748B"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
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
                      <Text style={styles.label}>Debt Amount</Text>
                      <Text style={styles.required}>*</Text>
                    </View>
                    <View style={styles.inputContainer}>
                      <View style={styles.currencyContainer}>
                        <Text style={styles.currencyLabel}>TSh</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.amountInput]}
                        keyboardType="numeric"
                        value={newDebtorAmount}
                        onChangeText={(text) => {
                          const cleanText = text.replace(/[^0-9.]/g, "");
                          const parts = cleanText.split(".");
                          if (parts.length > 2) return;
                          if (parts[1] && parts[1].length > 2) return;
                          setNewDebtorAmount(cleanText);
                        }}
                        placeholder="0"
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
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowCreateDebtorForm(false);
                      setSelectedAgentId("");
                      setNewDebtorName("");
                      setNewDebtorPhone("");
                      setNewDebtorAmount("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.submitButton,
                      (!newDebtorName.trim() ||
                        !newDebtorAmount ||
                        !selectedAgentId) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleCreateDebtor}
                    disabled={
                      !newDebtorName.trim() ||
                      !newDebtorAmount ||
                      !selectedAgentId
                    }
                  >
                    <Icon name="check" size={moderateScale(18)} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Create Debtor</Text>
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(16),
  },
  headerTitle: {
    fontSize: moderateScale(26),
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: moderateScale(4),
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: "#64748B",
  },
  headerButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    gap: moderateScale(12),
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    flexDirection: "row",
    alignItems: "center",
    minWidth: isTablet ? width / 3 - moderateScale(40) : width - moderateScale(120),
    marginRight: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  totalDebtCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  debtorsCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  avgCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  summaryIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(16),
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "600",
    marginBottom: moderateScale(4),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#EF4444",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(16),
    alignItems: "center",
    gap: moderateScale(12),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#1E293B",
    marginLeft: moderateScale(12),
  },
  sortButton: {
    backgroundColor: "#FFFFFF",
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(100),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: moderateScale(60),
  },
  loadingText: {
    fontSize: moderateScale(15),
    color: "#64748B",
    marginTop: moderateScale(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: moderateScale(80),
    paddingHorizontal: moderateScale(40),
  },
  emptyIllustration: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(24),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#475569",
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: moderateScale(20),
  },
  debtorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  debtorCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  debtorCardExpanded: {
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowOpacity: 0.12,
  },
  debtorHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(16),
  },
  debtorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  avatarContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  avatarText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#3B82F6",
  },
  nameContainer: {
    flex: 1,
  },
  debtorName: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(4),
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  severityDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: moderateScale(6),
  },
  severityText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  debtAmount: {
    fontSize: moderateScale(22),
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
  expandedContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
  },
  debtorDetails: {
    marginBottom: moderateScale(16),
    gap: moderateScale(8),
  },
  detailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
  },
  detailContent: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  detailLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: moderateScale(2),
  },
  detailText: {
    fontSize: moderateScale(14),
    color: "#1E293B",
    fontWeight: "600",
  },
  paymentSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: moderateScale(16),
  },
  payFullButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  payFullButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  payFullButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
    marginLeft: moderateScale(8),
  },
  payFullAmount: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    fontWeight: "800",
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: moderateScale(16),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: moderateScale(11),
    color: "#94A3B8",
    marginHorizontal: moderateScale(16),
    fontWeight: "700",
    letterSpacing: 1,
  },
  partialPaymentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: moderateScale(12),
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#64748B",
    marginBottom: moderateScale(8),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
  },
  currencySymbol: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#64748B",
    marginRight: moderateScale(8),
  },
  paymentInput: {
    flex: 1,
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(16),
    color: "#1E293B",
    fontWeight: "700",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(8),
    justifyContent: "center",
    minWidth: moderateScale(80),
  },
  payButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
    marginLeft: moderateScale(6),
  },
  fab: {
    position: "absolute",
    bottom: moderateScale(24),
    right: moderateScale(24),
    backgroundColor: "#3B82F6",
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    paddingTop: moderateScale(24),
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(24),
    marginBottom: moderateScale(24),
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
  scrollViewContent: {
    paddingHorizontal: moderateScale(24),
    paddingBottom: moderateScale(24),
  },
  inputGroup: {
    marginBottom: moderateScale(24),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#374151",
  },
  required: {
    fontSize: moderateScale(14),
    color: "#EF4444",
    marginLeft: moderateScale(4),
    fontWeight: "700",
  },
  noAgentsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  noAgentsText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#92400E",
    marginLeft: moderateScale(12),
    lineHeight: moderateScale(18),
  },
  agentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(12),
  },
  agentOption: {
    width: isTablet ? "30%" : "48%",
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  agentOptionSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  agentOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  agentIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    position: "absolute",
    top: -moderateScale(4),
    right: -moderateScale(4),
  },
  agentName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: moderateScale(4),
  },
  agentNameSelected: {
    color: "#3B82F6",
  },
  agentType: {
    fontSize: moderateScale(12),
    color: "#64748B",
    fontWeight: "600",
  },
  agentTypeSelected: {
    color: "#60A5FA",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  inputIcon: {
    marginRight: moderateScale(12),
  },
  input: {
    flex: 1,
    paddingVertical: moderateScale(14),
    fontSize: moderateScale(15),
    color: "#1E293B",
  },
  currencyContainer: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  currencyLabel: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#475569",
  },
  amountInput: {
    fontWeight: "700",
    fontSize: moderateScale(18),
  },
  modalFooter: {
    flexDirection: "row",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(20),
    paddingBottom: Platform.OS === "ios" ? moderateScale(34) : moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  button: {
    flex: 1,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#64748B",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
});

export default DebtOverviewScreen;