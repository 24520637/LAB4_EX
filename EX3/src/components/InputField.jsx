import { useId } from 'react';
import { useFormContext } from '../formContext.js';

export default function InputField({ name, label, type = 'text' }) {
  const id = useId();
  const errorId = `${id}-error`;
  const { values, touched, errors, submitted, updateField, touchField } = useFormContext();
  const showError = Boolean(errors[name]) && (Boolean(touched[name]) || submitted);
  return (
    <section className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} type={type} value={values[name] ?? ''}
        onChange={event => updateField(name, event.target.value)}
        onBlur={() => touchField(name)} aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={showError ? errorId : undefined} />
      {showError && <p id={errorId} className="error">{errors[name]}</p>}
    </section>
  );
}
