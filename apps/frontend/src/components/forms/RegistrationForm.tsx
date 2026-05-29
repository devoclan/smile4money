import React, { useState } from 'react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface RegistrationFormProps {
  onSubmit: (data: { email: string }) => void | Promise<void>;
}

function validateEmail(value: string): string | undefined {
  if (!value) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return 'Password must contain an uppercase letter, a number, and a symbol';
  }
  return undefined;
}

function validateConfirm(password: string, confirm: string): string | undefined {
  if (confirm && password !== confirm) return 'Passwords do not match';
  return undefined;
}

export function RegistrationForm({ onSubmit }: RegistrationFormProps) {
  const [fields, setFields] = useState<FormData>({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setFields((f) => ({ ...f, email: value }));
    if (touched.email) {
      setErrors((err) => ({ ...err, email: validateEmail(value) }));
    }
  }

  function handleEmailBlur() {
    setTouched((t) => ({ ...t, email: true }));
    setErrors((err) => ({ ...err, email: validateEmail(fields.email) }));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setFields((f) => ({ ...f, password: value }));
    // Real-time password validation on change
    setErrors((err) => ({
      ...err,
      password: validatePassword(value),
      confirmPassword: fields.confirmPassword
        ? validateConfirm(value, fields.confirmPassword)
        : err.confirmPassword,
    }));
  }

  function handleConfirmChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setFields((f) => ({ ...f, confirmPassword: value }));
    if (touched.confirmPassword) {
      setErrors((err) => ({ ...err, confirmPassword: validateConfirm(fields.password, value) }));
    }
  }

  function handleConfirmBlur() {
    setTouched((t) => ({ ...t, confirmPassword: true }));
    setErrors((err) => ({
      ...err,
      confirmPassword: validateConfirm(fields.password, fields.confirmPassword),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || submitted) return;

    const emailErr = validateEmail(fields.email);
    const passwordErr = validatePassword(fields.password);
    const confirmErr = validateConfirm(fields.password, fields.confirmPassword);

    setTouched({ email: true, password: true, confirmPassword: true });
    setErrors({ email: emailErr, password: passwordErr, confirmPassword: confirmErr });

    if (emailErr || passwordErr || confirmErr) return;

    setSubmitting(true);
    try {
      await onSubmit({ email: fields.email });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  const isValid =
    !validateEmail(fields.email) &&
    !validatePassword(fields.password) &&
    !validateConfirm(fields.password, fields.confirmPassword) &&
    !!fields.email &&
    !!fields.password &&
    !!fields.confirmPassword;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={fields.email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          autoComplete="email"
        />
        {errors.email && <span>{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={fields.password}
          onChange={handlePasswordChange}
          autoComplete="new-password"
        />
        {errors.password && <span>{errors.password}</span>}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={fields.confirmPassword}
          onChange={handleConfirmChange}
          onBlur={handleConfirmBlur}
          autoComplete="new-password"
        />
        {errors.confirmPassword && <span>{errors.confirmPassword}</span>}
      </div>

      <button type="submit" disabled={submitting || submitted}>
        Register
      </button>
    </form>
  );
}
