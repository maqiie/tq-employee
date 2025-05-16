import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    if (menuOpen) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  };

  const navigateTo = (screen) => {
    toggleMenu();
    navigation.navigate(screen);
  };

  // Sample data - replace with actual data from your backend
  const [dailyStats, setDailyStats] = useState({
    openingBalance: 10000,
    closingBalance: 12500,
    transactions: 8,
    commissions: 1200,
    debtors: 3
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu}>
          <Icon name="menu" size={28} color="#4A5568" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Money Manager</Text>
        <TouchableOpacity onPress={logout}>
          <Icon name="exit-to-app" size={28} color="#4A5568" />
        </TouchableOpacity>
      </View>

      {/* Side Menu */}
      {menuOpen && (
        <Animated.View style={[styles.menuContainer, { opacity: fadeAnim }]}>
          <View style={styles.menu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateTo('Balance')}
            >
              <Icon name="account-balance" size={24} color="#4A5568" />
              <Text style={styles.menuText}>Daily Balance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateTo('Transactions')}
            >
              <Icon name="swap-horiz" size={24} color="#4A5568" />
              <Text style={styles.menuText}>Transactions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateTo('Commissions')}
            >
              <Icon name="attach-money" size={24} color="#4A5568" />
              <Text style={styles.menuText}>Commissions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateTo('Debtors')}
            >
              <Icon name="money-off" size={24} color="#4A5568" />
              <Text style={styles.menuText}>Debtors</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateTo('Vendors')}
            >
              <Icon name="store" size={24} color="#4A5568" />
              <Text style={styles.menuText}>Vendors</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.menuOverlay} 
            onPress={toggleMenu}
          />
        </Animated.View>
      )}

      {/* Dashboard Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back, {user?.name}</Text>
          <Text style={styles.dateText}>{new Date().toDateString()}</Text>
        </View>

        {/* Balance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Opening Balance</Text>
              <Text style={styles.statValue}>${dailyStats.openingBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Closing Balance</Text>
              <Text style={styles.statValue}>${dailyStats.closingBalance.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('RecordTransaction')}
            >
              <View style={styles.actionIcon}>
                <Icon name="add" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Record Transaction</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('AddDebtor')}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#E53E3E'}]}>
                <Icon name="person-add" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Add Debtor</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.gridCard}>
              <Icon name="receipt" size={28} color="#4299E1" />
              <Text style={styles.gridNumber}>{dailyStats.transactions}</Text>
              <Text style={styles.gridLabel}>Transactions</Text>
            </View>
            
            <View style={styles.gridCard}>
              <Icon name="attach-money" size={28} color="#48BB78" />
              <Text style={styles.gridNumber}>${dailyStats.commissions.toFixed(2)}</Text>
              <Text style={styles.gridLabel}>Commissions</Text>
            </View>
            
            <View style={styles.gridCard}>
              <Icon name="money-off" size={28} color="#F56565" />
              <Text style={styles.gridNumber}>{dailyStats.debtors}</Text>
              <Text style={styles.gridLabel}>Active Debtors</Text>
            </View>
            
            <View style={styles.gridCard}>
              <Icon name="trending-up" size={28} color="#9F7AEA" />
              <Text style={styles.gridNumber}>
                ${(dailyStats.closingBalance - dailyStats.openingBalance).toFixed(2)}
              </Text>
              <Text style={styles.gridLabel}>Net Change</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, {backgroundColor: '#4299E1'}]}>
                <Icon name="swap-horiz" size={20} color="#fff" />
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Bank Deposit</Text>
                <Text style={styles.activityTime}>10:30 AM</Text>
              </View>
              <Text style={styles.activityAmount}>+$2,500.00</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, {backgroundColor: '#48BB78'}]}>
                <Icon name="attach-money" size={20} color="#fff" />
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Vendor Commission</Text>
                <Text style={styles.activityTime}>12:45 PM</Text>
              </View>
              <Text style={styles.activityAmount}>+$350.00</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, {backgroundColor: '#F56565'}]}>
                <Icon name="money-off" size={20} color="#fff" />
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Debtor Payment</Text>
                <Text style={styles.activityTime}>2:15 PM</Text>
              </View>
              <Text style={styles.activityAmount}>+$1,200.00</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'row',
  },
  menu: {
    width: '70%',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#4A5568',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: '#4299E1',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#EBF8FF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  seeAll: {
    color: '#4299E1',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    backgroundColor: '#4299E1',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginVertical: 8,
  },
  gridLabel: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#718096',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48BB78',
  },
});

export default DashboardScreen;