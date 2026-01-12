import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Book, Heart, Star, Trash2, Plus, Trophy, X, Search, Loader2, Clock, 
  MessageSquareHeart, Pencil, Camera, History, Palette, Map, Library, 
  BookOpen, Flame, CheckCircle2, Sparkles, CalendarDays, Download, 
  Share, HelpCircle, ChevronRight, ChevronDown, Wifi, WifiOff, 
  RefreshCw, Globe, LayoutGrid, Columns, Tag, Filter, ArrowUpDown, 
  GripHorizontal, Play, LogOut, Lock, CloudOff
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy, 
  updateDoc,
  writeBatch,
  enableIndexedDbPersistence // Importante para offline
} from "firebase/firestore";

// --- FIREBASE CONFIG ---
// Usamos la variable global proporcionada por el entorno en lugar de import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ACTIVAR PERSISTENCIA OFFLINE ---
// Intentamos activar la persistencia de Firestore. 
// Esto permite que la app funcione sin internet usando una base de datos local IndexDB.
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('La persistencia falló: Probablemente múltiples pestañas abiertas.');
    } else if (err.code == 'unimplemented') {
      console.log('El navegador no soporta persistencia.');
    }
  });
} catch (e) {
  console.log("Error inicializando persistencia:", e);
}

// --- UTILIDADES ---

const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const getSpineThickness = (pageCount) => {
  if (!pageCount) return 46; 
  const thickness = Math.max(36, Math.min(70, (pageCount / 100) * 8 + 32));
  return thickness;
};

// --- TEMAS ---

const themes = {
  modern: {
    id: 'modern',
    name: 'Nordic Clean',
    woodColor: '#e2e8f0', 
    plankColor: '#cbd5e1', 
    colors: {
      bg: 'bg-slate-50', 
      text: 'text-slate-900', 
      subtext: 'text-slate-500',
      header: 'bg-white/90 backdrop-blur-md border-slate-200',
      card: 'bg-white',
      border: 'border-slate-200',
      accent: 'bg-slate-900', 
      accentGradient: 'bg-gradient-to-r from-slate-800 to-slate-900',
      accentHover: 'hover:from-slate-700 hover:to-slate-800',
      highlight: 'text-slate-700',
      input: 'bg-white border-slate-200 text-slate-800',
      dropdown: 'bg-white border-slate-200 text-slate-800',
      shelfShadow: 'shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)]'
    }
  },
  classic: {
    id: 'classic',
    name: 'Biblioteca Oxford',
    woodColor: '#c2a58d', 
    plankColor: '#a68b74',
    colors: {
      bg: 'bg-[#f0ece3]', 
      text: 'text-[#3e3221]', 
      subtext: 'text-[#8c7b66]', 
      header: 'bg-[#f7f5f0]/95 backdrop-blur-md border-[#e6e0d4]',
      card: 'bg-[#fdfbf7]',
      border: 'border-[#e6e0d4]',
      accent: 'bg-[#8b5a2b]', 
      accentGradient: 'bg-gradient-to-r from-[#8b5a2b] to-[#6d4c41]',
      accentHover: 'hover:from-[#a06d35] hover:to-[#8d6e63]',
      highlight: 'text-[#8b5a2b]',
      input: 'bg-[#fdfbf7] border-[#dcd6ca] text-[#3e3221]',
      dropdown: 'bg-[#fdfbf7] border-[#dcd6ca] text-[#3e3221]',
      shelfShadow: 'shadow-md'
    }
  },
  rose: {
    id: 'rose',
    name: 'Velvet Rose',
    woodColor: '#fbcfe8', 
    plankColor: '#f9a8d4',
    colors: {
      bg: 'bg-[#fff1f2]', 
      text: 'text-[#881337]', 
      subtext: 'text-[#be123c]', 
      header: 'bg-white/80 backdrop-blur-md border-rose-100',
      card: 'bg-white',
      border: 'border-rose-200',
      accent: 'bg-[#fb7185]', 
      accentGradient: 'bg-gradient-to-r from-[#fb7185] to-[#f43f5e]',
      accentHover: 'hover:from-[#f43f5e] hover:to-[#e11d48]',
      highlight: 'text-[#e11d48]',
      input: 'bg-white border-rose-200 text-[#881337]',
      dropdown: 'bg-white border-rose-200 text-[#881337]',
      shelfShadow: 'shadow-sm'
    }
  },
  dark: {
    id: 'dark',
    name: 'Modo Focus',
    woodColor: '#334155', 
    plankColor: '#1e293b', 
    colors: {
      bg: 'bg-[#0f172a]', 
      text: 'text-slate-100', 
      subtext: 'text-slate-400', 
      header: 'bg-[#1e293b]/90 backdrop-blur-md border-slate-700',
      card: 'bg-[#1e293b]', 
      border: 'border-slate-700',
      accent: 'bg-indigo-500',
      accentGradient: 'bg-gradient-to-r from-indigo-500 to-violet-500',
      accentHover: 'hover:from-indigo-400 hover:to-violet-400',
      highlight: 'text-indigo-400',
      input: 'bg-[#020617] border-slate-700 text-slate-100 placeholder:text-slate-600',
      dropdown: 'bg-[#1e293b] border-slate-600 text-slate-100',
      shelfShadow: 'shadow-lg shadow-black/50'
    }
  }
};

const bookColors = [
  'bg-[#2d3748] text-white',      
  'bg-[#742a2a] text-red-50',     
  'bg-[#2c5282] text-blue-50',    
  'bg-[#276749] text-green-50',   
  'bg-[#553c9a] text-purple-50',  
  'bg-[#975a16] text-yellow-50',  
  'bg-[#285e61] text-teal-50',    
  'bg-[#702459] text-pink-50',    
  'bg-[#1a202c] text-gray-200',   
  'bg-[#dd6b20] text-orange-50'   
];

const commonGenres = [
  "Ficción", "No Ficción", "Fantasía", "Ciencia Ficción", 
  "Misterio", "Thriller", "Romance", "Terror", 
  "Biografía", "Historia", "Autoayuda", "Negocios", 
  "Poesía", "Infantil", "Cómic/Manga", "Clásicos"
];

// --- COMPONENTES ---

