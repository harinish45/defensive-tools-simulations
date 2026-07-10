import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PasswordAnalyzer from '../page';

describe('PasswordAnalyzer', () => {
  it('renders the title', () => {
    render(<PasswordAnalyzer />);
    expect(screen.getByText('Password Strength Analyzer')).toBeInTheDocument();
  });

  it('updates strength as password is typed', async () => {
    render(<PasswordAnalyzer />);
    const input = screen.getByPlaceholderText('Type a password to analyze...');

    // Initially weak
    expect(screen.getByText('Strength: Enter a password')).toBeInTheDocument();

    // Type weak password
    await act(async () => {
      fireEvent.change(input, { target: { value: 'password' } });
    });

    expect(screen.getByText('Strength: Weak')).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { value: 'password123' } });
    });

    expect(screen.getByText('Strength: Moderate')).toBeInTheDocument();
  });
});
