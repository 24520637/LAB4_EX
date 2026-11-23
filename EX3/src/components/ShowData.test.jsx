import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimpleForm from './SimpleForm.jsx';

const fields = [
  { name: 'alpha', label: 'Alpha', validate: value => value.trim() ? '' : 'Alpha required' },
  { name: 'beta', label: 'Beta', validate: value => value.trim() ? '' : 'Beta required' },
];

const inspector = () => screen.queryByRole('region', { name: 'Last successful submission' });
const snapshot = () => JSON.parse(within(inspector()).getByTestId('submitted-json').textContent);

describe('ShowData successful submission inspector', () => {
  it('stays hidden before success, including after invalid submissions', async () => {
    const user = userEvent.setup();
    render(<SimpleForm fields={fields} />);
    expect(inspector()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(inspector()).not.toBeInTheDocument();
  });

  it('shows formatted JSON for every field after valid submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SimpleForm fields={fields} onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox', { name: 'Alpha' }), 'one');
    await user.type(screen.getByRole('textbox', { name: 'Beta' }), 'two');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(snapshot()).toEqual({ alpha: 'one', beta: 'two' });
    expect(within(inspector()).getByTestId('submitted-json').textContent).toBe(
      JSON.stringify({ alpha: 'one', beta: 'two' }, null, 2),
    );
    expect(onSubmit).toHaveBeenCalledWith({ alpha: 'one', beta: 'two' });
  });

  it('retains the previous snapshot after invalid submission and replaces it on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SimpleForm fields={fields} onSubmit={onSubmit} />);
    const alpha = screen.getByRole('textbox', { name: 'Alpha' });
    const beta = screen.getByRole('textbox', { name: 'Beta' });

    await user.type(alpha, 'one');
    await user.type(beta, 'two');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await user.clear(beta);
    expect(snapshot()).toEqual({ alpha: 'one', beta: 'two' });
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(snapshot()).toEqual({ alpha: 'one', beta: 'two' });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await user.type(beta, 'three');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(snapshot()).toEqual({ alpha: 'one', beta: 'three' });
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
