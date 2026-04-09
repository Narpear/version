'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { User, Book, ReadingSession } from '@/types';
import { BookOpen, Plus, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

type Tab = 'reading' | 'finished' | 'want_to_read';

const STATUS_LABELS: Record<Tab, string> = {
  reading:      'Currently Reading',
  finished:     'Finished',
  want_to_read: 'Want to Read',
};

export default function BooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('reading');

  // Add book form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPages, setNewPages] = useState('');
  const [newStatus, setNewStatus] = useState<Tab>('reading');
  const [addingBook, setAddingBook] = useState(false);

  // Log pages
  const [loggingBookId, setLoggingBookId] = useState<string | null>(null);
  const [pagesInput, setPagesInput] = useState('');

  // Expanded book detail
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadData(parsedUser.id);
  }, [router]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: sessionData } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      setBooks(bookData || []);
      setSessions(sessionData || []);
    } catch (err) {
      console.log('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };

  const addBook = async () => {
    if (!user || !newTitle.trim() || !newPages) return;
    setAddingBook(true);
    try {
      const { data } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          author: newAuthor.trim() || null,
          total_pages: parseInt(newPages),
          pages_read: 0,
          status: newStatus,
          rating: null,
          start_date: newStatus === 'reading' ? today : null,
          finish_date: null,
        })
        .select()
        .single();

      if (data) {
        setBooks(prev => [data, ...prev]);
        setNewTitle('');
        setNewAuthor('');
        setNewPages('');
        setNewStatus('reading');
        setShowAddForm(false);
        setTab(newStatus);
        toast('Book added!');
      }
    } catch (err) {
      console.error('Error adding book:', err);
    } finally {
      setAddingBook(false);
    }
  };

  const logPages = async (book: Book) => {
    if (!user || !pagesInput) return;
    const pages = parseInt(pagesInput);
    if (isNaN(pages) || pages <= 0) return;

    const newPagesRead = Math.min(book.pages_read + pages, book.total_pages);
    const isFinished = newPagesRead >= book.total_pages;

    try {
      // Upsert today's session — add to existing if already logged today
      const existingSession = sessions.find(s => s.book_id === book.id && s.date === today);
      if (existingSession) {
        await supabase
          .from('reading_sessions')
          .update({ pages_read: existingSession.pages_read + pages })
          .eq('id', existingSession.id);
        setSessions(prev => prev.map(s => s.id === existingSession.id
          ? { ...s, pages_read: s.pages_read + pages } : s));
      } else {
        const { data: newSession } = await supabase
          .from('reading_sessions')
          .insert({ user_id: user.id, book_id: book.id, date: today, pages_read: pages })
          .select().single();
        if (newSession) setSessions(prev => [newSession, ...prev]);
      }

      // Update book progress
      const bookUpdate: Partial<Book> = {
        pages_read: newPagesRead,
        ...(isFinished ? { status: 'finished', finish_date: today } : {}),
      };
      await supabase.from('books').update(bookUpdate).eq('id', book.id);
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, ...bookUpdate } : b));

      setPagesInput('');
      setLoggingBookId(null);
      toast(isFinished ? 'Book finished!' : 'Pages logged!');
    } catch (err) {
      console.error('Error logging pages:', err);
    }
  };

  const rateBook = async (book: Book, rating: number) => {
    await supabase.from('books').update({ rating }).eq('id', book.id);
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, rating } : b));
    toast('Rated!');
  };

  const moveToReading = async (book: Book) => {
    await supabase.from('books').update({ status: 'reading', start_date: today }).eq('id', book.id);
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'reading', start_date: today } : b));
    setTab('reading');
    toast('Started reading!');
  };

  const deleteBook = async (bookId: string) => {
    await supabase.from('books').delete().eq('id', bookId);
    setBooks(prev => prev.filter(b => b.id !== bookId));
    toast('Removed');
  };

  if (loading) {
    return <div className="container-pixel"><p className="font-mono text-lg">Loading...</p></div>;
  }

  const filteredBooks = books.filter(b => b.status === tab);
  const currentlyReading = books.filter(b => b.status === 'reading');
  const totalPagesThisWeek = (() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    return sessions
      .filter(s => s.date >= weekAgoStr)
      .reduce((sum, s) => sum + s.pages_read, 0);
  })();
  const booksFinished = books.filter(b => b.status === 'finished').length;
  const todayPages = sessions.filter(s => s.date === today).reduce((sum, s) => sum + s.pages_read, 0);

  return (
    <div className="container-pixel">
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-pixel">Books</h1>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="btn-pixel flex items-center gap-2"
        >
          <Plus size={14} />
          Add Book
        </button>
      </div>

      {/* Add Book Form */}
      {showAddForm && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="subheading-pixel mb-0">New Book</h3>
            <button onClick={() => setShowAddForm(false)}><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-pixel-xs mb-1">Title *</p>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Book title"
                className="input-pixel w-full"
              />
            </div>
            <div>
              <p className="text-pixel-xs mb-1">Author</p>
              <input
                type="text"
                value={newAuthor}
                onChange={e => setNewAuthor(e.target.value)}
                placeholder="Author name"
                className="input-pixel w-full"
              />
            </div>
            <div>
              <p className="text-pixel-xs mb-1">Total Pages *</p>
              <input
                type="number"
                value={newPages}
                onChange={e => setNewPages(e.target.value)}
                placeholder="300"
                min={1}
                className="input-pixel w-full"
              />
            </div>
            <div>
              <p className="text-pixel-xs mb-1">Add to</p>
              <div className="flex gap-2">
                {(['reading', 'want_to_read'] as Tab[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className="flex-1 py-2 border-2 border-darkgray font-mono text-sm transition-all"
                    style={{ backgroundColor: newStatus === s ? '#F5D4BD' : 'rgba(255,255,255,0.5)' }}
                  >
                    {s === 'reading' ? 'Currently Reading' : 'Want to Read'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={addBook}
              disabled={addingBook || !newTitle.trim() || !newPages}
              className="w-full btn-pixel disabled:opacity-40"
            >
              {addingBook ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Today">
          <div className="text-center py-1">
            <p className="font-mono text-3xl font-bold text-primary">{todayPages}</p>
            <p className="text-pixel-xs text-darkgray/60 mt-1">pages</p>
          </div>
        </Card>
        <Card title="This Week">
          <div className="text-center py-1">
            <p className="font-mono text-3xl font-bold text-secondary">{totalPagesThisWeek}</p>
            <p className="text-pixel-xs text-darkgray/60 mt-1">pages</p>
          </div>
        </Card>
        <Card title="Finished">
          <div className="text-center py-1">
            <p className="font-mono text-3xl font-bold" style={{ color: '#C1A87A' }}>{booksFinished}</p>
            <p className="text-pixel-xs text-darkgray/60 mt-1">books</p>
          </div>
        </Card>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 mb-6 border-2 border-darkgray overflow-hidden">
        {(['reading', 'finished', 'want_to_read'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 font-mono text-sm transition-all border-r-2 border-darkgray last:border-r-0"
            style={{
              backgroundColor: tab === t ? '#F5D4BD' : 'rgba(255,255,255,0.4)',
              fontWeight: tab === t ? 'bold' : 'normal',
            }}
          >
            {STATUS_LABELS[t]}
            <span className="ml-1 text-darkgray/50">({books.filter(b => b.status === t).length})</span>
          </button>
        ))}
      </div>

      {/* Book List */}
      {filteredBooks.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <BookOpen size={40} className="mx-auto mb-3 text-darkgray/30" />
            <p className="font-mono text-lg text-darkgray/50">
              {tab === 'reading' ? 'No books in progress' : tab === 'finished' ? 'No finished books yet' : 'No books on your list'}
            </p>
            <button onClick={() => setShowAddForm(true)} className="btn-pixel mt-4">
              Add a Book
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBooks.map(book => {
            const pct = book.total_pages > 0 ? Math.round((book.pages_read / book.total_pages) * 100) : 0;
            const isExpanded = expandedBookId === book.id;
            const isLogging = loggingBookId === book.id;
            const bookSessions = sessions.filter(s => s.book_id === book.id).slice(0, 5);

            return (
              <Card key={book.id}>
                {/* Header row */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-bold text-lg leading-tight">{book.title}</h3>
                    {book.author && <p className="font-mono text-sm text-darkgray/60">{book.author}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                      className="p-1 text-darkgray/40 hover:text-darkgray"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={() => deleteBook(book.id)} className="p-1 text-darkgray/30 hover:text-darkgray">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {book.status !== 'want_to_read' && (
                  <div className="mt-3 mb-2">
                    <div className="flex justify-between mb-1">
                      <p className="text-pixel-xs text-darkgray/60">{book.pages_read} / {book.total_pages} pages</p>
                      <p className="text-pixel-xs font-bold">{pct}%</p>
                    </div>
                    <div className="progress-pixel h-4">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 100 ? '#C1FBA4' : '#F5D4BD',
                          borderRight: pct > 0 ? '2px solid #4A4A4A' : 'none',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Log pages inline */}
                {book.status === 'reading' && (
                  <div className="mt-3">
                    {isLogging ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={pagesInput}
                          onChange={e => setPagesInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && logPages(book)}
                          placeholder="Pages read"
                          min={1}
                          autoFocus
                          className="input-pixel flex-1"
                        />
                        <button onClick={() => logPages(book)} className="btn-pixel px-4">
                          <Check size={14} />
                        </button>
                        <button onClick={() => { setLoggingBookId(null); setPagesInput(''); }} className="p-2 border-2 border-darkgray bg-white">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setLoggingBookId(book.id); setPagesInput(''); }}
                        className="w-full btn-pixel-secondary text-sm"
                      >
                        + Log Pages
                      </button>
                    )}
                  </div>
                )}

                {/* Move to reading (from want_to_read) */}
                {book.status === 'want_to_read' && (
                  <button onClick={() => moveToReading(book)} className="mt-3 w-full btn-pixel-secondary text-sm">
                    Start Reading
                  </button>
                )}

                {/* Rating for finished books */}
                {book.status === 'finished' && (
                  <div className="mt-3">
                    <p className="text-pixel-xs text-darkgray/60 mb-2">Rating</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          onClick={() => rateBook(book, r)}
                          className="flex-1 py-2 border-2 border-darkgray font-mono text-sm transition-all"
                          style={{ backgroundColor: (book.rating ?? 0) >= r ? '#F5D4BD' : 'rgba(255,255,255,0.4)' }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {book.finish_date && (
                      <p className="text-pixel-xs text-darkgray/50 mt-2">
                        Finished {new Date(book.finish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Expanded: recent sessions */}
                {isExpanded && bookSessions.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-darkgray/10">
                    <p className="text-pixel-xs text-darkgray/60 mb-2">Recent Sessions</p>
                    <div className="space-y-1">
                      {bookSessions.map(s => (
                        <div key={s.id} className="flex justify-between font-mono text-sm">
                          <span className="text-darkgray/60">
                            {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-bold">{s.pages_read} pages</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
