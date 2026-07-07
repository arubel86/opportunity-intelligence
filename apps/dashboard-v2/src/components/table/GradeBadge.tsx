import type { GradeBadgeProps } from '../../types/components'

function gradeColor(grade: string | null | undefined): string {
  const first = grade?.charAt(0) || 'D'
  return {
    A: 'var(--grade-a)',
    B: 'var(--grade-b)',
    C: 'var(--grade-c)',
    D: 'var(--grade-d)',
  }[first] || 'var(--grade-d)'
}

export function GradeBadge({ grade, score, size = 'md' }: GradeBadgeProps) {
  const display = grade || (score != null ? `${score}` : '?')
  const color = gradeColor(grade)

  return (
    <span
      className={`grade-badge grade-badge-${size}`}
      style={{ backgroundColor: color + '22', color }}
    >
      {display}
    </span>
  )
}
