export default function Toast({ msg, type }) {
  const icons = { success: '✓', error: '✕', '': 'i' }
  return (
    <div className={`toast ${type}`}>
      <span>{icons[type] || 'i'}</span>
      {msg}
    </div>
  )
}
