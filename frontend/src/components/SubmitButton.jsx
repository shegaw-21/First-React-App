// frontend/src/components/SubmitButton.jsx
import React from 'react';

/**
 * A reusable SubmitButton component with Tailwind CSS styling.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The text content or JSX to be displayed inside the button.
 * @param {string} [props.type='submit'] - The button type (e.g., 'submit', 'button', 'reset').
 * @param {function} [props.onClick] - The onClick event handler.
 * @param {string} [props.bgColor='bg-blue-600'] - Tailwind background color class.
 * @param {string} [props.hoverBgColor='hover:bg-blue-700'] - Tailwind hover background color class.
 * @param {string} [props.className=''] - Additional Tailwind classes.
 */
const SubmitButton = ({ children, type = 'submit', onClick, bgColor = 'bg-blue-600', hoverBgColor = 'hover:bg-blue-700', className = '' }) => {
    // Default classes for all buttons
    const defaultClasses = `text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105`;

    return (
        <button
            type={type}
            onClick={onClick}
            // Combine default classes with specific background/hover colors and any additional classes
            className={`${defaultClasses} ${bgColor} ${hoverBgColor} ${className}`}
        >
            {children}
        </button>
    );
};

export default SubmitButton;
