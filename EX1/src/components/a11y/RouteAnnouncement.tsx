import { useRouteFeedback } from './RouteFeedbackProvider'

/** Single persistent polite live region, mounted outside all route Suspense fallbacks. */
export default function RouteAnnouncement() {
  const feedback = useRouteFeedback()
  return (
    <p
      role="status"
      style={{
        position: 'absolute',
        inlineSize: '1px',
        blockSize: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
      }}
    >
      {feedback?.message ?? ''}
    </p>
  )
}
