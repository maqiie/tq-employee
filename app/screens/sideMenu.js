// SideMenu.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SideMenu = ({ isVisible, onClose, navigation }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.menuContainer}>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Commission')}>
        <Text style={styles.menuText}>Commission</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Debts')}>
        <Text style={styles.menuText}>Debts</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Transactions')}>
        <Text style={styles.menuText}>Transactions</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Agents')}>
        <Text style={styles.menuText}>Agents</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={onClose}>
        <Text style={styles.menuText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1000,
    paddingTop: 50,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  menuText: {
    fontSize: 18,
  },
});

export default SideMenu;
