import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import axios from 'axios';

const DebtOverviewScreen = () => {
  const [debtors, setDebtors] = useState([]);

  useEffect(() => {
    const fetchDebtors = async () => {
      try {
        const response = await axios.get('http://your_api_url/employees/debtors/overview');
        setDebtors(response.data);
      } catch (error) {
        console.error('Error fetching debtors', error);
      }
    };

    fetchDebtors();
  }, []);

  return (
    <View>
      <Text>Debt Overview</Text>
      {debtors.map(debtor => (
        <View key={debtor.id}>
          <Text>{debtor.name}</Text>
          <Text>Debt: {debtor.debt_amount}</Text>
          <Text>Paid: {debtor.total_paid}</Text>
        </View>
      ))}
    </View>
  );
};

export default DebtOverviewScreen;
