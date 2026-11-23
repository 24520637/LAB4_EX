import { useId } from 'react';
import { useFormContext } from '../formContext.js';

export default function InputField({ name, label, type = 'text' }) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const { values, touched, errors, submitted, updateField, touchField } = useFormContext();
  const error = errors[name];
  const showError = Boolean(error) && (Boolean(touched[name]) || submitted);

  return (
    <section className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={values[name] ?? ''}
        onChange={event => updateField(name, event.target.value)}
        onBlur={() => touchField(name)}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
      />
      {showError && <p id={errorId} className="error">{error}</p>}
    </section>
  );
}
