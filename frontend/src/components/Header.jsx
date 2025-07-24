// frontend/src/components/Header.jsx
import React, { useContext } from 'react';
// Assuming AuthContext is available via a path or passed as a prop,
// or you can import it directly if moved to a shared context file.
// For this example, we'll assume it's imported from a central location like App.jsx or a dedicated context file.
// For demonstration, we'll use a placeholder for AuthContext if it's not globally accessible.
const AuthContext = React.createContext(null); // Placeholder for demonstration if not imported

// In a real app, you'd import useAuth from your central AuthContext file:
// import { useAuth } from '../contexts/AuthContext';
const useAuth = () => useContext(AuthContext); // Placeholder hook for demonstration

const Header = () => {
    // In a real app, ensure useAuth provides isAuthenticated and logout
    const { isAuthenticated, logout } = useAuth() || { isAuthenticated: false, logout: () => console.log('Logout clicked') };

    return (
        <header className="bg-gradient-to-r from-blue-700 to-purple-700 text-white p-4 shadow-xl rounded-b-2xl">
            <nav className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
                <h1 className="text-4xl font-extrabold font-inter tracking-wide">
                    <a href="/" className="hover:text-blue-300 transition-colors duration-300">
                        FinanceFlow
                    </a>
                </h1>
                <ul className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6">
                    {isAuthenticated ? (
                        <>
                            <li>
                                <a href="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 text-lg">
                                    Dashboard
                                </a>
                            </li>
                            <li>
                                <a href="/transactions" className="inline-block bg-purple-600 hover:bg-purple-800 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 text-lg">
                                    Transactions
                                </a>
                            </li>
                            <li>
                                <a href="/categories" className="inline-block bg-green-600 hover:bg-green-800 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 text-lg">
                                    Categories
                                </a>
                            </li>
                            <li>
                                <button onClick={logout} className="inline-block bg-red-600 hover:bg-red-800 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 text-lg">
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <a href="/login" className="inline-block bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 text-lg">
                                    Login
                                </a>
                            </li>
                            <li>
                                <a href="/register" className="inline-block bg-green-600 hover:bg-green-800 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 text-lg">
                                    Register
                                </a>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Header;
