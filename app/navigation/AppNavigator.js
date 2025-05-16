// // AppNavigator.js
// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import LoginScreen from '../screens/LoginScreen';
// import DashboardScreen from '../screens/DashboardScreen';
// import CommissionScreen from '../screens/CommissionsScreen';
// import DebtOverviewScreen from '../screens/DebtOverviewScreen';
// import TransactionsScreen from '../screens/TransactionsScreen';
// import AgentsScreen from '../screens/AgentsScreen';
// const Stack = createStackNavigator();

// const AppNavigator = () => (
//   <Stack.Navigator>
//     <Stack.Screen name="Login" component={LoginScreen} />
//     <Stack.Screen name="Dashboard" component={DashboardScreen} />
//   </Stack.Navigator>
// );

// export default AppNavigator;
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CommissionScreen from '../screens/CommissionsScreen';
import DebtOverviewScreen from '../screens/DebtOverviewScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AgentsScreen from '../screens/AgentsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="Login"
    screenOptions={{
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#4A5568',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ headerShown: false }} 
    />
    
    <Stack.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{ title: 'Dashboard' }} 
    />
    
    {/* Mapping Dashboard navigation to existing screens */}
    <Stack.Screen 
      name="Balance" 
      component={AgentsScreen}  // Using AgentsScreen as placeholder
      options={{ title: 'Daily Balance' }} 
    />
    
    <Stack.Screen 
      name="Transactions" 
      component={TransactionsScreen} 
      options={{ title: 'Transactions' }} 
    />
    
    <Stack.Screen 
      name="Commissions" 
      component={CommissionScreen} 
      options={{ title: 'Commissions' }} 
    />
    
    <Stack.Screen 
      name="Debtors" 
      component={DebtOverviewScreen} 
      options={{ title: 'Debtors Overview' }} 
    />
    
    <Stack.Screen 
      name="Vendors" 
      component={AgentsScreen}  // Using AgentsScreen as placeholder
      options={{ title: 'Vendors' }} 
    />
    
    {/* Quick Action screens - using existing screens as placeholders */}
    <Stack.Screen 
      name="RecordTransaction" 
      component={TransactionsScreen}  // Using TransactionsScreen as placeholder
      options={{ title: 'Record Transaction' }} 
    />
    
    <Stack.Screen 
      name="AddDebtor" 
      component={DebtOverviewScreen}  // Using DebtOverviewScreen as placeholder
      options={{ title: 'Add Debtor' }} 
    />
  </Stack.Navigator>
);

export default AppNavigator;