import { useState } from 'react';
import SimpleForm from './components/SimpleForm.jsx';
import ForumChannelSwitcher from './components/ForumChannelSwitcher.jsx';

// Illustrative fields only. Replace with confirmed exercise requirements when available.
const exampleFields = [
  { name: 'first', label: 'First field', validate: value => value.trim() ? '' : 'This field is required.' },
  { name: 'second', label: 'Second field', validate: value => value.trim() ? '' : 'This field is required.' },
];

export default function App() {
  const [submitted, setSubmitted] = useState(null);
  return (
    <main>
      <h1>Exercise 1.3 — Form Context</h1>
      <p>Example fields; exercise-specific rules are not yet supplied.</p>
      <SimpleForm fields={exampleFields} onSubmit={setSubmitted} />
      {submitted && <output role="status">Submitted successfully.</output>}
      <ForumChannelSwitcher />
    </main>
  );
}
