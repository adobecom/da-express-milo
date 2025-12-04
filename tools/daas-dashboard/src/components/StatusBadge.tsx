interface StatusBadgeProps {
  status: 'Published' | 'Previewed' | 'Draft'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Published':
        return 'text-green-700'
      case 'Previewed':
        return 'text-blue-700'
      default:
        return 'text-gray-700'
    }
  }

  const showDot = status === 'Published' || status === 'Previewed'
  const dotColor = status === 'Published' ? 'bg-green-600' : 'bg-blue-600'

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${getStatusStyles()}`}>
      {showDot && <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>}
      {status}
    </span>
  )
}

