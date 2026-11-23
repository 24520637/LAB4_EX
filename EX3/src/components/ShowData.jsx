export default function ShowData({ data }) {
  return (
    <section aria-labelledby="submitted-data-heading">
      <h2 id="submitted-data-heading">Last successful submission</h2>
      <pre><code data-testid="submitted-json">{JSON.stringify(data, null, 2)}</code></pre>
    </section>
  );
}
