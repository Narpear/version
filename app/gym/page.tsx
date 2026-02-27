'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { User, GymLog, ExerciseLibrary } from '@/types';
import {
  Dumbbell, Trash2, ChevronLeft, ChevronRight, X,
  Search, Edit, Flame, Zap, Plus, BookOpen, ChevronDown, TrendingUp
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { recalculateGoalCumulatives } from '@/lib/goalUtils';

const MUSCLE_COLORS: Record<string, string> = {
  'Chest':                  'bg-red-100 border-red-400 text-red-900',
  'Upper Chest':            'bg-red-50 border-red-300 text-red-700',
  'Lats':                   'bg-blue-100 border-blue-500 text-blue-900',
  'Teres Major':            'bg-blue-50 border-blue-300 text-blue-700',
  'Rhomboids':              'bg-sky-100 border-sky-400 text-sky-900',
  'Mid Traps':              'bg-sky-50 border-sky-300 text-sky-700',
  'Upper Traps':            'bg-indigo-100 border-indigo-400 text-indigo-900',
  'Lower Back':             'bg-slate-100 border-slate-400 text-slate-800',
  'Front Delts':            'bg-violet-100 border-violet-400 text-violet-900',
  'Side Delts':             'bg-purple-100 border-purple-400 text-purple-900',
  'Rear Delts':             'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-900',
  'Biceps':                 'bg-amber-100 border-amber-500 text-amber-900',
  'Brachialis':             'bg-amber-50 border-amber-300 text-amber-700',
  'Forearms':               'bg-yellow-100 border-yellow-400 text-yellow-800',
  'Triceps':                'bg-orange-100 border-orange-500 text-orange-900',
  'Triceps (Long Head)':    'bg-orange-100 border-orange-400 text-orange-800',
  'Triceps (Lateral Head)': 'bg-orange-50 border-orange-300 text-orange-700',
  'Triceps (Medial Head)':  'bg-amber-50 border-orange-300 text-orange-700',
  'Quads':                  'bg-green-100 border-green-500 text-green-900',
  'Hamstrings':             'bg-teal-100 border-teal-500 text-teal-900',
  'Glutes':                 'bg-emerald-100 border-emerald-500 text-emerald-900',
  'Glute Med':              'bg-emerald-50 border-emerald-300 text-emerald-700',
  'Calves':                 'bg-cyan-100 border-cyan-400 text-cyan-900',
  'Inner Thighs':           'bg-rose-100 border-rose-400 text-rose-800',
  'Outer Thighs':           'bg-pink-100 border-pink-300 text-pink-800',
  'Abs':                    'bg-yellow-100 border-yellow-500 text-yellow-900',
  'Lower Abs':              'bg-yellow-50 border-yellow-400 text-yellow-800',
  'Obliques':               'bg-lime-100 border-lime-400 text-lime-900',
  'Hip Flexors':            'bg-lime-50 border-lime-300 text-lime-700',
  'Deep Core':              'bg-yellow-50 border-yellow-300 text-yellow-700',
};

const FALLBACK_COLOR = 'bg-gray-100 border-gray-300 text-gray-800';

function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border-4 border-darkgray max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-pixel">
        <div className="sticky top-0 bg-white border-b-4 border-darkgray p-4 flex justify-between items-center">
          <h2 className="heading-pixel text-xl">{title}</h2>
          <button onClick={onClose} className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70 transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function MuscleTags({ groups, isCardio }: { groups: string[]; isCardio: boolean }) {
  if (isCardio) {
    return (
      <span className="text-xs font-mono px-2 py-0.5 border rounded bg-pink-100 border-pink-300 text-pink-800">
        Cardio
      </span>
    );
  }
  if (!groups?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {groups.map(g => (
        <span key={g} className={`text-xs font-mono px-2 py-0.5 border rounded ${MUSCLE_COLORS[g] || FALLBACK_COLOR}`}>
          {g}
        </span>
      ))}
    </div>
  );
}

function ExerciseRow({ log, onEdit, onDelete }: {
  log: GymLog;
  onEdit: (log: GymLog) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 border-2 border-darkgray bg-white hover:bg-secondary/10 transition-all">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono font-bold mb-1">{log.exercise_name}</p>
          <div className="mb-2">
            <MuscleTags groups={log.muscle_groups || []} isCardio={log.is_cardio || false} />
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-sm text-darkgray/70">
            {log.sets && log.reps ? <span>{log.sets} sets × {log.reps} reps</span> : null}
            {log.weight_kg ? <span>{log.weight_kg} kg</span> : null}
            {log.calories_burned > 0 && (
              <span className="flex items-center gap-1">
                <Flame size={12} className="text-orange-400" />
                {log.calories_burned} cal
              </span>
            )}
          </div>
          {log.notes && (
            <p className="font-mono text-xs text-darkgray/50 mt-1">{log.notes}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(log)}
            className="p-2 border-2 border-darkgray bg-accent hover:bg-accent/70 transition-all"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(log.id)}
            className="p-2 border-2 border-darkgray bg-warning hover:bg-warning/70 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Progress chart ────────────────────────────────────────────────────────────
interface HistoryPoint {
  date: string;
  weight_kg: number | null;
  sets: number | null;
  reps: number | null;
}

function ProgressChart({ points }: { points: HistoryPoint[] }) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 600, H = 140;
  const PAD = { top: 14, right: 16, bottom: 30, left: 42 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const weights = points.map(p => p.weight_kg ?? 0);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const xScale = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * iW;
  const yScale = (w: number) => PAD.top + iH - ((w - minW) / range) * iH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.weight_kg ?? 0).toFixed(1)}`)
    .join(' ');

  const yTicks = [0, 0.5, 1].map(t => ({
    t, val: minW + range * t, y: PAD.top + iH * (1 - t),
  }));

  const activePoint = tooltip !== null ? points[tooltip.idx] : null;
  const activeX = tooltip !== null ? xScale(tooltip.idx) : 0;
  const activeY = activePoint ? yScale(activePoint.weight_kg ?? 0) : 0;

  return (
    <div className="relative w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 140 }}
        onMouseLeave={() => setTooltip(null)}
      >
        {yTicks.map(({ t, val, y }) => (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af" fontFamily="monospace">
              {Number.isInteger(val) ? val : val.toFixed(1)}
            </text>
          </g>
        ))}

        {points.map((p, i) => {
          const step = Math.ceil(points.length / 7);
          if (points.length > 8 && i % step !== 0 && i !== points.length - 1) return null;
          const d = new Date(p.date + 'T00:00:00');
          return (
            <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af" fontFamily="monospace">
              {`${d.getMonth() + 1}/${d.getDate()}`}
            </text>
          );
        })}

        {tooltip !== null && (
          <line x1={activeX} y1={PAD.top} x2={activeX} y2={PAD.top + iH}
            stroke="#4f46e5" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
        )}

        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        )}

        {points.map((p, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(p.weight_kg ?? 0)}
            r={tooltip?.idx === i ? 6 : 4}
            fill={tooltip?.idx === i ? '#4f46e5' : 'white'}
            stroke="#4f46e5" strokeWidth={2}
          />
        ))}

        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={xScale(i) - (iW / Math.max(points.length - 1, 1)) / 2}
            y={PAD.top}
            width={iW / Math.max(points.length - 1, 1)}
            height={iH}
            fill="transparent"
            onMouseEnter={() => setTooltip({ idx: i })}
          />
        ))}
      </svg>

      {tooltip !== null && activePoint && (
        <div
          className="absolute z-10 pointer-events-none bg-darkgray text-white font-mono text-xs px-2.5 py-2 space-y-0.5 border-2 border-darkgray"
          style={{
            left: `clamp(4px, calc(${(activeX / W) * 100}% - 44px), calc(100% - 92px))`,
            top: `${Math.max(0, ((activeY - PAD.top) / iH) * 100 - 30)}%`,
          }}
        >
          <div className="font-bold text-sm">{activePoint.weight_kg} kg</div>
          {activePoint.sets && activePoint.reps && (
            <div className="text-white/70">{activePoint.sets} × {activePoint.reps} reps</div>
          )}
          <div className="text-white/50">
            {new Date(activePoint.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseProgressCard({ name, history }: { name: string; history: HistoryPoint[] }) {
  const [open, setOpen] = useState(false);

  const withWeight = history.filter(p => p.weight_kg !== null && p.weight_kg > 0);
  const latest = withWeight[withWeight.length - 1];
  const first = withWeight[0];
  const diff =
    latest && first && withWeight.length > 1
      ? +(latest.weight_kg! - first.weight_kg!).toFixed(2)
      : null;

  return (
    <div className="border-2 border-darkgray">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-accent/10 transition-all text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono font-bold text-sm truncate">{name}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="font-mono text-xs text-darkgray/50 hidden sm:block">
            {latest ? `${latest.weight_kg} kg · ` : ''}
            {history.length} session{history.length !== 1 ? 's' : ''}
          </span>
          <ChevronDown
            size={16}
            className={`text-darkgray/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t-2 border-darkgray p-4 bg-white">
          {withWeight.length >= 2 ? (
            <ProgressChart points={withWeight} />
          ) : withWeight.length === 1 ? (
            <p className="py-4 text-center font-mono text-sm text-darkgray/50">
              Only 1 session with weight data — log more to see a graph
            </p>
          ) : (
            <p className="py-4 text-center font-mono text-sm text-darkgray/50">
              No weight recorded for this exercise
            </p>
          )}

          <div className="mt-3 border-t border-gray-100 pt-3 space-y-0 max-h-44 overflow-y-auto">
            {[...history].reverse().map((p, i) => (
              <div key={i} className="flex justify-between font-mono text-xs text-darkgray/70 py-1.5 border-b border-gray-50 last:border-0">
                <span>
                  {new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </span>
                <span className="text-darkgray font-medium">
                  {p.weight_kg ? `${p.weight_kg} kg` : '—'}
                  {p.sets && p.reps ? `  ·  ${p.sets} × ${p.reps}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [gymLogs, setGymLogs] = useState<GymLog[]>([]);
  const [allHistory, setAllHistory] = useState<GymLog[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibrary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<GymLog | null>(null);

  // Date
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  // Form state
  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [isCardio, setIsCardio] = useState(false);
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [notes, setNotes] = useState('');
  const [warmupDone, setWarmupDone] = useState(false);
  const [cooldownDone, setCooldownDone] = useState(false);
  const [meditationDone, setMeditationDone] = useState(false);

  // Library filter
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');

  // Main page muscle filter
  const [activeMuscleView, setActiveMuscleView] = useState('All');

  // Muscle tag input
  const [muscleInput, setMuscleInput] = useState('');

  // Progress section
  const [progressSearch, setProgressSearch] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadWorkoutData(parsedUser.id, selectedDate);
    loadExerciseLibrary();
    loadAllHistory(parsedUser.id);
  }, [router, selectedDate]);

  useEffect(() => {
    if (gymLogs.length > 0) {
      const first = gymLogs[0];
      setWarmupDone(first.warmup_done);
      setCooldownDone(first.cooldown_done);
      setMeditationDone(first.meditation_done);
    } else {
      setWarmupDone(false);
      setCooldownDone(false);
      setMeditationDone(false);
    }
  }, [gymLogs]);

  const loadWorkoutData = async (userId: string, date: string) => {
    try {
      const { data } = await supabase
        .from('gym_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (data) {
        setGymLogs(data);
        await updateDailyTotals(userId, data, date);
      }
    } catch (e) {
      console.log('No gym logs for this date');
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseLibrary = async () => {
    try {
      const { data } = await supabase
        .from('exercise_library')
        .select('*')
        .order('exercise_name');
      if (data) setExerciseLibrary(data);
    } catch (e) {
      console.log('Error loading library');
    }
  };

  const loadAllHistory = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('gym_logs')
        .select('id, date, exercise_name, weight_kg, sets, reps')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (data) setAllHistory(data as GymLog[]);
    } catch (e) {
      console.log('Error loading history');
    }
  };

  const updateDailyTotals = async (userId: string, logs: GymLog[], date: string) => {
    const totalCaloriesOut = logs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
    try {
      const { data: existing } = await supabase
        .from('daily_entries').select('*').eq('user_id', userId).eq('date', date).single();

      if (existing) {
        const bmr = existing.bmr || 0;
        const caloriesIn = existing.total_calories_in || 0;
        const netIntake = caloriesIn - totalCaloriesOut;
        const apparentDeficit = bmr > 0 ? bmr - netIntake : null;
        await supabase.from('daily_entries').update({
          total_calories_out: totalCaloriesOut,
          net_intake: netIntake,
          apparent_deficit: apparentDeficit,
        }).eq('id', existing.id);
        await recalculateGoalCumulatives(userId);
      } else {
        await supabase.from('daily_entries').insert({
          user_id: userId,
          date,
          total_calories_in: 0,
          total_calories_out: totalCaloriesOut,
          water_glasses: 0,
        });
      }
    } catch (e) {
      console.error('Error updating daily totals:', e);
    }
  };

  const resetForm = () => {
    setExerciseName('');
    setMuscleGroups([]);
    setIsCardio(false);
    setSets(0);
    setReps(0);
    setWeight(0);
    setCaloriesBurned(0);
    setNotes('');
    setMuscleInput('');
    setEditingWorkout(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !exerciseName) return;

    try {
      if (editingWorkout) {
        const { data, error } = await supabase
          .from('gym_logs')
          .update({
            exercise_name: exerciseName,
            muscle_groups: isCardio ? [] : muscleGroups,
            is_cardio: isCardio,
            sets: sets || null,
            reps: reps || null,
            weight_kg: weight || null,
            calories_burned: caloriesBurned,
            notes: notes || null,
          })
          .eq('id', editingWorkout.id)
          .select()
          .single();

        if (error) throw error;
        const updated = gymLogs.map(l => l.id === editingWorkout.id ? data : l);
        setGymLogs(updated);
        await updateDailyTotals(user.id, updated, selectedDate);
        toast('Updated!');
      } else {
        const { data, error } = await supabase
          .from('gym_logs')
          .insert({
            user_id: user.id,
            date: selectedDate,
            exercise_name: exerciseName,
            muscle_groups: isCardio ? [] : muscleGroups,
            is_cardio: isCardio,
            sets: sets || null,
            reps: reps || null,
            weight_kg: weight || null,
            calories_burned: caloriesBurned,
            notes: notes || null,
            warmup_done: warmupDone,
            cooldown_done: cooldownDone,
            meditation_done: meditationDone,
          })
          .select()
          .single();

        if (error) throw error;
        const updated = [...gymLogs, data];
        setGymLogs(updated);
        setAllHistory(prev => [...prev, data]);
        await updateDailyTotals(user.id, updated, selectedDate);
        toast('Exercise logged!');
      }

      resetForm();
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save exercise');
    }
  };

  const handleSelectFromLibrary = (exercise: ExerciseLibrary) => {
    setExerciseName(exercise.exercise_name);
    setMuscleGroups(exercise.muscle_groups || []);
    setIsCardio(exercise.is_cardio);
    setSets(0);
    setReps(0);
    setWeight(0);
    setCaloriesBurned(0);
    setNotes('');
    setMuscleInput('');
    setShowLibraryModal(false);
    setShowAddModal(true);
  };

  const handleEdit = (log: GymLog) => {
    setExerciseName(log.exercise_name);
    setMuscleGroups(log.muscle_groups || []);
    setIsCardio(log.is_cardio || false);
    setSets(log.sets || 0);
    setReps(log.reps || 0);
    setWeight(log.weight_kg || 0);
    setCaloriesBurned(log.calories_burned || 0);
    setNotes(log.notes || '');
    setMuscleInput('');
    setEditingWorkout(log);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await supabase.from('gym_logs').delete().eq('id', id);
      const updated = gymLogs.filter(l => l.id !== id);
      setGymLogs(updated);
      setAllHistory(prev => prev.filter(l => l.id !== id));
      await updateDailyTotals(user.id, updated, selectedDate);
      toast('Deleted');
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const updateChecklist = async (
    field: 'warmup_done' | 'cooldown_done' | 'meditation_done',
    value: boolean
  ) => {
    if (!user || gymLogs.length === 0) return;
    const first = gymLogs[0];
    try {
      await supabase.from('gym_logs').update({ [field]: value }).eq('id', first.id);
      setGymLogs(gymLogs.map(l => l.id === first.id ? { ...l, [field]: value } : l));
      if (field === 'warmup_done') setWarmupDone(value);
      if (field === 'cooldown_done') setCooldownDone(value);
      if (field === 'meditation_done') setMeditationDone(value);
      toast('Saved!');
    } catch (e) {
      console.error(e);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const addMuscleTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !muscleGroups.includes(trimmed)) {
      setMuscleGroups([...muscleGroups, trimmed]);
    }
    setMuscleInput('');
  };

  const removeMuscleTag = (g: string) => {
    setMuscleGroups(muscleGroups.filter(m => m !== g));
  };

  // Derived
  const totalCalsBurned = gymLogs.reduce((s, l) => s + (l.calories_burned || 0), 0);

  const muscleGroupsLogged = [
    ...new Set(
      gymLogs.flatMap(l =>
        l.is_cardio ? ['Cardio'] : (l.muscle_groups || [])
      )
    )
  ].filter(Boolean).sort();

  const visibleLogs = activeMuscleView === 'All'
    ? gymLogs
    : activeMuscleView === 'Cardio'
    ? gymLogs.filter(l => l.is_cardio)
    : gymLogs.filter(l => !l.is_cardio && (l.muscle_groups || []).includes(activeMuscleView));

  const cardioLogs = visibleLogs.filter(l => l.is_cardio);

  const logsByMuscle = [...new Set(
    visibleLogs.filter(l => !l.is_cardio).flatMap(l => l.muscle_groups || [])
  )]
    .sort()
    .map(g => ({
      group: g,
      logs: visibleLogs.filter(l => !l.is_cardio && (l.muscle_groups || []).includes(g)),
    }))
    .filter(({ logs }) => logs.length > 0);

  const unknownLogs = visibleLogs.filter(
    l => !l.is_cardio && (!l.muscle_groups || l.muscle_groups.length === 0)
  );

  // Library filters
  const libraryMuscleOptions = [
    'All',
    'Cardio',
    ...Array.from(new Set(
      exerciseLibrary
        .filter(e => !e.is_cardio)
        .flatMap(e => e.muscle_groups || [])
    )).sort()
  ];

  const filteredLibrary = exerciseLibrary.filter(e => {
    const matchSearch = e.exercise_name.toLowerCase().includes(librarySearch.toLowerCase());
    const matchMuscle =
      selectedMuscleFilter === 'All' ||
      (selectedMuscleFilter === 'Cardio' && e.is_cardio) ||
      (!e.is_cardio && (e.muscle_groups || []).includes(selectedMuscleFilter));
    return matchSearch && matchMuscle;
  });

  // ── Progress data ─────────────────────────────────────────────────────────
  const historyMap = new Map<string, { name: string; points: HistoryPoint[] }>();
  for (const log of allHistory) {
    const key = log.exercise_name.trim().toLowerCase();
    if (!historyMap.has(key)) {
      historyMap.set(key, { name: log.exercise_name.trim(), points: [] });
    }
    historyMap.get(key)!.points.push({
      date: log.date,
      weight_kg: log.weight_kg ? parseFloat(String(log.weight_kg)) : null,
      sets: log.sets ?? null,
      reps: log.reps ?? null,
    });
  }

  // Only show exercises logged on the selected date
  const exercisesOnSelectedDate = new Set(gymLogs.map(l => l.exercise_name.trim().toLowerCase()));

  const progressList = [...historyMap.values()]
    .filter(({ name }) => exercisesOnSelectedDate.has(name.toLowerCase()))
    .sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name))
    .filter(({ name }) =>
      progressSearch === '' || name.toLowerCase().includes(progressSearch.toLowerCase())
    );

  if (loading) {
    return <div className="container-pixel"><p className="font-mono text-lg">Loading...</p></div>;
  }

  return (
    <div className="container-pixel">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="heading-pixel text-3xl mb-1">Gym Tracker</h1>
          <p className="font-mono text-sm text-darkgray/60">
            {gymLogs.length} exercise{gymLogs.length !== 1 ? 's' : ''} · {totalCalsBurned} cal burned
          </p>
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 border-2 border-darkgray bg-white hover:bg-lavender transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center min-w-[110px]">
            <p className="font-mono font-bold">
              {isToday
                ? 'Today'
                : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-pixel-xs border-2 border-darkgray p-1 mt-1 w-full"
            />
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-2 border-2 border-darkgray ${isToday ? 'bg-gray-100 cursor-not-allowed opacity-40' : 'bg-white hover:bg-lavender transition-all'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus size={16} className="inline mr-2" />
          Log Exercise
        </Button>
        <Button variant="secondary" onClick={() => setShowLibraryModal(true)}>
          <BookOpen size={16} className="inline mr-2" />
          Exercise Library
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-warning/10">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-500" />
            <p className="text-pixel-xs text-darkgray/70">Calories Burned</p>
          </div>
          <p className="font-mono text-2xl font-bold">{totalCalsBurned}</p>
        </Card>
        <Card className="bg-accent/10">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={16} className="text-purple-500" />
            <p className="text-pixel-xs text-darkgray/70">Exercises</p>
          </div>
          <p className="font-mono text-2xl font-bold">{gymLogs.length}</p>
        </Card>
        <Card className="bg-success/10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-green-500" />
            <p className="text-pixel-xs text-darkgray/70">Muscle Groups</p>
          </div>
          <p className="font-mono text-2xl font-bold">{muscleGroupsLogged.length}</p>
        </Card>
        <Card className="bg-secondary/10">
          <p className="text-pixel-xs text-darkgray/70 mb-2">Checklist</p>
          <p className="font-mono text-sm">
            {[warmupDone, cooldownDone, meditationDone].filter(Boolean).length}/3 done
          </p>
        </Card>
      </div>

      {/* ── Checklist (today only, only if logs exist) ── */}
      {isToday && gymLogs.length > 0 && (
        <Card title="Today's Checklist" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: '5 min Warmup', field: 'warmup_done' as const, value: warmupDone },
              { label: '5 min Cooldown', field: 'cooldown_done' as const, value: cooldownDone },
              { label: '5 min Meditation', field: 'meditation_done' as const, value: meditationDone },
            ].map(({ label, field, value }) => (
              <button
                key={field}
                onClick={() => updateChecklist(field, !value)}
                className={`p-3 border-2 transition-all flex items-center gap-3 ${
                  value ? 'bg-success/30 border-success' : 'bg-white border-darkgray hover:bg-lavender'
                }`}
              >
                <div
                  className={`w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 ${
                    value ? 'bg-darkgray border-darkgray' : 'border-darkgray'
                  }`}
                >
                  {value && <span className="text-white text-sm font-black">✓</span>}
                </div>
                <span className="font-mono text-sm">{label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ── Muscle Group Filter Tabs ── */}
      {gymLogs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['All', ...muscleGroupsLogged].map(g => (
            <button
              key={g}
              onClick={() => setActiveMuscleView(g)}
              className={`px-3 py-1 border-2 border-darkgray font-mono text-sm transition-all ${
                activeMuscleView === g ? 'bg-darkgray text-white' : 'bg-white hover:bg-accent/30'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* ── Exercises List ── */}
      {gymLogs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto mb-4 text-darkgray/20" />
            <p className="font-mono text-lg text-darkgray/60">No exercises logged yet</p>
            <p className="font-mono text-sm text-darkgray/40 mt-1">Hit "Log Exercise" to get started</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {logsByMuscle.map(({ group, logs }) => (
            <Card key={group} title={group}>
              <div className="space-y-3">
                {logs.map(log => (
                  <ExerciseRow key={log.id} log={log} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </Card>
          ))}

          {cardioLogs.length > 0 && (
            <Card title="Cardio">
              <div className="space-y-3">
                {cardioLogs.map(log => (
                  <ExerciseRow key={log.id} log={log} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </Card>
          )}

          {unknownLogs.length > 0 && (
            <Card title="Other">
              <div className="space-y-3">
                {unknownLogs.map(log => (
                  <ExerciseRow key={log.id} log={log} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Progress Section ── */}
      {gymLogs.length > 0 && allHistory.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-1">
            <TrendingUp size={22} />
            <h2 className="heading-pixel text-2xl">Progress</h2>
          </div>
          <p className="font-mono text-sm text-darkgray/50 mb-5">
            Showing history for exercises logged {isToday ? 'today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>

          <div className="relative mb-4">
            <input
              type="text"
              value={progressSearch}
              onChange={e => setProgressSearch(e.target.value)}
              placeholder="Search exercises..."
              className="input-pixel w-full pr-10"
            />
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-darkgray/50 pointer-events-none"
              size={18}
            />
          </div>

          {progressList.length === 0 ? (
            <p className="font-mono text-sm text-darkgray/50 text-center py-8">No exercises found</p>
          ) : (
            <div className="space-y-2">
              {progressList.map(({ name, points }) => (
                <ExerciseProgressCard key={name} name={name} history={points} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={editingWorkout ? 'Edit Exercise' : 'Log Exercise'}
      >
        {!editingWorkout && (
          <div className="mb-5">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => { setShowAddModal(false); setShowLibraryModal(true); }}
            >
              <BookOpen size={16} className="inline mr-2" />
              Pick from Exercise Library
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Input
              label="Exercise Name"
              type="text"
              value={exerciseName}
              onChange={e => setExerciseName(e.target.value)}
              placeholder="e.g., Squat"
              required
            />

            {/* Cardio toggle */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCardio}
                  onChange={e => {
                    setIsCardio(e.target.checked);
                    if (e.target.checked) setMuscleGroups([]);
                  }}
                  className="w-5 h-5 border-2 border-darkgray"
                />
                <span className="font-mono text-sm">This is a cardio exercise</span>
              </label>
            </div>

            {/* Muscles worked — hidden for cardio */}
            {!isCardio && (
              <div className="md:col-span-2">
                <label className="block text-pixel-sm mb-2">Muscles Worked</label>
                <div className="flex flex-wrap gap-2 p-3 border-2 border-darkgray min-h-[48px] bg-white">
                  {muscleGroups.map(g => (
                    <span
                      key={g}
                      className={`flex items-center gap-1 px-2 py-0.5 border rounded font-mono text-xs ${MUSCLE_COLORS[g] || FALLBACK_COLOR}`}
                    >
                      {g}
                      <button type="button" onClick={() => removeMuscleTag(g)} className="ml-1 hover:opacity-60">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={muscleInput}
                    onChange={e => setMuscleInput(e.target.value)}
                    placeholder={muscleGroups.length === 0 ? 'Type a muscle and press Enter...' : 'Add more...'}
                    className="font-mono text-xs border-none outline-none bg-transparent min-w-[160px] flex-1"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMuscleTag(muscleInput);
                      }
                      if (e.key === 'Backspace' && muscleInput === '' && muscleGroups.length > 0) {
                        setMuscleGroups(muscleGroups.slice(0, -1));
                      }
                    }}
                  />
                </div>
                <p className="text-pixel-xs text-darkgray/50 mt-1">Press Enter to add · Backspace to remove last</p>
              </div>
            )}

            {isCardio && (
              <div className="md:col-span-2">
                <div className="p-3 border-2 border-pink-300 bg-pink-50 font-mono text-sm text-pink-700">
                  Cardio exercise — no muscle groups tracked
                </div>
              </div>
            )}

            <Input
              label="Sets"
              type="number"
              value={sets || ''}
              min={0}
              onChange={e => setSets(parseInt(e.target.value) || 0)}
              placeholder="4"
            />
            <Input
              label="Reps"
              type="number"
              value={reps || ''}
              min={0}
              onChange={e => setReps(parseInt(e.target.value) || 0)}
              placeholder="10"
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={weight || ''}
              min={0}
              step={0.5}
              onChange={e => setWeight(parseFloat(e.target.value) || 0)}
              placeholder="60"
            />
            <Input
              label="Calories Burned"
              type="number"
              value={caloriesBurned || ''}
              min={0}
              onChange={e => setCaloriesBurned(parseInt(e.target.value) || 0)}
              placeholder="120"
            />
            <div className="md:col-span-2">
              <Input
                label="Notes"
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="mt-6">
            <Button type="submit" className="w-full">
              {editingWorkout ? 'Update Exercise' : 'Log Exercise'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Exercise Library Modal ── */}
      <Modal
        isOpen={showLibraryModal}
        onClose={() => {
          setShowLibraryModal(false);
          setLibrarySearch('');
          setSelectedMuscleFilter('All');
        }}
        title="Exercise Library"
      >
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={librarySearch}
            onChange={e => setLibrarySearch(e.target.value)}
            placeholder="Search exercises..."
            className="input-pixel w-full pr-10"
          />
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-darkgray/50 pointer-events-none"
            size={18}
          />
        </div>

        {/* Muscle filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {libraryMuscleOptions.map(g => (
            <button
              key={g}
              onClick={() => setSelectedMuscleFilter(g)}
              className={`px-3 py-1 border-2 border-darkgray font-mono text-xs transition-all ${
                selectedMuscleFilter === g ? 'bg-darkgray text-white' : 'bg-white hover:bg-accent/30'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {filteredLibrary.length === 0 ? (
            <p className="font-mono text-sm text-center py-6 text-darkgray/60">No exercises found</p>
          ) : (
            filteredLibrary.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => handleSelectFromLibrary(exercise)}
                className="w-full text-left p-4 border-2 border-darkgray hover:bg-accent/20 transition-all"
              >
                <div className="flex justify-between items-start gap-3">
                  <p className="font-mono font-bold text-sm">{exercise.exercise_name}</p>
                  <div className="flex-shrink-0">
                    <MuscleTags
                      groups={exercise.muscle_groups || []}
                      isCardio={exercise.is_cardio}
                    />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

    </div>
  );
}