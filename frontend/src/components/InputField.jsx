// frontend/src/components/InputField.jsx
import React from 'react';

/**
 * A reusable InputField component with Tailwind CSS styling.
 * @param {object} props - Component props.
 * @param {string} props.label - The label for the input field.
 * @param {string} props.id - The HTML 'id' and 'name' attribute for the input.
 * @param {string} props.type - The input type (e.g., 'text', 'email', 'password', 'number', 'date').
 * @param {string} props.value - The current value of the input.
 * @param {function} props.onChange - The onChange event handler.
 * @param {string} [props.placeholder=''] - Placeholder text.
 * @param {boolean} [props.required=false] - Whether the input is required.
 * @param {string} [props.step] - Step attribute for number inputs.
 * @param {React.ReactNode} [props.children] - Optional children (e.g., for select options).
 * @param {string} [props.className=''] - Additional Tailwind classes for the input element.
 * @param {string} [props.labelClassName=''] - Additional Tailwind classes for the label element.
 * @param {number} [props.rows] - Number of rows for textarea type.
 */
const InputField = ({
    label,
    id,
    type,
    value,
    onChange,
    placeholder = '',
    required = false,
    step,
    children,
    className = '',
    labelClassName = '',
    rows
}) => {
    const inputClasses = `w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200 shadow-sm ${className}`;
    const labelClasses = `block text-gray-700 text-lg font-medium mb-2 ${labelClassName}`;

    let inputElement;
    if (type === 'textarea') {
        inputElement = (
            <textarea
                id={id}
                name={id}
                rows={rows || 3}
                className={inputClasses}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
            ></textarea>
        );
    } else if (type === 'select') {
        inputElement = (
            <select
                id={id}
                name={id}
                className={inputClasses}
                value={value}
                onChange={onChange}
                required={required}
            >
                {children}
            </select>
        );
    } else {
        inputElement = (
            <input
                type={type}
                id={id}
                name={id}
                step={step}
                className={inputClasses}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
            />
        );
    }

    return (
        <div>
            <label className={labelClasses} htmlFor={id}>{label}</label>
            {inputElement}
        </div>
    );
};

export default InputField;


// frontend/src/components/SubmitButton.jsx
import React from 'react';

/**
 * A reusable SubmitButton component with Tailwind CSS styling.
 * @param {object} props - Component props.
 * @param {string} props.children - The text content of the button.
 * @param {string} [props.type='submit'] - The button type.
 * @param {function} [props.onClick] - The onClick event handler.
 * @param {string} [props.bgColor='bg-blue-600'] - Tailwind background color class.
 * @param {string} [props.hoverBgColor='hover:bg-blue-700'] - Tailwind hover background color class.
 * @param {string} [props.className=''] - Additional Tailwind classes.
 */
const SubmitButton = ({ children, type = 'submit', onClick, bgColor = 'bg-blue-600', hoverBgColor = 'hover:bg-blue-700', className = '' }) => {
    const defaultClasses = `w-full text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xl transform hover:scale-105`;

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${defaultClasses} ${bgColor} ${hoverBgColor} ${className}`}
        >
            {children}
        </button>
    );
};

export default SubmitButton;
