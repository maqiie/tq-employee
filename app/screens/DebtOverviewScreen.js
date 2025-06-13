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

const DebtorItem = React.memo(
  ({ item, onPay, onPayFull, isProcessingPayment }) => {
    const [amount, setAmount] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [animatedValue] = useState(new Animated.Value(0));

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
      setIsExpanded(!isExpanded);
      Animated.timing(animatedValue, {
        toValue: isExpanded ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value);
    };

    const getDebtSeverity = (amount) => {
      if (amount > 1000) return { color: "#DC2626", label: "High" };
      if (amount > 500) return { color: "#F59E0B", label: "Medium" };
      return { color: "#10B981", label: "Low" };
    };

    const debtSeverity = getDebtSeverity(item.balance_due);

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
              <Text style={styles.debtorName} numberOfLines={1}>
                {item.debtor_name || "Unknown Debtor"}
              </Text>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: debtSeverity.color + "20" },
                ]}
              >
                <Text
                  style={[styles.severityText, { color: debtSeverity.color }]}
                >
                  {debtSeverity.label}
                </Text>
              </View>
            </View>
            <Text style={styles.debtAmount}>
              {formatCurrency(item.balance_due || 0)}
            </Text>
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
              size={24}
              color={isExpanded ? "#3B82F6" : "#64748B"}
            />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{
            maxHeight: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 300],
            }),
            opacity: animatedValue,
            overflow: "hidden",
          }}
        >
          <View style={styles.expandedContent}>
            <View style={styles.debtorDetails}>
              <View style={styles.detailRow}>
                <Icon name="phone" size={18} color="#64748B" />
                <Text style={styles.detailText}>
                  {item.phone || "No phone number"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="calendar-today" size={18} color="#64748B" />
                <Text style={styles.detailText}>
                  Created{" "}
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

            {item.balance_due > 0 && (
              <View style={styles.paymentSection}>
                <TouchableOpacity
                  style={styles.payFullButton}
                  onPress={() => onPayFull(item.id, item.balance_due)}
                  disabled={isProcessingPayment}
                  activeOpacity={0.7}
                >
                  <Icon name="payment" size={20} color="#FFFFFF" />
                  <Text style={styles.payFullButtonText}>
                    Pay Full {formatCurrency(item.balance_due)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.partialPaymentContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Partial Payment</Text>
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="0.00"
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
                        <Icon name="send" size={18} color="#FFFFFF" />
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
    console.log("Starting payment process...");
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
      console.log("Payment successful:", response.data);

      Alert.alert(
        "Success",
        `Payment of $${amount.toFixed(2)} recorded successfully`
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
      console.error(`Invalid debtor ID: ${debtorId}`);
      Alert.alert("Error", "Invalid debtor ID");
      return;
    }

    try {
      setIsProcessingPayment(true);
      await handlePayment(id, amount);
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

  const handleCreateDebtor = async () => {
    if (!newDebtorName.trim()) {
      Alert.alert("Error", "Please enter a name for the debtor");
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
          agent_id: 1,
        },
      };

      await createDebtor(debtorData, headers);
      Alert.alert("Success", "Debtor created successfully");
      setShowCreateDebtorForm(false);
      setNewDebtorName("");
      setNewDebtorPhone("");
      setNewDebtorAmount("");
      fetchDebtors();
    } catch (error) {
      console.error("Error creating debtor:", error);
      Alert.alert(
        "Error",
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  useEffect(() => {
    fetchDebtors();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Debt Overview</Text>
          <Text style={styles.headerSubtitle}>Manage outstanding debts</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Icon name="trending-down" size={24} color="#EF4444" />
            <Text style={styles.summaryTitle}>Total Outstanding</Text>
          </View>
          <Text style={styles.totalDebt}>{formatCurrency(totalDebt)}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{debtors.length}</Text>
              <Text style={styles.statLabel}>Debtors</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {debtors.length > 0
                  ? formatCurrency(totalDebt / debtors.length)
                  : "$0.00"}
              </Text>
              <Text style={styles.statLabel}>Avg. Debt</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search debtors..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
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
            <Icon name="sort" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

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
            <Icon name="money-off" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No matching debtors found" : "No active debtors"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try adjusting your search"
                : "All debts have been cleared"}
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

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateDebtorForm(true)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Modal
          visible={showCreateDebtorForm}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateDebtorForm(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
              style={styles.keyboardAvoidingView}
            >
              <View
                style={[
                  styles.modalContent,
                  Platform.OS === "android" &&
                    keyboardHeight > 0 && {
                      maxHeight: height - keyboardHeight - 50,
                      marginTop: 50,
                    },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Debtor</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowCreateDebtorForm(false);
                    }}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollViewContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name*</Text>
                    <TextInput
                      style={styles.input}
                      value={newDebtorName}
                      onChangeText={setNewDebtorName}
                      placeholder="Enter debtor's full name"
                      placeholderTextColor="#94A3B8"
                      autoFocus
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
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

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Debt Amount*</Text>
                    <TextInput
                      style={styles.input}
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
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowCreateDebtorForm(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.submitButton,
                      (!newDebtorName.trim() || !newDebtorAmount) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleCreateDebtor}
                    disabled={!newDebtorName.trim() || !newDebtorAmount}
                  >
                    <Icon name="person-add" size={18} color="#FFFFFF" />
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
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748B",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    marginLeft: 8,
  },
  totalDebt: {
    fontSize: 36,
    fontWeight: "800",
    color: "#EF4444",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    marginLeft: 12,
  },
  sortButton: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#475569",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
  debtorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  debtorCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  debtorCardExpanded: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  debtorHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  debtorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  debtorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  debtAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#EF4444",
  },
  expandButton: {
    padding: 8,
    borderRadius: 20,
  },
  expandButtonActive: {
    backgroundColor: "#EFF6FF",
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  debtorDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: "#64748B",
    marginLeft: 12,
  },
  paymentSection: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 20,
  },
  payFullButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 16,
  },
  payFullButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94A3B8",
    marginHorizontal: 16,
    fontWeight: "500",
  },
  partialPaymentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  paymentInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    minWidth: 80,
  },
  payButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3B82F6",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DebtOverviewScreen;
