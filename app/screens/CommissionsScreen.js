import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Platform,
} from "react-native";

import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getCommissions,
  createCommission,
  getCommission,
  updateCommission,
  deleteCommission,
  getAgents,
} from "../services/api";
import { getUserData } from "../services/auth";

const { width } = Dimensions.get("window");

// Custom Dropdown Component
const CustomDropdown = ({ 
  data, 
  selectedValue, 
  onValueChange, 
  placeholder = "Select an option",
  labelKey = "label",
  valueKey = "value",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const item = data.find(d => d[valueKey] === selectedValue);
    setSelectedItem(item);
  }, [selectedValue, data, valueKey]);

  const handleSelect = (item) => {
    onValueChange(item[valueKey]);
    setIsOpen(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[styles.dropdownButton, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Text style={[
          styles.dropdownButtonText,
          !selectedItem && styles.dropdownPlaceholder,
          disabled && styles.dropdownDisabledText
        ]}>
          {selectedItem ? selectedItem[labelKey] : placeholder}
        </Text>
        <Icon 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={disabled ? "#9CA3AF" : "#6B7280"} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView 
            style={styles.dropdownScrollView}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            {data.map((item, index) => (
              <TouchableOpacity
                key={item[valueKey] || index}
                style={[
                  styles.dropdownItem,
                  selectedValue === item[valueKey] && styles.dropdownItemSelected
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedValue === item[valueKey] && styles.dropdownItemTextSelected
                ]}>
                  {item[labelKey]}
                </Text>
                {selectedValue === item[valueKey] && (
                  <Icon name="check" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const CommissionScreen = () => {
  const [amount, setAmount] = useState("");
  const [agentId, setAgentId] = useState("");
  const [description, setDescription] = useState("");
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [userData, setUserData] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert("Error", "Failed to fetch user data.");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [selectedMonth, selectedYear]);

  const fetchAgents = async () => {
    try {
      const userData = await getUserData();
      if (!userData.userToken || !userData.client || !userData.uid) {
        throw new Error("Missing authentication headers");
      }
  
      const headers = {
        'access-token': userData.userToken,
        client: userData.client,
        uid: userData.uid,
      };
  
      const response = await getAgents(headers); // response is already response.data
      console.log("API Response:", response);
  
      const agentsData = response || []; // use response directly
      setAgents(agentsData);
  
      if (agentsData.length > 0) {
        setAgentId(agentsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      Alert.alert("Error", "Failed to load agents.");
    }
  };
  

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await getCommissions({
        month: selectedMonth,
        year: selectedYear,
      });
      setCommissions(response.data || []);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      Alert.alert("Error", "Failed to load commissions.");
    } finally {
      setLoading(false);
    }
  };

  const addCommission = async () => {
    console.log("Starting addCommission function");

    if (!amount || isNaN(amount) || !agentId) {
      console.log("Validation failed: amount or agentId is missing or invalid");
      Alert.alert("Error", "Please enter a valid amount and select an agent.");
      return;
    }

    try {
      console.log("Selected Agent ID:", agentId);

      const agentExists = agents.some(agent => agent.id === agentId);
      if (!agentExists) {
        console.log("Agent does not exist with ID:", agentId);
        Alert.alert("Error", "Selected agent does not exist.");
        return;
      }

      const commissionPayload = {
        agent_id: agentId,
        amount: parseFloat(amount),
        month: selectedMonth,
        year: selectedYear,
        description: description,
      };

      console.log("Creating commission with data:", commissionPayload);

      const response = await createCommission(commissionPayload);

      console.log("Commission created successfully:", response);

      Alert.alert("Success", "Commission added successfully.");
      setAmount("");
      setDescription("");
      fetchCommissions();
    } catch (error) {
      console.error("Error adding commission:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to add commission. Please check the console for more details.");
    }
  };

  const renderCommissionItem = ({ item, index }) => {
    const amountValue = Number(item.amount) || 0;

    return (
      <TouchableOpacity 
        onPress={() => {
          setSelectedCommission(item);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.commissionCard, { marginTop: index === 0 ? 0 : 16 }]}>
          <View style={styles.commissionContent}>
            <View style={styles.commissionLeft}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.agentAvatar}
              >
                <Text style={styles.agentInitial}>
                  {item.agent_name ? item.agent_name.charAt(0).toUpperCase() : "A"}
                </Text>
              </LinearGradient>
              <View style={styles.commissionInfo}>
                <Text style={styles.agentName}>
                  {item.agent_name || "Unknown Agent"}
                </Text>
                {item.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.dateContainer}>
                  <Icon name="schedule" size={14} color="#8B9DC3" />
                  <Text style={styles.date}>
                    {new Date(item.date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>${amountValue.toFixed(2)}</Text>
              <View style={styles.amountBadge}>
                <Icon name="trending-up" size={16} color="#10B981" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CommissionDetailsModal = ({ commission, visible, onClose }) => {
    if (!visible || !commission) return null;

    const amountValue = Number(commission.amount) || 0;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commission Details</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <Icon name="person" size={20} color="#3B82F6" />
                <Text style={styles.modalLabel}>Agent:</Text>
                <Text style={styles.modalValue}>{commission.agent_name}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Icon name="attach-money" size={20} color="#10B981" />
                <Text style={styles.modalLabel}>Amount:</Text>
                <Text style={[styles.modalValue, styles.modalAmount]}>${amountValue.toFixed(2)}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Icon name="description" size={20} color="#8B5CF6" />
                <Text style={styles.modalLabel}>Description:</Text>
                <Text style={styles.modalValue}>{commission.description || "No description"}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Icon name="schedule" size={20} color="#F59E0B" />
                <Text style={styles.modalLabel}>Date:</Text>
                <Text style={styles.modalValue}>{new Date(commission.date).toLocaleDateString()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.closeButtonGradient}>
                <Text style={styles.closeButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Prepare dropdown data
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
    value: i + 1
  }));

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: currentYear - i
  }));

  const agentOptions = agents.map(agent => ({
    label: agent.name,
    value: agent.id
  }));

  const totalCommissions = commissions && commissions.length > 0
    ? commissions.reduce((sum, item) => sum + item.amount, 0)
    : 0;

  const totalCommissionsValue = Number(totalCommissions) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <LinearGradient colors={["#0F172A", "#1E293B", "#334155"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="monetization-on" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Commissions</Text>
          <Text style={styles.subtitle}>Manage agent commissions efficiently</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.statsCard}
        >
          <View style={styles.statItem}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statIconContainer}
            >
              <Icon name="trending-up" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>${totalCommissionsValue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total This Period</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.statIconContainer}
            >
              <Icon name="assignment" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.statValue}>{commissions.length}</Text>
            <Text style={styles.statLabel}>Commissions</Text>
          </View>
        </LinearGradient>

        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.sectionIcon}
            >
              <Icon name="filter-list" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Filter Period</Text>
          </View>
          
          <View style={styles.filterContainer}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Month</Text>
              <CustomDropdown
                data={monthOptions}
                selectedValue={selectedMonth}
                onValueChange={setSelectedMonth}
                placeholder="Select Month"
              />
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Year</Text>
              <CustomDropdown
                data={yearOptions}
                selectedValue={selectedYear}
                onValueChange={setSelectedYear}
                placeholder="Select Year"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.sectionIcon}
            >
              <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Add New Commission</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Agent</Text>
            <CustomDropdown
              data={agentOptions}
              selectedValue={agentId}
              onValueChange={setAgentId}
              placeholder={agents.length > 0 ? "Choose an agent..." : "Loading agents..."}
              disabled={agents.length === 0}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.inputWrapper}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.inputIconContainer}
              >
                <Icon name="attach-money" size={20} color="#FFFFFF" />
              </LinearGradient>
              <TextInput
                style={styles.input}
                onChangeText={setAmount}
                value={amount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={[styles.inputIconContainer, styles.textAreaIcon]}
              >
                <Icon name="description" size={20} color="#FFFFFF" />
              </LinearGradient>
              <TextInput
                style={[styles.input, styles.textArea]}
                onChangeText={setDescription}
                value={description}
                placeholder="Add commission details..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              (!amount || !agentId) && styles.addButtonDisabled,
            ]}
            onPress={addCommission}
            disabled={!amount || !agentId}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !amount || !agentId
                  ? ["#9CA3AF", "#6B7280"]
                  : ["#3B82F6", "#1D4ED8"]
              }
              style={styles.addButtonGradient}
            >
              <Icon
                name="add"
                size={20}
                color="#FFFFFF"
                style={styles.addButtonIcon}
              />
              <Text style={styles.addButtonText}>Add Commission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.sectionIcon}
            >
              <Icon name="list" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>
              {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString(
                "default",
                {
                  month: "long",
                  year: "numeric",
                }
              )}{" "}
              Commissions
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading commissions...</Text>
            </View>
          ) : !commissions || commissions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['#F3F4F6', '#E5E7EB']}
                style={styles.emptyIconContainer}
              >
                <Icon name="inbox" size={48} color="#9CA3AF" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No Commissions Found</Text>
              <Text style={styles.emptyText}>
                No commissions recorded for this period. Add your first
                commission above to get started.
              </Text>
            </View>
          ) : (
            <FlatList
              data={commissions}
              renderItem={renderCommissionItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </ScrollView>

      <CommissionDetailsModal
        commission={selectedCommission}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#CBD5E1",
    opacity: 0.9,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F1F5F9",
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 28,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 24,
  },
  filterSection: {
    margin: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formSection: {
    margin: 20,
    marginTop: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  listSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 16,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  
  // Custom Dropdown Styles
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  dropdownDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownDisabledText: {
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownItemTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingRight: 16,
    minHeight: 52,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    minHeight: 100,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 12,
  },
  textAreaIcon: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 28,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  commissionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  commissionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commissionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  agentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  agentInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  commissionInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: "#8B9DC3",
    marginLeft: 6,
    fontWeight: "600",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 6,
  },
  amountBadge: {
    backgroundColor: "#D1FAE5",
    borderRadius: 20,
    padding: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  listContainer: {
    paddingBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 0,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeIcon: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
    paddingTop: 16,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  modalLabel: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  modalValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
    flex: 1,
  },
  modalAmount: {
    color: "#10B981",
    fontWeight: "bold",
    fontSize: 18,
  },
  closeButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  closeButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default CommissionScreen;