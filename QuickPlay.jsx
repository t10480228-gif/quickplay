import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus, Trash2, Pencil, ChevronLeft, Play, BookOpen,
  ImagePlus, Trophy, RotateCcw, Check, X, ChevronRight,
  ShieldCheck, Swords, Users
} from "lucide-react";

/* ============================================================
   QuickPlay — アメフト アサイメント暗記アプリ
   ============================================================ */

const STORAGE_KEY = "quickplay_v1";

/* ---------- storage ---------- */
const storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

/* ---------- uid ---------- */
function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

/* ---------- default data ---------- */
function defaultData() {
  return { teams: [] };
}

/* ---------- shuffle ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- quiz generator ---------- */
// quizType: "img2name" | "name2img"
function generateQuiz(plays, quizType) {
  if (plays.length < 3) return null;
  const shuffled = shuffle(plays);
  return shuffled.map(correct => {
    const wrongPool = plays.filter(p => p.id !== correct.id);
    const wrongs = shuffle(wrongPool).slice(0, 2);
    const choices = shuffle([correct, ...wrongs]);
    return { correct, choices, quizType };
  });
}

/* ============================================================
   Styles
   ============================================================ */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Zen+Maru+Gothic:wght@400;500;700&family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap');

      *, *::before, *::after { box-sizing: border-box; }

      .qp-root {
        --c-bg:       #0D1B2A;
        --c-surface:  #1A2D42;
        --c-card:     #1F3550;
        --c-border:   #2A4160;
        --c-gold:     #F4B942;
        --c-gold2:    #D4950A;
        --c-green:    #3DDC84;
        --c-red:      #FF5A5A;
        --c-blue:     #4EB5FF;
        --c-ink:      #EAF0FA;
        --c-sub:      #7A9BBF;
        --c-offense:  #F4B942;
        --c-defense:  #4EB5FF;
        font-family: 'Zen Maru Gothic', sans-serif;
        color: var(--c-ink);
        background: var(--c-bg);
        width: 100%;
        max-width: 440px;
        margin: 0 auto;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      /* Header */
      .qp-header {
        background: var(--c-surface);
        padding: 16px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid var(--c-border);
        flex-shrink: 0;
      }
      .qp-header h1 {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 24px;
        letter-spacing: 2px;
        margin: 0;
        color: var(--c-gold);
      }
      .qp-header .sub { font-size: 11px; color: var(--c-sub); }

      /* Back header */
      .qp-back-header {
        background: var(--c-surface);
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid var(--c-border);
        flex-shrink: 0;
      }
      .qp-back-btn {
        background: rgba(255,255,255,0.07);
        border: none;
        color: var(--c-ink);
        width: 34px; height: 34px;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
      }
      .qp-back-btn:hover { background: rgba(255,255,255,0.14); }
      .qp-back-header h2 {
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 17px;
        margin: 0;
        color: var(--c-ink);
        flex: 1;
      }

      /* Scroll area */
      .qp-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 18px 16px 90px;
      }
      .qp-scroll::-webkit-scrollbar { width: 5px; }
      .qp-scroll::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 4px; }

      /* Card */
      .qp-card {
        background: var(--c-card);
        border-radius: 16px;
        border: 1px solid var(--c-border);
        padding: 16px;
        margin-bottom: 14px;
      }

      /* Section title */
      .qp-section-title {
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-weight: 800;
        font-size: 13px;
        color: var(--c-sub);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin: 0 0 10px;
        display: flex; align-items: center; gap: 6px;
      }

      /* Team card */
      .qp-team-card {
        background: var(--c-card);
        border-radius: 16px;
        border: 1px solid var(--c-border);
        padding: 16px 18px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 14px;
        cursor: pointer;
        transition: border-color .15s;
      }
      .qp-team-card:hover { border-color: var(--c-gold); }
      .qp-team-icon {
        width: 48px; height: 48px;
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }
      .qp-team-icon.offense { background: rgba(244,185,66,0.15); }
      .qp-team-icon.defense { background: rgba(78,181,255,0.15); }
      .qp-team-card .tc-name { font-weight: 700; font-size: 16px; }
      .qp-team-card .tc-sub { font-size: 12px; color: var(--c-sub); margin-top: 2px; }
      .qp-team-card .tc-arrow { color: var(--c-sub); margin-left: auto; }

      /* Play card */
      .qp-play-card {
        background: var(--c-card);
        border-radius: 14px;
        border: 1px solid var(--c-border);
        margin-bottom: 10px;
        overflow: hidden;
        display: flex;
        align-items: center;
      }
      .qp-play-thumb {
        width: 72px; height: 56px;
        object-fit: cover;
        background: #0a1520;
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        color: var(--c-sub);
        font-size: 11px;
      }
      .qp-play-thumb img { width: 72px; height: 56px; object-fit: cover; }
      .qp-play-info { flex: 1; padding: 10px 12px; min-width: 0; }
      .qp-play-info .pn { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .qp-play-info .ps { font-size: 11.5px; color: var(--c-sub); margin-top: 2px; }
      .qp-play-actions { display: flex; gap: 4px; padding-right: 10px; }
      .qp-icon-btn {
        background: rgba(255,255,255,0.07);
        border: none;
        color: var(--c-sub);
        width: 32px; height: 32px;
        border-radius: 9px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
      }
      .qp-icon-btn:hover { color: var(--c-ink); background: rgba(255,255,255,0.14); }
      .qp-icon-btn.danger:hover { color: var(--c-red); }

      /* FAB */
      .qp-fab {
        position: fixed;
        right: calc(50% - 220px + 18px);
        bottom: 24px;
        background: var(--c-gold);
        color: #0D1B2A;
        border: none;
        border-radius: 999px;
        padding: 13px 22px;
        font-weight: 800;
        font-size: 14px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        display: flex; align-items: center; gap: 6px;
        box-shadow: 0 4px 20px rgba(244,185,66,0.45);
        cursor: pointer;
        z-index: 30;
        transition: transform .12s;
      }
      .qp-fab:active { transform: scale(0.96); }

      /* Form */
      .qp-field { margin-bottom: 16px; }
      .qp-field label {
        display: block; font-size: 12px; font-weight: 700;
        color: var(--c-sub); text-transform: uppercase; letter-spacing: 1px;
        margin-bottom: 6px;
      }
      .qp-field input[type=text], .qp-field select {
        width: 100%;
        background: var(--c-surface);
        border: 1.5px solid var(--c-border);
        border-radius: 11px;
        padding: 11px 13px;
        font-size: 15px;
        font-family: 'Zen Maru Gothic', sans-serif;
        color: var(--c-ink);
      }
      .qp-field input[type=text]:focus, .qp-field select:focus {
        outline: 2px solid var(--c-gold);
        border-color: var(--c-gold);
      }
      .qp-field select option { background: #1A2D42; }

      /* Image upload */
      .qp-img-upload {
        width: 100%;
        min-height: 160px;
        background: var(--c-surface);
        border: 2px dashed var(--c-border);
        border-radius: 14px;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 8px;
        cursor: pointer;
        color: var(--c-sub);
        font-size: 13px;
        position: relative;
        overflow: hidden;
        transition: border-color .15s;
      }
      .qp-img-upload:hover { border-color: var(--c-gold); color: var(--c-gold); }
      .qp-img-upload img {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: contain;
        background: #0a1520;
      }
      .qp-img-upload input { display: none; }

      /* Btn */
      .qp-btn-primary {
        width: 100%;
        background: var(--c-gold);
        color: #0D1B2A;
        border: none;
        border-radius: 13px;
        padding: 14px;
        font-size: 15px;
        font-weight: 800;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        cursor: pointer;
        box-shadow: 0 3px 0 var(--c-gold2);
        transition: transform .1s;
      }
      .qp-btn-primary:active { transform: translateY(2px); box-shadow: none; }
      .qp-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
      .qp-btn-ghost {
        width: 100%;
        background: transparent;
        color: var(--c-red);
        border: 1.5px solid rgba(255,90,90,0.35);
        border-radius: 13px;
        padding: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 10px;
        font-family: 'Zen Maru Gothic', sans-serif;
      }

      /* Side badge */
      .qp-side-badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 700;
      }
      .qp-side-badge.offense { background: rgba(244,185,66,0.18); color: var(--c-offense); }
      .qp-side-badge.defense { background: rgba(78,181,255,0.18); color: var(--c-defense); }

      /* Quiz start card */
      .qp-quiz-start {
        background: var(--c-card);
        border-radius: 18px;
        border: 1px solid var(--c-border);
        padding: 22px 20px;
        margin-bottom: 14px;
      }
      .qp-quiz-start h3 {
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 16px;
        margin: 0 0 6px;
        color: var(--c-ink);
      }
      .qp-quiz-start p { font-size: 12.5px; color: var(--c-sub); margin: 0 0 16px; line-height: 1.6; }
      .qp-quiz-btn {
        width: 100%;
        background: var(--c-surface);
        border: 1.5px solid var(--c-border);
        border-radius: 12px;
        padding: 12px 14px;
        display: flex; align-items: center; gap: 10px;
        cursor: pointer;
        color: var(--c-ink);
        font-size: 14px;
        font-weight: 700;
        font-family: 'Zen Maru Gothic', sans-serif;
        margin-bottom: 8px;
        transition: border-color .15s;
      }
      .qp-quiz-btn:hover { border-color: var(--c-gold); }
      .qp-quiz-btn .qb-icon {
        width: 36px; height: 36px;
        background: rgba(244,185,66,0.15);
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        color: var(--c-gold);
        flex-shrink: 0;
      }

      /* Quiz screen */
      .qp-quiz-progress {
        padding: 12px 16px 0;
        display: flex;
        gap: 5px;
        flex-shrink: 0;
      }
      .qp-quiz-progress-dot {
        flex: 1; height: 4px; border-radius: 2px;
        background: var(--c-border);
        transition: background .3s;
      }
      .qp-quiz-progress-dot.done { background: var(--c-green); }
      .qp-quiz-progress-dot.current { background: var(--c-gold); }

      .qp-quiz-body { flex: 1; overflow-y: auto; padding: 14px 16px 20px; }

      .qp-quiz-question {
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 14.5px;
        font-weight: 800;
        color: var(--c-sub);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 12px;
      }
      .qp-quiz-img {
        width: 100%;
        aspect-ratio: 4/3;
        object-fit: contain;
        background: #0a1520;
        border-radius: 14px;
        border: 1.5px solid var(--c-border);
        margin-bottom: 16px;
      }
      .qp-quiz-name {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 32px;
        letter-spacing: 3px;
        color: var(--c-gold);
        margin-bottom: 16px;
        text-align: center;
        background: var(--c-card);
        border-radius: 14px;
        padding: 18px 12px;
        border: 1.5px solid var(--c-border);
      }

      /* Choices */
      .qp-choices { display: flex; flex-direction: column; gap: 10px; }
      .qp-choice {
        background: var(--c-card);
        border: 2px solid var(--c-border);
        border-radius: 13px;
        padding: 0;
        overflow: hidden;
        cursor: pointer;
        transition: border-color .15s, transform .1s;
        display: flex;
        align-items: center;
      }
      .qp-choice:active { transform: scale(0.98); }
      .qp-choice:hover:not(.answered) { border-color: var(--c-gold); }
      .qp-choice.correct { border-color: var(--c-green); background: rgba(61,220,132,0.08); }
      .qp-choice.wrong   { border-color: var(--c-red);   background: rgba(255,90,90,0.08); }
      .qp-choice.reveal  { border-color: var(--c-green); background: rgba(61,220,132,0.05); }

      /* text choice */
      .qp-choice-text {
        padding: 14px 16px;
        font-weight: 700;
        font-size: 15px;
        font-family: 'Zen Maru Gothic', sans-serif;
        display: flex; align-items: center; gap: 10px;
        width: 100%;
      }
      .qp-choice-idx {
        width: 26px; height: 26px;
        border-radius: 8px;
        background: var(--c-surface);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 800;
        color: var(--c-sub);
        flex-shrink: 0;
      }
      /* image choice */
      .qp-choice-img {
        width: 100%;
        aspect-ratio: 16/9;
        object-fit: contain;
        background: #0a1520;
      }

      /* Next btn */
      .qp-next-btn {
        width: 100%;
        background: var(--c-gold);
        color: #0D1B2A;
        border: none;
        border-radius: 13px;
        padding: 14px;
        font-size: 15px;
        font-weight: 800;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        cursor: pointer;
        margin-top: 16px;
      }

      /* Result */
      .qp-result-hero {
        text-align: center;
        padding: 30px 20px 20px;
      }
      .qp-result-hero .score-num {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 72px;
        color: var(--c-gold);
        line-height: 1;
      }
      .qp-result-hero .score-label {
        font-size: 13px; color: var(--c-sub); margin-top: 4px;
      }
      .qp-result-hero .grade {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 28px;
        margin-top: 10px;
        color: var(--c-ink);
        letter-spacing: 2px;
      }

      /* Empty */
      .qp-empty {
        text-align: center;
        padding: 48px 20px;
        color: var(--c-sub);
        font-size: 13.5px;
        line-height: 1.7;
      }
      .qp-empty .emoji { font-size: 44px; margin-bottom: 10px; }

      /* Toast */
      .qp-toast {
        position: fixed;
        top: 14px; left: 50%;
        transform: translateX(-50%);
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        color: var(--c-ink);
        padding: 10px 18px;
        border-radius: 999px;
        font-size: 13px; font-weight: 700;
        z-index: 100;
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        animation: qp-toast-in .22s ease;
        white-space: nowrap;
      }
      @keyframes qp-toast-in {
        from { opacity:0; transform: translate(-50%,-10px); }
        to   { opacity:1; transform: translate(-50%,0); }
      }

      /* Answer overlay icon */
      .qp-ans-icon {
        width: 28px; height: 28px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        margin-left: auto;
        margin-right: 12px;
      }
      .qp-ans-icon.ok  { background: var(--c-green); color: #fff; }
      .qp-ans-icon.ng  { background: var(--c-red);   color: #fff; }
    `}</style>
  );
}

/* ============================================================
   Back Header
   ============================================================ */
function BackHeader({ title, onBack, actions }) {
  return (
    <div className="qp-back-header">
      <button className="qp-back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
      <h2>{title}</h2>
      {actions}
    </div>
  );
}

/* ============================================================
   Home
   ============================================================ */
function Home({ data, go }) {
  const teamCount = data.teams.length;
  const playCount = data.teams.reduce((s, t) => s + t.plays.length, 0);

  return (
    <>
      <div className="qp-header">
        <div style={{ flex: 1 }}>
          <h1>QuickPlay</h1>
          <div className="sub">アメフト アサイメント暗記</div>
        </div>
        <button className="qp-icon-btn" onClick={() => go("teams")} title="チーム管理">
          <Users size={18} />
        </button>
      </div>
      <div className="qp-scroll">
        <div className="qp-card" style={{ marginBottom: 18, display: "flex", gap: 20, justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: "var(--c-gold)", lineHeight: 1 }}>{teamCount}</div>
            <div style={{ fontSize: 11.5, color: "var(--c-sub)", marginTop: 3 }}>チーム</div>
          </div>
          <div style={{ width: 1, background: "var(--c-border)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: "var(--c-gold)", lineHeight: 1 }}>{playCount}</div>
            <div style={{ fontSize: 11.5, color: "var(--c-sub)", marginTop: 3 }}>プレー登録数</div>
          </div>
        </div>

        <div className="qp-section-title"><Play size={13} /> クイズを始める</div>

        {data.teams.length === 0 ? (
          <div className="qp-empty">
            <div className="emoji">🏈</div>
            まずはチームとプレーを登録しましょう<br />
            右上のアイコンからチーム管理へ
          </div>
        ) : (
          data.teams.map(team => (
            team.plays.length >= 3 ? (
              <div key={team.id} className="qp-quiz-start">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span className={`qp-side-badge ${team.side}`}>
                    {team.side === "offense" ? <Swords size={11} /> : <ShieldCheck size={11} />}
                    {team.side === "offense" ? "OFFENSE" : "DEFENSE"}
                  </span>
                  <h3 style={{ margin: 0 }}>{team.name}</h3>
                  <span style={{ fontSize: 12, color: "var(--c-sub)", marginLeft: "auto" }}>{team.plays.length} プレー</span>
                </div>
                <button className="qp-quiz-btn" onClick={() => go("quiz", { teamId: team.id, quizType: "img2name" })}>
                  <span className="qb-icon"><BookOpen size={17} /></span>
                  絵を見てプレー名を答える
                </button>
                <button className="qp-quiz-btn" onClick={() => go("quiz", { teamId: team.id, quizType: "name2img" })}>
                  <span className="qb-icon"><ImagePlus size={17} /></span>
                  プレー名を見て絵を答える
                </button>
              </div>
            ) : (
              <div key={team.id} className="qp-card" style={{ opacity: 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className={`qp-side-badge ${team.side}`}>{team.name}</span>
                  <span style={{ fontSize: 12, color: "var(--c-sub)" }}>{team.plays.length} / 3 プレー（クイズには3つ以上必要）</span>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </>
  );
}

/* ============================================================
   Team List
   ============================================================ */
function TeamList({ data, onAdd, onSelect, onDelete, onBack }) {
  return (
    <>
      <BackHeader title="チーム管理" onBack={onBack} />
      <div className="qp-scroll">
        {data.teams.length === 0 && (
          <div className="qp-empty">
            <div className="emoji">🏈</div>
            チームを追加して<br />プレーを登録しましょう
          </div>
        )}
        {data.teams.map(team => (
          <div key={team.id} className="qp-team-card" onClick={() => onSelect(team.id)}>
            <div className={`qp-team-icon ${team.side}`}>
              {team.side === "offense" ? "⚔️" : "🛡️"}
            </div>
            <div style={{ flex: 1 }}>
              <div className="tc-name">{team.name}</div>
              <div className="tc-sub">
                <span className={`qp-side-badge ${team.side}`} style={{ fontSize: 10.5, padding: "2px 7px" }}>
                  {team.side === "offense" ? "OFFENSE" : "DEFENSE"}
                </span>
                <span style={{ marginLeft: 8, fontSize: 12, color: "var(--c-sub)" }}>{team.plays.length} プレー</span>
              </div>
            </div>
            <button
              className="qp-icon-btn danger"
              style={{ marginLeft: 4 }}
              onClick={e => { e.stopPropagation(); onDelete(team.id); }}
            >
              <Trash2 size={15} />
            </button>
            <ChevronRight size={16} style={{ color: "var(--c-sub)" }} />
          </div>
        ))}
      </div>
      <button className="qp-fab" onClick={onAdd}>
        <Plus size={17} />チーム追加
      </button>
    </>
  );
}

/* ============================================================
   Team Form
   ============================================================ */
function TeamForm({ initial, onSave, onBack }) {
  const [name, setName] = useState(initial?.name || "");
  const [side, setSide] = useState(initial?.side || "offense");

  return (
    <>
      <BackHeader title={initial ? "チーム編集" : "チーム追加"} onBack={onBack} />
      <div className="qp-scroll">
        <div className="qp-field">
          <label>チーム名</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：Tigers Offense"
            autoFocus
          />
        </div>
        <div className="qp-field">
          <label>サイド</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { value: "offense", label: "⚔️ オフェンス", cls: "offense" },
              { value: "defense", label: "🛡️ ディフェンス", cls: "defense" },
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => setSide(opt.value)}
                style={{
                  flex: 1,
                  background: side === opt.value ? (opt.value === "offense" ? "rgba(244,185,66,0.18)" : "rgba(78,181,255,0.18)") : "var(--c-surface)",
                  border: `2px solid ${side === opt.value ? (opt.value === "offense" ? "var(--c-offense)" : "var(--c-defense)") : "var(--c-border)"}`,
                  borderRadius: 12,
                  padding: "12px 8px",
                  textAlign: "center",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: side === opt.value ? (opt.value === "offense" ? "var(--c-offense)" : "var(--c-defense)") : "var(--c-sub)",
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
        <button
          className="qp-btn-primary"
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), side })}
        >
          {initial ? "更新する" : "保存する"}
        </button>
      </div>
    </>
  );
}

/* ============================================================
   Play Manager (one team)
   ============================================================ */
function PlayManager({ team, onAddPlay, onDeletePlay, onEditPlay, onBack }) {
  return (
    <>
      <BackHeader
        title={team.name}
        onBack={onBack}
        actions={
          <span className={`qp-side-badge ${team.side}`} style={{ marginLeft: "auto" }}>
            {team.side === "offense" ? <Swords size={11} /> : <ShieldCheck size={11} />}
            {team.side === "offense" ? "OFFENSE" : "DEFENSE"}
          </span>
        }
      />
      <div className="qp-scroll">
        {team.plays.length === 0 && (
          <div className="qp-empty">
            <div className="emoji">📋</div>
            まだプレーが登録されていません<br />右下の＋から追加しましょう
          </div>
        )}
        {team.plays.map(play => (
          <div key={play.id} className="qp-play-card">
            <div className="qp-play-thumb">
              {play.imageDataUrl
                ? <img src={play.imageDataUrl} alt={play.name} />
                : <ImagePlus size={20} />
              }
            </div>
            <div className="qp-play-info">
              <div className="pn">{play.name}</div>
              <div className="ps">{play.imageDataUrl ? "画像あり" : "画像なし"}</div>
            </div>
            <div className="qp-play-actions">
              <button className="qp-icon-btn" onClick={() => onEditPlay(play.id)} title="編集">
                <Pencil size={14} />
              </button>
              <button className="qp-icon-btn danger" onClick={() => onDeletePlay(play.id)} title="削除">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="qp-fab" onClick={onAddPlay}>
        <Plus size={17} />プレー追加
      </button>
    </>
  );
}

/* ============================================================
   Play Form
   ============================================================ */
function PlayForm({ initial, onSave, onBack }) {
  const [name, setName] = useState(initial?.name || "");
  const [imgUrl, setImgUrl] = useState(initial?.imageDataUrl || null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImgUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <BackHeader title={initial ? "プレー編集" : "プレー追加"} onBack={onBack} />
      <div className="qp-scroll">
        <div className="qp-field">
          <label>プレー名</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：36 POWER, Y-Cross 等"
            autoFocus
          />
        </div>
        <div className="qp-field">
          <label>アサイメント画像</label>
          <div className="qp-img-upload" onClick={() => fileRef.current?.click()}>
            {imgUrl
              ? <img src={imgUrl} alt="preview" />
              : <>
                  <ImagePlus size={28} />
                  <span>タップして画像を選択</span>
                  <span style={{ fontSize: 11 }}>JPG / PNG / GIF</span>
                </>
            }
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
          </div>
          {imgUrl && (
            <button
              style={{ marginTop: 8, background: "none", border: "none", color: "var(--c-sub)", fontSize: 12, cursor: "pointer" }}
              onClick={() => setImgUrl(null)}
            >
              画像を削除
            </button>
          )}
        </div>
        <button
          className="qp-btn-primary"
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), imageDataUrl: imgUrl })}
        >
          {initial ? "更新する" : "保存する"}
        </button>
      </div>
    </>
  );
}

/* ============================================================
   Quiz Screen
   ============================================================ */
function QuizScreen({ team, quizType, onFinish, onBack }) {
  const [questions] = useState(() => generateQuiz(team.plays, quizType));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // play id
  const [answers, setAnswers] = useState([]); // {correct: bool}[]

  if (!questions) return (
    <div className="qp-empty">
      <div className="emoji">⚠️</div>
      プレーが3つ以上必要です
    </div>
  );

  const q = questions[index];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.correct.id;

  const handleSelect = (id) => {
    if (isAnswered) return;
    setSelected(id);
  };

  const handleNext = () => {
    const newAnswers = [...answers, { correct: selected === q.correct.id }];
    if (index + 1 >= questions.length) {
      onFinish(newAnswers);
    } else {
      setAnswers(newAnswers);
      setIndex(index + 1);
      setSelected(null);
    }
  };

  const typeLabel = quizType === "img2name" ? "絵を見てプレー名を答えよ" : "プレー名を見て絵を答えよ";

  return (
    <>
      <BackHeader title={team.name} onBack={onBack} />
      {/* Progress dots */}
      <div className="qp-quiz-progress">
        {questions.map((_, i) => (
          <div
            key={i}
            className={
              "qp-quiz-progress-dot" +
              (i < index ? " done" : i === index ? " current" : "")
            }
          />
        ))}
      </div>
      <div className="qp-quiz-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="qp-quiz-question">{typeLabel}</div>
          <div style={{ color: "var(--c-sub)", fontFamily: "'Bebas Neue',sans-serif", fontSize: 18 }}>
            {index + 1} / {questions.length}
          </div>
        </div>

        {/* Stimulus */}
        {quizType === "img2name" ? (
          q.correct.imageDataUrl
            ? <img className="qp-quiz-img" src={q.correct.imageDataUrl} alt="" />
            : <div className="qp-quiz-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-sub)", fontSize: 13 }}>画像未登録</div>
        ) : (
          <div className="qp-quiz-name">{q.correct.name}</div>
        )}

        {/* Choices */}
        <div className="qp-choices">
          {q.choices.map((choice, ci) => {
            let choiceCls = "";
            let iconEl = null;
            if (isAnswered) {
              if (choice.id === q.correct.id) {
                choiceCls = selected === choice.id ? "correct" : "reveal";
                iconEl = <span className="qp-ans-icon ok"><Check size={14} /></span>;
              } else if (choice.id === selected) {
                choiceCls = "wrong";
                iconEl = <span className="qp-ans-icon ng"><X size={14} /></span>;
              }
            }
            return (
              <div
                key={choice.id}
                className={`qp-choice ${choiceCls} ${isAnswered ? "answered" : ""}`}
                onClick={() => handleSelect(choice.id)}
              >
                {quizType === "img2name" ? (
                  /* Text choices */
                  <div className="qp-choice-text" style={{ width: "100%" }}>
                    <span className="qp-choice-idx">{["A","B","C"][ci]}</span>
                    <span style={{ flex: 1 }}>{choice.name}</span>
                    {iconEl}
                  </div>
                ) : (
                  /* Image choices */
                  <div style={{ width: "100%" }}>
                    {choice.imageDataUrl
                      ? <img className="qp-choice-img" src={choice.imageDataUrl} alt={choice.name} />
                      : <div className="qp-choice-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-sub)", fontSize: 12 }}>
                          {choice.name}（画像なし）
                        </div>
                    }
                    {isAnswered && (
                      <div style={{ padding: "8px 12px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
                        <span>{choice.name}</span>
                        {iconEl}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAnswered && (
          <button className="qp-next-btn" onClick={handleNext}>
            {index + 1 < questions.length ? "次の問題 →" : "結果を見る 🏆"}
          </button>
        )}
      </div>
    </>
  );
}

/* ============================================================
   Result Screen
   ============================================================ */
function ResultScreen({ answers, total, onRetry, onHome }) {
  const correct = answers.filter(a => a.correct).length;
  const pct = Math.round((correct / total) * 100);
  const grade = pct === 100 ? "PERFECT! 🏆" : pct >= 80 ? "GREAT! 🌟" : pct >= 60 ? "GOOD 👍" : "KEEP GOING 💪";

  return (
    <>
      <div className="qp-header">
        <h1>RESULT</h1>
      </div>
      <div className="qp-scroll">
        <div className="qp-result-hero">
          <div className="score-num">{correct}<span style={{ fontSize: 32, marginLeft: 4 }}>/ {total}</span></div>
          <div className="score-label">{pct}% 正解</div>
          <div className="grade">{grade}</div>
        </div>
        <div className="qp-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--c-sub)" }}>
            <span>正解</span><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "var(--c-green)" }}>{correct}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--c-sub)" }}>
            <span>不正解</span><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "var(--c-red)" }}>{total - correct}</span>
          </div>
          {/* mini bar */}
          <div style={{ marginTop: 12, background: "var(--c-surface)", borderRadius: 6, height: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "var(--c-green)", borderRadius: 6, transition: "width .5s ease" }} />
          </div>
        </div>
        <button className="qp-btn-primary" style={{ marginBottom: 10 }} onClick={onRetry}>
          <RotateCcw size={15} style={{ verticalAlign: -2, marginRight: 6 }} />もう一度挑戦
        </button>
        <button className="qp-btn-primary" style={{ background: "var(--c-surface)", color: "var(--c-ink)", boxShadow: "none" }} onClick={onHome}>
          ホームに戻る
        </button>
      </div>
    </>
  );
}

/* ============================================================
   App Root
   ============================================================ */
export default function App() {
  const [data, setData] = useState(() => storage.load() || defaultData());
  const [screen, setScreen] = useState("home");
  const [ctx, setCtx] = useState({}); // { teamId, quizType, playId, quizAnswers, quizTotal }
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  /* persist on change */
  useEffect(() => {
    storage.save(data);
  }, [data]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const go = (s, extra = {}) => { setCtx(extra); setScreen(s); };

  /* ---- Team mutations ---- */
  const handleAddTeam = () => go("teamForm", {});
  const handleSaveTeam = ({ name, side }) => {
    if (ctx.teamId) {
      setData(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === ctx.teamId ? { ...t, name, side } : t),
      }));
    } else {
      const newTeam = { id: uid(), name, side, plays: [] };
      setData(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
    }
    showToast(ctx.teamId ? "チームを更新しました" : "チームを追加しました");
    go("teams");
  };
  const handleDeleteTeam = (teamId) => {
    if (!window.confirm("このチームとプレーをすべて削除しますか？")) return;
    setData(prev => ({ ...prev, teams: prev.teams.filter(t => t.id !== teamId) }));
    showToast("チームを削除しました");
  };

  /* ---- Play mutations ---- */
  const currentTeam = data.teams.find(t => t.id === ctx.teamId) || null;

  const handleAddPlay = () => go("playForm", { teamId: ctx.teamId });
  const handleSavePlay = ({ name, imageDataUrl }) => {
    setData(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id !== ctx.teamId) return t;
        if (ctx.playId) {
          return { ...t, plays: t.plays.map(p => p.id === ctx.playId ? { ...p, name, imageDataUrl } : p) };
        } else {
          return { ...t, plays: [...t.plays, { id: uid(), name, imageDataUrl, positions: [] }] };
        }
      }),
    }));
    showToast(ctx.playId ? "プレーを更新しました" : "プレーを追加しました");
    go("playManager", { teamId: ctx.teamId });
  };
  const handleDeletePlay = (playId) => {
    if (!window.confirm("このプレーを削除しますか？")) return;
    setData(prev => ({
      ...prev,
      teams: prev.teams.map(t =>
        t.id !== ctx.teamId ? t : { ...t, plays: t.plays.filter(p => p.id !== playId) }
      ),
    }));
    showToast("プレーを削除しました");
  };
  const handleEditPlay = (playId) => {
    go("playForm", { teamId: ctx.teamId, playId });
  };

  /* ---- Quiz ---- */
  const handleQuizFinish = (answers) => {
    go("result", { ...ctx, quizAnswers: answers, quizTotal: answers.length });
  };

  /* ---- Render ---- */
  const currentPlay = currentTeam?.plays.find(p => p.id === ctx.playId) || null;
  const quizTeam = data.teams.find(t => t.id === ctx.teamId) || null;

  return (
    <div className="qp-root">
      <GlobalStyle />
      {toast && <div className="qp-toast">{toast}</div>}

      {screen === "home" && <Home data={data} go={go} />}
      {screen === "teams" && (
        <TeamList
          data={data}
          onAdd={handleAddTeam}
          onSelect={(id) => go("playManager", { teamId: id })}
          onDelete={handleDeleteTeam}
          onBack={() => go("home")}
        />
      )}
      {screen === "teamForm" && (
        <TeamForm
          initial={ctx.teamId ? data.teams.find(t => t.id === ctx.teamId) : null}
          onSave={handleSaveTeam}
          onBack={() => go("teams")}
        />
      )}
      {screen === "playManager" && currentTeam && (
        <PlayManager
          team={currentTeam}
          onAddPlay={handleAddPlay}
          onDeletePlay={handleDeletePlay}
          onEditPlay={handleEditPlay}
          onBack={() => go("teams")}
        />
      )}
      {screen === "playForm" && (
        <PlayForm
          initial={currentPlay}
          onSave={handleSavePlay}
          onBack={() => go("playManager", { teamId: ctx.teamId })}
        />
      )}
      {screen === "quiz" && quizTeam && (
        <QuizScreen
          team={quizTeam}
          quizType={ctx.quizType}
          onFinish={handleQuizFinish}
          onBack={() => go("home")}
        />
      )}
      {screen === "result" && (
        <ResultScreen
          answers={ctx.quizAnswers || []}
          total={ctx.quizTotal || 0}
          onRetry={() => go("quiz", { teamId: ctx.teamId, quizType: ctx.quizType })}
          onHome={() => go("home")}
        />
      )}
    </div>
  );
}
