/**
 * Validates UK phone number format
 * Accepts: +447123456789 (with +44 prefix)
 */
export const validateUKPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove spaces
  const cleaned = phone.replace(/\s/g, '');
  
  // UK phone pattern: +44 prefix, followed by 10 digits starting with 7
  const ukPhonePattern = /^\+44[1-9]\d{9}$/;
  
  return ukPhonePattern.test(cleaned);
};

/**
 * Formats phone number for display
 */
export const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return 'Not provided';
  
  // Format: +44 7123 456789
  if (phone.startsWith('+44')) {
    const number = phone.substring(3);
    return `+44 ${number.substring(0, 4)} ${number.substring(4)}`;
  }
  
  // Format: 07123 456789
  if (phone.startsWith('0')) {
    return `${phone.substring(0, 5)} ${phone.substring(5)}`;
  }
  
  return phone;
};

/**
 * Normalizes phone number for API (removes spaces)
 */
export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\s/g, '');
};

/**
 * Auto-formats phone number as user types
 * Converts 07123456789 to +447123456789
 */
export const autoFormatPhoneNumber = (input: string): string => {
  // Remove all non-digit characters except +
  const cleaned = input.replace(/[^\d+]/g, '');
  
  // Auto-format: Add +44 if user starts with 0
  if (cleaned.startsWith('0') && !cleaned.startsWith('+44')) {
    return '+44' + cleaned.substring(1);
  }
  
  return cleaned;
};
