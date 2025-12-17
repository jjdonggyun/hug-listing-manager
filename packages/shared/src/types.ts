export type ListingStatus = 'NEW' | 'CONTACTED' | 'VISIT_SCHEDULED' | 'CONSIDERING' | 'DROPPED' | 'CONTRACTING';

export type HugGrade = 'PASS' | 'CAUTION' | 'FAIL' | 'UNKNOWN';

export interface HugInput {
  depositKrw: number;           // 보증금
  officialPriceKrw?: number;    // 공시가(입력/연동)
  seniorLienKrw?: number;       // 선순위(근저당 최고액 등)
  usageType?: 'RESIDENTIAL' | 'OFFICE' | 'UNKNOWN'; // 오피스텔 주거/업무 등(참고)
}

export interface HugResult {
  grade: HugGrade;
  score: number;               // 0~100
  reasons: string[];           // 사용자에게 보여줄 근거
  disclaimer: string;          // 필수 고지
}
