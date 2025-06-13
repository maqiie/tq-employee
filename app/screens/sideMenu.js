import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you have this package installed

const SideMenu = ({ isVisible, onClose, navigation }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <Text style={styles.menuHeaderText}>Menu</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1A202C" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://via.placeholder.com/150' }} // Replace with actual profile image
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>John Doe</Text>
        <Text style={styles.profileEmail}>john.doe@example.com</Text>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Commission')}>
        <Ionicons name="cash-outline" size={20} color="#4299E1" />
        <Text style={styles.menuText}>Commission</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Debts')}>
        <Ionicons name="document-text-outline" size={20} color="#4299E1" />
        <Text style={styles.menuText}>Debts</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Transactions')}>
        <Ionicons name="swap-horizontal-outline" size={20} color="#4299E1" />
        <Text style={styles.menuText}>Transactions</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Agents')}>
        <Ionicons name="people-outline" size={20} color="#4299E1" />
        <Text style={styles.menuText}>Agents</Text>
      </TouchableOpacity>

      <View style={styles.menuDivider} />

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
        <Ionicons name="person-outline" size={20} color="#4299E1" />
        <Text style={styles.menuText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="settings-outline" size={20} color="#4299E1" />
        <Text style={styles.menuText}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Logout')}>
        <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
        <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '75%',
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1000,
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuHeaderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
  },
  closeButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#718096',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  menuText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#1A202C',
    fontWeight: '500',
  },
  logoutText: {
    color: '#E53E3E',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
});

export default SideMenu;
