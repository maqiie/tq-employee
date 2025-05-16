import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import axios from 'axios';

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('http://your_api_url/employees/agents/:agent_id/transactions');
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions', error);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <View>
      <Text>Transactions</Text>
      {transactions.map(transaction => (
        <View key={transaction.id}>
          <Text>{transaction.date}</Text>
          <Text>Opening Balance: {transaction.opening_balance}</Text>
          <Text>Closing Balance: {transaction.closing_balance}</Text>
        </View>
      ))}
    </View>
  );
};

export default TransactionsScreen;
