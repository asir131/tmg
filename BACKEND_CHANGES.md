# Frontend Integration Guide - Phone Number Implementation

## Overview

The backend API has been updated to require phone numbers during user registration and social authentication. This document outlines all the changes and provides guidance for frontend integration.

**Release Date**: [Current Date]  
**API Version**: v1  
**Breaking Changes**: Yes (for registration and social auth endpoints)

---

## Table of Contents

1. [Summary of Changes](#summary-of-changes)
2. [Breaking Changes](#breaking-changes)
3. [API Response Changes](#api-response-changes)
4. [Frontend Implementation Guide](#frontend-implementation-guide)
5. [Migration Strategy](#migration-strategy)
6. [Code Examples](#code-examples)
7. [Testing Checklist](#testing-checklist)

---

## Summary of Changes

### What Changed?

1. **Phone number is now required** for all new user registrations (local and social auth)
2. **Phone number validation** - Only UK format phone numbers are accepted
3. **API responses updated** - All user objects now include `phone_number` field
4. **Profile updates** - Phone number can be updated/removed (with validation)

### What Stayed the Same?

- Existing users without phone numbers can continue using the app
- Profile update endpoint still accepts optional phone_number
- All other endpoints remain unchanged

---

## Breaking Changes

### 1. User Registration Endpoint

**Endpoint**: `POST /api/v1/auth/register`

**Before:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**After (Required):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone_number": "+447123456789"  // ← NEW: Required field
}
```

**Action Required**: Update registration form to include phone number input field.

---

### 2. Social Authentication Endpoints

**Endpoints Affected:**
- `POST /api/v1/auth/google/mobile`
- `POST /api/v1/auth/firebase/google`
- `POST /api/v1/auth/apple`

**Before:**
```json
{
  "idToken": "google-id-token-here"
}
```

**After (Required):**
```json
{
  "idToken": "google-id-token-here",
  "phone_number": "+447123456789"  // ← NEW: Required field
}
```

**Action Required**: 
- Collect phone number before or after social authentication
- Update social auth flow to include phone number in request

---

## API Response Changes

### User Object Structure

All endpoints that return user objects now include `phone_number`:

**Updated Response Structure:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+447123456789",  // ← NEW: Always included
      "role": "user",
      "verified": true
    }
  }
}
```

**Endpoints Affected:**
- `POST /api/v1/auth/register` - Response includes phone_number
- `POST /api/v1/auth/login` - Response includes phone_number
- `GET /api/v1/user/profile` - Response includes phone_number
- `PUT /api/v1/user/profile` - Response includes phone_number
- `GET /api/v1/admin/users` - Response includes phone_number for each user
- All social authentication endpoints - Response includes phone_number

**Action Required**: Update TypeScript interfaces/types to include `phone_number` field.

---

## Frontend Implementation Guide

### Step 1: Update Type Definitions

**TypeScript Interface Update:**

```typescript
// types/user.ts or similar
export interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;  // ← Add this field
  role: 'user' | 'admin';
  verified: boolean;
  // ... other fields
}

// API Response Types
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

---

### Step 2: Update Registration Form

**React Component Example:**

```tsx
import React, { useState } from 'react';
import { registerUser } from '../services/authService';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',  // ← Add phone number field
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // UK Phone Number Validation
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    const ukPhonePattern = /^(\+44|0)[1-9]\d{8,9}$/;
    return ukPhonePattern.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!formData.phone_number) {
      setErrors({ phone_number: 'Phone number is required' });
      return;
    }

    if (!validatePhoneNumber(formData.phone_number)) {
      setErrors({ 
        phone_number: 'Please enter a valid UK phone number (e.g., +447123456789 or 07123456789)' 
      });
      return;
    }

    try {
      const response = await registerUser(formData);
      // Handle success
      console.log('Registration successful:', response);
    } catch (error: any) {
      // Handle error
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Phone Number (UK)</label>
        <input
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          placeholder="+447123456789 or 07123456789"
          required
        />
        {errors.phone_number && (
          <span className="error">{errors.phone_number}</span>
        )}
        <small>Enter your UK phone number (e.g., +447123456789 or 07123456789)</small>
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <button type="submit">Register</button>
    </form>
  );
};
```

**Phone Number Input Component (Reusable):**

```tsx
// components/PhoneNumberInput.tsx
import React from 'react';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  error,
  required = true,
}) => {
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit characters except +
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Auto-format: Add +44 if user starts with 0
    if (cleaned.startsWith('0') && !cleaned.startsWith('+44')) {
      return '+44' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  return (
    <div className="phone-input-wrapper">
      <label>
        Phone Number (UK) {required && <span className="required">*</span>}
      </label>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(formatPhoneNumber(e.target.value))}
        placeholder="+447123456789"
        required={required}
        maxLength={13} // +44 + 10 digits
      />
      {error && <span className="error-message">{error}</span>}
      <small className="helper-text">
        Format: +447123456789 or 07123456789
      </small>
    </div>
  );
};
```

---

### Step 3: Update Social Authentication Flow

**Option A: Collect Phone Number Before Social Auth**

```tsx
// components/SocialAuthFlow.tsx
import React, { useState } from 'react';
import { authenticateGoogle } from '../services/authService';

const SocialAuthFlow = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const handleGoogleSignIn = async () => {
    // Step 1: Collect phone number first
    if (!phoneNumber) {
      setShowPhoneInput(true);
      return;
    }

    // Step 2: Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      alert('Please enter a valid UK phone number');
      return;
    }

    // Step 3: Initiate Google Sign-In
    try {
      const googleUser = await signInWithGoogle(); // Your Google Sign-In SDK
      const idToken = googleUser.idToken;

      // Step 4: Send to backend with phone number
      const response = await authenticateGoogle(idToken, phoneNumber);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {showPhoneInput ? (
        <div>
          <PhoneNumberInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            required
          />
          <button onClick={handleGoogleSignIn}>Continue with Google</button>
        </div>
      ) : (
        <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
};
```

**Option B: Collect Phone Number After Social Auth (Recommended)**

```tsx
// components/SocialAuthFlow.tsx
import React, { useState } from 'react';
import { authenticateGoogle } from '../services/authService';

const SocialAuthFlow = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pendingAuth, setPendingAuth] = useState<{ idToken: string; provider: string } | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      // Step 1: Authenticate with Google
      const googleUser = await signInWithGoogle();
      const idToken = googleUser.idToken;

      // Step 2: Try to authenticate with backend (may fail if new user)
      try {
        const response = await authenticateGoogle(idToken, ''); // Empty phone for existing users
        // Success - existing user, no phone needed
        handleAuthSuccess(response);
      } catch (error: any) {
        // Step 3: If error is "Phone number required", show phone input
        if (error.response?.data?.message?.includes('Phone number')) {
          setPendingAuth({ idToken, provider: 'google' });
        } else {
          throw error;
        }
      }
    } catch (error) {
      // Handle other errors
    }
  };

  const handlePhoneSubmit = async () => {
    if (!pendingAuth || !validatePhoneNumber(phoneNumber)) {
      alert('Please enter a valid UK phone number');
      return;
    }

    try {
      const response = await authenticateGoogle(pendingAuth.idToken, phoneNumber);
      handleAuthSuccess(response);
      setPendingAuth(null);
      setPhoneNumber('');
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {pendingAuth ? (
        <div className="phone-collection-modal">
          <h3>Complete Your Registration</h3>
          <p>Please provide your UK phone number to continue</p>
          <PhoneNumberInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            required
          />
          <button onClick={handlePhoneSubmit}>Continue</button>
        </div>
      ) : (
        <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
};
```

---

### Step 4: Update Auth Service Functions

**Auth Service Update:**

```typescript
// services/authService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone_number: string;  // ← Add this field
}

export interface SocialAuthData {
  idToken: string;
  phone_number: string;  // ← Add this field
}

export const registerUser = async (data: RegisterData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

// Google Mobile Auth
export const authenticateGoogle = async (idToken: string, phoneNumber: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/google/mobile`, {
    idToken,
    phone_number: phoneNumber,  // ← Add this field
  });
  return response.data;
};

// Firebase Google Auth
export const authenticateFirebaseGoogle = async (idToken: string, phoneNumber: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/firebase/google`, {
    idToken,
    phone_number: phoneNumber,  // ← Add this field
  });
  return response.data;
};

// Apple Auth
export const authenticateApple = async (
  idToken: string, 
  phoneNumber: string,
  user?: { email?: string; name?: { firstName?: string; lastName?: string } }
) => {
  const response = await axios.post(`${API_BASE_URL}/auth/apple`, {
    idToken,
    phone_number: phoneNumber,  // ← Add this field
    user,
  });
  return response.data;
};
```

---

### Step 5: Update Profile Components

**Profile Display:**

```tsx
// components/UserProfile.tsx
import React from 'react';
import { User } from '../types/user';

interface UserProfileProps {
  user: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Phone: {user.phone_number || 'Not provided'}</p>
      {/* Display phone number if available */}
    </div>
  );
};
```

**Profile Update Form:**

```tsx
// components/ProfileUpdateForm.tsx
import React, { useState } from 'react';
import { updateProfile } from '../services/profileService';
import { PhoneNumberInput } from './PhoneNumberInput';

export const ProfileUpdateForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Phone number is optional for updates, but if provided, must be valid
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setErrors({ 
        phone_number: 'Please enter a valid UK phone number' 
      });
      return;
    }

    try {
      await updateProfile({ phone_number: phoneNumber || null });
      // Handle success
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PhoneNumberInput
        value={phoneNumber}
        onChange={setPhoneNumber}
        error={errors.phone_number}
        required={false}  // Optional for updates
      />
      <button type="submit">Update Profile</button>
    </form>
  );
};
```

---

### Step 6: Update User State Management

**Redux/Zustand Store Update:**

```typescript
// store/userSlice.ts (Redux Toolkit example)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;  // ← Add this field
  role: 'user' | 'admin';
  verified: boolean;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    updateUserPhone: (state, action: PayloadAction<string | null>) => {
      if (state.user) {
        state.user.phone_number = action.payload;
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, updateUserPhone, clearUser } = userSlice.actions;
export default userSlice.reducer;
```

---

## Migration Strategy

### For Existing Users

**Scenario**: Users who registered before this update don't have phone numbers.

**Solution**: 
1. Allow existing users to continue using the app without phone numbers
2. Prompt them to add phone number (optional but recommended)
3. Show a banner or notification encouraging phone number addition

**Implementation:**

```tsx
// components/PhoneNumberPrompt.tsx
import React, { useState } from 'react';
import { useUser } from '../hooks/useUser';
import { updateProfile } from '../services/profileService';

export const PhoneNumberPrompt = () => {
  const { user } = useUser();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Only show if user doesn't have phone number
  if (!user || user.phone_number || dismissed) {
    return null;
  }

  const handleAddPhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      alert('Please enter a valid UK phone number');
      return;
    }

    try {
      await updateProfile({ phone_number: phoneNumber });
      setDismissed(true);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="phone-prompt-banner">
      <p>Add your phone number for better account security</p>
      <PhoneNumberInput
        value={phoneNumber}
        onChange={setPhoneNumber}
        required
      />
      <button onClick={handleAddPhone}>Add Phone Number</button>
      <button onClick={() => setDismissed(true)}>Maybe Later</button>
    </div>
  );
};
```

---

## Phone Number Validation

### Client-Side Validation Function

```typescript
// utils/validation.ts

