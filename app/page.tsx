'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './page.module.css';

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
}

const COLOR_PALETTES = [
  { bg1: '#f5f2ed', bg2: '#efe8dc', accent: '#8b6914' },
  { bg1: '#f2eff5', bg2: '#e8e0ef', accent: '#6b4f8a' },
  { bg1: '#eff5f3', bg2: '#e0efea', accent: '#2a7a5a' },
  { bg1: '#f5f3ef', bg2: '#efe8dc', accent: '#8a7020' },
  { bg1: '#f5efef', bg2: '#efe0e0', accent: '#8a3a3a' },
  { bg1: '#eff2f5', bg2: '#e0e8ef', accent: '#3a5a8a' },
  { bg1: '#f5f1ef', bg2: '#efe5dc', accent: '#8a5a2a' },
  { bg1: '#eff5f1', bg2: '#e0efe5', accent: '#3a7a4a' },
];

export default function Home() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [palette, setPalette] = useState(COLOR_PALETTES[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imagePosition, setImagePosition] = useState('center 20%');
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate optimal object-position based on image and viewport aspect ratios
  const calcImagePosition = useCallback((imgWidth: number, imgHeight: number) => {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const imgRatio = imgWidth / imgHeight;
    const viewRatio = viewportW / viewportH;

    if (imgRatio > viewRatio) {
      // Image is wider than viewport ratio — cropped on sides, center horizontally
      // Face is typically in the upper-center of portraits
      return 'center 25%';
    } else {
      // Image is taller than viewport ratio — cropped on top/bottom
      // Keep face visible by positioning toward top
      const diff = imgRatio / viewRatio;
      // The more the image is taller relative to viewport, the more we shift up
      const yPercent = Math.max(10, Math.min(35, 30 * diff));
      return `center ${yPercent}%`;
    }
  }, []);

  const fetchQuote = useCallback(async () => {
    setIsTransitioning(true);
    setImageLoaded(false);

    await new Promise((r) => setTimeout(r, 600));

    const res = await fetch('/api/quotes');
    const data = await res.json();

    // Preload the image before showing the quote
    if (data.imageUrl) {
      const img = new Image();
      img.onload = () => {
        setImagePosition(calcImagePosition(img.naturalWidth, img.naturalHeight));
        setQuote(data);
        setImageLoaded(true);
        const newPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
        setPalette(newPalette);
        setTimeout(() => setIsTransitioning(false), 100);
      };
      img.onerror = () => {
        setQuote(data);
        const newPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
        setPalette(newPalette);
        setTimeout(() => setIsTransitioning(false), 100);
      };
      img.src = data.imageUrl;
    } else {
      setQuote(data);
      const newPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
      setPalette(newPalette);
      setTimeout(() => setIsTransitioning(false), 100);
    }
  }, [calcImagePosition]);

  useEffect(() => {
    fetchQuote().then(() => {
      setTimeout(() => setIsLoaded(true), 200);
    });
  }, [fetchQuote]);

  // Recalculate image position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current && imageRef.current.naturalWidth) {
        setImagePosition(calcImagePosition(imageRef.current.naturalWidth, imageRef.current.naturalHeight));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calcImagePosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (!isTransitioning) fetchQuote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchQuote, isTransitioning]);

  return (
    <div
      className={styles.container}
      style={{
        '--bg1': palette.bg1,
        '--bg2': palette.bg2,
        '--accent': palette.accent,
      } as React.CSSProperties}
    >
      {/* Background portrait */}
      {quote?.imageUrl && (
        <div className={`${styles.portraitContainer} ${imageLoaded && !isTransitioning ? styles.portraitVisible : ''}`}>
          <img
            ref={imageRef}
            src={quote.imageUrl}
            alt={quote.author}
            className={styles.portraitImage}
            style={{ objectPosition: imagePosition }}
          />
          <div className={styles.portraitOverlay} />
          <div className={styles.portraitVignette} />
        </div>
      )}

      {/* Grain texture overlay */}
      <div className={styles.grain} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>Today's Quote</div>
        <a href="/admin" className={styles.adminLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </a>
      </header>

      {/* Main content */}
      <main className={`${styles.main} ${isTransitioning ? styles.fadeOut : styles.fadeIn} ${isLoaded ? styles.loaded : ''}`}>
        {quote && (
          <>
            {/* Quote mark */}
            <div className={styles.quoteMark}>&ldquo;</div>

            {/* Quote text */}
            <blockquote className={styles.quoteText}>
              {quote.quote}
            </blockquote>

            {quote.quoteJa && (
              <p className={styles.quoteJa}>{quote.quoteJa}</p>
            )}

            {/* Author section */}
            <div className={styles.authorSection}>
              <div className={styles.authorDivider} />
              <h2 className={styles.authorName}>{quote.author}</h2>
              <p className={styles.authorBio}>{quote.bio}</p>

              {quote.sourceUrl ? (
                <a
                  href={quote.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  <span className={styles.sourceLinkIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </span>
                  {quote.source}
                </a>
              ) : (
                <span className={styles.sourceText}>{quote.source}</span>
              )}
            </div>

            {/* Tags */}
            {quote.tags && quote.tags.length > 0 && (
              <div className={styles.tags}>
                {quote.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom action */}
      <footer className={styles.footer}>
        <button
          onClick={fetchQuote}
          disabled={isTransitioning}
          className={styles.nextButton}
        >
          <span className={styles.nextButtonText}>Meet another mind</span>
          <span className={styles.nextButtonIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </button>
        <div className={styles.hint}>
          or press <kbd className={styles.kbd}>Space</kbd> / <kbd className={styles.kbd}>&rarr;</kbd>
        </div>
      </footer>
    </div>
  );
}
