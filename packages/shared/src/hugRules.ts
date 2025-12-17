import type { HugInput, HugResult, HugGrade } from './types';

/**
 * 참고용 규칙 엔진 v1
 * - 절대 "확정"이 아니라 리스크 평가로만 표시하세요.
 * - 실제 심사는 HUG/은행 기준에 따름.
 */
export function assessHug(input: HugInput): HugResult {
  const reasons: string[] = [];
  const disclaimer =
    '본 결과는 참고용이며, 최종 HUG 전세자금대출/전세금반환보증 가능 여부는 금융기관 및 HUG 심사 결과에 따릅니다.';

  // 기본값
  const deposit = input.depositKrw ?? 0;
  const op = input.officialPriceKrw;
  const senior = input.seniorLienKrw ?? 0;

  let score = 50; // 중간에서 시작

  if (!op || op <= 0) {
    reasons.push('공시가격이 입력되지 않아 정확한 판정이 어렵습니다.');
    score -= 10;
  } else {
    // MVP 규칙: 공시지가(공시가격) * 126%
    const limit = op * 1.26;
    const sum = deposit + senior;

    reasons.push(`(참고) 공시지가×1.26 = ${Math.round(limit).toLocaleString()}원`);
    reasons.push(`보증금+선순위 = ${Math.round(sum).toLocaleString()}원`);

    if (sum <= limit) {
      reasons.push('보증금+선순위가 공시지가×1.26 이하로 계산됩니다.');
      score += 25;
    } else {
      reasons.push('보증금+선순위가 공시지가×1.26을 초과합니다.');
      score -= 30;
    }
  }

  if ((input.usageType ?? 'UNKNOWN') === 'OFFICE') {
    reasons.push('업무용으로 분류될 가능성이 있으면 상품에 따라 제한될 수 있습니다.');
    score -= 10;
  }

  // 클램프
  score = Math.max(0, Math.min(100, score));

  const grade: HugGrade =
    score >= 70 ? 'PASS' :
    score >= 45 ? 'CAUTION' :
    op ? 'FAIL' : 'UNKNOWN';

  return { grade, score, reasons, disclaimer };
}