/**
 * Validates UK phone number format
 * Accepts: +447123456789 or 07123456789
 */
export const validateUKPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove spaces
  const cleaned = phone.replace(/\s/g, '');
  
  // UK phone pattern: +44 or 0 prefix, followed by 9-10 digits
  const ukPhonePattern = /^(\+44|0)[1-9]\d{8,9}$/;
  
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
```

---

## Error Handling

### Common Error Responses

```typescript
// Handle API errors
try {
  await registerUser(formData);
} catch (error: any) {
  const errorMessage = error.response?.data?.message || 'An error occurred';
  
  if (errorMessage.includes('Phone number is required')) {
    setErrors({ phone_number: 'Phone number is required' });
  } else if (errorMessage.includes('valid UK phone number')) {
    setErrors({ phone_number: 'Please enter a valid UK phone number' });
  } else if (errorMessage.includes('Email already registered')) {
    setErrors({ email: 'This email is already registered' });
  } else {
    setErrors({ general: errorMessage });
  }
}
```

---

## Testing Checklist

### Registration Flow
- [ ] Registration form includes phone number field
- [ ] Phone number is required (form validation)
- [ ] UK phone format validation works (+44 and 0 prefix)
- [ ] Error messages display correctly for invalid phone numbers
- [ ] Registration succeeds with valid phone number
- [ ] User object in response includes phone_number

### Social Authentication Flow
- [ ] Google Sign-In collects phone number (new users)
- [ ] Apple Sign-In collects phone number (new users)
- [ ] Firebase Google Auth collects phone number (new users)
- [ ] Existing users can sign in without phone number prompt
- [ ] Phone number validation works in social auth flow

### Profile Management
- [ ] Profile display shows phone number (if available)
- [ ] Profile update form includes phone number field
- [ ] Phone number can be updated
- [ ] Phone number can be removed (set to null)
- [ ] Invalid phone numbers are rejected

### User State Management
- [ ] User type/interface includes phone_number field
- [ ] User state updates correctly after registration/login
- [ ] User state updates correctly after profile update
- [ ] Phone number persists in user state

### Existing Users (Migration)
- [ ] Existing users without phone numbers can still log in
- [ ] Optional phone number prompt appears for users without phone
- [ ] Users can dismiss phone number prompt
- [ ] Users can add phone number later via profile

---

## API Endpoints Reference

### Updated Endpoints

| Endpoint | Method | Phone Number | Status |
|----------|--------|--------------|--------|
| `/api/v1/auth/register` | POST | **Required** | Breaking |
| `/api/v1/auth/login` | POST | In response | Non-breaking |
| `/api/v1/auth/google/mobile` | POST | **Required** | Breaking |
| `/api/v1/auth/firebase/google` | POST | **Required** | Breaking |
| `/api/v1/auth/apple` | POST | **Required** | Breaking |
| `/api/v1/user/profile` | GET | In response | Non-breaking |
| `/api/v1/user/profile` | PUT | Optional (validated) | Non-breaking |

### Phone Number Format

- **Accepted Formats**: 
  - `+447123456789` (international format)
  - `07123456789` (UK national format)
- **Validation Pattern**: `^(\+44|0)[1-9]\d{8,9}$`
- **Max Length**: 13 characters (for +44 format)

---

## Support & Questions

If you encounter any issues during integration:

1. Check the API response error messages
2. Verify phone number format matches UK requirements
3. Ensure all required fields are included in requests
4. Review the [API cURL Examples](./API-CURL-EXAMPLES-PHONE-NUMBER.md) document

---

## Version History

- **v1.0.0** - Initial phone number implementation
  - Phone number required for registration
  - Phone number required for social auth
  - Phone number included in all user responses
