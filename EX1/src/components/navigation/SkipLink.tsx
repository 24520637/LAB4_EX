const styles = `
  .skip-link {
    position: fixed;
    z-index: 1;
    inset-block-start: 0.75rem;
    inset-inline-start: var(--page-gutter);
    max-inline-size: calc(100% - 2 * var(--page-gutter));
    padding: 0.5rem 0.75rem;
    color: var(--color-page);
    background: var(--color-accent);
  }

  .skip-link:not(:focus) {
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .skip-link:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

export default function SkipLink() {
  return (
    <>
      <style href="pioneer-atlas-skip-link" precedence="components">{styles}</style>
      <a className="skip-link" href="#main-content">Skip to main content</a>
    </>
  )
}
