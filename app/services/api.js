import axios from 'axios';
import { getUserData } from './auth'; 

const API_URL = 'http://192.168.100.4:3001'; // Update with your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/sign_in', { email, password });

    // Log the entire headers object to inspect what you get
    console.log('Response headers:', response.headers);

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
    throw error;
  }
};

// Create an agent as an employee
export const createAgent = async (agentData, headers) => {
    try {
      const response = await api.post('/employees/agents', agentData, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  
  // Create a transaction for a specific agent as an employee
  export const createAgentTransaction = async (agentId, transactionData, headers) => {
    try {
      const response = await api.post(`/employees/agents/${agentId}/create_transaction`, transactionData, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  };
// Get all agents for the current authenticated employee
export const getAgents = async (headers) => {
    try {
      const response = await api.get('/employees/agents', { headers });
      console.log('API Response:', response); // Log the entire response
      return response;
    } catch (error) {
      console.error('Error in getAgents:', error);
      throw error;
    }
  };
  
  // Get all debtors for the current authenticated employee
export const getDebtors = async (headers) => {
    try {
      const response = await api.get('/employees/debtors', { headers });
      return response.data;
    } catch (error) {
      console.error('Error in getDebtors:', error);
      throw error;
    }
  };
  
  // Create a new debtor as an employee
export const createDebtor = async (debtorData, headers) => {
    try {
      const response = await api.post('/employees/debtors', debtorData, { headers });
      return response.data;
    } catch (error) {
      console.error('Failed to create debtor:', error?.response?.data || error.message);
      throw error;
    }
  };
  
  // Record a payment for a specific debtor as an employee
export const payDebt = (debtorId, data, headers) => {
  // Convert to number if it's a string
  const id = typeof debtorId === 'string' ? parseInt(debtorId, 10) : debtorId;

  if (isNaN(id) || id <= 0) {
    return Promise.reject(new Error('Invalid debtor ID'));
  }

  return api.post(
    `/employees/debtors/${id}/pay_debt`,
    { payment_amount: data.amount }, // use payment_amount here
    { headers }
  );
};
  
  // Get overview of debtors for the current authenticated employee
  export const getDebtorsOverview = async (headers) => {
    try {
      const response = await api.get('/employees/debtors/overview', { headers });
      return response.data;
    } catch (error) {
      console.error('Error in getDebtorsOverview:', error);
      throw error;
    }
  };


// Example of what your API function should look like
export const getTransactions = async (employeeId, headers) => {
  try {
    const response = await api.get(`/employees/${employeeId}/transactions`, { headers });
    return response.data || [];
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};


export const createTransaction = async (employeeId, transactionData) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      client: userData.client,
      uid: userData.uid,
      'Content-Type': 'application/json',
    };

   const response = await api.post(
  `/employees/${employeeId}/transactions`,
  { transaction: transactionData }, // ✅ wrap here
  { headers }
);

      

    return response.data;
  } catch (error) {
    console.error('API Error - createTransaction:', error);
    throw error;
  }
};



// Get the latest transaction (for opening balance)
export const getLatestTransaction = async (employeeId, headers) => {
  try {
    const response = await api.get(`/employees/${employeeId}/transactions/latest`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching latest transaction:', error.response?.data || error.message);
    throw error;
  }
};

// Dashboard API calls
export const getDashboardStats = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats', { headers }); // Note: added /stats
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};


export const getWeeklyStats = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats/weekly', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    throw error;
  }
};

export const getMonthlyStats = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats/monthly', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    throw error;
  }
};

export const getAgentsPerformance = async (headers) => {
  try {
    const response = await api.get('/employees/dashboard/stats/agents_performance', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching agents performance:', error);
    throw error;
  }
};


// Commissions API

export const getCommissions = async ({ month, year } = {}) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      client: userData.client,
      uid: userData.uid,
      'Content-Type': 'application/json',
    };

    // Include query params only if month/year are provided
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;

    const response = await api.get('/employees/commissions', { headers, params });
    return response;
  } catch (error) {
    console.error('Error fetching commissions:', error);
    throw error;
  }
};

export const getCommission = async (commissionId) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      client: userData.client,
      uid: userData.uid,
      'Content-Type': 'application/json',
    };

    const response = await api.get(`/employees/commissions/${commissionId}`, { headers });
    return response;
  } catch (error) {
    console.error('Error fetching commission:', error);
    throw error;
  }
};

export const createCommission = async (commissionData) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      client: userData.client,
      uid: userData.uid,
      'Content-Type': 'application/json',
    };

    if (!commissionData.agent_id) {
      throw new Error('agent_id is required to create a commission.');
    }

    const response = await api.post(
      '/employees/commissions',
      { commission: commissionData },  // wrap data as { commission: { ... } }
      { headers }
    );

    return response;
  } catch (error) {
    console.error('Error creating commission:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCommission = async (commissionId, commissionData) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      client: userData.client,
      uid: userData.uid,
      'Content-Type': 'application/json',
    };

    // Wrap update data with commission key to match Rails strong params expectation
    const response = await api.put(
      `/employees/commissions/${commissionId}`,
      { commission: commissionData },
      { headers }
    );

    return response;
  } catch (error) {
    console.error('Error updating commission:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteCommission = async (commissionId) => {
  try {
    const userData = await getUserData();
    const headers = {
      'access-token': userData.userToken,
      client: userData.client,
      uid: userData.uid,
      'Content-Type': 'application/json',
    };

    const response = await api.delete(`/employees/commissions/${commissionId}`, { headers });
    return response;
  } catch (error) {
    console.error('Error deleting commission:', error.response?.data || error.message);
    throw error;
  }
};
