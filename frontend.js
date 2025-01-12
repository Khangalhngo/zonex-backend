// Function to store tokens
const storeTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Function to get tokens
const getTokens = () => {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken')
  };
};

// Function to remove tokens (logout)
const removeTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Example login function
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      storeTokens(data.accessToken, data.refreshToken);
      return true;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}; 