import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { GlassInputWrapper } from './GlassInputWrapper';

interface AuthFormFieldProps {
    label: string;
    name: string;
    type?: 'text' | 'email' | 'password';
    placeholder: string;
    required?: boolean;
    defaultValue?: string;
}

export const AuthFormField: React.FC<AuthFormFieldProps> = ({
    label,
    name,
    type = 'text',
    placeholder,
    required = false,
    defaultValue,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div>
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <GlassInputWrapper>
                <div className="relative">
                    <input
                        name={name}
                        type={inputType}
                        placeholder={placeholder}
                        required={required}
                        defaultValue={defaultValue}
                        className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                            ) : (
                                <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                            )}
                        </button>
                    )}
                </div>
            </GlassInputWrapper>
        </div>
    );
};
