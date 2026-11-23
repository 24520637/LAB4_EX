import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimpleForm from './SimpleForm.jsx';

const fields = [
  { name: 'first', label: 'First', validate: value => value.trim() ? '' : 'First required' },
  { name: 'second', label: 'Second', validate: value => value.trim() ? '' : 'Second required' },
];

describe('Context-driven InputField', () => {
  it('connects each label to a distinct stable input ID', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SimpleForm fields={fields} />);
    const first = screen.getByRole('textbox', { name: 'First' });
    const second = screen.getByRole('textbox', { name: 'Second' });
    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
    expect(screen.getByText('First', { selector: 'label' })).toHaveAttribute('for', first.id);
    expect(screen.getByText('Second', { selector: 'label' })).toHaveAttribute('for', second.id);

    rerender(<SimpleForm fields={fields} />);
    expect(screen.getByRole('textbox', { name: 'First' })).toHaveAttribute('id', first.id);
    await user.type(first, 'hello');
    expect(first).toHaveValue('hello');
    expect(second).toHaveValue('');
  });

  it('reveals touched errors and removes stale descriptions after correction', async () => {
    const user = userEvent.setup();
    render(<SimpleForm fields={fields} />);
    const first = screen.getByRole('textbox', { name: 'First' });
    const second = screen.getByRole('textbox', { name: 'Second' });
    expect(first).toHaveAttribute('aria-invalid', 'false');
    expect(first).not.toHaveAttribute('aria-describedby');

    await user.click(first);
    await user.tab();
    expect(first).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByText('First required');
    expect(first).toHaveAttribute('aria-describedby', error.id);
    expect(second).toHaveAttribute('aria-invalid', 'false');
    expect(second).not.toHaveAttribute('aria-describedby');

    await user.type(first, 'valid');
    expect(first).toHaveAttribute('aria-invalid', 'false');
    expect(first).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('First required')).not.toBeInTheDocument();
  });

  it('shows separate errors after invalid submission and updates only the edited field', async () => {
    const user = userEvent.setup();
    render(<SimpleForm fields={fields} />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    for (const field of fields) {
      const input = screen.getByRole('textbox', { name: field.label });
      const error = screen.getByText(`${field.label} required`);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', error.id);
    }

    await user.type(screen.getByRole('textbox', { name: 'First' }), 'ok');
    expect(screen.getByRole('textbox', { name: 'Second' })).toHaveValue('');
    expect(screen.getByText('Second required')).toBeInTheDocument();
  });
});
