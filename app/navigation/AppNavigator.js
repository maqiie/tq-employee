import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CommissionScreen from '../screens/CommissionsScreen';
import DebtOverviewScreen from '../screens/DebtOverviewScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AgentsScreen from '../screens/AgentsScreen';
import CreateTransactionScreen from '../screens/CreateTransactionScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false, // removes the top navigation bar for all screens
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Balance" component={AgentsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="CreateTransaction" component={CreateTransactionScreen} />
      <Stack.Screen name="Commissions" component={CommissionScreen} />
      <Stack.Screen name="Debtors" component={DebtOverviewScreen} />
      <Stack.Screen name="Agents" component={AgentsScreen} />
      <Stack.Screen name="RecordTransaction" component={TransactionsScreen} />
      <Stack.Screen name="AddDebtor" component={DebtOverviewScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;

// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import LoginScreen from '../screens/LoginScreen';
// import DashboardScreen from '../screens/DashboardScreen';
// import CommissionScreen from '../screens/CommissionsScreen';
// import DebtOverviewScreen from '../screens/DebtOverviewScreen';
// import TransactionsScreen from '../screens/TransactionsScreen';
// import AgentsScreen from '../screens/AgentsScreen';
// import CreateTransactionScreen from '../screens/CreateTransactionScreen';

// const Stack = createStackNavigator();

// const AppNavigator = () => (
//   <Stack.Navigator
//     initialRouteName="Login"
//     screenOptions={{
//       headerStyle: {
//         headerShown: false,
//         backgroundColor: '#fff',
//         elevation: 0,
//         shadowOpacity: 0,
//         borderBottomWidth: 0,
//       },
//       headerTintColor: '#4A5568',
//       headerTitleStyle: {
//         fontWeight: 'bold',
//       },
//     }}
//   >
//     <Stack.Screen
//       name="Login"
//       component={LoginScreen}
//       options={{ headerShown: false }}
//     />

//     <Stack.Screen
//       name="Dashboard"
//       component={DashboardScreen}
//       options={{ title: 'Dashboard' }}
//     />

//     {/* Mapping Dashboard navigation to existing screens */}
//     <Stack.Screen
//       name="Balance"
//       component={AgentsScreen}  // Using AgentsScreen as placeholder
//       options={{ title: 'Daily Balance' }}
//     />

//     <Stack.Screen
//       name="Transactions"
//       component={TransactionsScreen}
//       options={{ title: 'Transactions' }}
//     />
//     <Stack.Screen
//   name="CreateTransaction"
//   component={CreateTransactionScreen}
//   options={{ title: 'Create Transaction' }}
// />

//     <Stack.Screen
//       name="Commissions"
//       component={CommissionScreen}
//       options={{ title: 'Commissions' }}
//     />
  

//     <Stack.Screen
//       name="Debtors"
//       component={DebtOverviewScreen}
//       options={{ title: 'Debtors Overview' }}
//     />

//     <Stack.Screen
//       name="Agents"
//       component={AgentsScreen}  // Using AgentsScreen as placeholder
//       options={{ title: 'Agents' }}
//     />

//     {/* Quick Action screens - using existing screens as placeholders */}
//     <Stack.Screen
//       name="RecordTransaction"
//       component={TransactionsScreen}  // Using TransactionsScreen as placeholder
//       options={{ title: 'Record Transaction' }}
//     />

//     <Stack.Screen
//       name="AddDebtor"
//       component={DebtOverviewScreen}  // Using DebtOverviewScreen as placeholder
//       options={{ title: 'Add Debtor' }}
//     />
//   </Stack.Navigator>
// );

// export default AppNavigator;
