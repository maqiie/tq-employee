import axios from 'axios';
import { getUserData } from './auth'; 

// const API_URL = 'https://tq-backend-main.fly.dev ';
const API_URL = 'https://tq-backend-main.fly.dev';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================================
// Authentication
// ================================

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/sign_in', { email, password });
    
    const accessToken = response.headers['access-token'];
    const client = response.headers['client'];
    const uid = response.headers['uid'];
    
    if (!accessToken || !client || !uid) {
      throw new Error('Missing authentication headers from login response');
    }
    
    return {
      accessToken,
      client,
      uid,
      user: response.data.data,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const verifyOtp = async (otp) => {
  try {
    const response = await api.post('/auth/verify_otp', { otp });
    return response.data;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

// ================================
// Agents
// ================================

export const getAgents = async (headers) => {
  try {
    const response = await api.get('/employees/agents', { headers });
    console.log('Agents API Response:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('Error in getAgents:', error);
    return [];
  }
};


export const createAgent = async (agentData, headers) => {
  try {
    const response = await api.post('/employees/agents', agentData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
};

export const getAgentTransactions = async (agentId, headers) => {
  try {
    const response = await api.get(`/employees/agents/${agentId}/transactions`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching agent transactions:', error);
    return { transactions: [] };
  }
};

export const createAgentTransaction = async (agentId, transactionData, headers) => {
  try {
    const response = await api.post(
      `/employees/agents/${agentId}/create_transaction`, 
      transactionData, 
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating agent transaction:', error);
    throw error;
  }
};

export const getLatestAgentTransaction = async (employeeId, agentId, headers) => {
  try {
    const response = await api.get(
      `/employees/agents/${agentId}/transactions/latest`, 
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching latest agent transaction:', error);
    return null;
  }
};

// ================================
// Transactions
// ================================

export const getTransactions = async (employeeId, headers) => {
  try {
    const response = await api.get(`/employees/${employeeId}/transactions`, { headers });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const createTransaction = async (employeeId, transactionData, headers) => {
  try {
    if (!headers) {
      const userData = await getUserData();
      headers = {
        'access-token': userData.userToken,
        'client': userData.client,
        'uid': userData.uid,
        'Content-Type': 'application/json',
      };
    }
    
    const response = await api.post(
      `/employees/${employeeId}/transactions`,
      { transaction: transactionData },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getLatestTransaction = async (employeeId, headers) => {
  try {
    const response = await api.get(`/employees/${employeeId}/transactions/latest`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching latest transaction:', error);
    return null;
  }
};

export const getAllTransactionsFiltered = async (employeeId, agentId, headers) => {
  try {
    const allTransactions = await getTransactions(employeeId, headers);
    
    const agentTransactions = allTransactions.filter(transaction => {
      return transaction.agent_id === agentId || 
             transaction.agentId === agentId ||
             transaction.agent?.id === agentId;
    });
    
    const sortedTransactions = agentTransactions.sort((a, b) => {
      const dateA = new Date(a.created_at || a.date || a.transaction_date || a.createdAt);
      const dateB = new Date(b.created_at || b.date || b.transaction_date || b.createdAt);
      return dateB - dateA;
    });
    
    return sortedTransactions;
  } catch (error) {
    console.error('Error in getAllTransactionsFiltered:', error);
    return [];
  }
};

// ================================
// Debtors
// ================================

export const getDebtors = async (headers) => {
  try {
    const response = await api.get('/employees/debtors', { headers });
    return response.data;
  } catch (error) {
    console.error('Error in getDebtors:', error);
    return [];
  }
};

export const getDebtorsOverview = async (headers) => {
  try {
    const response = await api.get('/employees/debtors/overview', { headers });
    return response.data;
  } catch (error) {
    console.error('Error in getDebtorsOverview:', error);
    return { debt_summary: [] };
  }
};

export const createDebtor = async (debtorData, headers) => {
  try {
    const response = await api.post('/employees/debtors', debtorData, { headers });
    return response.data;
  } catch (error) {
    console.error('Failed to create debtor:', error?.response?.data || error.message);
    throw error;
  }
};

export const payDebt = async (debtorId, data, headers) => {
  try {
    const id = typeof debtorId === 'string' ? parseInt(debtorId, 10) : debtorId;
    
    if (isNaN(id) || id <= 0) {
      throw new Error('Invalid debtor ID');
    }
    
    const response = await api.post(
      `/employees/debtors/${id}/pay_debt`,
      { payment_amount: data.amount },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error paying debt:', error);
    throw error;
  }
};

// ================================
// Dashboard & Statistics
// ================================

export const getDashboardStats = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats', { headers });
    console.log('Dashboard stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      daily_stats: {
        opening_balance: 0,
        closing_balance: 0,
        employee_transactions: 0,
        agent_transactions: 0,
        total_commissions: 0,
        active_debtors: 0,
        net_change: 0,
        has_today_transaction: false
      },
      quick_stats: {
        total_agents: 0,
        active_debtors: 0,
        monthly_commissions: 0,
        weekly_transactions: 0,
        total_debt_outstanding: 0,
        total_debt_collected: 0
      },
      agents_summary: {
        agents: [],
        summary: {
          total_agents: 0,
          agents_with_updates_today: 0,
          total_active_debtors: 0,
          total_debt_managed: 0
        }
      },
      debtors_summary: {
        debtors: []
      },
      recent_activity: [],
      last_updated: null
    };
  }
};

export const getWeeklyStats = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats/weekly', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return null;
  }
};

export const getMonthlyStats = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats/monthly', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    return null;
  }
};

export const getAgentsPerformance = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats/agents_performance', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching agents performance:', error);
    return null;
  }
};

// ================================
// Commissions
// ================================

export const getCommissions = async ({ month, year } = {}) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      'client': userData.client,
      'uid': userData.uid,
      'Content-Type': 'application/json',
    };
    
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    
    const response = await api.get('/employees/commissions', { headers, params });
    return response.data;
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return [];
  }
};

export const getCommission = async (commissionId) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      'client': userData.client,
      'uid': userData.uid,
      'Content-Type': 'application/json',
    };
    
    const response = await api.get(`/employees/commissions/${commissionId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching commission:', error);
    return null;
  }
};

export const createCommission = async (commissionData) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      'client': userData.client,
      'uid': userData.uid,
      'Content-Type': 'application/json',
    };
    
    if (!commissionData.agent_id) {
      throw new Error('agent_id is required to create a commission.');
    }
    
    const response = await api.post(
      '/employees/commissions',
      { commission: commissionData },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating commission:', error);
    throw error;
  }
};

export const updateCommission = async (commissionId, commissionData) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      'client': userData.client,
      'uid': userData.uid,
      'Content-Type': 'application/json',
    };
    
    const response = await api.put(
      `/employees/commissions/${commissionId}`,
      { commission: commissionData },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating commission:', error);
    throw error;
  }
};

export const deleteCommission = async (commissionId) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      'client': userData.client,
      'uid': userData.uid,
      'Content-Type': 'application/json',
    };
    
    const response = await api.delete(`/employees/commissions/${commissionId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error deleting commission:', error);
    throw error;
  }
};

// import axios from 'axios';
// import { getUserData } from './auth'; 

// const API_URL = 'https://tq-backend-main.fly.dev '; // Update with your backend URL

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export const login = async (email, password) => {
//   try {
//     const response = await api.post('/auth/sign_in', { email, password });
//     // Log the entire headers object to inspect what you get
//     console.log('Response headers:', response.headers);
    
//     const accessToken = response.headers['access-token'];
//     const client = response.headers['client'];
//     const uid = response.headers['uid'];
    
//     if (!accessToken || !client || !uid) {
//       throw new Error('Missing authentication headers from login response');
//     }
    
//     return {
//       accessToken,
//       client,
//       uid,
//       user: response.data.data,
//     };
//   } catch (error) {
//     console.error('Login error:', error);
//     throw error;
//   }
// };

// export const verifyOtp = async (otp) => {
//   try {
//     const response = await api.post('/auth/verify_otp', { otp });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// // Create an agent as an employee
// export const createAgent = async (agentData, headers) => {
//   try {
//     const response = await api.post('/employees/agents', agentData, { headers });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// // Create a transaction for a specific agent as an employee
// export const createAgentTransaction = async (agentId, transactionData, headers) => {
//   try {
//     const response = await api.post(`/employees/agents/${agentId}/create_transaction`, transactionData, { headers });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// // Get all agents for the current authenticated employee
// export const getAgents = async (headers) => {
//   try {
//     const response = await api.get('/employees/agents', { headers });
//     console.log('API Response:', response); // Log the entire response
//     return response;
//   } catch (error) {
//     console.error('Error in getAgents:', error);
//     throw error;
//   }
// };

// // Get all debtors for the current authenticated employee
// export const getDebtors = async (headers) => {
//   try {
//     const response = await api.get('/employees/debtors', { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Error in getDebtors:', error);
//     throw error;
//   }
// };

// // Create a new debtor as an employee
// export const createDebtor = async (debtorData, headers) => {
//   try {
//     const response = await api.post('/employees/debtors', debtorData, { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Failed to create debtor:', error?.response?.data || error.message);
//     throw error;
//   }
// };

// // Record a payment for a specific debtor as an employee
// export const payDebt = (debtorId, data, headers) => {
//   // Convert to number if it's a string
//   const id = typeof debtorId === 'string' ? parseInt(debtorId, 10) : debtorId;
//   if (isNaN(id) || id <= 0) {
//     return Promise.reject(new Error('Invalid debtor ID'));
//   }
//   return api.post(
//     `/employees/debtors/${id}/pay_debt`,
//     { payment_amount: data.amount }, // use payment_amount here
//     { headers }
//   );
// };

// // Get overview of debtors for the current authenticated employee
// export const getDebtorsOverview = async (headers) => {
//   try {
//     const response = await api.get('/employees/debtors/overview', { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Error in getDebtorsOverview:', error);
//     throw error;
//   }
// };

// // NEW: Get all transactions for a specific agent
// export const getAgentTransactions = async (agentId, headers) => {
//   try {
//     const response = await api.get(`/employees/agents/${agentId}/transactions`, { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching agent transactions:', error.response?.data || error.message);
//     throw error;
//   }
// };

// // Get all transactions for an employee
// export const getTransactions = async (employeeId, headers) => {
//   try {
//     const response = await api.get(`/employees/${employeeId}/transactions`, { headers });
//     return response.data || [];
//   } catch (error) {
//     console.error('API Error:', error.response?.data || error.message);
//     throw error;
//   }
// };

// // Enhanced createTransaction function with better error handling
// export const createTransaction = async (employeeId, transactionData, headers) => {
//   try {
//     // If headers aren't provided, get them from userData
//     if (!headers) {
//       const userData = await getUserData();
//       headers = {
//         'access-token': userData.userToken,
//         'client': userData.client,
//         'uid': userData.uid,
//         'Content-Type': 'application/json',
//       };
//     }

//     const response = await api.post(
//       `/employees/${employeeId}/transactions`,
//       { transaction: transactionData }, // ✅ wrap here
//       { headers }
//     );
    
//     return response.data;
//   } catch (error) {
//     console.error('API Error - createTransaction:', error);
//     throw error;
//   }
// };

// // Get the latest transaction for a specific agent
// export const getLatestAgentTransaction = async (employeeId, agentId, headers) => {
//   try {
//     const response = await api.get(
//       `/employees/${employeeId}/agents/${agentId}/transactions/latest`, 
//       { headers }
//     );
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching latest agent transaction:', error.response?.data || error.message);
//     throw error;
//   }
// };

// // Get the latest transaction (for opening balance) - kept for backward compatibility
// export const getLatestTransaction = async (employeeId, headers) => {
//   try {
//     const response = await api.get(`/employees/${employeeId}/transactions/latest`, { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching latest transaction:', error.response?.data || error.message);
//     throw error;
//   }
// };

// // NEW: Alternative function to get all transactions and filter by agent (fallback)
// export const getAllTransactionsFiltered = async (employeeId, agentId, headers) => {
//   try {
//     // Get all transactions first
//     const allTransactions = await getTransactions(employeeId, headers);
    
//     // Filter by agent ID
//     const agentTransactions = allTransactions.filter(transaction => {
//       return transaction.agent_id === agentId || 
//              transaction.agentId === agentId ||
//              transaction.agent?.id === agentId;
//     });
    
//     // Sort by date (most recent first)
//     const sortedTransactions = agentTransactions.sort((a, b) => {
//       const dateA = new Date(a.created_at || a.date || a.transaction_date || a.createdAt);
//       const dateB = new Date(b.created_at || b.date || b.transaction_date || b.createdAt);
//       return dateB - dateA;
//     });
    
//     return sortedTransactions;
//   } catch (error) {
//     console.error('Error in getAllTransactionsFiltered:', error);
//     throw error;
//   }
// };

// // Dashboard API calls
// export const getDashboardStats = async (headers) => {
//   try {
//     const response = await api.get('/employees/dashboard/stats', { headers }); // Note: added /stats
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching dashboard stats:', error);
//     throw error;
//   }
// };

// export const getWeeklyStats = async (headers) => {
//   try {
//     const response = await api.get('/employees/dashboard/stats/weekly', { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching weekly stats:', error);
//     throw error;
//   }
// };

// export const getMonthlyStats = async (headers) => {
//   try {
//     const response = await api.get('/employees/dashboard/stats/monthly', { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching monthly stats:', error);
//     throw error;
//   }
// };

// export const getAgentsPerformance = async (headers) => {
//   try {
//     const response = await api.get('/employees/dashboard/stats/agents_performance', { headers });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching agents performance:', error);
//     throw error;
//   }
// };

// // Commissions API
// export const getCommissions = async ({ month, year } = {}) => {
//   try {
//     const userData = await getUserData();
//     const headers = {
//       'access-token': userData.userToken,
//       'client': userData.client,
//       'uid': userData.uid,
//       'Content-Type': 'application/json',
//     };
    
//     // Include query params only if month/year are provided
//     const params = {};
//     if (month) params.month = month;
//     if (year) params.year = year;
    
//     const response = await api.get('/employees/commissions', { headers, params });
//     return response;
//   } catch (error) {
//     console.error('Error fetching commissions:', error);
//     throw error;
//   }
// };

// export const getCommission = async (commissionId) => {
//   try {
//     const userData = await getUserData();
//     const headers = {
//       'access-token': userData.userToken,
//       'client': userData.client,
//       'uid': userData.uid,
//       'Content-Type': 'application/json',
//     };
    
//     const response = await api.get(`/employees/commissions/${commissionId}`, { headers });
//     return response;
//   } catch (error) {
//     console.error('Error fetching commission:', error);
//     throw error;
//   }
// };

// export const createCommission = async (commissionData) => {
//   try {
//     const userData = await getUserData();
//     const headers = {
//       'access-token': userData.userToken,
//       'client': userData.client,
//       'uid': userData.uid,
//       'Content-Type': 'application/json',
//     };
    
//     if (!commissionData.agent_id) {
//       throw new Error('agent_id is required to create a commission.');
//     }
    
//     const response = await api.post(
//       '/employees/commissions',
//       { commission: commissionData },  // wrap data as { commission: { ... } }
//       { headers }
//     );
//     return response;
//   } catch (error) {
//     console.error('Error creating commission:', error.response?.data || error.message);
//     throw error;
//   }
// };

// export const updateCommission = async (commissionId, commissionData) => {
//   try {
//     const userData = await getUserData();
//     const headers = {
//       'access-token': userData.userToken,
//       'client': userData.client,
//       'uid': userData.uid,
//       'Content-Type': 'application/json',
//     };
    
//     // Wrap update data with commission key to match Rails strong params expectation
//     const response = await api.put(
//       `/employees/commissions/${commissionId}`,
//       { commission: commissionData },
//       { headers }
//     );
//     return response;
//   } catch (error) {
//     console.error('Error updating commission:', error.response?.data || error.message);
//     throw error;
//   }
// };

// export const deleteCommission = async (commissionId) => {
//   try {
//     const userData = await getUserData();
//     const headers = {
//       'access-token': userData.userToken,
//       'client': userData.client,
//       'uid': userData.uid,
//       'Content-Type': 'application/json',
//     };
    
//     const response = await api.delete(`/employees/commissions/${commissionId}`, { headers });
//     return response;
//   } catch (error) {
//     console.error('Error deleting commission:', error.response?.data || error.message);
//     throw error;
//   }
// };