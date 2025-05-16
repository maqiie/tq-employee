import axios from 'axios';

const API_URL = 'http://192.168.100.5:3001'; // Update with your backend URL

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
