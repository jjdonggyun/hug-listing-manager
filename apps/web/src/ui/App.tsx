import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import { normalizeNaverArticle } from '../lib/naver';

type Listing = {
  id: string;
  title: string;
  dealType: 'JEONSE' | 'MONTHLY' | 'SALE';
  depositKrw: number;
  monthlyKrw: number;
  salePriceKrw?: number | null;
  officialPrice?: number | null;
  status: string;
  tags: string[];
  referenceUrl?: string | null;
  externalId?: string | null;
  updatedAt: string;
  assessments?: { grade: string; score: number; createdAt: string }[];
  notes?: { id: string; content: string; createdAt: string }[];
};

type ListingFormValues = {
  title: string;
  dealType: 'JEONSE' | 'MONTHLY' | 'SALE';
  depositKrw: number;
  monthlyKrw: number;
  salePriceKrw: number;
  articleInput: string;
};

type NoteFormValues = {
  content: string;
};

type AssessFormValues = {
  officialPrice: number;
};

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-semibold">{title}</div>
            <button className="text-slate-500 hover:text-slate-800" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ListingFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<ListingFormValues>;
  onClose: () => void;
  onSubmit: (v: ListingFormValues) => Promise<void>;
}) {
  const [dealType, setDealType] = useState<ListingFormValues['dealType']>(initial?.dealType ?? 'JEONSE');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [depositKrw, setDepositKrw] = useState<number>(initial?.depositKrw ?? 0);
  const [monthlyKrw, setMonthlyKrw] = useState<number>(initial?.monthlyKrw ?? 0);
  const [salePriceKrw, setSalePriceKrw] = useState<number>(initial?.salePriceKrw ?? 0);
  const [articleInput, setArticleInput] = useState(initial?.articleInput ?? '');

  // 초기값이 바뀌면 폼도 리셋
  useEffect(() => {
    setDealType(initial?.dealType ?? 'JEONSE');
    setTitle(initial?.title ?? '');
    setDepositKrw(initial?.depositKrw ?? 0);
    setMonthlyKrw(initial?.monthlyKrw ?? 0);
    setSalePriceKrw(initial?.salePriceKrw ?? 0);
    setArticleInput(initial?.articleInput ?? '');
  }, [open, initial?.dealType, initial?.title, initial?.depositKrw, initial?.monthlyKrw, initial?.salePriceKrw, initial?.articleInput]);

  const normalized = useMemo(() => normalizeNaverArticle(articleInput), [articleInput]);

  return (
    <Modal
      open={open}
      title={mode === 'create' ? '매물 등록' : '매물 수정'}
      onClose={onClose}
    >
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const t = title.trim();
          if (!t) {
            toast.error('매물명을 입력해줘');
            return;
          }
          if (dealType === 'SALE' && (!salePriceKrw || salePriceKrw <= 0)) {
            toast.error('매매가는 0보다 커야 해');
            return;
          }
          await onSubmit({
            title: t,
            dealType,
            depositKrw: Number.isFinite(depositKrw) ? depositKrw : 0,
            monthlyKrw: Number.isFinite(monthlyKrw) ? monthlyKrw : 0,
            salePriceKrw: Number.isFinite(salePriceKrw) ? salePriceKrw : 0,
            articleInput: articleInput.trim(),
          });
        }}
      >
        <label className="grid gap-1">
          <span className="text-sm text-slate-700">거래 유형</span>
          <select
            className="px-3 py-2 rounded border border-slate-200"
            value={dealType}
            onChange={(e) => setDealType(e.target.value as any)}
          >
            <option value="JEONSE">전세</option>
            <option value="MONTHLY">월세</option>
            <option value="SALE">매매</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-700">매물명</span>
          <input
            className="px-3 py-2 rounded border border-slate-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 강남역 오피스텔 101동"
          />
        </label>

        {dealType !== 'SALE' && (
          <label className="grid gap-1">
            <span className="text-sm text-slate-700">{dealType === 'MONTHLY' ? '보증금(원)' : '전세금(원)'}</span>
            <input
              className="px-3 py-2 rounded border border-slate-200"
              value={String(depositKrw)}
              onChange={(e) => setDepositKrw(Number(e.target.value.replace(/[^\d]/g, '')))}
              inputMode="numeric"
              placeholder="예: 56000000"
            />
          </label>
        )}

        {dealType === 'MONTHLY' && (
          <label className="grid gap-1">
            <span className="text-sm text-slate-700">월세(원)</span>
            <input
              className="px-3 py-2 rounded border border-slate-200"
              value={String(monthlyKrw)}
              onChange={(e) => setMonthlyKrw(Number(e.target.value.replace(/[^\d]/g, '')))}
              inputMode="numeric"
              placeholder="예: 700000"
            />
          </label>
        )}

        {dealType === 'SALE' && (
          <label className="grid gap-1">
            <span className="text-sm text-slate-700">매매가(원)</span>
            <input
              className="px-3 py-2 rounded border border-slate-200"
              value={String(salePriceKrw)}
              onChange={(e) => setSalePriceKrw(Number(e.target.value.replace(/[^\d]/g, '')))}
              inputMode="numeric"
              placeholder="예: 350000000"
            />
          </label>
        )}

        <label className="grid gap-1">
          <span className="text-sm text-slate-700">네이버 매물번호 또는 URL(선택)</span>
          <input
            className="px-3 py-2 rounded border border-slate-200"
            value={articleInput}
            onChange={(e) => setArticleInput(e.target.value)}
            placeholder="예: 399902 / https://fin.land.naver.com/articles/399902"
          />
        </label>

        {normalized.url && (
          <a className="text-sm text-blue-600 underline" href={normalized.url} target="_blank" rel="noreferrer">
            네이버 매물 열기(미리보기)
          </a>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800">
            {mode === 'create' ? '등록' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NoteModal({
  open,
  title,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial?: Partial<NoteFormValues>;
  onClose: () => void;
  onSubmit: (v: NoteFormValues) => Promise<void>;
}) {
  const [content, setContent] = useState(initial?.content ?? '');

  useEffect(() => {
    setContent(initial?.content ?? '');
  }, [open, initial?.content]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const c = content;
          // 빈 문자열도 "메모 지우기"로 허용
          await onSubmit({ content: c });
        }}
      >
        <label className="grid gap-1">
          <span className="text-sm text-slate-700">메모</span>
          <textarea
            className="px-3 py-2 rounded border border-slate-200 min-h-[140px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="예) 문의 내용, 체크할 점, 특약 아이디어…"
          />
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800">
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssessModal({
  open,
  title,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial?: Partial<AssessFormValues>;
  onClose: () => void;
  onSubmit: (v: AssessFormValues) => Promise<void>;
}) {
  const [officialPrice, setOfficialPrice] = useState<number>(initial?.officialPrice ?? 0);

  useEffect(() => {
    setOfficialPrice(initial?.officialPrice ?? 0);
  }, [open, initial?.officialPrice]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!officialPrice || officialPrice <= 0) {
            toast.error('공시지가(원)를 입력해줘');
            return;
          }
          await onSubmit({ officialPrice });
        }}
      >
        <label className="grid gap-1">
          <span className="text-sm text-slate-700">공시지가(원)</span>
          <input
            className="px-3 py-2 rounded border border-slate-200"
            value={String(officialPrice)}
            onChange={(e) => setOfficialPrice(Number(e.target.value.replace(/[^\d]/g, '')))}
            inputMode="numeric"
            placeholder="예: 150000000"
          />
        </label>
        <div className="text-xs text-slate-600">
          계산 기준(참고): <b>공시지가 × 126%</b>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800">
            평가 실행
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function App() {
  const [items, setItems] = useState<Listing[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Listing | null>(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<Listing | null>(null);

  const [assessOpen, setAssessOpen] = useState(false);
  const [assessTarget, setAssessTarget] = useState<Listing | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await apiGet<Listing[]>('/listings');
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(it: Listing) {
    setFormMode('edit');
    setEditing(it);
    setFormOpen(true);
  }

  async function remove(it: Listing) {
    toast(`삭제할까?`, {
      description: it.title,
      action: {
        label: '삭제',
        onClick: async () => {
          try {
            await apiDelete(`/listings/${it.id}`);
            toast.success('삭제 완료');
            await load();
          } catch (e: any) {
            toast.error(`삭제 실패: ${e?.message ?? String(e)}`);
          }
        },
      },
    });
  }

  function openAssess(it: Listing) {
    if (it.dealType === 'SALE') {
      toast.message('매매 매물은 HUG(참고) 평가 대상이 아니에요');
      return;
    }
    setAssessTarget(it);
    setAssessOpen(true);
  }

  async function submitAssess(v: AssessFormValues) {
    if (!assessTarget) return;
    await apiPost(`/listings/${assessTarget.id}/assess-hug`, { officialPrice: v.officialPrice });
    toast.success('평가 완료');
    setAssessOpen(false);
    setAssessTarget(null);
    await load();
  }

  async function submitForm(v: ListingFormValues) {
    const normalized = normalizeNaverArticle(v.articleInput);
    if (formMode === 'create') {
      await apiPost('/listings', {
        title: v.title,
        dealType: v.dealType,
        depositKrw: v.depositKrw,
        monthlyKrw: v.monthlyKrw,
        salePriceKrw: v.salePriceKrw,
        externalId: normalized.articleId ?? (v.articleInput || undefined),
        referenceUrl: normalized.url ?? undefined,
        status: 'NEW',
        tags: [],
      });
      toast.success('등록 완료');
    } else {
      if (!editing) return;
      await apiPatch(`/listings/${editing.id}`, {
        title: v.title,
        dealType: v.dealType,
        depositKrw: v.depositKrw,
        monthlyKrw: v.monthlyKrw,
        salePriceKrw: v.salePriceKrw,
        status: editing.status ?? 'NEW',
        tags: editing.tags ?? [],
        externalId: normalized.articleId ?? (v.articleInput || undefined),
        referenceUrl: normalized.url ?? (editing.referenceUrl ?? undefined),
      });
      toast.success('수정 완료');
    }
    setFormOpen(false);
    await load();
  }

  function openNote(it: Listing) {
    setNoteTarget(it);
    setNoteOpen(true);
  }

  async function submitNote(v: NoteFormValues) {
    if (!noteTarget) return;
    try {
      await apiPost(`/listings/${noteTarget.id}/notes`, { content: v.content ?? '' });
      toast.success('메모 저장');
      setNoteOpen(false);
      setNoteTarget(null);
      await load();
    } catch (e: any) {
      toast.error(`메모 저장 실패: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Toaster richColors position="top-right" />
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">HUG 매물 관리자</h1>
          <p className="text-sm text-slate-600">
            네이버 데이터는 저장/재배포하지 않고, URL은 참고 링크로만 관리하는 구조(MVP)
          </p>
        </div>
        <button
          className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 shrink-0 whitespace-nowrap"
          onClick={openCreate}
        >
          + 빠른 등록
        </button>
      </header>

      <ListingFormModal
        open={formOpen}
        mode={formMode}
        initial={
          formMode === 'edit' && editing
            ? {
                title: editing.title,
                dealType: editing.dealType,
                depositKrw: editing.depositKrw,
                monthlyKrw: editing.monthlyKrw ?? 0,
                salePriceKrw: editing.salePriceKrw ?? 0,
                articleInput: editing.referenceUrl ?? editing.externalId ?? '',
              }
            : { title: '', dealType: 'JEONSE', depositKrw: 0, monthlyKrw: 0, salePriceKrw: 0, articleInput: '' }
        }
        onClose={() => setFormOpen(false)}
        onSubmit={submitForm}
      />

      <NoteModal
        open={noteOpen}
        title={noteTarget ? `메모 · ${noteTarget.title}` : '메모'}
        initial={{ content: noteTarget?.notes?.[0]?.content ?? '' }}
        onClose={() => {
          setNoteOpen(false);
          setNoteTarget(null);
        }}
        onSubmit={submitNote}
      />

      <AssessModal
        open={assessOpen}
        title={assessTarget ? `HUG 평가 · ${assessTarget.title}` : 'HUG 평가'}
        initial={{ officialPrice: assessTarget?.officialPrice ?? 0 }}
        onClose={() => {
          setAssessOpen(false);
          setAssessTarget(null);
        }}
        onSubmit={submitAssess}
      />

      {err && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800">
          {err}
        </div>
      )}

      <div className="grid gap-3">
        {items.map((it) => {
          const latest = it.assessments?.[0];
          const openUrl = it.referenceUrl ?? normalizeNaverArticle(it.externalId ?? '').url;
          const latestNote = it.notes?.[0]?.content;
          return (
            <div key={it.id} className="p-4 rounded bg-white border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm text-slate-600">
                    {it.dealType === 'SALE'
                      ? `매매가 ${(it.salePriceKrw ?? 0).toLocaleString()}원`
                      : it.dealType === 'MONTHLY'
                        ? `보증금 ${it.depositKrw.toLocaleString()}원 / 월세 ${it.monthlyKrw.toLocaleString()}원`
                        : `전세금 ${it.depositKrw.toLocaleString()}원`}
                    {' '}· 상태 {it.status}
                  </div>
                  {openUrl && (
                    <a
                      className="text-sm text-blue-600 underline"
                      href={openUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      네이버 매물 열기
                    </a>
                  )}
                </div>

                <div className="w-full sm:w-auto sm:text-right">
                  {latest ? (
                    <div className="text-sm">
                      <div className="font-semibold">HUG(참고): {latest.grade} / {latest.score}</div>
                      <div className="text-xs text-slate-500">{new Date(latest.createdAt).toLocaleString()}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">HUG 평가 없음</div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                    <button
                      className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-sm"
                      onClick={() => openAssess(it)}
                    >
                      HUG 평가 실행
                    </button>
                    <button
                      className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-sm"
                      onClick={() => openEdit(it)}
                    >
                      수정
                    </button>
                    <button
                      className="px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 text-sm"
                      onClick={() => remove(it)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-sm font-semibold mb-2">메모</div>
                {latestNote ? (
                  <div className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{latestNote}</div>
                ) : (
                  <div className="text-sm text-slate-500 mb-2">아직 메모가 없어요.</div>
                )}

                <button
                  className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 text-sm"
                  onClick={() => openNote(it)}
                >
                  {latestNote ? '메모 수정' : '메모 입력'}
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                ⚠️ 본 결과는 참고용이며 최종 가능 여부는 금융기관/HUG 심사에 따릅니다.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
