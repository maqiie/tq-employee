import React, { Component } from 'react';
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
  Modal,
  StatusBar,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getUserData } from '../services/auth';
import { getAgents, createAgent, createAgentTransaction } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');
const API_BASE_URL = 'https://tq-backend-main.fly.dev';

class AgentsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      agents: [],
      loading: true,
      refreshing: false,
      selectedAgent: null,
      transactionAmount: '',
      transactionType: 'credit',
      showTransactionForm: false,
      showCreateAgentForm: false,
      showAgentDetails: false,
      newAgentName: '',
      newAgentPhone: '',
      newAgentBalance: '',
      searchQuery: '',
      viewMode: 'grid', // 'grid' or 'list'
    };
  }

  componentDidMount() {
    this.fetchAgents();
  }

  fetchAgents = async () => {
    try {
      this.setState({ loading: true });
  
      const userData = await getUserData();
      const headers = {
        'access-token': userData.userToken,
        client: userData.client,
        uid: userData.uid,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
  
      const response = await getAgents(headers);
      console.log('Fetched agents raw response:', response);
  
      if (!Array.isArray(response)) {
        console.error('Response is not an array:', response);
        this.setState({ agents: [], loading: false, refreshing: false });
        return;
      }
  
      // Fetch transactions for each agent to get their latest balance
      const agentsWithBalances = await Promise.all(
        response.map(async (agent) => {
          try {
            // Fetch transactions for this specific agent
            const transactionsResponse = await fetch(
              `${API_BASE_URL}/employees/agents/${agent.id}/transactions`,
              {
                method: 'GET',
                headers: headers,
              }
            );
  
            let balance = 0;
            let openingBalance = 0;
            let closingBalance = 0;
  
            if (transactionsResponse.ok) {
              const transactionsData = await transactionsResponse.json();
              const transactions = transactionsData?.data || transactionsData?.transactions || transactionsData || [];
  
              console.log(`Agent ${agent.name} transactions:`, transactions);
  
              if (Array.isArray(transactions) && transactions.length > 0) {
                // Sort by date to get most recent
                const sortedTransactions = transactions.sort((a, b) => {
                  const dateA = new Date(a.created_at || a.date);
                  const dateB = new Date(b.created_at || b.date);
                  return dateB - dateA;
                });
  
                const latestTransaction = sortedTransactions[0];
                console.log(`Latest transaction for ${agent.name}:`, latestTransaction);
  
                openingBalance = parseFloat(latestTransaction.opening_balance) || 0;
                closingBalance = parseFloat(latestTransaction.closing_balance) || 0;
                balance = closingBalance;
              }
            } else {
              console.log(`No transactions found for agent ${agent.name}`);
            }
  
            return {
              id: agent.id,
              name: agent.name || 'Unknown Agent',
              phone: agent.phone || 'N/A',
              balance: balance,
              type_of_agent: agent.type_of_agent || 'Agent',
              created_at: agent.created_at,
              opening_balance: openingBalance,
              closing_balance: closingBalance,
              status: balance > 0 ? 'active' : 'needs_update',
            };
          } catch (error) {
            console.error(`Error fetching transactions for agent ${agent.name}:`, error);
            // Return agent with 0 balance if transaction fetch fails
            return {
              id: agent.id,
              name: agent.name || 'Unknown Agent',
              phone: agent.phone || 'N/A',
              balance: 0,
              type_of_agent: agent.type_of_agent || 'Agent',
              created_at: agent.created_at,
              opening_balance: 0,
              closing_balance: 0,
              status: 'needs_update',
            };
          }
        })
      );
  
      console.log('Agents with balances:', agentsWithBalances);
      this.setState({ 
        agents: agentsWithBalances, 
        loading: false, 
        refreshing: false 
      });
    } catch (error) {
      console.error('Error fetching agents:', error);
      this.setState({ loading: false, refreshing: false });
      Alert.alert('Error', 'Failed to fetch agents');
    }
  };
  
  handleRefresh = () => {
    this.setState({ refreshing: true }, () => {
      this.fetchAgents();
    });
  };

  handleAgentPress = (agent) => {
    this.setState({
      selectedAgent: agent,
      showAgentDetails: true
    });
  };

  handleAddTransaction = (agent) => {
    this.setState({
      selectedAgent: agent,
      showTransactionForm: true,
      transactionAmount: '',
      transactionType: 'credit'
    });
  };

  handleTransactionSubmit = async () => {
    const { selectedAgent, transactionAmount, transactionType } = this.state;
    
    if (!transactionAmount || isNaN(transactionAmount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const userData = await getUserData();
      const headers = {
        'Authorization': `Bearer ${userData.userToken}`,
        'client': userData.client,
        'uid': userData.uid,
      };

      const transactionData = {
        agentId: selectedAgent.id,
        amount: parseFloat(transactionAmount),
        type: transactionType,
        date: new Date().toISOString()
      };

      await createAgentTransaction(selectedAgent.id, transactionData, headers);
      Alert.alert('Success', 'Transaction added successfully');
      this.setState({ showTransactionForm: false });
      this.fetchAgents();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  handleCreateAgent = async () => {
    const { newAgentName, newAgentPhone, newAgentBalance } = this.state;
    
    if (!newAgentName || !newAgentPhone || !newAgentBalance) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const userData = await getUserData();
      const headers = {
        'Authorization': `Bearer ${userData.userToken}`,
        'client': userData.client,
        'uid': userData.uid,
      };

      const agentData = {
        name: newAgentName,
        phone: newAgentPhone,
        balance: parseFloat(newAgentBalance),
      };

      await createAgent(agentData, headers);
      Alert.alert('Success', 'Agent created successfully');
      this.setState({ 
        showCreateAgentForm: false, 
        newAgentName: '', 
        newAgentPhone: '', 
        newAgentBalance: '' 
      });
      this.fetchAgents();
    } catch (error) {
      console.error('Error creating agent:', error);
      Alert.alert('Error', 'Failed to create agent');
    }
  };

  getFilteredAgents = () => {
    const { agents, searchQuery } = this.state;
    if (!searchQuery) return agents;
    
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone.includes(searchQuery)
    );
  };

  // Updated for TSh (Tanzanian Shillings)
  getBalanceColor = (balance) => {
    if (balance > 5000000) return '#10B981'; // Green - over 5M TSh
    if (balance > 1000000) return '#F59E0B'; // Yellow - over 1M TSh
    return '#EF4444'; // Red - under 1M TSh
  };

  // Format currency in TSh
  formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return `TSh ${numAmount.toLocaleString('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  renderAgentGridItem = ({ item }) => (
    <TouchableOpacity
      style={styles.agentGridCard}
      onPress={() => this.handleAgentPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.agentCardHeader}>
        <View style={[styles.agentAvatar, { backgroundColor: this.getBalanceColor(item.balance || 0) }]}>
          <Text style={styles.agentInitials}>
            {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => this.handleAddTransaction(item)}
        >
          <Icon name="add" size={16} color="#6366F1" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.agentNameGrid} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.agentPhoneGrid} numberOfLines={1}>{item.phone}</Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={[styles.balanceAmount, { color: this.getBalanceColor(item.balance || 0) }]} numberOfLines={1}>
          {this.formatCurrency(item.balance || 0)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  renderAgentListItem = ({ item }) => (
    <TouchableOpacity
      style={styles.agentListCard}
      onPress={() => this.handleAgentPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.agentAvatar, { backgroundColor: this.getBalanceColor(item.balance || 0) }]}>
        <Text style={styles.agentInitials}>
          {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.agentInfoList}>
        <Text style={styles.agentNameList}>{item.name}</Text>
        <Text style={styles.agentPhoneList}>{item.phone}</Text>
      </View>
      
      <View style={styles.agentActions}>
        <Text style={[styles.balanceAmountList, { color: this.getBalanceColor(item.balance || 0) }]} numberOfLines={1}>
          {this.formatCurrency(item.balance || 0)}
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => this.handleAddTransaction(item)}
        >
          <Icon name="add" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  renderAgentDetails = () => {
    const { selectedAgent } = this.state;
    if (!selectedAgent) return null;

    return (
      <Modal
        visible={this.state.showAgentDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.detailsContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          
          {/* Header */}
          <View style={styles.detailsHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => this.setState({ showAgentDetails: false })}
            >
              <Icon name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.detailsTitle}>Agent Details</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                console.log('Edit agent:', selectedAgent);
              }}
            >
              <Icon name="edit" size={24} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContent}>
            {/* Agent Profile */}
            <View style={styles.profileSection}>
              <View style={[styles.profileAvatar, { backgroundColor: this.getBalanceColor(selectedAgent.balance || 0) }]}>
                <Text style={styles.profileInitials}>
                  {selectedAgent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.profileName}>{selectedAgent.name}</Text>
              <Text style={styles.profilePhone}>{selectedAgent.phone}</Text>
            </View>

            {/* Balance Overview */}
            <View style={styles.overviewSection}>
              <Text style={styles.sectionTitle}>Balance Overview</Text>
              <View style={styles.balanceCard}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceItemLabel}>Current Balance</Text>
                  <Text style={[styles.balanceItemValue, { color: this.getBalanceColor(selectedAgent.balance || 0) }]}>
                    {this.formatCurrency(selectedAgent.balance || 0)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceItemLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: this.getBalanceColor(selectedAgent.balance || 0) }]}>
                    <Text style={styles.statusText}>
                      {(selectedAgent.balance || 0) > 1000000 ? 'Active' : 'Low Balance'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: '#10B981' }]}
                  onPress={() => {
                    this.setState({ showAgentDetails: false });
                    setTimeout(() => {
                      this.setState({ 
                        transactionType: 'credit',
                        showTransactionForm: true 
                      });
                    }, 300);
                  }}
                >
                  <Icon name="add-circle" size={32} color="#fff" />
                  <Text style={styles.actionCardText}>Add Credit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    this.setState({ showAgentDetails: false });
                    setTimeout(() => {
                      this.setState({ 
                        transactionType: 'debit',
                        showTransactionForm: true 
                      });
                    }, 300);
                  }}
                >
                  <Icon name="remove-circle" size={32} color="#fff" />
                  <Text style={styles.actionCardText}>Add Debit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: '#6366F1' }]}
                  onPress={() => {
                    console.log('View transactions for:', selectedAgent);
                  }}
                >
                  <Icon name="history" size={32} color="#fff" />
                  <Text style={styles.actionCardText}>View History</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: '#F59E0B' }]}
                  onPress={() => {
                    console.log('Generate report for:', selectedAgent);
                  }}
                >
                  <Icon name="assessment" size={32} color="#fff" />
                  <Text style={styles.actionCardText}>Generate Report</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Agent Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="person" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{selectedAgent.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="phone" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{selectedAgent.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="account-balance-wallet" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Agent ID</Text>
                  <Text style={styles.infoValue}>#{selectedAgent.id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="date-range" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {selectedAgent.created_at ? new Date(selectedAgent.created_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  render() {
    const {
      loading,
      refreshing,
      showTransactionForm,
      selectedAgent,
      transactionAmount,
      transactionType,
      showCreateAgentForm,
      newAgentName,
      newAgentPhone,
      newAgentBalance,
      searchQuery,
      viewMode
    } = this.state;

    const filteredAgents = this.getFilteredAgents();

    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading agents...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agents</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.viewToggle, viewMode === 'grid' && styles.viewToggleActive]}
              onPress={() => this.setState({ viewMode: 'grid' })}
            >
              <Icon name="grid-view" size={20} color={viewMode === 'grid' ? '#fff' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggle, viewMode === 'list' && styles.viewToggleActive]}
              onPress={() => this.setState({ viewMode: 'list' })}
            >
              <Icon name="view-list" size={20} color={viewMode === 'list' ? '#fff' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search agents..."
            value={searchQuery}
            onChangeText={text => this.setState({ searchQuery: text })}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => this.setState({ searchQuery: '' })}
              style={styles.clearButton}
            >
              <Icon name="clear" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Agents List */}
        <FlatList
          data={filteredAgents}
          renderItem={viewMode === 'grid' ? this.renderAgentGridItem : this.renderAgentListItem}
          keyExtractor={item => item.id.toString()}
          refreshing={refreshing}
          onRefresh={this.handleRefresh}
          contentContainerStyle={styles.listContainer}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No agents found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search' : 'Add your first agent to get started'}
              </Text>
            </View>
          }
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => this.setState({ showCreateAgentForm: true })}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Agent Details Modal */}
        {this.renderAgentDetails()}

        {/* Transaction Form Modal */}
        <Modal
          visible={showTransactionForm}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Transaction</Text>
                <Text style={styles.modalSubtitle}>{selectedAgent?.name}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount (TSh)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={transactionAmount}
                  onChangeText={text => this.setState({ transactionAmount: text })}
                  placeholder="Enter amount in TSh"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Transaction Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioButton, transactionType === 'credit' && styles.radioButtonSelected]}
                    onPress={() => this.setState({ transactionType: 'credit' })}
                  >
                    <Icon name="add-circle" size={20} color={transactionType === 'credit' ? '#fff' : '#10B981'} />
                    <Text style={transactionType === 'credit' ? styles.radioButtonTextSelected : styles.radioButtonText}>
                      Credit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, transactionType === 'debit' && styles.radioButtonSelected]}
                    onPress={() => this.setState({ transactionType: 'debit' })}
                  >
                    <Icon name="remove-circle" size={20} color={transactionType === 'debit' ? '#fff' : '#EF4444'} />
                    <Text style={transactionType === 'debit' ? styles.radioButtonTextSelected : styles.radioButtonText}>
                      Debit
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => this.setState({ showTransactionForm: false })}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={this.handleTransactionSubmit}
                >
                  <Text style={styles.buttonText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Create Agent Form Modal */}
        <Modal
          visible={showCreateAgentForm}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Agent</Text>
                <Text style={styles.modalSubtitle}>Add a new agent to your network</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={newAgentName}
                  onChangeText={text => this.setState({ newAgentName: text })}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newAgentPhone}
                  onChangeText={text => this.setState({ newAgentPhone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Initial Balance (TSh)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={newAgentBalance}
                  onChangeText={text => this.setState({ newAgentBalance: text })}
                  placeholder="Enter initial balance in TSh"
                />
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => this.setState({ showCreateAgentForm: false })}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={this.handleCreateAgent}
                >
                  <Text style={styles.buttonText}>Create Agent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

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
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewToggleActive: {
    backgroundColor: '#6366F1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  // Grid View Styles
  agentGridCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 160,
  },
  agentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentNameGrid: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  agentPhoneGrid: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  balanceContainer: {
    marginTop: 'auto',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // List View Styles
  agentListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  agentInfoList: {
    flex: 1,
    marginLeft: 16,
  },
  agentNameList: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  agentPhoneList: {
    fontSize: 14,
    color: '#6B7280',
  },
  agentActions: {
    alignItems: 'flex-end',
  },
  balanceAmountList: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#6366F1',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Agent Details Styles
  detailsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
    marginRight: -8,
  },
  detailsContent: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 16,
    color: '#6B7280',
  },
  overviewSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceItemLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  balanceItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: (screenWidth - 56) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  actionCardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  radioButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  radioButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  radioButtonTextSelected: {
    color: '#fff',
    marginLeft: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AgentsScreen;