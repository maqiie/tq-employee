import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createTransaction, getAgents, getLatestTransaction } from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const DailyBalanceScreen = ({ navigation, route }) => {
  const { employeeId } = route.params || {};
  
  // Existing state
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPrevious, setFetchingPrevious] = useState(false);
  const [date, setDate] = useState(new Date());
  const [transactionCreated, setTransactionCreated] = useState(false);
  
  // New agent selection state
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [fetchingAgents, setFetchingAgents] = useState(true);

  useEffect(() => {
    if (!employeeId) {
      Alert.alert(
        "Error",
        "Employee ID is missing. Cannot proceed without an employee identifier.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  }, [employeeId, navigation]);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (!employeeId) return;
    
    const fetchAgentsList = async () => {
      try {
        setFetchingAgents(true);
        
        // Get authentication data from AsyncStorage
        const userToken = await AsyncStorage.getItem('userToken');
        const client = await AsyncStorage.getItem('client');
        const uid = await AsyncStorage.getItem('uid');
        
        if (!userToken || !client || !uid) {
          throw new Error('Missing authentication data. Please login again.');
        }
        
        const headers = {
          'access-token': userToken,
          'client': client,
          'uid': uid,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };
        
        const response = await getAgents(headers);
        console.log('Agents response:', response);
        
        // Handle different response structures
        const agentsData = response?.data || response || [];
        setAgents(Array.isArray(agentsData) ? agentsData : []);
      } catch (error) {
        console.error("Error fetching agents:", error);
        Alert.alert("Error", "Failed to fetch agents list. Please check your internet connection and try again.");
        setAgents([]);
      } finally {
        setFetchingAgents(false);
      }
    };
    
    fetchAgentsList();
  }, [employeeId]);

  // Updated function to fetch agent-specific transactions
  const fetchAgentTransactions = async (agentId) => {
    try {
      setFetchingPrevious(true);
      
      // Get authentication data from AsyncStorage
      const userToken = await AsyncStorage.getItem('userToken');
      const client = await AsyncStorage.getItem('client');
      const uid = await AsyncStorage.getItem('uid');
      
      if (!userToken || !client || !uid) {
        throw new Error('Missing authentication data. Please login again.');
      }
      
      const headers = {
        'access-token': userToken,
        'client': client,
        'uid': uid,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      console.log(`Fetching transactions for agent ${agentId}`);
      
      // Try to get agent-specific transactions using the correct API endpoint
      try {
        // First, try the agent-specific endpoint
        const response = await fetch(`https://tq-backend-main.fly.dev /employees/agents/${agentId}/transactions`, {
          method: 'GET',
          headers: headers,
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Agent transactions response:', data);
          
          // Handle different response structures
          const transactions = data?.data || data?.transactions || data || [];
          
          if (Array.isArray(transactions) && transactions.length > 0) {
            // Sort transactions by date to get the most recent one
            const sortedTransactions = transactions.sort((a, b) => {
              const dateA = new Date(a.created_at || a.date || a.transaction_date || a.createdAt);
              const dateB = new Date(b.created_at || b.date || b.transaction_date || b.createdAt);
              return dateB - dateA; // Most recent first
            });
            
            const lastTransaction = sortedTransactions[0];
            console.log('Latest transaction for agent:', lastTransaction);
            
            // Extract closing balance from the last transaction
            const closingBalance = lastTransaction.closing_balance || 
                                  lastTransaction.closingBalance || 
                                  lastTransaction.close_balance ||
                                  lastTransaction.balance_close;
            
            if (closingBalance !== undefined && closingBalance !== null) {
              const balance = parseFloat(closingBalance);
              
              if (!isNaN(balance)) {
                setOpeningBalance(balance.toFixed(2));
                console.log(`Opening balance set to: ${balance.toFixed(2)} from agent ${agentId}'s last transaction`);
                return;
              }
            }
          }
          
          console.log('No previous transactions found for this agent, using default');
          setOpeningBalance('0.00');
          return;
        }
        
        // If agent-specific endpoint fails, try getting all transactions and filtering
        console.log('Agent-specific endpoint failed, trying general transactions endpoint');
        const allTransactionsResponse = await fetch(`https://tq-backend-main.fly.dev /employees/${employeeId}/transactions`, {
          method: 'GET',
          headers: headers,
        });
        
        if (allTransactionsResponse.ok) {
          const allData = await allTransactionsResponse.json();
          console.log('All transactions response:', allData);
          
          const allTransactions = allData?.data || allData?.transactions || allData || [];
          
          if (Array.isArray(allTransactions) && allTransactions.length > 0) {
            // Filter transactions for the selected agent
            const agentTransactions = allTransactions.filter(transaction => {
              return transaction.agent_id === agentId || 
                     transaction.agentId === agentId ||
                     transaction.agent?.id === agentId;
            });
            
            console.log(`Found ${agentTransactions.length} transactions for agent ${agentId} from all transactions`);
            
            if (agentTransactions.length > 0) {
              // Sort and get the most recent
              const sortedTransactions = agentTransactions.sort((a, b) => {
                const dateA = new Date(a.created_at || a.date || a.transaction_date || a.createdAt);
                const dateB = new Date(b.created_at || b.date || b.transaction_date || b.createdAt);
                return dateB - dateA;
              });
              
              const lastTransaction = sortedTransactions[0];
              const closingBalance = lastTransaction.closing_balance || 
                                    lastTransaction.closingBalance || 
                                    lastTransaction.close_balance ||
                                    lastTransaction.balance_close;
              
              if (closingBalance !== undefined && closingBalance !== null) {
                const balance = parseFloat(closingBalance);
                if (!isNaN(balance)) {
                  setOpeningBalance(balance.toFixed(2));
                  console.log(`Opening balance set to: ${balance.toFixed(2)} from filtered transactions`);
                  return;
                }
              }
            }
          }
        }
        
        // If all attempts fail, use default
        console.log('All transaction fetching attempts failed, using default');
        setOpeningBalance('0.00');
        
      } catch (fetchError) {
        console.error('Error fetching transactions:', fetchError);
        setOpeningBalance('0.00');
      }
      
    } catch (error) {
      console.error("Error in fetchAgentTransactions:", error);
      
      // More specific error handling
      if (error.message.includes('authentication') || error.message.includes('login')) {
        Alert.alert(
          'Authentication Error', 
          'Please login again to continue',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (error.message.includes('network') || error.message.includes('internet')) {
        Alert.alert(
          'Network Error', 
          'Please check your internet connection and try again'
        );
      } else {
        console.log('Using default opening balance due to error');
      }
      
      // Always set a default value
      setOpeningBalance('0.00');
    } finally {
      setFetchingPrevious(false);
    }
  };

  // Enhanced agent selection handler
  const handleAgentSelect = async (agent) => {
    console.log(`Agent selected: ${agent.name} (ID: ${agent.id})`);
    setSelectedAgent(agent);
    setAgentModalVisible(false);
    
    // Clear previous opening balance while fetching
    setOpeningBalance('');
    
    // Fetch transactions for this specific agent
    await fetchAgentTransactions(agent.id);
  };

  const validateAmounts = () => {
    const opening = parseFloat(openingBalance);
    const closing = parseFloat(closingBalance);
    
    if (isNaN(opening)) {
      Alert.alert("Error", "Please enter a valid opening balance");
      return false;
    }
    if (isNaN(closing)) {
      Alert.alert("Error", "Please enter a valid closing balance");
      return false;
    }
    if (!selectedAgent) {
      Alert.alert("Error", "Please select an agent");
      return false;
    }
    return true;
  };

  // Additional helper function to validate the opening balance before submission
  const validateOpeningBalance = () => {
    const opening = parseFloat(openingBalance);
    
    if (isNaN(opening)) {
      Alert.alert("Error", "Invalid opening balance. Please select an agent to load the correct opening balance.");
      return false;
    }
    
    return true;
  };

  // Enhanced validation in handleSubmit
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!employeeId) {
      Alert.alert("Error", "Missing employee ID");
      return;
    }
    
    if (!validateAmounts()) {
      return;
    }
    
    // Additional validation for opening balance
    if (!validateOpeningBalance()) {
      return;
    }
    
    // Show confirmation dialog with transaction details
    const opening = parseFloat(openingBalance);
    const closing = parseFloat(closingBalance);
    const difference = (closing - opening).toFixed(2);
    
    // Check for negative opening balance and show warning
    if (opening < 0) {
      Alert.alert(
        "Warning", 
        `Opening balance is negative ($${opening.toFixed(2)}). Is this correct?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => showConfirmationDialog(opening, closing, difference) }
        ]
      );
      return;
    }
    
    showConfirmationDialog(opening, closing, difference);
  };

  const showConfirmationDialog = (opening, closing, difference) => {
    Alert.alert(
      "Confirm Transaction",
      `Agent: ${selectedAgent.name}\nOpening: $${opening.toFixed(2)}\nClosing: $${closing.toFixed(2)}\nDifference: ${parseFloat(difference) >= 0 ? '+' : ''}$${difference}\n\nProceed with saving?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save", onPress: () => performSubmit() }
      ]
    );
  };

  // Separate the actual submission logic
  const performSubmit = async () => {
    try {
      setLoading(true);
      
      const balanceData = {
        opening_balance: parseFloat(openingBalance),
        closing_balance: parseFloat(closingBalance),
        notes: notes.trim(),
        date: date.toISOString(),
        agent_id: selectedAgent.id,
      };
      
      // Get authentication headers for the transaction
      const userToken = await AsyncStorage.getItem('userToken');
      const client = await AsyncStorage.getItem('client');
      const uid = await AsyncStorage.getItem('uid');
      
      if (!userToken || !client || !uid) {
        throw new Error('Authentication required. Please login again.');
      }
      
      const headers = {
        'access-token': userToken,
        'client': client,
        'uid': uid,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      console.log('Creating transaction with data:', balanceData);
      await createTransaction(employeeId, balanceData, headers);
      
      setTransactionCreated(true);
      Alert.alert(
        "Success", 
        `Balance record saved successfully!\nClosing balance of $${parseFloat(closingBalance).toFixed(2)} will be tomorrow's opening balance.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error("Error saving balance record:", error);
      Alert.alert("Error", error.message || "Failed to save balance record");
    } finally {
      setLoading(false);
    }
  };

  const calculateDifference = () => {
    const opening = parseFloat(openingBalance) || 0;
    const closing = parseFloat(closingBalance) || 0;
    return (closing - opening).toFixed(2);
  };

  const difference = calculateDifference();
  const isDifferencePositive = parseFloat(difference) > 0;
  const isDifferenceNegative = parseFloat(difference) < 0;

  const renderAgentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.agentItem}
      onPress={() => handleAgentSelect(item)}
    >
      <View style={styles.agentItemContent}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>
            {item.name?.charAt(0)?.toUpperCase() || 'A'}
          </Text>
        </View>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{item.name || 'Unknown Agent'}</Text>
          <Text style={styles.agentEmail}>{item.email || 'No email provided'}</Text>
        </View>
        {selectedAgent?.id === item.id && (
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Daily Balance</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Date Display */}
          <View style={styles.dateContainer}>
            <View style={styles.dateIconWrapper}>
              <MaterialCommunityIcons name="calendar" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {/* Agent Selection */}
          <View style={styles.agentSection}>
            <Text style={styles.sectionLabel}>Select Agent *</Text>
            {fetchingAgents ? (
              <View style={styles.agentLoadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading agents...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.agentSelector}
                onPress={() => setAgentModalVisible(true)}
              >
                <View style={styles.agentSelectorContent}>
                  {selectedAgent ? (
                    <View style={styles.selectedAgentDisplay}>
                      <View style={styles.selectedAgentAvatar}>
                        <Text style={styles.selectedAgentAvatarText}>
                          {selectedAgent.name?.charAt(0)?.toUpperCase() || 'A'}
                        </Text>
                      </View>
                      <View style={styles.selectedAgentInfo}>
                        <Text style={styles.selectedAgentName}>
                          {selectedAgent.name || 'Unknown Agent'}
                        </Text>
                        <Text style={styles.selectedAgentEmail}>
                          {selectedAgent.email || 'No email provided'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.agentPlaceholder}>
                      Choose an agent
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Balance Form */}
          <View style={styles.card}>
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Opening Balance</Text>
                {fetchingPrevious ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.loadingText}>
                      Fetching previous balance...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={openingBalance}
                      onChangeText={setOpeningBalance}
                      editable={!fetchingPrevious}
                    />
                  </View>
                )}
                <Text style={styles.inputHelper}>
                  Previous day's closing balance for {selectedAgent?.name || 'selected agent'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Closing Balance *</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={closingBalance}
                    onChangeText={setClosingBalance}
                  />
                </View>
              </View>

              {/* Difference Calculation */}
              {openingBalance && closingBalance ? (
                <View style={[
                  styles.differenceContainer,
                  isDifferencePositive && styles.positiveDifferenceContainer,
                  isDifferenceNegative && styles.negativeDifferenceContainer,
                ]}>
                  <View style={styles.differenceContent}>
                    <MaterialCommunityIcons
                      name={isDifferencePositive ? "trending-up" : isDifferenceNegative ? "trending-down" : "minus"}
                      size={20}
                      color={isDifferencePositive ? "#10B981" : isDifferenceNegative ? "#EF4444" : "#6B7280"}
                    />
                    <Text style={styles.differenceLabel}>Difference</Text>
                  </View>
                  <Text style={[
                    styles.differenceAmount,
                    isDifferencePositive && styles.positiveAmount,
                    isDifferenceNegative && styles.negativeAmount,
                  ]}>
                    {isDifferencePositive ? "+" : ""}${Math.abs(parseFloat(difference)).toFixed(2)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={styles.multilineInput}
                  placeholder="Add any additional information or observations..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || fetchingPrevious || transactionCreated || fetchingAgents || !selectedAgent) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading || fetchingPrevious || transactionCreated || fetchingAgents || !selectedAgent}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons
                  name="content-save"
                  size={20}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
                <Text style={styles.submitButtonText}>Save Balance Record</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Success Message */}
          {transactionCreated && (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
              <Text style={styles.successText}>Transaction created successfully!</Text>
            </View>
          )}

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <MaterialCommunityIcons name="information" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Today's closing balance will automatically become tomorrow's opening balance.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Agent Selection Modal */}
      <Modal
        visible={agentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAgentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Agent</Text>
              <TouchableOpacity
                onPress={() => setAgentModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {agents.length === 0 ? (
              <View style={styles.emptyAgentContainer}>
                <MaterialCommunityIcons
                  name="account-off"
                  size={48}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyAgentText}>No agents available</Text>
                <Text style={styles.emptyAgentSubtext}>
                  Please add agents first before creating transactions.
                </Text>
              </View>
            ) : (
              <FlatList
                data={agents}
                renderItem={renderAgentItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                style={styles.agentList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.agentListContent}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  // Agent Selection Styles
  agentSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  agentLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#EBF8FF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  agentSelector: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  agentSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  selectedAgentDisplay: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedAgentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedAgentAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedAgentInfo: {
    flex: 1,
  },
  selectedAgentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  selectedAgentEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  agentPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
    flex: 1,
  },
  // Modal Styles
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
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  agentList: {
    paddingHorizontal: 20,
  },
  agentListContent: {
    paddingBottom: 20,
  },
  agentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  agentItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  agentAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  agentEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyAgentContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyAgentText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 12,
  },
  emptyAgentSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  // Form Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    minHeight: 56,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#6B7280",
    marginRight: 8,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  inputHelper: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  multilineInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#111827",
    fontWeight: "400",
    minHeight: 100,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#EBF8FF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "500",
  },
  differenceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  positiveDifferenceContainer: {
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
  },
  negativeDifferenceContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  differenceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  differenceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  differenceAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: -0.3,
  },
  positiveAmount: {
    color: "#10B981",
  },
  negativeAmount: {
    color: "#EF4444",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginBottom: 20,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    marginBottom: 20,
  },
  successText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
    lineHeight: 20,
    flex: 1,
    fontStyle: "italic",
  },
});

export default DailyBalanceScreen;