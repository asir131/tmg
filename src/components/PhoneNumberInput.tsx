import React, { useMemo } from 'react';

const COUNTRY_44 = '+44';
const COUNTRY_353 = '+353';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function getCountryFromValue(phoneValue: string): string {
  if (!phoneValue) return COUNTRY_44;
  const cleaned = phoneValue.replace(/\s/g, '');
  return cleaned.startsWith('+353') ? COUNTRY_353 : COUNTRY_44;
}

function getDigitsAfterPrefix(phoneValue: string, prefix: string): string {
  if (!phoneValue) return '';
  const cleaned = phoneValue.replace(/\s/g, '').replace(/^\+44/, '').replace(/^\+353/, '').replace(/^0/, '');
  return cleaned;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  error,
  required = true,
  disabled = false,
  placeholder,
}) => {
  const country = useMemo(() => getCountryFromValue(value), [value]);
  const is353 = country === COUNTRY_353;
  const maxLen = is353 ? 9 : 10;
  const defaultPlaceholder = is353 ? '1 234 5678' : '7123456789';
  const displayValue = getDigitsAfterPrefix(value, country);

  const handleCountryChange = (newCountry: string) => {
    const digits = getDigitsAfterPrefix(value, country);
    const truncated = digits.slice(0, newCountry === COUNTRY_353 ? 9 : 10);
    // Keep the prefix in value when empty so the dropdown stays on the selected country
    onChange(truncated ? `${newCountry}${truncated}` : newCountry);
  };

  const handleDigitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const prefix = country;
    const capped = digits.slice(0, prefix === COUNTRY_353 ? 9 : 10);
    onChange(capped ? `${prefix}${capped}` : '');
  };

  return (
    <div className="phone-input-wrapper">
      <label className="block text-sm font-medium mb-2">
        Phone Number (UK or Ireland) {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          aria-label="Country code"
          className="shrink-0 w-[110px] pl-3 pr-9 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer appearance-none focus:ring-0"
        >
          <option value={COUNTRY_44}>+44 UK</option>
          <option value={COUNTRY_353}>+353 IE</option>
        </select>
        <div className="relative flex-1">
          <input
            type="tel"
            value={displayValue}
            onChange={handleDigitChange}
            placeholder={placeholder ?? defaultPlaceholder}
            required={required}
            disabled={disabled}
            maxLength={maxLen}
            className="w-full pl-4 pr-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
      {error && <span className="text-red-500 text-sm mt-1 block">{error}</span>}
    </div>
  );
};
