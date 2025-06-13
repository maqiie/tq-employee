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
} from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { getTransactions } from "../services/api";
import { getUserData } from "../services/auth";

const { width } = Dimensions.get("window");

const TransactionCard = ({ transaction }) => {
  // Your data doesn't have `type` or `amount`, so we'll improvise:
  // Let's consider a transaction "credit" if closing_balance > opening_balance,
  // and "debit" if the opposite.
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
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <FontAwesome name={iconName} size={16} color={iconColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text
            style={styles.transactionTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {/* Use notes instead of description */}
            {transaction.notes || "Transaction"}
          </Text>
          <Text style={styles.transactionDate}>
            {moment(transaction.date).format("MMM D, YYYY - h:mm A")}
          </Text>
        </View>
        <Text style={[styles.amount, { color: amountColor }]}>
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
      </View>
    </Animated.View>
  );
};


const TransactionsScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchTransactions = async () => {
    try {
      setError(null);
      setLoading(true);

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

      const fetchedTransactions = await getTransactions(
        fetchedEmployeeId,
        headers
      );
      console.log("Transactions received:", fetchedTransactions);

      setTransactions(fetchedTransactions || []);
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
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!searchText.trim()) return transactions;
    return transactions.filter((txn) =>
      txn.description?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, transactions]);

  const totalCredit = useMemo(
    () =>
      filteredTransactions.reduce(
        (sum, txn) => (txn.type === "credit" ? sum + (txn.amount ?? 0) : sum),
        0
      ),
    [filteredTransactions]
  );

  const totalDebit = useMemo(
    () =>
      filteredTransactions.reduce(
        (sum, txn) => (txn.type === "debit" ? sum + (txn.amount ?? 0) : sum),
        0
      ),
    [filteredTransactions]
  );

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

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchTransactions}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerButtons}>
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
              navigation.navigate("CreateTransaction", { employeeId })
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
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>No Transactions Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchText.trim()
              ? "No matches for your search. Try different keywords."
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
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Transactions</Text>
              <Text style={styles.summaryValue}>
                {filteredTransactions.length}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate("CreateTransaction", { employeeId })
              }
            >
              <Ionicons name="add" size={24} color="#3B82F6" />
            </TouchableOpacity>

            <View style={styles.summaryCard}>
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
          </View>

          <View style={styles.totalsRow}>
            <View style={[styles.totalBox, styles.creditBox]}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text style={styles.totalLabel}>Total Credit</Text>
              <Text style={[styles.totalValue, { color: "#10B981" }]}>
                +${totalCredit.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.totalBox, styles.debitBox]}>
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
  headerButtons: {
    flexDirection: "row",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
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
    marginHorizontal: 16,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#64748B",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  totalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    width: 180,
    height: 180,
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
});

export default TransactionsScreen;
