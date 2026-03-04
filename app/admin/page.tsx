'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

interface Quote {
  id: string;
  quote: string;
  author: string;
  bio: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  quoteJa: string;
  tags: string[];
  createdAt: string;
}

const EMPTY_FORM = {
  quote: '',
  author: '',
  bio: '',
  source: '',
  sourceUrl: '',
  imageUrl: '',
  quoteJa: '',
  tags: '',
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const storedPassword = typeof window !== 'undefined' ? localStorage.getItem('admin_password') : null;

  useEffect(() => {
    if (storedPassword) {
      setPassword(storedPassword);
      setIsAuthenticated(true);
    }
  }, [storedPassword]);

  useEffect(() => {
    if (isAuthenticated) fetchQuotes();
  }, [isAuthenticated]);

  async function fetchQuotes() {
    const res = await fetch('/api/quotes?all=true');
    const data = await res.json();
    setQuotes(data);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/quotes?all=true', {
      headers: { 'x-admin-password': password },
    });

    // Test auth by trying a harmless operation
    // Actually, GET doesn't require auth. Let's just store and test on first write.
    // For UX, we'll validate by doing a test POST with empty data and checking for 401 vs 400
    const testRes = await fetch('/api/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ quote: '', author: '' }),
    });

    if (testRes.status === 401) {
      setAuthError('Incorrect password');
      return;
    }

    localStorage.setItem('admin_password', password);
    setIsAuthenticated(true);
    setAuthError('');
  }

  function showMessage(text: string, type: 'success' | 'error') {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.quote.trim() || !form.author.trim()) {
      showMessage('Quote and author are required', 'error');
      return;
    }

    const body = {
      ...form,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      ...(editingId ? { id: editingId } : {}),
    };

    const res = await fetch('/api/quotes', {
      method: editingId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showMessage(editingId ? 'Quote updated' : 'Quote added', 'success');
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchQuotes();
    } else {
      const err = await res.json().catch(() => null);
      showMessage(err?.error || 'Failed to save quote', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this quote?')) return;

    const res = await fetch(`/api/quotes?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });

    if (res.ok) {
      showMessage('Quote deleted', 'success');
      fetchQuotes();
    }
  }

  async function handleFetchImage() {
    if (!form.author.trim()) {
      showMessage('Enter an author name first', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/image?name=${encodeURIComponent(form.author)}`);
      const data = await res.json();
      if (data.imageUrl) {
        setForm({ ...form, imageUrl: data.imageUrl });
        showMessage('Image found from Wikipedia', 'success');
      } else {
        showMessage('No image found on Wikipedia', 'error');
      }
    } catch {
      showMessage('Failed to fetch image', 'error');
    }
  }

  function handleEdit(q: Quote) {
    setForm({
      quote: q.quote,
      author: q.author,
      bio: q.bio,
      source: q.source,
      sourceUrl: q.sourceUrl,
      imageUrl: q.imageUrl || '',
      quoteJa: q.quoteJa || '',
      tags: q.tags.join(', '),
    });
    setEditingId(q.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleLogout() {
    localStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    setPassword('');
  }

  // Password gate
  if (!isAuthenticated) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.grain} />
        <div className={styles.gateCard}>
          <div className={styles.gateLogo}>Today's Quote</div>
          <h1 className={styles.gateTitle}>Admin Access</h1>
          <form onSubmit={handleLogin} className={styles.gateForm}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.gateInput}
              autoFocus
            />
            {authError && <p className={styles.gateError}>{authError}</p>}
            <button type="submit" className={styles.gateButton}>
              Enter
            </button>
          </form>
          <a href="/" className={styles.gateBack}>&larr; Back to quotes</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grain} />

      {/* Header */}
      <header className={styles.header}>
        <a href="/" className={styles.logo}>Today's Quote</a>
        <div className={styles.headerRight}>
          <span className={styles.quoteCount}>{quotes.length} quotes</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Message toast */}
      {message.text && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <section className={styles.formSection}>
        <h2 className={styles.sectionTitle}>
          {editingId ? 'Edit Quote' : 'Add New Quote'}
        </h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Quote *</label>
            <textarea
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              className={styles.textarea}
              rows={3}
              placeholder="The quote text..."
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Japanese Translation</label>
            <textarea
              value={form.quoteJa}
              onChange={(e) => setForm({ ...form, quoteJa: e.target.value })}
              className={styles.textarea}
              rows={2}
              placeholder="日本語訳..."
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Author *</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className={styles.input}
                placeholder="Author name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Source</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className={styles.input}
                placeholder="Book, speech, interview..."
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className={styles.textarea}
              rows={2}
              placeholder="Brief description of the person..."
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Source URL</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                className={styles.input}
                placeholder="https://..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className={styles.input}
                placeholder="wisdom, courage, life (comma separated)"
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Portrait Image URL</label>
            <div className={styles.imageUrlRow}>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className={styles.input}
                placeholder="https://... (or auto-fetch from Wikipedia)"
              />
              <button type="button" onClick={handleFetchImage} className={styles.fetchButton}>
                Fetch from Wikipedia
              </button>
            </div>
            {form.imageUrl && (
              <div className={styles.imagePreview}>
                <img src={form.imageUrl} alt="Preview" className={styles.imagePreviewImg} />
              </div>
            )}
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              {editingId ? 'Update Quote' : 'Add Quote'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className={styles.cancelButton}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Quote list */}
      <section className={styles.listSection}>
        <h2 className={styles.sectionTitle}>All Quotes</h2>
        <div className={styles.quoteList}>
          {quotes.map((q) => (
            <div key={q.id} className={`${styles.quoteCard} ${editingId === q.id ? styles.quoteCardActive : ''}`}>
              <div className={styles.quoteCardContent}>
                <p className={styles.quoteCardText}>&ldquo;{q.quote}&rdquo;</p>
                <p className={styles.quoteCardAuthor}>{q.author}</p>
                <p className={styles.quoteCardSource}>{q.source}</p>
                {q.tags.length > 0 && (
                  <div className={styles.quoteCardTags}>
                    {q.tags.map((tag) => (
                      <span key={tag} className={styles.quoteCardTag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.quoteCardActions}>
                <button onClick={() => handleEdit(q)} className={styles.editButton}>
                  Edit
                </button>
                <button onClick={() => handleDelete(q.id)} className={styles.deleteButton}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
