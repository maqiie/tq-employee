import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  Image,
  TextInput,
  Alert,
  Animated,
  Easing,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { getTransactions } from "../services/api";
import { getUserData } from "../services/auth";

const { width, height } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = width > 768;
const isLargeScreen = width > 1024;

// Responsive dimensions
const getResponsiveDimensions = () => {
  const screenWidth = width;
  const padding = isTablet ? 24 : 16;
  const cardMargin = isTablet ? 16 : 12;
  const headerFontSize = isTablet ? 28 : 24;
  const cardFontSize = isTablet ? 18 : 16;
  
  return {
    screenWidth,
    padding,
    cardMargin,
    headerFontSize,
    cardFontSize,
    summaryCardWidth: isLargeScreen ? "30%" : isTablet ? "45%" : "48%",
    totalBoxWidth: isLargeScreen ? "30%" : isTablet ? "45%" : "48%",
  };
};

const TransactionCard = ({ transaction }) => {
  const dimensions = getResponsiveDimensions();
  const openingBalance = Number(transaction.opening_balance);
  const closingBalance = Number(transaction.closing_balance);
  const isCredit = closingBalance >= openingBalance;
  const amount = Math.abs(closingBalance - openingBalance);
  const amountColor = isCredit ? "#10B981" : "#EF4444";
  const iconName = isCredit ? "arrow-down" : "arrow-up";
  const iconColor = amountColor;
  const [opacity] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const formatBalance = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  return (
    <Animated.View style={[styles.card, { opacity, marginHorizontal: dimensions.padding }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <FontAwesome name={iconName} size={isTablet ? 20 : 16} color={iconColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text
            style={[styles.transactionTitle, { fontSize: dimensions.cardFontSize }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {transaction.notes || transaction.description || "Transaction"}
          </Text>
          <Text style={styles.transactionDate}>
            {moment(transaction.date).format("MMM D, YYYY - h:mm A")}
          </Text>
        </View>
        <Text style={[styles.amount, { color: amountColor, fontSize: dimensions.cardFontSize }]}>
          {isCredit ? "+" : "-"}${amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Opening:</Text>
          <Text style={styles.balanceValue}>${formatBalance(openingBalance)}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Closing:</Text>
          <Text style={styles.balanceValue}>${formatBalance(closingBalance)}</Text>
        </View>
        {transaction.agent_name && (
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Agent:</Text>
            <Text style={styles.balanceValue}>{transaction.agent_name}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const AgentSelector = ({ visible, onClose, onSelectAgent, agents, loading }) => {
  const dimensions = getResponsiveDimensions();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: dimensions.screenWidth * 0.9, maxWidth: 500 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: dimensions.headerFontSize - 4 }]}>Select Agent</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading agents...</Text>
            </View>
          ) : (
            <ScrollView style={styles.agentsList}>
              {agents.map((agent) => (
                <TouchableOpacity
                  key={agent.id}
                  style={styles.agentItem}
                  onPress={() => onSelectAgent(agent)}
                  activeOpacity={0.7}
                >
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentDetails}>ID: {agent.id}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const TransactionsScreen = ({ navigation }) => {
  const dimensions = getResponsiveDimensions();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [screenData, setScreenData] = useState({
    width: width,
    height: height,
  });

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  const fetchAgents = async () => {
    try {
      setAgentsLoading(true);
      const userData = await getUserData();
      if (!userData) throw new Error("User auth data not available");

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
      };

      // Mock agents data - replace with actual API call
      const mockAgents = [
        { id: 1, name: "Agent Smith", department: "Sales" },
        { id: 2, name: "Agent Johnson", department: "Support" },
        { id: 3, name: "Agent Brown", department: "Marketing" },
        { id: 4, name: "Agent Davis", department: "Operations" },
      ];

      setAgents(mockAgents);
    } catch (err) {
      console.error("Fetch agents error:", err);
      Alert.alert("Error", "Failed to load agents");
    } finally {
      setAgentsLoading(false);
    }
  };

  const fetchTransactions = async (agentId = null) => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      const userData = await getUserData();
      if (!userData) throw new Error("User auth data not available");

      const fetchedEmployeeId = userData.user?.id;
      if (!fetchedEmployeeId) throw new Error("Employee ID not found");

      setEmployeeId(fetchedEmployeeId);

      const headers = {
        "access-token": userData.userToken,
        client: userData.client,
        uid: userData.uid,
      };

      // Use agentId if provided, otherwise use employeeId
      const targetId = agentId || fetchedEmployeeId;
      const fetchedTransactions = await getTransactions(targetId, headers);
      
      console.log("Transactions received:", fetchedTransactions);
      
      // Add agent information to transactions if fetching for specific agent
      let processedTransactions = fetchedTransactions || [];
      if (agentId && selectedAgent) {
        processedTransactions = processedTransactions.map(txn => ({
          ...txn,
          agent_name: selectedAgent.name,
          agent_id: agentId,
        }));
      }

      setTransactions(processedTransactions);
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Error", err.message || "Failed to load transactions");
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("[DEBUG] Component mounted");
    fetchTransactions();
    fetchAgents();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions(selectedAgent?.id);
  }, [selectedAgent]);

  const handleSelectAgent = useCallback((agent) => {
    setSelectedAgent(agent);
    setShowAgentSelector(false);
    setTransactions([]); // Clear current transactions
    fetchTransactions(agent.id);
  }, []);

  const handleClearAgentSelection = useCallback(() => {
    setSelectedAgent(null);
    setTransactions([]);
    fetchTransactions(); // Fetch user's own transactions
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!searchText.trim()) return transactions;
    return transactions.filter((txn) => {
      const searchLower = searchText.toLowerCase();
      return (
        txn.description?.toLowerCase().includes(searchLower) ||
        txn.notes?.toLowerCase().includes(searchLower) ||
        txn.agent_name?.toLowerCase().includes(searchLower)
      );
    });
  }, [searchText, transactions]);

  // Calculate totals based on opening vs closing balance
  const { totalCredit, totalDebit } = useMemo(() => {
    return filteredTransactions.reduce((acc, txn) => {
      const opening = Number(txn.opening_balance) || 0;
      const closing = Number(txn.closing_balance) || 0;
      const difference = closing - opening;
      
      if (difference > 0) {
        acc.totalCredit += difference;
      } else if (difference < 0) {
        acc.totalDebit += Math.abs(difference);
      }
      
      return acc;
    }, { totalCredit: 0, totalDebit: 0 });
  }, [filteredTransactions]);

  const netBalance = useMemo(
    () => totalCredit - totalDebit,
    [totalCredit, totalDebit]
  );

  const onFilterPress = () => {
    Alert.alert("Filter", "Filter by date range, type, or amount coming soon!");
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your transactions...</Text>
      </SafeAreaView>
    );
  }

  if (error && !transactions.length) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchTransactions(selectedAgent?.id)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: dimensions.padding }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { fontSize: dimensions.headerFontSize }]}>
            Transaction History
          </Text>
          {selectedAgent && (
            <View style={styles.agentBadge}>
              <Text style={styles.agentBadgeText}>{selectedAgent.name}</Text>
              <TouchableOpacity onPress={handleClearAgentSelection}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowAgentSelector(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={onFilterPress}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              navigation.navigate("CreateTransaction", { 
                employeeId: selectedAgent?.id || employeeId,
                agentName: selectedAgent?.name 
              })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.searchContainer,
          searchFocused && styles.searchContainerFocused,
          { marginHorizontal: dimensions.padding }
        ]}
      >
        <MaterialIcons
          name="search"
          size={20}
          color={searchFocused ? "#3B82F6" : "#64748B"}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search transactions..."
          placeholderTextColor="#94A3B8"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          clearButtonMode="while-editing"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText("")}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require("../assets/no-transactions.png")}
            style={[styles.emptyImage, { 
              width: Math.min(180, screenData.width * 0.4),
              height: Math.min(180, screenData.width * 0.4)
            }]}
          />
          <Text style={styles.emptyTitle}>No Transactions Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchText.trim()
              ? "No matches for your search. Try different keywords."
              : selectedAgent 
                ? `No transactions found for ${selectedAgent.name}.`
                : "You don't have any transactions yet."}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color="#3B82F6" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.summaryContainer, { paddingHorizontal: dimensions.padding }]}>
            {isLargeScreen ? (
              <>
                <View style={[styles.summaryCard, { width: dimensions.summaryCardWidth }]}>
                  <Text style={styles.summaryTitle}>Total Transactions</Text>
                  <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
                </View>
                <View style={[styles.summaryCard, { width: dimensions.summaryCardWidth }]}>
                  <Text style={styles.summaryTitle}>Total Credit</Text>
                  <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                    +${totalCredit.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryCard, { width: dimensions.summaryCardWidth }]}>
                  <Text style={styles.summaryTitle}>Net Balance</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: netBalance >= 0 ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(2)}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.summaryCard, { width: dimensions.summaryCardWidth }]}>
                  <Text style={styles.summaryTitle}>Total Transactions</Text>
                  <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
                </View>
                <View style={[styles.summaryCard, { width: dimensions.summaryCardWidth }]}>
                  <Text style={styles.summaryTitle}>Net Balance</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: netBalance >= 0 ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={[styles.totalsRow, { paddingHorizontal: dimensions.padding }]}>
            <View style={[styles.totalBox, styles.creditBox, { width: dimensions.totalBoxWidth }]}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.totalLabel}>Total Credit</Text>
              <Text style={[styles.totalValue, { color: "#10B981" }]}>
                +${totalCredit.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.totalBox, styles.debitBox, { width: dimensions.totalBoxWidth }]}>
              <Ionicons name="trending-down" size={20} color="#EF4444" />
              <Text style={styles.totalLabel}>Total Debit</Text>
              <Text style={[styles.totalValue, { color: "#EF4444" }]}>
                -${totalDebit.toFixed(2)}
              </Text>
            </View>
          </View>

          <FlatList
            data={filteredTransactions}
            renderItem={({ item }) => <TransactionCard transaction={item} />}
            keyExtractor={(item, index) =>
              item.id?.toString() || index.toString()
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#3B82F6"]}
                tintColor="#3B82F6"
                progressBackgroundColor="#FFFFFF"
              />
            }
            ListFooterComponent={<View style={{ height: 30 }} />}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      <AgentSelector
        visible={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        onSelectAgent={handleSelectAgent}
        agents={agents}
        loading={agentsLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    padding: 8,
    marginLeft: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
  },
  headerTitle: {
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  agentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  agentBadgeText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
    marginRight: 6,
  },
  loadingText: {
    marginTop: 16,
    color: "#64748B",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchContainerFocused: {
    borderColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#64748B",
  },
  amount: {
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    flexWrap: "wrap",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: "30%",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#64748B",
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  totalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  creditBox: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  debitBox: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  totalLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyImage: {
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  refreshButtonText: {
    color: "#3B82F6",
    fontWeight: "600",
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    maxHeight: height * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontWeight: "700",
    color: "#1E293B",
  },
  closeButton: {
    padding: 4,
  },
  modalLoading: {
    padding: 40,
    alignItems: "center",
  },
  agentsList: {
    maxHeight: height * 0.5,
  },
  agentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  agentDetails: {
    fontSize: 14,
    color: "#64748B",
  },
});

export default TransactionsScreen;