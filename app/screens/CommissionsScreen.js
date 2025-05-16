// CommissionScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList } from 'react-native';

const CommissionScreen = () => {
  const [commission, setCommission] = useState('');
  const [vendor, setVendor] = useState('');
  const [commissions, setCommissions] = useState([]);

  const addCommission = () => {
    if (commission && vendor) {
      setCommissions([...commissions, { vendor, commission }]);
      setCommission('');
      setVendor('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Commission</Text>
      <TextInput
        style={styles.input}
        onChangeText={setVendor}
        value={vendor}
        placeholder="Vendor Name"
      />
      <TextInput
        style={styles.input}
        onChangeText={setCommission}
        value={commission}
        placeholder="Commission Amount"
        keyboardType="numeric"
      />
      <Button title="Add Commission" onPress={addCommission} />
      <FlatList
        data={commissions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.commissionItem}>
            <Text>{item.vendor}: ${item.commission}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  commissionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default CommissionScreen;
