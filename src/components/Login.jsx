import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- DUMMY USER INTERCEPT ---
        if (username === 'admin' && password === 'admin') {
            login('dummy_admin_token');
            navigate('/dashboard'); // <-- CHANGED
            return;
        }
        if (username === 'user' && password === 'user') {
            login('dummy_user_token');
            navigate('/dashboard'); // <-- CHANGED
            return;
        }
        // ----------------------------

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post('/api/v1/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(response.data.access_token);
            navigate('/dashboard'); // <-- CHANGED
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Username (or 'admin' / 'user'): </label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password (or 'admin' / 'user'): </label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white' }}>
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;
