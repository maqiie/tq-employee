import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }}
    >
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

// const AppNavigator = () => {
//   return (
//     <Stack.Navigator
//       initialRouteName="Login"
//       screenOptions={{
//         headerShown: false, // removes the top navigation bar for all screens
//       }}
//     >
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Dashboard" component={DashboardScreen} />
//       <Stack.Screen name="Balance" component={AgentsScreen} />
//       <Stack.Screen name="Transactions" component={TransactionsScreen} />
//       <Stack.Screen name="CreateTransaction" component={CreateTransactionScreen} />
//       <Stack.Screen name="Commissions" component={CommissionScreen} />
//       <Stack.Screen name="Debtors" component={DebtOverviewScreen} />
//       <Stack.Screen name="Agents" component={AgentsScreen} />
//       <Stack.Screen name="RecordTransaction" component={TransactionsScreen} />
//       <Stack.Screen name="AddDebtor" component={DebtOverviewScreen} />
//     </Stack.Navigator>
//   );
// };

// export default AppNavigator;
