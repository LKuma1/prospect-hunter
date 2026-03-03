import { Badge } from '@/components/ui/badge';

interface LeadScoreBadgeProps {
  score: number;
}

export function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  if (score >= 70) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{score}</Badge>;
  }
  if (score >= 40) {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{score}</Badge>;
  }
  return <Badge variant="outline">{score}</Badge>;
}
