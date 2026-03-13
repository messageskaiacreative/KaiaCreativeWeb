import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', size = '', ...props }) => {

    const variants = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        danger: "btn-error",  // mapping danger to docgen-saas button (if exists, or fallback)
        ghost: "btn-ghost",
        outline: "btn-secondary"
    };

    let variantClass = variants[variant] || "btn-primary";
    if (variant === 'danger') {
        variantClass = "bg-red-600 text-white hover:bg-red-700 border-red-600";
    }

    // size handle
    let sizeClass = "";
    if (size === 'sm') sizeClass = 'btn-sm';
    if (size === 'lg') sizeClass = 'btn-lg';

    return (
        <button
            type={type}
            className={`btn ${variantClass} ${sizeClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;