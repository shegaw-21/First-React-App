// frontend/src/components/Card.jsx
import React from 'react';

/**
 * A reusable Card component with Tailwind CSS styling.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be displayed inside the card.
 * @param {string} [props.bgColor='bg-white'] - Tailwind background color class (e.g., 'bg-blue-50', 'bg-red-100').
 * @param {string} [props.borderColor='border-gray-200'] - Tailwind border color class.
 * @param {string} [props.className=''] - Additional Tailwind classes for customization.
 */
const Card = ({ children, bgColor = 'bg-white', borderColor = 'border-gray-200', className = '' }) => {
    const defaultClasses = `p-6 rounded-xl shadow-md border ${bgColor} ${borderColor} transform transition-all duration-300 hover:scale-[1.02]`;

    return (
        <div className={`${defaultClasses} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
