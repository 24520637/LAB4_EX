import { useState } from 'react';
import { FormContext } from '../formContext.js';
import InputField from './InputField.jsx';

// Fields and validators are supplied by the caller; the exercise does not define a schema yet.
export default function SimpleForm({ fields, onSubmit }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(({ name }) => [name, ''])));
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const errors = Object.fromEntries(fields.map(({ name, validate }) => [name, validate?.(values[name] ?? '', values) || '']));
  const isValid = Object.values(errors).every(error => error === '');

  function updateField(name, value) {
    setValues(previous => ({ ...previous, [name]: value }));
  }
  function touchField(name) {
    setTouched(previous => ({ ...previous, [name]: true }));
  }
  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    onSubmit?.({ ...values });
  }

  return (
    <FormContext.Provider value={{ values, touched, errors, isValid, submitted, updateField, touchField }}>
      <form onSubmit={handleSubmit} noValidate>
        {fields.map(({ name, label, type }) => <InputField key={name} name={name} label={label} type={type} />)}
        <button type="submit">Submit</button>
      </form>
    </FormContext.Provider>
  );
}
