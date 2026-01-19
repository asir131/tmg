import React from 'react';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  error,
  required = true,
  disabled = false,
  placeholder = '7123456789',
}) => {
  // Extract just the digits after +44
  const getPhoneDigits = (phoneValue: string): string => {
    if (!phoneValue) return '';
    // Remove +44 prefix if present
    const cleaned = phoneValue.replace(/\s/g, '').replace(/^\+44/, '').replace(/^0/, '');
    return cleaned;
  };

  // Convert display value to full format for parent component
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, ''); // Only digits
    const fullNumber = digits ? `+44${digits}` : '';
    onChange(fullNumber);
  };

  const displayValue = getPhoneDigits(value);

  return (
    <div className="phone-input-wrapper">
      <label className="block text-sm font-medium mb-2">
        Phone Number (UK) {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {/* +44 prefix */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <span className="text-text-secondary font-medium">+44</span>
        </div>
        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={10} // 10 digits after +44
          className="w-full pl-16 pr-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      {error && <span className="text-red-500 text-sm mt-1 block">{error}</span>}
    </div>
  );
};
