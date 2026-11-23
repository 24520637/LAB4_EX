import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimpleForm from './SimpleForm.jsx';

const fields = [
  { name: 'alpha', label: 'Alpha', validate: value => value.trim() ? '' : 'Alpha required' },
  { name: 'beta', label: 'Beta', validate: value => value.trim() ? '' : 'Beta required' },
];

describe('SimpleForm context', () => {
  it('keeps values independent and submits the current valid snapshot', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SimpleForm fields={fields} onSubmit={onSubmit} />);
    const alpha = screen.getByRole('textbox', { name: 'Alpha' });
    const beta = screen.getByRole('textbox', { name: 'Beta' });
    await user.type(alpha, 'A');
    expect(beta).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(beta).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Beta required')).toHaveAttribute('id', beta.getAttribute('aria-describedby'));
    await user.type(beta, 'B');
    expect(beta).toHaveAttribute('aria-invalid', 'false');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith({ alpha: 'A', beta: 'B' });
  });

  it('uses unique label IDs and shows touched errors', async () => {
    const user = userEvent.setup();
    render(<SimpleForm fields={fields} />);
    const alpha = screen.getByRole('textbox', { name: 'Alpha' });
    const beta = screen.getByRole('textbox', { name: 'Beta' });
    expect(alpha.id).not.toBe(beta.id);
    await user.click(alpha);
    await user.tab();
    expect(alpha).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Alpha required')).toBeInTheDocument();
  });
});
