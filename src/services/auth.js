import api from './api';

export const login = async (username, password) => {
  // FastAPI typically uses form data (OAuth2PasswordRequestForm) for login
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
};
