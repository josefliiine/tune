import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tune-backend-opj9.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;