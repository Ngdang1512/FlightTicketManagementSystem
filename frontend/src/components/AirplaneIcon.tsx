export default function AirplaneIcon({ className = '' }: { className?: string }) {
  return <svg className={`airplane-icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21.8 11.6c-.2-.7-.8-1.1-1.5-1.1h-5.4l-4.7-7H7.8l2.3 7H5.4L3.8 8H2.2l.8 4-.8 4h1.6l1.6-2.5h4.7l-2.3 7h2.4l4.7-7h5.4c.7 0 1.3-.4 1.5-1.1.1-.3.1-.5 0-.8Z" />
  </svg>
}
