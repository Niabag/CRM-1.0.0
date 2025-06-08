const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Users
  USERS: `${API_BASE_URL}/api/users`,
  
  // Clients
  CLIENTS: `${API_BASE_URL}/api/clients`,
  
  // Devis
  DEVIS: `${API_BASE_URL}/api/devis`,
  
  // Business Cards
  BUSINESS_CARDS: `${API_BASE_URL}/api/business-cards`,
  
  // Stats
  STATS: `${API_BASE_URL}/api/stats`,
};

export default API_BASE_URL;