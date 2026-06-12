import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { audioService } from '../services/audioService';
import { Plus, Trash2, Edit2, Check, X, ShieldAlert, Smile, AlertCircle } from 'lucide-react';

const DEFAULT_EMOJIS = [
  "🧠", "🎮", "⚡", "🏆", "🔥", "🎯", "👑", "🚀", "👍", "🙌", "💖", "🎉", "🌟", "👾", "👀", "😎"
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error in EmojiManager: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const EmojiManager: React.FC = () => {
  const [dbEmojis, setDbEmojis] = useState<{ id: string; char: string; timestamp: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing/adding state
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [inputChar, setInputChar] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Subscribing to emojis in database
  useEffect(() => {
    const path = 'emojis';
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: { id: string; char: string; timestamp: number }[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            char: data.char || '',
            timestamp: data.timestamp || 0,
          });
        });
        setDbEmojis(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Failed to stream live reaction presets. Verify admin status.");
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.GET, path);
        } catch (e) {
          // Handled and logged
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Compute 16 absolute visual slots
  // If a slot has a custom emoji in db, use it. Otherwise, show default backup emoji.
  const slots = Array.from({ length: 16 }).map((_, idx) => {
    const dbEmoji = dbEmojis[idx];
    return {
      index: idx,
      isCustom: !!dbEmoji,
      id: dbEmoji?.id || `default-${idx}`,
      char: dbEmoji?.char || DEFAULT_EMOJIS[idx],
      timestamp: dbEmoji?.timestamp || 0,
    };
  });

  const handleSelectSlot = (idx: number, currentBlock: typeof slots[0]) => {
    audioService.playClick();
    setSelectedSlotIndex(idx);
    setInputChar(currentBlock.char);
    setStatusMessage(null);
  };

  const handleSaveSlot = async (idx: number) => {
    if (!inputChar.trim()) return;
    const charToSave = inputChar.trim();

    // Custom check: validate that it's a valid emoji or small string up to 4 chars
    if (charToSave.length > 4) {
      setStatusMessage("Emoji must be a single symbol or at most 4 chars.");
      return;
    }

    const docId = `emojiSlot-${idx}`;
    const path = `emojis/${docId}`;
    try {
      audioService.playClick();
      await setDoc(doc(db, 'emojis', docId), {
        char: charToSave,
        timestamp: Date.now()
      });
      setSelectedSlotIndex(null);
      setStatusMessage(null);
    } catch (err) {
      console.error("Failed to commit emoji slot:", err);
      setStatusMessage(err instanceof Error ? err.message : String(err));
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (e) {
        // Handled
      }
    }
  };

  const handleClearSlot = async (idx: number, isCustom: boolean) => {
    audioService.playClick();
    if (!isCustom) {
      // Already running on a default emoji fallback slot, nothing to wipe in firestore
      setSelectedSlotIndex(null);
      return;
    }

    const docId = `emojiSlot-${idx}`;
    const path = `emojis/${docId}`;
    try {
      await deleteDoc(doc(db, 'emojis', docId));
      setSelectedSlotIndex(null);
      setStatusMessage(null);
    } catch (err) {
      console.error("Failed to delete emoji slot:", err);
      setStatusMessage(err instanceof Error ? err.message : String(err));
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (e) {
        // Handled
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Live Emoji Manager</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
              Zero-scroll 16-slot reaction system
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 px-3 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-500 text-[10px] font-black uppercase tracking-wide">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Admin Curated Panel</span>
        </div>
      </div>

      {error ? (
        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/15 flex items-center gap-3 text-rose-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-line Visual Grid preview without scrolling */}
          <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden shadow-xl p-6 relative">
            <div className="mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                ACTIVE REACTION GRID PREVIEW (exactly 2 LINES, no scroll)
              </h4>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                Each button maps to the real-time chat interface. Click a slot to configure.
              </p>
            </div>

            {loading ? (
              <div className="h-32 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-xs font-black uppercase tracking-widest">Loading presets...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Visualizer: exactly col-8 / row-2. Fits perfectly! */}
                <div className="grid grid-cols-8 grid-rows-2 gap-2 bg-slate-950 p-4 rounded-2xl relative border border-white/5 shadow-inner">
                  {slots.map((slot) => {
                    const isEditingThis = selectedSlotIndex === slot.index;
                    return (
                      <button
                        key={slot.index}
                        onClick={() => handleSelectSlot(slot.index, slot)}
                        className={`aspect-square sm:h-12 w-full rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer select-none relative group ${
                          isEditingThis
                            ? 'bg-indigo-600 shadow-lg shadow-indigo-500/40 border-2 border-indigo-400'
                            : slot.isCustom
                            ? 'bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:scale-105 hover:border-indigo-400 text-slate-200'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 opacity-65 hover:opacity-100 hover:scale-105 text-slate-400'
                        }`}
                        title={slot.isCustom ? `Slot ${slot.index + 1}: Custom ${slot.char}` : `Slot ${slot.index + 1}: Default Fallback ${slot.char}`}
                      >
                        {slot.char}

                        {/* Top Indicator */}
                        <span className="absolute top-1 left-1 text-[7px] font-black text-slate-500 opacity-60">
                          {slot.index + 1}
                        </span>

                        {/* Custom tag */}
                        {slot.isCustom && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-indigo-500/10 border border-indigo-500/30 inline-block" />
                      <span>Custom Overridden Slots</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-white/5 border border-white/10 inline-block" />
                      <span>System Default Backups</span>
                    </div>
                  </div>
                  <span>Total slots: 16</span>
                </div>
              </div>
            )}
          </div>

          {/* Slot Customization Side Panel */}
          <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-xl p-6 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-200 dark:border-white/5 pb-3 mb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Configure Preset Slot
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Override falling defaults with custom assets
                </p>
              </div>

              {selectedSlotIndex === null ? (
                <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-500">
                  <Smile className="w-8 h-8 opacity-25 mb-1.5" />
                  <p className="text-[10px] font-black uppercase tracking-wider">No slot selected</p>
                  <p className="text-[9px] text-slate-400 max-w-[180px] mt-1">
                    Click any emoji slot in the left grid panel to start mapping or clearing!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wide text-indigo-400">
                      Modifying Slot {selectedSlotIndex + 1}
                    </span>
                    <button
                      onClick={() => setSelectedSlotIndex(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center text-4xl select-none">
                      {inputChar || "❓"}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                        Emoji representation character
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="🔥"
                        value={inputChar}
                        onChange={(e) => setInputChar(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  </div>

                  {statusMessage && (
                    <p className="text-[9px] font-bold text-rose-500 break-words bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
                      {statusMessage}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleSaveSlot(selectedSlotIndex)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest cursor-pointer shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Set Custom
                    </button>

                    {slots[selectedSlotIndex].isCustom && (
                      <button
                        onClick={() => handleClearSlot(selectedSlotIndex, slots[selectedSlotIndex].isCustom)}
                        className="py-2 px-3.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-[10px] tracking-widest cursor-pointer transition-all flex items-center justify-center"
                        title="Delete custom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 dark:border-white/5 text-[9px] text-slate-400 uppercase leading-relaxed font-bold">
              ⚡ Custom inputs sync with the live Cloud database instantaneously. Real-time players are updated as soon as you save.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
