    // backend/server.js

    require('dotenv').config(); // Load environment variables from .env file
    const express = require('express');
    const mysql = require('mysql2/promise');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const bcrypt = require('bcryptjs'); // For password hashing
    const jwt = require('jsonwebtoken'); // For JSON Web Tokens

    const app = express();
    // Use the PORT from .env, or default to 5000 if not specified.
    const port = process.env.PORT || 5000;

    // Middleware setup
    app.use(cors()); // Enable CORS for all origins (adjust for production)
    app.use(bodyParser.json()); // Parse JSON request bodies

    // Database connection pool
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // Test DB connection
    app.get('/api/test-db', async(req, res) => {
        try {
            await pool.query('SELECT 1');
            res.status(200).json({ message: 'Database connected successfully!' });
        } catch (error) {
            console.error('Database connection failed:', error);
            res.status(500).json({ message: 'Database connection failed', error: error.message });
        }
    });

    // --- JWT Authentication Middleware ---
    // This middleware will protect routes that require authentication
    const authenticateToken = (req, res, next) => {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({ message: 'Access Denied: No token provided.' });
        }

        try {
            // Verify token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Attach user information (e.g., user ID) to the request
            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(403).json({ message: 'Access Denied: Invalid token.' });
        }
    };

    // --- API Routes ---

    // 1. User Authentication Routes
    // Register User
    app.post('/api/auth/register', async(req, res) => {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        try {
            // Check if user already exists
            const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                return res.status(409).json({ message: 'Email already registered.' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert new user into database
            const [result] = await pool.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]
            );
            res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
        } catch (error) {
            console.error('Error during registration:', error);
            res.status(500).json({ message: 'Server error during registration.', error: error.message });
        }
    });

    // Login User
    app.post('/api/auth/login', async(req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        try {
            // Find user by email
            const [rows] = await pool.execute('SELECT id, username, email, password FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const user = rows[0];

            // Compare provided password with hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            // Generate JWT
            // The payload typically includes user ID and any other relevant, non-sensitive data
            const token = jwt.sign({ id: user.id, username: user.username, email: user.email },
                process.env.JWT_SECRET, { expiresIn: '1h' } // Token expires in 1 hour
            );

            res.status(200).json({
                message: 'Login successful!',
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        } catch (error) {
            console.error('Error during login:', error);
            res.status(500).json({ message: 'Server error during login.', error: error.message });
        }
    });

    // 2. Category Management Routes (Protected)
    // Get all categories for a user
    app.get('/api/categories', authenticateToken, async(req, res) => {
        try {
            const [categories] = await pool.execute('SELECT * FROM categories WHERE user_id = ?', [req.user.id]);
            res.status(200).json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Server error fetching categories.', error: error.message });
        }
    });

    // Add a new category
    app.post('/api/categories', authenticateToken, async(req, res) => {
        const { name, type } = req.body; // type should be 'income' or 'expense'

        if (!name || !type) {
            return res.status(400).json({ message: 'Category name and type are required.' });
        }
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Category type must be "income" or "expense".' });
        }

        try {
            const [result] = await pool.execute(
                'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)', [req.user.id, name, type]
            );
            res.status(201).json({ message: 'Category added successfully!', categoryId: result.insertId });
        } catch (error) {
            console.error('Error adding category:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Category with this name and type already exists for this user.' });
            }
            res.status(500).json({ message: 'Server error adding category.', error: error.message });
        }
    });

    // Update a category
    app.put('/api/categories/:id', authenticateToken, async(req, res) => {
        const { id } = req.params;
        const { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: 'Category name and type are required.' });
        }
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Category type must be "income" or "expense".' });
        }

        try {
            // Ensure the category belongs to the authenticated user
            const [existingCategory] = await pool.execute('SELECT id FROM categories WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (existingCategory.length === 0) {
                return res.status(404).json({ message: 'Category not found or you do not have permission to update it.' });
            }

            const [result] = await pool.execute(
                'UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?', [name, type, id, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Category not found or no changes made.' });
            }
            res.status(200).json({ message: 'Category updated successfully!' });
        } catch (error) {
            console.error('Error updating category:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Another category with this name and type already exists for this user.' });
            }
            res.status(500).json({ message: 'Server error updating category.', error: error.message });
        }
    });

    // Delete a category
    app.delete('/api/categories/:id', authenticateToken, async(req, res) => {
        const { id } = req.params;

        try {
            // Ensure the category belongs to the authenticated user before deleting
            const [result] = await pool.execute('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, req.user.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Category not found or you do not have permission to delete it.' });
            }
            res.status(200).json({ message: 'Category deleted successfully!' });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ message: 'Server error deleting category.', error: error.message });
        }
    });

    // 3. Transaction Management Routes (Protected)
    // Get all transactions for a user
    app.get('/api/transactions', authenticateToken, async(req, res) => {
        try {
            const [transactions] = await pool.execute(
                'SELECT t.*, c.name AS category_name FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? ORDER BY t.transaction_date DESC, t.created_at DESC', [req.user.id]
            );
            res.status(200).json(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({ message: 'Server error fetching transactions.', error: error.message });
        }
    });

    // Add a new transaction
    app.post('/api/transactions', authenticateToken, async(req, res) => {
        const { amount, type, description, transaction_date, category_id } = req.body;

        if (!amount || !type || !transaction_date) {
            return res.status(400).json({ message: 'Amount, type, and date are required.' });
        }
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Transaction type must be "income" or "expense".' });
        }

        try {
            // Optional: Validate category_id belongs to the user if provided
            if (category_id) {
                const [categoryCheck] = await pool.execute('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.user.id]);
                if (categoryCheck.length === 0) {
                    return res.status(400).json({ message: 'Invalid category ID or category does not belong to user.' });
                }
            }

            const [result] = await pool.execute(
                'INSERT INTO transactions (user_id, amount, type, description, transaction_date, category_id) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, amount, type, description, transaction_date, category_id || null]
            );
            res.status(201).json({ message: 'Transaction added successfully!', transactionId: result.insertId });
        } catch (error) {
            console.error('Error adding transaction:', error);
            res.status(500).json({ message: 'Server error adding transaction.', error: error.message });
        }
    });

    // Update a transaction
    app.put('/api/transactions/:id', authenticateToken, async(req, res) => {
        const { id } = req.params;
        const { amount, type, description, transaction_date, category_id } = req.body;

        if (!amount || !type || !transaction_date) {
            return res.status(400).json({ message: 'Amount, type, and date are required.' });
        }
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Transaction type must be "income" or "expense".' });
        }

        try {
            // Optional: Validate category_id belongs to the user if provided
            if (category_id) {
                const [categoryCheck] = await pool.execute('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.user.id]);
                if (categoryCheck.length === 0) {
                    return res.status(400).json({ message: 'Invalid category ID or category does not belong to user.' });
                }
            }

            // Ensure the transaction belongs to the authenticated user
            const [result] = await pool.execute(
                'UPDATE transactions SET amount = ?, type = ?, description = ?, transaction_date = ?, category_id = ? WHERE id = ? AND user_id = ?', [amount, type, description, transaction_date, category_id || null, id, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Transaction not found or you do not have permission to update it.' });
            }
            res.status(200).json({ message: 'Transaction updated successfully!' });
        } catch (error) {
            console.error('Error updating transaction:', error);
            res.status(500).json({ message: 'Server error updating transaction.', error: error.message });
        }
    });

    // Delete a transaction
    app.delete('/api/transactions/:id', authenticateToken, async(req, res) => {
        const { id } = req.params;

        try {
            // Ensure the transaction belongs to the authenticated user before deleting
            const [result] = await pool.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Transaction not found or you do not have permission to delete it.' });
            }
            res.status(200).json({ message: 'Transaction deleted successfully!' });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            res.status(500).json({ message: 'Server error deleting transaction.', error: error.message });
        }
    });

    // 4. Dashboard and Reporting Routes (Protected)
    // Get summary: total income, total expenses, net balance
    app.get('/api/dashboard/summary', authenticateToken, async(req, res) => {
        try {
            const [incomeResult] = await pool.execute(
                'SELECT SUM(amount) AS total_income FROM transactions WHERE user_id = ? AND type = "income"', [req.user.id]
            );
            const totalIncome = incomeResult[0].total_income || 0;

            const [expenseResult] = await pool.execute(
                'SELECT SUM(amount) AS total_expense FROM transactions WHERE user_id = ? AND type = "expense"', [req.user.id]
            );
            const totalExpense = expenseResult[0].total_expense || 0;

            const netBalance = totalIncome - totalExpense;

            res.status(200).json({ totalIncome, totalExpense, netBalance });
        } catch (error) {
            console.error('Error fetching summary:', error);
            res.status(500).json({ message: 'Server error fetching summary.', error: error.message });
        }
    });

    // Get monthly trends (e.g., income/expense by month)
    app.get('/api/dashboard/monthly-trends', authenticateToken, async(req, res) => {
        try {
            // Get income trends by month
            const [incomeTrends] = await pool.execute(
                `SELECT
                    DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                    SUM(amount) AS total_amount
                FROM transactions
                WHERE user_id = ? AND type = 'income'
                GROUP BY month
                ORDER BY month ASC`, [req.user.id]
            );

            // Get expense trends by month
            const [expenseTrends] = await pool.execute(
                `SELECT
                    DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                    SUM(amount) AS total_amount
                FROM transactions
                WHERE user_id = ? AND type = 'expense'
                GROUP BY month
                ORDER BY month ASC`, [req.user.id]
            );

            res.status(200).json({ incomeTrends, expenseTrends });
        } catch (error) {
            console.error('Error fetching monthly trends:', error);
            res.status(500).json({ message: 'Server error fetching monthly trends.', error: error.message });
        }
    });

    // Get spending by category
    app.get('/api/dashboard/category-spending', authenticateToken, async(req, res) => {
        try {
            const [categorySpending] = await pool.execute(
                `SELECT
                    c.name AS category_name,
                    SUM(t.amount) AS total_spent
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = ? AND t.type = 'expense'
                GROUP BY c.name
                ORDER BY total_spent DESC`, [req.user.id]
            );
            res.status(200).json(categorySpending);
        } catch (error) {
            console.error('Error fetching category spending:', error);
            res.status(500).json({ message: 'Server error fetching category spending.', error: error.message });
        }
    });


    // Start the server
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`Test DB: http://localhost:${port}/api/test-db`);
        console.log(`Register: POST http://localhost:${port}/api/auth/register`);
        console.log(`Login: POST http://localhost:${port}/api/auth/login`);
    });