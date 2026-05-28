import React, { useState } from 'react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface Errors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface RegistrationFormProps {
  onSubmit?: (data: Omit<FormData, 'confirmPassword'>) => void | Promise<void>;
}

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  }
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
    errors.password = 'Password must contain an uppercase letter and a number';
  }
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
}

export function RegistrationForm({ onSubmit }: RegistrationFormProps) {
  const [data, setData] = useState<FormData>({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: keyof FormData, value: string) {
    const next = { ...data, [field]: value };
    setData(next);
    // Show errors on change once the field has been touched OR if any field was touched via submit
    const newTouched = { ...touched, [field]: true };
    setTouched(newTouched);
    setErrors(validate(next));
  }

  function handleBlur(field: keyof FormData) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(data));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched = { email: true, password: true, confirmPassword: true };
    setTouched(allTouched);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !data.email || !data.password) return;
    setSubmitting(true);
    await onSubmit?.({ email: data.email, password: data.password });
    setSubmitting(false);
    setSubmitted(true);
  }

  const errs = validate(data);
  const isValid = !!(data.email && data.password && data.confirmPassword &&
    Object.keys(errs).length === 0);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
        />
        {touched.email && errors.email && <span>{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={data.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
        />
        {touched.password && errors.password && <span>{errors.password}</span>}
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={data.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <span>{errors.confirmPassword}</span>
        )}
      </div>

      <button type="submit" disabled={submitting || (submitted && isValid)}>
        Register
      </button>
    </form>
  );
}
