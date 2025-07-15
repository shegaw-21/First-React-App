// frontend/src/App.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Create an Auth Context to manage user authentication state globally
const AuthContext = createContext(null);

// Custom hook to use AuthContext
const useAuth = () => {
    return useContext(AuthContext);
};

// Axios instance for API calls
const api = axios.create({
    // IMPORTANT: This baseURL must match the port your backend is running on
    baseURL: 'http://localhost:6916/api', // Updated to port 6916
});

// Axios request interceptor to add JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
                config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Axios response interceptor for error handling (e.g., token expiration)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 403) {
            // Token expired or invalid, log out user
            localStorage.removeItem('token');
            // Using window.location.href to force a full page reload and redirect
            // This is a simple way to handle unauthorized access in a basic app
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// AuthProvider Component
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token in localStorage on mount
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // In a real app, you'd verify the token on the backend or decode it
                // For simplicity, we'll assume a valid token means logged in
                // You might decode the token here to get user info if needed
                setUser({ isLoggedIn: true }); // Placeholder user object
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const register = async (username, email, password) => {
        try {
            await api.post('/auth/register', { username, email, password });
            return true;
        } catch (error) {
            console.error('Registration failed:', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login'; // Redirect to login after logout
    };

    const authContextValue = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!localStorage.getItem('token'), // Check if user object exists and token is present
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// --- Components ---

// Header Component
const Header = () => {
    const { isAuthenticated, logout } = useAuth();
    return (
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg rounded-b-xl">
            <nav className="container mx-auto flex justify-between items-center">
                <h1 className="text-3xl font-bold font-inter">
                    <a href="/" className="hover:text-blue-200 transition-colors">
                        FinanceFlow
                    </a>
                </h1>
                <ul className="flex space-x-6">
                    {isAuthenticated ? (
                        <>
                            <li><a href="/dashboard" className="hover:text-blue-200 transition-colors text-lg">Dashboard</a></li>
                            <li><a href="/transactions" className="hover:text-blue-200 transition-colors text-lg">Transactions</a></li>
                            <li><a href="/categories" className="hover:text-blue-200 transition-colors text-lg">Categories</a></li>
                            <li><button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition-all text-lg">Logout</button></li>
                        </>
                    ) : (
                        <>
                            <li><a href="/login" className="hover:text-blue-200 transition-colors text-lg">Login</a></li>
                            <li><a href="/register" className="hover:text-blue-200 transition-colors text-lg">Register</a></li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
};

// Message Box Component (replaces alert/confirm)
const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;

    let bgColor = 'bg-blue-500';
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'warning') bgColor = 'bg-yellow-500';

    return (
        <div className={`fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-xl z-50 animate-fade-in-down`}>
            <div className="flex justify-between items-center">
                <span>{message}</span>
                <button onClick={onClose} className="ml-4 text-white font-bold text-xl">&times;</button>
            </div>
        </div>
    );
};

// --- Pages ---

// Login Page
const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        const success = await login(email, password);
        if (success) {
            setMessageType('success');
            setMessage('Login successful! Redirecting...');
            setTimeout(() => {
                onLoginSuccess(); // This will trigger App to navigate to dashboard
            }, 1500);
        } else {
            setMessageType('error');
            setMessage('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200"> {/* Added border and shadow for form */}
                <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                            placeholder="your@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105"
                    >
                        Log In
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600 text-lg">
                    Don't have an account? <a href="/register" className="text-blue-600 hover:underline font-semibold">Register here</a>
                </p>
            </div>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
        </div>
    );
};

// Register Page
const RegisterPage = ({ onRegisterSuccess }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        const success = await register(username, email, password);
        if (success) {
            setMessageType('success');
            setMessage('Registration successful! Please log in.');
            setTimeout(() => {
                onRegisterSuccess(); // This will trigger App to navigate to login
            }, 1500);
        } else {
            setMessageType('error');
            setMessage('Registration failed. Email might already be in use.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200"> {/* Added border and shadow for form */}
                <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">Register</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                            placeholder="John Doe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                            placeholder="your@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105"
                    >
                        Register
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600 text-lg">
                    Already have an account? <a href="/login" className="text-green-600 hover:underline font-semibold">Login here</a>
                </p>
            </div>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
        </div>
    );
};

// Dashboard Page
const DashboardPage = () => {
    const [summary, setSummary] = useState(null);
    const [monthlyTrends, setMonthlyTrends] = useState([]);
    const [categorySpending, setCategorySpending] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, trendsRes, categoryRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/dashboard/monthly-trends'),
                    api.get('/dashboard/category-spending')
                ]);
                setSummary(summaryRes.data);

                // Prepare monthly trends data for Recharts
                const combinedTrends = {};
                trendsRes.data.incomeTrends.forEach(item => {
                    if (!combinedTrends[item.month]) combinedTrends[item.month] = { month: item.month, income: 0, expense: 0 };
                    combinedTrends[item.month].income = item.total_amount;
                });
                trendsRes.data.expenseTrends.forEach(item => {
                    if (!combinedTrends[item.month]) combinedTrends[item.month] = { month: item.month, income: 0, expense: 0 };
                    combinedTrends[item.month].expense = item.total_amount;
                });
                setMonthlyTrends(Object.values(combinedTrends).sort((a, b) => a.month.localeCompare(b.month)));

                setCategorySpending(categoryRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setMessageType('error');
                setMessage('Failed to load dashboard data. Please try again.');
            }
        };
        fetchDashboardData();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#19FFD1'];

    return (
        <div className="container mx-auto p-6 bg-gray-50 rounded-xl shadow-lg my-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Dashboard</h2>

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-blue-100 p-6 rounded-xl shadow-md text-center border border-blue-200">
                        <h3 className="text-2xl font-semibold text-blue-800 mb-2">Total Income</h3>
                        <p className="text-4xl font-bold text-blue-600">${(parseFloat(summary.totalIncome) || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-red-100 p-6 rounded-xl shadow-md text-center border border-red-200">
                        <h3 className="text-2xl font-semibold text-red-800 mb-2">Total Expenses</h3>
                        <p className="text-4xl font-bold text-red-600">${(parseFloat(summary.totalExpense) || 0).toFixed(2)}</p>
                    </div>
                    <div className={`p-6 rounded-xl shadow-md text-center border ${parseFloat(summary.netBalance) >= 0 ? 'bg-green-100 border-green-200' : 'bg-orange-100 border-orange-200'}`}>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Net Balance</h3>
                        <p className={`text-4xl font-bold ${parseFloat(summary.netBalance) >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            ${(parseFloat(summary.netBalance) || 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Monthly Income vs. Expense</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Line type="monotone" dataKey="income" stroke="#4F46E5" strokeWidth={2} activeDot={{ r: 6 }} name="Income" />
                            <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expense" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Spending by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categorySpending}
                                dataKey="total_spent"
                                nameKey="category_name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label={({ category_name, percent }) => `${category_name} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={false}
                            >
                                {categorySpending.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={1} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
        </div>
    );
};

// Transactions Page
const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        amount: '', type: 'expense', description: '', transaction_date: '', category_id: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const fetchTransactionsAndCategories = async () => {
        try {
            const [transactionsRes, categoriesRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/categories')
            ]);
            setTransactions(transactionsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessageType('error');
            setMessage('Failed to load transactions or categories.');
        }
    };

    useEffect(() => {
        fetchTransactionsAndCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            if (editingId) {
                await api.put(`/transactions/${editingId}`, formData);
                setMessageType('success');
                setMessage('Transaction updated successfully!');
            } else {
                await api.post('/transactions', formData);
                setMessageType('success');
                setMessage('Transaction added successfully!');
            }
            setFormData({ amount: '', type: 'expense', description: '', transaction_date: '', category_id: '' });
            setEditingId(null);
            fetchTransactionsAndCategories(); // Re-fetch data
        } catch (error) {
            console.error('Error submitting transaction:', error);
            setMessageType('error');
            setMessage('Failed to save transaction. ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (transaction) => {
        setEditingId(transaction.id);
        setFormData({
            amount: transaction.amount,
            type: transaction.type,
            description: transaction.description || '',
            transaction_date: transaction.transaction_date.split('T')[0], // Format date for input
            category_id: transaction.category_id || ''
        });
    };

    const handleDelete = async (id) => {
        // IMPORTANT: In a real app, replace window.confirm with a custom modal for better UX
        const confirmDelete = window.confirm("Are you sure you want to delete this transaction?");
        if (!confirmDelete) return;

        setMessage('');
        try {
            await api.delete(`/transactions/${id}`);
            setMessageType('success');
            setMessage('Transaction deleted successfully!');
            fetchTransactionsAndCategories();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            setMessageType('error');
            setMessage('Failed to delete transaction. ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 rounded-xl shadow-lg my-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">{editingId ? 'Edit Transaction' : 'Add New Transaction'}</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div>
                    <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="amount">Amount</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="type">Type</label>
                    <select
                        id="type"
                        name="type"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="transaction_date">Date</label>
                    <input
                        type="date"
                        id="transaction_date"
                        name="transaction_date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                        value={formData.transaction_date}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="category_id">Category</label>
                    <select
                        id="category_id"
                        name="category_id"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                        value={formData.category_id}
                        onChange={handleChange}
                    >
                        <option value="">Select Category</option>
                        {categories.filter(cat => cat.type === formData.type).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                        placeholder="Optional description..."
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                </div>
                <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105"
                    >
                        {editingId ? 'Update Transaction' : 'Add Transaction'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ amount: '', type: 'expense', description: '', transaction_date: '', category_id: '' });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>

            <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">All Transactions</h3>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">No transactions recorded yet.</td>
                            </tr>
                        ) : (
                            transactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900">{new Date(t.transaction_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900">{t.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900">{t.category_name || 'Uncategorized'}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        ${(parseFloat(t.amount) || 0).toFixed(2)} {/* Applied parseFloat fix here */}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium">
                                        <button
                                            onClick={() => handleEdit(t)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
        </div>
    );
};

// Categories Page
const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: '', type: 'expense' });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setMessageType('error');
            setMessage('Failed to load categories.');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, formData);
                setMessageType('success');
                setMessage('Category updated successfully!');
            } else {
                await api.post('/categories', formData);
                setMessageType('success');
                setMessage('Category added successfully!');
            }
            setFormData({ name: '', type: 'expense' });
            setEditingId(null);
            fetchCategories(); // Re-fetch categories
        } catch (error) {
            console.error('Error submitting category:', error);
            setMessageType('error');
            setMessage('Failed to save category. ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({ name: category.name, type: category.type });
    };

    const handleDelete = async (id) => {
        // IMPORTANT: In a real app, replace window.confirm with a custom modal for better UX
        const confirmDelete = window.confirm("Are you sure you want to delete this category? Transactions linked to this category will become 'Uncategorized'.");
        if (!confirmDelete) return;

        setMessage('');
        try {
            await api.delete(`/categories/${id}`);
            setMessageType('success');
            setMessage('Category deleted successfully!');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            setMessageType('error');
            setMessage('Failed to delete category. ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 rounded-xl shadow-lg my-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">{editingId ? 'Edit Category' : 'Add New Category'}</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div>
                    <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="name">Category Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-lg font-medium mb-2" htmlFor="type">Type</label>
                    <select
                        id="type"
                        name="type"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </div>
                <div className="flex items-end space-x-4">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105 flex-grow"
                    >
                        {editingId ? 'Update Category' : 'Add Category'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ name: '', type: 'expense' });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Categories</h3>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">No categories defined yet.</td>
                            </tr>
                        ) : (
                            categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900">{cat.name}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-semibold ${cat.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {cat.type.charAt(0).toUpperCase() + cat.type.slice(1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
        </div>
    );
};


// Main App Component with Simple Routing
const App = () => {
    const [path, setPath] = useState(window.location.pathname);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const onLocationChange = () => setPath(window.location.pathname);
        window.addEventListener('popstate', onLocationChange);
        return () => window.removeEventListener('popstate', onLocationChange);
    }, []);

    const navigate = (newPath) => {
        window.history.pushState({}, '', newPath);
        setPath(newPath);
    };

    const handleLoginSuccess = () => {
        navigate('/dashboard');
    };

    const handleRegisterSuccess = () => {
        navigate('/login');
    };

    const renderContent = () => {
        if (!isAuthenticated) {
            if (path === '/register') {
                return <RegisterPage onRegisterSuccess={handleRegisterSuccess} />;
            }
            return <LoginPage onLoginSuccess={handleLoginSuccess} />;
        }

        switch (path) {
            case '/dashboard':
                return <DashboardPage />;
            case '/transactions':
                return <TransactionsPage />;
            case '/categories':
                return <CategoriesPage />;
            case '/login': // If logged in, redirect from login/register
            case '/register':
                navigate('/dashboard');
                return null; // Render nothing while redirecting
            default:
                navigate('/dashboard'); // Default to dashboard if not logged in or invalid path
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-inter">
            <Header />
            <main className="flex-grow flex justify-center items-start"> {/* Added flex properties for centering */}
                {renderContent()}
            </main>
        </div>
    );
};

// Wrap App with AuthProvider
const RootApp = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default RootApp;