export default function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- ONLINE STATE ---
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- APP STATES ---
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('library_theme') || 'modern');
  const theme = themes[currentTheme];

  const [books, setBooks] = useState([]);
  const [readingSessions, setReadingSessions] = useState([]);
  const [readDates, setReadDates] = useState([]);

  const [streak, setStreak] = useState(0);
  const [streakStatus, setStreakStatus] = useState('none'); 
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  
  const [view, setView] = useState('books'); 
  const [displayMode, setDisplayMode] = useState('grid'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [sortBy, setSortBy] = useState('custom'); 
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const [draggedBookId, setDraggedBookId] = useState(null);
  const [itemsPerShelf, setItemsPerShelf] = useState(10);

  const [isSearching, setIsSearching] = useState(false);
  
  // Modales
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [showStreakSuccess, setShowStreakSuccess] = useState(false); 
  const [showInstallHelp, setShowInstallHelp] = useState(false); 
  
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [isManualSearching, setIsManualSearching] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingBookId, setEditingBookId] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [bookForm, setBookForm] = useState({ title: '', author: '', genre: '', rating: 5, color: bookColors[0], coverUrl: null, isFavorite: false });
  const [sessionForm, setSessionForm] = useState({ bookId: '', duration: '30', note: '' });
  
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');

  const suggestionsRef = useRef(null);
  const fileInputRef = useRef(null);

  const genreOptions = [...new Set([...commonGenres, ...books.map(b => b.genre).filter(Boolean)])].sort();
  const filteredGenreOptions = genreOptions.filter(g => g.toLowerCase().includes((bookForm.genre || '').toLowerCase()));

  const filteredBooksForSession = books.filter(b => 
    b.title.toLowerCase().includes(sessionSearchTerm.toLowerCase()) || 
    (b.author && b.author.toLowerCase().includes(sessionSearchTerm.toLowerCase()))
  );

  // --- NETWORK DETECTION ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- API ---
  const fetchBookData = async (title) => {
    // OFFLINE GUARD: No llamar a API si no hay internet
    if (!isOnline) {
      console.log("Modo offline: Saltando búsqueda API");
      return null;
    }
    
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}`);
      const data = await response.json();
      if (data.items?.[0]?.volumeInfo) {
        const info = data.items[0].volumeInfo;
        return {
            coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
            author: info.authors?.[0] || null,
            pageCount: info.pageCount || null,
            genre: info.categories?.[0] || '' 
        };
      }
    } catch (error) { console.log("Error API", error); }
    return null;
  };

  // --- AUTH & DATA SYNC EFFECTS ---

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. MIGRACIÓN DE DATOS LOCALES A FIRESTORE (Legacy)
  useEffect(() => {
    if (!user) return;

    const migrateLocalData = async () => {
      const localBooksStr = localStorage.getItem('my_books_v3');
      const localSessionsStr = localStorage.getItem('my_reading_sessions');

      if (!localBooksStr && !localSessionsStr) return;

      const batch = writeBatch(db);
      let migrationCount = 0;

      // Migrar Libros
      if (localBooksStr) {
        try {
          const localBooks = JSON.parse(localBooksStr);
          localBooks.forEach(book => {
            const docRef = doc(db, 'users', user.uid, 'books', book.id);
            const bookData = { ...book, order: book.order || Date.now() };
            batch.set(docRef, bookData);
            migrationCount++;
          });
        } catch (e) { console.error("Error parsing local books", e); }
      }

      // Migrar Sesiones
      if (localSessionsStr) {
        try {
          const localSessions = JSON.parse(localSessionsStr);
          localSessions.forEach(session => {
            const docRef = doc(db, 'users', user.uid, 'sessions', session.id);
            batch.set(docRef, session);
            migrationCount++;
          });
        } catch (e) { console.error("Error parsing local sessions", e); }
      }

      if (migrationCount > 0) {
        try {
          await batch.commit();
          localStorage.removeItem('my_books_v3');
          localStorage.removeItem('my_reading_sessions');
          localStorage.removeItem('my_reading_dates'); 
          alert(`¡Sincronización completada! Hemos movido ${migrationCount} elementos de tu dispositivo a la nube.`);
        } catch (error) {
          console.error("Error durante la migración:", error);
        }
      }
    };

    migrateLocalData();
  }, [user]);

  // 3. Sync Firestore Data (Books & Sessions)
  // Con soporte offline: Al usar enableIndexedDbPersistence, onSnapshot
  // funcionará con los datos locales si no hay red.
  useEffect(() => {
    if (!user) {
      setBooks([]);
      setReadingSessions([]);
      setReadDates([]);
      return;
    }

    // Estrategia de Backup en LocalStorage:
    // Aunque Firestore maneja persistencia, en entornos iframe o con políticas estrictas puede fallar.
    // Mantenemos una copia en localStorage por seguridad extra.

    // Libros
    const booksQuery = query(collection(db, 'users', user.uid, 'books'));
    const unsubscribeBooks = onSnapshot(booksQuery, { includeMetadataChanges: true }, (snapshot) => {
      const loadedBooks = snapshot.docs.map(doc => doc.data());
      loadedBooks.sort((a, b) => (a.order || 0) - (b.order || 0));
      setBooks(loadedBooks);
      
      // Backup Local
      localStorage.setItem(`backup_books_${user.uid}`, JSON.stringify(loadedBooks));
    }, (error) => {
        console.error("Error Firestore Books (Offline Fallback):", error);
        // Si Firestore falla completamente, cargamos backup
        const backup = localStorage.getItem(`backup_books_${user.uid}`);
        if(backup) setBooks(JSON.parse(backup));
    });

    // Sesiones
    const sessionsQuery = query(collection(db, 'users', user.uid, 'sessions'));
    const unsubscribeSessions = onSnapshot(sessionsQuery, { includeMetadataChanges: true }, (snapshot) => {
      const loadedSessions = snapshot.docs.map(doc => doc.data());
      loadedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setReadingSessions(loadedSessions);
      
      const dates = loadedSessions.map(s => s.date);
      setReadDates(dates);

      // Backup Local
      localStorage.setItem(`backup_sessions_${user.uid}`, JSON.stringify(loadedSessions));
    }, (error) => {
        console.error("Error Firestore Sessions (Offline Fallback):", error);
        const backup = localStorage.getItem(`backup_sessions_${user.uid}`);
        if(backup) {
            const parsed = JSON.parse(backup);
            setReadingSessions(parsed);
            setReadDates(parsed.map(s => s.date));
        }
    });

    return () => {
      unsubscribeBooks();
      unsubscribeSessions();
    };
  }, [user]);


  // --- APP LOGIC EFFECTS ---
  useEffect(() => { localStorage.setItem('library_theme', currentTheme); }, [currentTheme]);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setItemsPerShelf(5);
      else if (width < 768) setItemsPerShelf(8);
      else if (width < 1024) setItemsPerShelf(12);
      else setItemsPerShelf(16);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const calculateStreak = useCallback(() => {
    const sortedDates = [...new Set(readDates)].sort((a, b) => new Date(b) - new Date(a));
    if (sortedDates.length === 0) { setStreak(0); setStreakStatus('none'); return; }
    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
    const lastRead = sortedDates[0];
    if (lastRead !== today && lastRead !== yesterday) { setStreak(0); setStreakStatus('none'); return; }
    let currentStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
        const diffTime = Math.abs(new Date(sortedDates[i-1] || sortedDates[i]) - new Date(sortedDates[i]));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (i === 0 || diffDays === 1) currentStreak++; else break;
    }
    setStreak(currentStreak);
    if (lastRead === today) setStreakStatus('active'); else setStreakStatus('pending');
  }, [readDates]);

  useEffect(() => { calculateStreak(); }, [readDates, calculateStreak]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (bookForm.title.length > 2 && showSuggestions && !editingBookId && !manualSearchResults.length) { 
        // OFFLINE GUARD: No buscar sugerencias si offline
        if (!isOnline) {
            setSuggestions([]);
            return;
        }

        setIsTyping(true);
        try {
          const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookForm.title)}&maxResults=5`);
          const data = await response.json();
          const uniqueItems = (data.items || []).filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
          setSuggestions(uniqueItems);
        } catch (e) { setSuggestions([]); } 
        finally { setIsTyping(false); }
      } else { setSuggestions([]); setIsTyping(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [bookForm.title, showSuggestions, editingBookId, manualSearchResults, isOnline]);

  const hasReadToday = readDates.includes(getLocalDateString());

  // --- HANDLERS ---

  const handleLogin = async () => {
    if (!isOnline) {
        alert("Necesitas conexión a internet para iniciar sesión.");
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error logging in", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setBooks([]);
      setReadingSessions([]);
      setUser(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const handleManualSearch = async () => {
    if (!bookForm.title) return;
    if (!isOnline) { alert("Esta función requiere internet."); return; }
    setIsManualSearching(true); setSuggestions([]); 
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookForm.title)}&maxResults=5`);
        const data = await response.json();
        setManualSearchResults(data.items || []);
    } catch (error) {} finally { setIsManualSearching(false); }
  };

  const handleSelectManualResult = (book) => {
    const info = book.volumeInfo;
    setBookForm({ ...bookForm, title: info.title, author: info.authors?.[0] || '', genre: info.categories?.[0] || '', coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null });
    setManualSearchResults([]); 
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setDeferredPrompt(null); } 
    else setShowInstallHelp(true);
  };

  const toggleFavorite = async (e, bookId) => {
    e?.stopPropagation(); 
    if (!user) return;
    const book = books.find(b => b.id === bookId);
    if (book) {
      try {
        // Firestore maneja la escritura offline automáticamente (lo pone en cola)
        await updateDoc(doc(db, 'users', user.uid, 'books', bookId), {
          isFavorite: !book.isFavorite
        });
      } catch (err) { console.error("Error fav", err); }
    }
    
    if (selectedBook && selectedBook.id === bookId) setSelectedBook(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
  };

  const openSessionModal = (preSelectedBookId = '') => {
    if (books.length === 0) { alert("Añade un libro primero 📚"); setIsBookModalOpen(true); return; }
    setSessionForm({ bookId: preSelectedBookId, duration: '30', note: '' }); 
    setSessionSearchTerm('');
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault(); if (!sessionForm.bookId || !user) return;
    const today = getLocalDateString();
    const newSession = {
      id: generateId(),
      date: today,
      bookId: sessionForm.bookId,
      bookTitle: books.find(b => b.id === sessionForm.bookId)?.title || 'Libro',
      duration: sessionForm.duration,
      note: sessionForm.note,
      timestamp: Date.now()
    };

    try {
      // Escritura en Firestore (funciona offline gracias a persistencia)
      await setDoc(doc(db, 'users', user.uid, 'sessions', newSession.id), newSession);
      
      if (!readDates.includes(today)) { setShowStreakSuccess(true); } 
      else {
          // Feedback diferente si es offline
          if (isOnline) alert("¡Lectura registrada! 🚀");
          else alert("¡Lectura guardada offline! Se sincronizará al conectar. ☁️");
      }
      setIsSessionModalOpen(false);
    } catch (err) {
      console.error("Error saving session", err);
      // Fallback manual si falla la escritura (raro con persistencia activada)
      alert("Error al guardar sesión");
    }
  };

  const openNewBookModal = () => { setEditingBookId(null); setManualSearchResults([]); setBookForm({ title: '', author: '', genre: '', rating: 5, color: bookColors[0], coverUrl: null, isFavorite: false }); setIsBookModalOpen(true); };

  const openEditBookModal = (book) => { setEditingBookId(book.id); setManualSearchResults([]); setBookForm({ title: book.title, author: book.author, genre: book.genre || '', rating: book.rating, color: book.color || bookColors[0], coverUrl: book.coverUrl, isFavorite: book.isFavorite || false }); setSelectedBook(null); setIsBookModalOpen(true); };

  const handleSelectSuggestion = (book) => {
    const info = book.volumeInfo;
    setBookForm({ ...bookForm, title: info.title, author: info.authors?.[0] || '', genre: info.categories?.[0] || '', coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null });
    setShowSuggestions(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) { const resized = await resizeImage(file); setBookForm({ ...bookForm, coverUrl: resized }); }
  };

  const handleSaveBook = async (e) => {
    e.preventDefault(); if (!bookForm.title || !user) return; setIsSearching(true); 
    let finalData = { ...bookForm };
    
    // Fetch extra data if missing AND online
    if (isOnline && (!finalData.coverUrl || !finalData.author) && !editingBookId) {
       const apiData = await fetchBookData(bookForm.title);
       if (apiData) finalData = { ...finalData, coverUrl: finalData.coverUrl || apiData.coverUrl, author: finalData.author || apiData.author, genre: finalData.genre || apiData.genre, pageCount: apiData.pageCount };
    }

    try {
      if (editingBookId) {
        await setDoc(doc(db, 'users', user.uid, 'books', editingBookId), finalData, { merge: true });
      } else {
        const newId = generateId();
        await setDoc(doc(db, 'users', user.uid, 'books', newId), { 
          id: newId, 
          ...finalData, 
          dateAdded: getLocalDateString(),
          order: Date.now() 
        });
      }
      
      if (!isOnline) alert("Libro guardado en modo offline. Se sincronizará cuando vuelvas a tener internet.");
      
      setIsBookModalOpen(false);
    } catch (err) {
      console.error("Error saving book", err);
      alert("Error al guardar el libro");
    } finally {
      setIsSearching(false);
    }
  };

  const deleteBook = async (id) => { 
    if (!user) return;
    if (confirm("¿Eliminar este libro de la nube?")) { 
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'books', id));
        setSelectedBook(null); 
      } catch (err) { console.error("Error deleting", err); }
    } 
  };

  const handleDragStart = (e, bookId) => { setDraggedBookId(bookId); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  
  const handleDrop = async (e, targetBookId) => {
    e.preventDefault(); 
    if (!draggedBookId || draggedBookId === targetBookId || !user) return;
    
    const sourceIndex = books.findIndex(b => b.id === draggedBookId);
    const targetIndex = books.findIndex(b => b.id === targetBookId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const newBooks = [...books];
    const [movedBook] = newBooks.splice(sourceIndex, 1);
    newBooks.splice(targetIndex, 0, movedBook);
    
    if (sortBy !== 'custom') setSortBy('custom');
    setDraggedBookId(null);
    setBooks(newBooks); 

    const batchUpdates = newBooks.map((book, index) => {
       return setDoc(doc(db, 'users', user.uid, 'books', book.id), { order: index }, { merge: true });
    });
    
    Promise.all(batchUpdates).catch(err => console.error("Error reordering", err));
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGenre = selectedGenre === 'Todos' || (book.genre && book.genre === selectedGenre);
    return matchesSearch && matchesGenre;
  }).sort((a, b) => {
    if (sortBy === 'custom') return 0; 
    if (sortBy === 'favorites') { if (a.isFavorite === b.isFavorite) return a.title.localeCompare(b.title); return a.isFavorite ? -1 : 1; }
    if (sortBy === 'author') return (a.author || '').localeCompare(b.author || '');
    return a.title.localeCompare(b.title);
  });

  const libraryGenres = ['Todos', ...new Set(books.map(b => b.genre).filter(Boolean))].sort();
  const shelves = [];
  if (filteredBooks.length > 0) { for (let i = 0; i < filteredBooks.length; i += itemsPerShelf) shelves.push(filteredBooks.slice(i, i + itemsPerShelf)); }

  // --- RENDERS ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-white/50">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Library size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Mi Biblioteca</h1>
          <p className="text-slate-500 mb-8 font-medium">Tu espacio de lectura en la nube.</p>
          
          <button 
            onClick={handleLogin}
            disabled={!isOnline}
            className={`w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${!isOnline ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
          >
            {isOnline ? (
                <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                Continuar con Google
                </>
            ) : (
                <>
                <WifiOff size={20} />
                Sin Conexión (Requiere Internet para Login)
                </>
            )}
          </button>
          
          <p className="mt-8 text-xs text-slate-400">
            Tus datos se guardarán de forma segura en Firestore.
          </p>
        </div>
      </div>
    );
  }

  // MAIN APP
  const renderStreakIndicator = () => {
    const isDark = currentTheme === 'dark';
    let petEmoji = "🥚"; let bgColor = isDark ? "bg-slate-800/80 border-slate-700" : "bg-white/50 backdrop-blur-sm border-slate-200"; let label = "Incubando..."; let statusClass = "opacity-80";
    if (streakStatus === 'active') { petEmoji = "🦉"; bgColor = isDark ? "bg-emerald-900/40 border-emerald-700/50" : "bg-emerald-100 border-emerald-200"; statusClass = "animate-bounce ring-2 " + (isDark ? "ring-emerald-500/20" : "ring-emerald-100"); label = `${streak} días`; } 
    else if (streakStatus === 'pending') { petEmoji = "🥺"; bgColor = isDark ? "bg-orange-900/40 border-orange-700/50" : "bg-orange-100 border-orange-200"; statusClass = "animate-pulse ring-2 " + (isDark ? "ring-orange-500/20" : "ring-orange-200"); label = "¡Hambre!"; }
    return <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all cursor-help select-none ${bgColor} ${statusClass}`} title="Racha"><span className="text-2xl filter drop-shadow-sm leading-none">{petEmoji}</span><span className={`font-bold text-sm ${theme.colors.text}`}>{label}</span></div>;
  };

  const renderJournal = () => (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-lg mx-auto">
      {readingSessions.length === 0 ? <div className="text-center py-20 opacity-60"><div className="bg-slate-200/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><History size={32} className={theme.colors.subtext}/></div><p className={`font-medium ${theme.colors.subtext}`}>El diario aún está vacío.</p></div> : 
        readingSessions.map(session => (
          <div key={session.id} className={`${theme.colors.card} border ${theme.colors.border} p-5 rounded-2xl shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start mb-3"><div><h4 className={`font-bold ${theme.colors.text} text-lg`}>{session.bookTitle}</h4><span className={`text-xs ${theme.colors.subtext} font-medium flex items-center gap-1`}><CalendarDays size={12}/> {session.date}</span></div><div className={`flex items-center gap-1 font-bold ${theme.colors.accent} text-white px-3 py-1 rounded-full text-xs shadow-sm`}><Clock size={12} /> {session.duration}m</div></div>
            {session.note && <div className={`${theme.colors.bg} p-4 rounded-xl text-sm ${theme.colors.subtext} italic`}>"{session.note}"</div>}
          </div>
        ))
      }
    </div>
  );

  const renderCalendar = () => {
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); 
    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const daysReadInMonth = new Set(readDates.filter(d => d.startsWith(currentMonthPrefix))).size;
    const days = []; for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dayString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isRead = readDates.includes(dayString); const isToday = dayString === getLocalDateString(); const isSelected = selectedCalendarDate === dayString;
      days.push(
        <button key={d} onClick={() => setSelectedCalendarDate(dayString)} className={`flex flex-col items-center justify-center h-12 w-full rounded-xl relative cursor-pointer transition-all hover:scale-105 active:scale-95 ${isSelected ? 'ring-2 ring-indigo-400 z-10' : ''}`} type="button">
          <span className={`z-10 text-sm font-bold ${isRead ? 'text-white' : theme.colors.subtext}`}>{d}</span>
          {isRead ? <div className={`absolute inset-0 ${theme.colors.accent} rounded-xl shadow-sm`}></div> : isToday ? <div className={`absolute inset-0 border-2 ${theme.colors.border} rounded-xl bg-white/50`}></div> : <div className="absolute inset-0 rounded-xl hover:bg-slate-100 transition-colors"></div>}
        </button>
      );
    }
    const sessionsForDate = readingSessions.filter(s => s.date === selectedCalendarDate);
    return (
      <div className={`${theme.colors.card} p-6 rounded-[2rem] shadow-xl border ${theme.colors.border} mb-6 animate-in zoom-in-95 max-w-lg mx-auto`}>
        <div className="flex justify-between items-center mb-8"><div className={`font-black ${theme.colors.text} text-2xl capitalize tracking-tight`}>{["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][currentMonth]} {currentYear}</div><div className={`text-xs font-bold ${theme.colors.highlight} bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1`}><Flame size={14} className="fill-current" /> {daysReadInMonth} días activos</div></div>
        <div className="grid grid-cols-7 gap-2 text-center mb-2 opacity-50">{['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <span key={i} className={`text-xs font-bold ${theme.colors.text}`}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-2 mb-6">{days}</div>
        {selectedCalendarDate && <div className={`pt-6 border-t ${theme.colors.border} animate-in slide-in-from-top-2`}><h4 className={`text-xs font-bold ${theme.colors.subtext} mb-4 uppercase tracking-wider flex items-center gap-2`}><CalendarDays size={14}/> {selectedCalendarDate}</h4>{sessionsForDate.length > 0 ? <div className="space-y-3">{sessionsForDate.map(session => (<div key={session.id} className={`${theme.colors.bg} p-4 rounded-xl border ${theme.colors.border} flex justify-between items-center group hover:shadow-sm transition-shadow`}><div className="overflow-hidden pr-4"><p className={`text-sm font-bold ${theme.colors.text} truncate`}>{session.bookTitle}</p>{session.note ? <p className={`text-xs ${theme.colors.subtext} italic truncate`}>"{session.note}"</p> : <p className={`text-xs ${theme.colors.subtext} opacity-50`}>Sin notas</p>}</div><span className={`text-xs font-bold ${theme.colors.highlight} px-2.5 py-1 rounded-lg border ${theme.colors.border} bg-white/80`}>{session.duration}m</span></div>))}</div> : <div className={`text-center py-6 ${theme.colors.bg} rounded-xl border border-dashed ${theme.colors.border}`}><p className={`text-sm ${theme.colors.subtext}`}>No leíste nada este día 😴</p></div>}</div>}
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans pb-32 ${theme.colors.bg} transition-colors duration-300`}>
      <style>{`::-webkit-scrollbar { display: none; } * { -ms-overflow-style: none; scrollbar-width: none; } body { -webkit-font-smoothing: antialiased; }`}</style>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-30 ${theme.colors.header} pt-4 pb-4 px-6 shadow-sm border-b ${theme.colors.border} transition-colors duration-300`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full ${theme.colors.accent} flex items-center justify-center text-white shadow-lg`}><Library size={20} /></div><div><h1 className={`text-lg font-bold ${theme.colors.text} leading-tight`}>Hola, {user.displayName ? user.displayName.split(' ')[0] : 'Lectora'}</h1><p className={`text-xs ${theme.colors.subtext}`}>Tu espacio personal</p></div></div>
          <div className="flex gap-2 items-center">
             {/* Indicador Offline */}
             {!isOnline && (
                 <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-200">
                     <WifiOff size={14} />
                     Offline
                 </div>
             )}

             {!isInstalled && <button onClick={handleInstallClick} className={`p-2 rounded-full border ${theme.colors.border} text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors ${deferredPrompt ? 'animate-pulse' : ''}`} aria-label="Instalar App">{deferredPrompt ? <Download size={20} /> : <HelpCircle size={20} />}</button>}
             <button onClick={() => setIsThemeModalOpen(!isThemeModalOpen)} className={`p-2 rounded-full border ${theme.colors.border} ${theme.colors.text} hover:bg-slate-100/50 transition-colors`} aria-label="Tema"><Palette size={20} /></button>
             <button onClick={handleLogout} className={`p-2 rounded-full border ${theme.colors.border} text-rose-500 hover:bg-rose-50 transition-colors`} aria-label="Cerrar Sesión"><LogOut size={20} /></button>
             {isThemeModalOpen && <div className={`absolute top-16 right-6 w-48 ${theme.colors.card} rounded-2xl shadow-2xl border ${theme.colors.border} z-50 p-2 overflow-hidden`}>{Object.values(themes).map(t => (<button key={t.id} onClick={() => { setCurrentTheme(t.id); setIsThemeModalOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentTheme === t.id ? `${t.colors.accent} text-white` : `${theme.colors.text} hover:bg-slate-100 dark:hover:bg-slate-700`}`} type="button">{t.name}</button>))}</div>}
             {renderStreakIndicator()}
          </div>
        </div>
        {/* Banner Offline Móvil */}
        {!isOnline && (
            <div className="sm:hidden mt-3 mx-auto max-w-xs flex items-center justify-center gap-2 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 py-1 px-3 rounded-full">
                <WifiOff size={12}/> Modo Offline: Datos locales
            </div>
        )}
      </header>

      {/* BODY CONTENT */}
      <div className="max-w-5xl mx-auto px-6 mt-8">
        
        {/* BOTÓN DE ACCIÓN PRINCIPAL */}
        <div className="mb-8"><button onClick={() => openSessionModal()} className={`w-full py-5 rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 transition-all transform active:scale-[0.98] font-bold text-white text-lg ${hasReadToday ? 'bg-emerald-500 hover:bg-emerald-600' : `${theme.colors.accentGradient} ${theme.colors.accentHover}`}`} type="button">{hasReadToday ? <><CheckCircle2 className="text-white w-6 h-6" /><span>¡Objetivo Diario Cumplido!</span></> : <><BookOpen className="w-6 h-6 animate-pulse" /><span>Registrar Lectura de Hoy</span></>}</button></div>

        {/* NAVEGACIÓN TIPO TABS */}
        <div className="flex justify-center mb-8"><div className={`flex bg-slate-200/50 p-1.5 rounded-2xl ${theme.colors.border} border`}>{['books', 'calendar', 'journal'].map(v => (<button key={v} onClick={() => setView(v)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === v ? `${theme.colors.card} ${theme.colors.text} shadow-md` : `${theme.colors.subtext} hover:bg-white/50`}`} type="button">{v === 'books' && 'Mis Libros'}{v === 'calendar' && 'Calendario'}{v === 'journal' && 'Diario'}</button>))}</div></div>

        {/* CONTENIDO PRINCIPAL */}
        <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'calendar' && renderCalendar()}
            {view === 'journal' && renderJournal()}

            {view === 'books' && (
                <>
                    {/* BARRA DE HERRAMIENTAS DE LIBROS */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`flex-1 relative`}>
                                <input type="text" placeholder="Buscar por título o autor..." className={`w-full ${theme.colors.input} rounded-xl py-3 pl-10 pr-4 text-sm outline-none border focus:ring-2 focus:ring-indigo-500/20 transition-all ${theme.colors.text}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            </div>
                            <div className={`flex p-1 rounded-xl border ${theme.colors.border} ${theme.colors.bg} relative`}>
                                <button onClick={() => setShowSortDropdown(!showSortDropdown)} className={`p-2 rounded-lg transition-all ${showSortDropdown ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><ArrowUpDown size={20} /></button>
                                <div className="w-[1px] bg-slate-200 mx-1 my-2"></div>
                                <button onClick={() => setDisplayMode('grid')} className={`p-2 rounded-lg transition-all ${displayMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20} /></button>
                                <button onClick={() => setDisplayMode('shelf')} className={`p-2 rounded-lg transition-all ${displayMode === 'shelf' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Columns size={20} className="rotate-90" /></button>
                                {showSortDropdown && <div className={`absolute top-12 right-0 w-44 ${theme.colors.dropdown} rounded-xl shadow-xl border ${theme.colors.border} z-20 overflow-hidden animate-in fade-in zoom-in-95`}><div className="px-4 py-2 text-xs font-bold uppercase tracking-wider opacity-50 border-b border-black/5">Ordenar por</div>{[{ id: 'custom', label: 'Manual' }, { id: 'favorites', label: 'Favoritos' }, { id: 'title', label: 'Título' }, { id: 'author', label: 'Autor' }].map(opt => (<button key={opt.id} onClick={() => { setSortBy(opt.id); setShowSortDropdown(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-black/5 transition-colors flex items-center justify-between ${sortBy === opt.id ? 'text-indigo-600' : ''}`}>{opt.label}{sortBy === opt.id && <CheckCircle2 size={14} />}</button>))}</div>}
                            </div>
                        </div>
                        {libraryGenres.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">{libraryGenres.map(genre => (<button key={genre} onClick={() => setSelectedGenre(genre)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap flex-shrink-0 ${selectedGenre === genre ? (currentTheme === 'dark' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-indigo-600 text-white border-indigo-600 shadow-md') : (currentTheme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm')}`}>{genre}</button>))}</div>)}
                    </div>

                    {/* VISTA GRID */}
                    {displayMode === 'grid' && (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6 justify-items-center pb-20">
                            {filteredBooks.length === 0 && <div className="col-span-full text-center py-20"><div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><Book size={40} className="text-slate-300"/></div><p className={`text-xl font-bold ${theme.colors.text}`}>No se encontraron libros</p></div>}
                            {filteredBooks.map((book) => {
                                const isFav = book.isFavorite;
                                const isDragged = draggedBookId === book.id;
                                const auraClass = isFav ? "ring-4 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-[1.02]" : "shadow-md hover:shadow-2xl hover:scale-105";
                                return (
                                    <button key={book.id} onClick={() => setSelectedBook(book)} onDoubleClick={(e) => toggleFavorite(e, book.id)} draggable="true" onDragStart={(e) => handleDragStart(e, book.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, book.id)} className={`group relative w-full aspect-[2/3] rounded-2xl cursor-pointer transition-all overflow-hidden ${theme.colors.card} border-0 p-0 ${auraClass} ${isDragged ? 'opacity-40 scale-95' : ''}`} type="button">
                                        {book.coverUrl ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover"/> : <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${book.color.split(' ')[0]}`}><span className="text-xs font-black opacity-60 tracking-widest line-clamp-3 leading-relaxed uppercase">{book.title}</span></div>}
                                        <div onClick={(e) => toggleFavorite(e, book.id)} className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm z-10 transition-all duration-300 ${isFav ? 'opacity-100 text-amber-400 bg-white/20' : 'opacity-0 group-hover:opacity-100 text-white bg-black/30 hover:bg-black/50'}`}><Heart size={18} fill={isFav ? "currentColor" : "none"} /></div>
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < book.rating ? "fill-yellow-400 text-yellow-400 drop-shadow-md" : "text-white/30"}/>)}</div></div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* VISTA SHELF MEJORADA */}
                    {displayMode === 'shelf' && (
                        <div className="pb-20 space-y-16">
                            {filteredBooks.length === 0 ? <div className="text-center py-20 opacity-50"><p className={`${theme.colors.subtext}`}>Estantería vacía.</p></div> : 
                                shelves.map((shelfBooks, shelfIndex) => (
                                    <div key={shelfIndex} className="relative group">
                                        <div className="flex flex-wrap items-end justify-center sm:justify-start px-8 sm:px-16 gap-1 sm:gap-1.5 z-10 relative">
                                            {shelfBooks.map((book) => {
                                                const thickness = getSpineThickness(book.pageCount);
                                                const heightClass = ['h-40 sm:h-64', 'h-44 sm:h-72', 'h-44 sm:h-72', 'h-48 sm:h-80', 'h-40 sm:h-64', 'h-44 sm:h-72'][book.id.charCodeAt(0) % 6] || 'h-44 sm:h-72';
                                                const bgColor = book.color.split(' ')[0];
                                                const isFav = book.isFavorite;
                                                const isDragged = draggedBookId === book.id;
                                                const lomoStyle = isFav ? { boxShadow: "0 0 20px 5px rgba(251, 191, 36, 0.5)", zIndex: 10, transform: 'translateY(-4px)' } : { boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }; 

                                                return (
                                                    <button 
                                                        key={book.id} 
                                                        onClick={() => setSelectedBook(book)}
                                                        onDoubleClick={(e) => toggleFavorite(e, book.id)}
                                                        draggable="true"
                                                        onDragStart={(e) => handleDragStart(e, book.id)}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, book.id)}
                                                        className={`relative ${heightClass} ${bgColor} rounded-sm hover:-translate-y-4 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer group/book flex flex-col justify-center border-l border-white/10 border-r border-black/20 ${isDragged ? 'opacity-40' : ''}`} 
                                                        title={`${book.title}`}
                                                        style={{ width: `${thickness}px`, backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%, rgba(0,0,0,0.15) 100%)`, ...lomoStyle }}
                                                    >
                                                        <div className="absolute top-4 w-full h-[1px] bg-white/20"></div>
                                                        <div className="absolute top-full left-0 w-full h-2 bg-black/20 blur-sm rounded-full opacity-60"></div>
                                                        
                                                        <div className="absolute inset-0 flex items-center justify-center p-1 z-10 pointer-events-none" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                                                            <span className="text-[10px] sm:text-[14px] font-extrabold italic tracking-wide leading-tight uppercase text-center line-clamp-2" style={{ fontFamily: 'system-ui, sans-serif', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{book.title}</span>
                                                        </div>
                                                        {isFav && (<div className="absolute inset-0 overflow-hidden pointer-events-none"><Sparkles size={12} className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-300 animate-pulse drop-shadow-md" /><div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-yellow-100 rounded-full animate-ping opacity-75"></div><div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-amber-200 rounded-full animate-pulse opacity-50"></div></div>)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 rounded-sm shadow-xl z-0" style={{ backgroundColor: theme.woodColor, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255,255,255,0.3)', backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 100px, ${theme.plankColor}20 101px, transparent 102px)` }}>
                                            <div className="absolute top-full left-0 right-0 h-3 sm:h-4 bg-black/20 rounded-b-sm" style={{ backgroundColor: theme.plankColor }}></div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </>
            )}
        </main>
      </div>

      {/* FAB */}
      {view === 'books' && <button onClick={openNewBookModal} className={`fixed bottom-8 right-8 w-16 h-16 ${theme.colors.accent} text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all z-20`} type="button" aria-label="Añadir libro"><Plus size={32} /></button>}

      {/* MODAL DETALLE CON BOTÓN DE REGISTRAR LECTURA */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`${theme.colors.card} w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10`}>
                <div className="h-40 bg-slate-200 relative overflow-hidden">
                    {selectedBook.coverUrl ? <img src={selectedBook.coverUrl} className="w-full h-full object-cover blur-lg opacity-60 scale-110" alt="" /> : <div className={`w-full h-full ${selectedBook.color.split(' ')[0]} opacity-50`}></div>}
                    <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white z-10 backdrop-blur-md transition-colors" type="button"><X size={20} /></button>
                </div>
                <div className="px-8 pb-8 relative">
                    <div className="flex gap-6 -mt-16 mb-6">
                        <div className="w-28 h-40 rounded-xl shadow-2xl bg-white overflow-hidden flex-shrink-0 border-4 border-white transform rotate-3 transition-transform hover:rotate-0 relative">
                            {selectedBook.coverUrl ? <img src={selectedBook.coverUrl} className="w-full h-full object-cover" alt="Portada" /> : <div className={`w-full h-full flex items-center justify-center ${selectedBook.color.split(' ')[0]}`}><Book className="opacity-50 text-white" /></div>}
                            <button onClick={(e) => toggleFavorite(e, selectedBook.id)} className={`absolute -top-3 -right-3 p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ${selectedBook.isFavorite ? 'bg-amber-100 text-amber-500' : 'bg-white text-slate-300 hover:text-amber-400'}`}><Heart size={20} fill={selectedBook.isFavorite ? "currentColor" : "none"} /></button>
                        </div>
                        <div className="flex-1 pt-16">
                            <div className="flex justify-between items-start mb-1"><h2 className={`text-2xl font-bold ${theme.colors.text} leading-tight`}>{selectedBook.title}</h2><button onClick={(e) => toggleFavorite(e, selectedBook.id)} className={`p-2 rounded-full transition-colors flex-shrink-0 ml-2 ${selectedBook.isFavorite ? 'text-amber-400 bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}`}><Heart size={24} fill={selectedBook.isFavorite ? "currentColor" : "none"} /></button></div>
                            <p className={`text-sm ${theme.colors.highlight} font-semibold mb-3 uppercase tracking-wide`}>{selectedBook.author}</p>
                            {selectedBook.genre && <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.colors.bg} ${theme.colors.subtext} text-xs font-bold border ${theme.colors.border} mb-3`}><Tag size={12} />{selectedBook.genre}</div>}
                            <div className="flex gap-1 items-center">{[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < selectedBook.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}/>)}{selectedBook.pageCount && <span className="ml-auto text-xs font-mono text-slate-400 border px-1.5 rounded">{selectedBook.pageCount}p</span>}</div>
                        </div>
                    </div>
                    {/* BOTÓN "LEER AHORA" EN MODAL DETALLE */}
                    <div className="mb-6">
                        <button 
                            onClick={() => { setSelectedBook(null); openSessionModal(selectedBook.id); }}
                            className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700`}
                        >
                            <Play size={18} fill="currentColor" /> Leer Ahora
                        </button>
                    </div>
                    <div className="flex gap-3 mb-8 pb-6 border-b border-slate-100"><button onClick={() => openEditBookModal(selectedBook)} className={`flex-1 py-3 ${theme.colors.bg} rounded-xl text-sm font-bold ${theme.colors.text} flex items-center justify-center gap-2 border ${theme.colors.border} hover:bg-slate-100 transition-colors`} type="button"><Pencil size={16} /> Editar</button><button onClick={() => deleteBook(selectedBook.id)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition-colors" type="button"><Trash2 size={16} /> Eliminar</button></div>
                    
                    <div>
                      <h3 className={`text-xs font-bold ${theme.colors.subtext} uppercase tracking-widest mb-4 flex items-center gap-2`}>
                        <History size={14}/> Historial de Lectura
                      </h3>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {readingSessions.filter(s => s.bookId === selectedBook.id).length === 0 ? (
                          <div className={`text-center py-6 ${theme.colors.bg} rounded-xl border border-dashed ${theme.colors.border}`}>
                            <p className={`text-sm ${theme.colors.subtext}`}>Aún no has leído este libro.</p>
                          </div>
                        ) : (
                          readingSessions.filter(s => s.bookId === selectedBook.id).map(session => (
                            <div key={session.id} className={`${theme.colors.bg} p-4 rounded-xl border ${theme.colors.border} flex justify-between items-center`}>
                              <div className="overflow-hidden pr-4">
                                <span className={`text-xs font-bold ${theme.colors.text} block mb-1`}>{session.date}</span>
                                {session.note && (
                                  <p className={`text-xs ${theme.colors.subtext} italic max-w-[150px] truncate`}>"{session.note}"</p>
                                )}
                              </div>
                              <span className={`text-xs font-bold ${theme.colors.highlight} bg-white px-2.5 py-1 rounded-lg border shadow-sm`}>
                                {session.duration}m
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                </div>
            </div>
        </div>
      )}

      {/* --- MODALES FORMULARIOS (NUEVO/EDITAR) --- */}
      {(isBookModalOpen || isSessionModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            
            {/* MODAL NUEVO/EDITAR LIBRO */}
            {isBookModalOpen && (
                <div className={`${theme.colors.card} w-full max-w-sm rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95`}>
                    <div className="flex justify-between items-center mb-8"><h2 className={`text-2xl font-bold ${theme.colors.text}`}>{editingBookId ? 'Editar Libro' : 'Nuevo Libro'}</h2><button onClick={() => setIsBookModalOpen(false)} className={`p-2 rounded-full bg-slate-100 hover:bg-slate-200 ${theme.colors.subtext}`} type="button"><X size={20} /></button></div>
                    <form onSubmit={handleSaveBook} className="space-y-6">
                        <div className="flex justify-center mb-4"><div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()} role="button" tabIndex={0} aria-label="Subir portada">{bookForm.coverUrl ? <img src={bookForm.coverUrl} className="w-32 h-48 object-cover rounded-xl shadow-lg border-2 border-white ring-1 ring-slate-200" alt="Portada" /> : <div className={`w-32 h-48 ${theme.colors.bg} rounded-xl border-2 border-dashed ${theme.colors.border} flex flex-col items-center justify-center ${theme.colors.subtext} hover:border-indigo-400 transition-colors`}><Camera size={28} className="mb-2 opacity-50"/><span className="text-[10px] font-bold uppercase tracking-wider">Subir Foto</span></div>}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} /></div></div>
                        <div className="mb-4">
                            <button 
                                type="button" 
                                onClick={handleManualSearch} 
                                disabled={!bookForm.title || isManualSearching || !isOnline} 
                                className={`w-full py-2.5 rounded-xl text-sm font-bold border-2 border-dashed ${theme.colors.border} transition-all flex items-center justify-center gap-2 ${!isOnline ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200'}`}
                            >
                                {isManualSearching ? <Loader2 size={16} className="animate-spin" /> : (!isOnline ? <WifiOff size={16}/> : <Globe size={16} />)} 
                                {isOnline ? "Buscar Portada y Datos en Línea" : "Sin conexión: Añade manualmente"}
                            </button>
                        </div>
                        {manualSearchResults.length > 0 && <div className="mb-6 space-y-2 bg-slate-50 p-2 rounded-xl border border-slate-200 max-h-60 overflow-y-auto"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Resultados encontrados:</p>{manualSearchResults.map((book) => (<button key={book.id} type="button" onClick={() => handleSelectManualResult(book)} className="w-full flex items-center gap-3 p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-left group">{book.volumeInfo.imageLinks?.thumbnail ? <img src={book.volumeInfo.imageLinks.thumbnail} className="w-10 h-14 object-cover rounded shadow-sm group-hover:shadow-md" alt="" /> : <div className="w-10 h-14 bg-slate-200 rounded flex items-center justify-center text-slate-400"><Book size={16} /></div>}<div className="overflow-hidden"><p className="font-bold text-sm text-slate-800 truncate">{book.volumeInfo.title}</p><p className="text-xs text-slate-500 truncate">{book.volumeInfo.authors?.[0] || 'Autor desconocido'}</p></div><ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-500" /></button>))}</div>}
                        <div className="space-y-4">
                            <div className="relative" ref={suggestionsRef}><label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Título</label><div className="relative"><input className={`w-full ${theme.colors.input} rounded-xl p-4 ${theme.colors.text} outline-none border-2 border-transparent focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/10 transition-all pl-12 font-medium`} value={bookForm.title} onChange={e => { setBookForm({...bookForm, title: e.target.value}); setShowSuggestions(true); }} placeholder="Ej. Cien Años de Soledad"/><div className="absolute left-4 top-4 text-slate-400">{isTyping ? <Loader2 size={20} className={`animate-spin ${theme.colors.highlight}`} /> : <Search size={20} />}</div></div>{showSuggestions && suggestions.length > 0 && !editingBookId && !manualSearchResults.length && <ul className={`absolute z-50 left-0 right-0 mt-2 ${theme.colors.card} rounded-xl shadow-2xl border ${theme.colors.border} max-h-48 overflow-y-auto p-2`}>{suggestions.map((book) => (<li key={book.id} onClick={() => handleSelectSuggestion(book)} className={`flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors`}>{book.volumeInfo.imageLinks?.thumbnail && <img src={book.volumeInfo.imageLinks.thumbnail} className="w-8 h-12 object-cover rounded" alt="" />}<div><p className={`font-bold text-sm ${theme.colors.text} line-clamp-1`}>{book.volumeInfo.title}</p><p className={`text-xs ${theme.colors.subtext}`}>{book.volumeInfo.authors?.[0]}</p></div></li>))}</ul>}</div>
                            <div><label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Autor</label><input className={`w-full ${theme.colors.input} rounded-xl p-4 ${theme.colors.text} outline-none border-2 border-transparent focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium`} value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} placeholder="Nombre del autor"/></div>
                            <div className="relative"><label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Género</label><div className="relative"><input className={`w-full ${theme.colors.input} rounded-xl p-4 ${theme.colors.text} outline-none border-2 border-transparent focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium`} value={bookForm.genre} onChange={e => { setBookForm({...bookForm, genre: e.target.value}); setShowGenreDropdown(true); }} onFocus={() => setShowGenreDropdown(true)} onBlur={() => setTimeout(() => setShowGenreDropdown(false), 200)} placeholder="Selecciona o escribe..."/><ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} /></div>{showGenreDropdown && <div className={`absolute z-20 w-full mt-1 max-h-48 overflow-y-auto ${theme.colors.dropdown} rounded-xl shadow-xl border ${theme.colors.border} animate-in fade-in zoom-in-95`}>{filteredGenreOptions.length > 0 ? filteredGenreOptions.map(g => (<button key={g} type="button" onClick={() => { setBookForm({...bookForm, genre: g}); setShowGenreDropdown(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-black/5 transition-colors flex items-center justify-between group`}>{g}<Tag size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" /></button>)) : <div className="px-4 py-3 text-sm text-slate-400 italic">Presiona guardar para crear "{bookForm.genre}"</div>}</div>}</div>
                            <div><label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Color del Lomo</label><div className="flex gap-2 overflow-x-auto pb-2">{bookColors.map((colorClass, idx) => (<button key={idx} type="button" onClick={() => setBookForm({ ...bookForm, color: colorClass })} className={`w-8 h-8 rounded-full border-2 ${colorClass.split(' ')[0]} ${bookForm.color === colorClass ? 'border-indigo-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}/>))}</div></div>
                            <div><label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Tu Valoración</label><div className={`flex justify-between ${theme.colors.input} p-4 rounded-xl border ${theme.colors.border}`}>{ [1, 2, 3, 4, 5].map((num) => (<button type="button" key={num} onClick={() => setBookForm({...bookForm, rating: num})} className="transform transition-transform active:scale-90 hover:scale-110"><Star size={28} className={num <= bookForm.rating ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-slate-200 fill-slate-200"}/></button>))}</div></div>
                        </div>
                        <button type="submit" disabled={isSearching} className={`w-full ${theme.colors.accent} ${theme.colors.accentHover} text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-[0.98] mt-4`}>{isSearching ? <Loader2 className="animate-spin mx-auto" /> : (isOnline ? "Guardar Libro" : "Guardar Offline")}</button>
                    </form>
                </div>
            )}

            {/* MODAL REGISTRAR LECTURA */}
            {isSessionModalOpen && (
                <div className={`${theme.colors.card} w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95`}>
                    <div className="flex justify-between items-center mb-8"><div><h2 className={`text-2xl font-bold ${theme.colors.text}`}>Registrar</h2><p className={`text-xs ${theme.colors.subtext} font-medium uppercase tracking-wide`}>Sesión de Lectura</p></div><button onClick={() => setIsSessionModalOpen(false)} className={`p-2 rounded-full bg-slate-100 hover:bg-slate-200 ${theme.colors.subtext}`} type="button"><X size={20} /></button></div>
                    <form onSubmit={handleSaveSession} className="space-y-6">
                        {/* SELECTOR DE LIBRO PERSONALIZADO */}
                        <div>
                            <label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Libro</label>
                            <div className="relative">
                                {/* Botón que muestra el libro seleccionado o el placeholder */}
                                <button 
                                    type="button"
                                    onClick={() => setShowBookSelector(!showBookSelector)}
                                    className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${sessionForm.bookId ? `${theme.colors.card} border-indigo-500/30` : `${theme.colors.input} border-transparent`} hover:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10`}
                                >
                                    {sessionForm.bookId ? (
                                        <>
                                            {(() => {
                                                const book = books.find(b => b.id === sessionForm.bookId);
                                                return book ? (
                                                    <>
                                                        {book.coverUrl ? <img src={book.coverUrl} className="w-8 h-10 object-cover rounded shadow-sm" alt="" /> : <div className={`w-8 h-10 flex items-center justify-center rounded ${book.color.split(' ')[0]} text-white text-[8px] font-bold p-1`}>{book.title.substring(0,2)}</div>}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold ${theme.colors.text} truncate`}>{book.title}</p>
                                                            <p className={`text-xs ${theme.colors.subtext} truncate`}>{book.author}</p>
                                                        </div>
                                                        <ChevronDown size={16} className={`${theme.colors.subtext}`} />
                                                    </>
                                                ) : <span>Seleccionar...</span>
                                            })()}
                                        </>
                                    ) : (
                                        <span className={`${theme.colors.subtext} font-medium`}>Selecciona un libro...</span>
                                    )}
                                </button>

                                {/* Dropdown Desplegable con Búsqueda */}
                                {showBookSelector && (
                                    <div className={`absolute z-30 top-full left-0 right-0 mt-2 ${theme.colors.dropdown} rounded-xl shadow-2xl border ${theme.colors.border} overflow-hidden animate-in fade-in zoom-in-95 max-h-60 flex flex-col`}>
                                        <div className="p-2 border-b border-black/5 sticky top-0 bg-inherit z-10">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                                <input 
                                                    autoFocus
                                                    className={`w-full bg-slate-100 rounded-lg py-2 pl-9 pr-3 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700`}
                                                    placeholder="Buscar..."
                                                    value={sessionSearchTerm}
                                                    onChange={(e) => setSessionSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto p-1 custom-scrollbar">
                                            {filteredBooksForSession.length > 0 ? (
                                                filteredBooksForSession.map(book => (
                                                    <button
                                                        key={book.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSessionForm({ ...sessionForm, bookId: book.id });
                                                            setShowBookSelector(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${sessionForm.bookId === book.id ? 'bg-indigo-50' : 'hover:bg-black/5'}`}
                                                    >
                                                        {book.coverUrl ? <img src={book.coverUrl} className="w-8 h-10 object-cover rounded shadow-sm" alt="" /> : <div className={`w-8 h-10 flex items-center justify-center rounded ${book.color.split(' ')[0]} text-white`}><Book size={12}/></div>}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-bold ${theme.colors.text} truncate`}>{book.title}</p>
                                                            <p className={`text-[10px] ${theme.colors.subtext} truncate`}>{book.author}</p>
                                                        </div>
                                                        {sessionForm.bookId === book.id && <CheckCircle2 size={14} className="text-indigo-600" />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-xs text-slate-400">No se encontraron libros</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div><label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Tiempo (Minutos)</label><div className="flex gap-3 mb-3">{['15', '30', '45', '60'].map(min => (<button key={min} type="button" onClick={() => setSessionForm({...sessionForm, duration: min})} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${sessionForm.duration === min ? `${theme.colors.accent} border-transparent text-white shadow-md` : `${theme.colors.bg} border-transparent hover:border-slate-200 ${theme.colors.subtext}`}`}>{min}</button>))}</div><input type="number" placeholder="Otro tiempo..." className={`w-full mt-2 ${theme.colors.input} rounded-xl p-4 text-sm ${theme.colors.text} outline-none border-2 border-transparent focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/10`} value={sessionForm.duration} onChange={e => setSessionForm({...sessionForm, duration: e.target.value})}/></div>
                        <div><label className={`block text-xs font-bold ${theme.colors.subtext} uppercase mb-2 ml-1`}>Notas (Opcional)</label><textarea className={`w-full ${theme.colors.input} rounded-xl p-4 ${theme.colors.text} outline-none resize-none h-28 text-sm border-2 border-transparent focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/10`} placeholder="¿Qué parte te gustó más hoy?" value={sessionForm.note} onChange={e => setSessionForm({...sessionForm, note: e.target.value})}/></div>
                        <button type="submit" className={`w-full ${theme.colors.accent} ${theme.colors.accentHover} text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-[0.98]`}>
                            {isOnline ? "Guardar Progreso" : "Guardar Offline"}
                        </button>
                    </form>
                </div>
            )}
        </div>
      )}
    </div>
  );
}