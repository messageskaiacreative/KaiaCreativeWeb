import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, type = 'text', error, className = '', ...props }, ref) => {
    return (
        <div className="mb-3">
            {label && (
                <label className="form-label">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                className={`form-input ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="mt-0.5 text-[11px] text-red-500 font-medium">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;