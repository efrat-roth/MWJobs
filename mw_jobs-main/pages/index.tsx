import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Head from 'next/head';
import { formatDateRangeDisplay, formatTimeRangeDisplay } from '../lib/utils/common';

interface EventItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  worker_limit: number;
  hourlyRate: number;
  signups_count: number;
  isFull: boolean;
  label: string;
  displayText: string;
  min_age?: number;
}

interface FormHistory {
  fullName: string[];
  idNumber: string[];
  phone: string[];
  city: string[];
}

interface SuggestionState {
  field: string | null;
  suggestions: string[];
  show: boolean;
}

export default function Landing() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [form, setForm] = useState({ fullName:'', idNumber:'', phone:'', city:'', dateOfBirth:''});
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const [formHistory, setFormHistory] = useState<FormHistory>({ fullName: [], idNumber: [], phone: [], city: [] });
  const [suggestions, setSuggestions] = useState<SuggestionState>({ field: null, suggestions: [], show: false });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchEvents();
    loadFormHistory();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      
      // Hide suggestions when clicking outside
      const clickedInsideSuggestion = Object.values(suggestionRefs.current).some(ref => 
        ref && ref.contains(event.target as Node)
      );
      if (!clickedInsideSuggestion) {
        setSuggestions({ field: null, suggestions: [], show: false });
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load form history from localStorage
  function loadFormHistory() {
    try {
      const savedHistory = localStorage.getItem('mw-jobs-form-history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setFormHistory(parsedHistory);
        // Debug: Log the loaded history
        console.log('Loaded form history:', parsedHistory);
      }
    } catch (error) {
      console.error('Error loading form history:', error);
    }
  }

  // Save form history to localStorage
  function saveFormHistory(newHistory: FormHistory) {
    try {
      localStorage.setItem('mw-jobs-form-history', JSON.stringify(newHistory));
      setFormHistory(newHistory);
      // Debug: Log the saved history
      console.log('Saved form history:', newHistory);
    } catch (error) {
      console.error('Error saving form history:', error);
    }
  }

  // Add multiple values to form history at once
  function addToHistoryBatch(updates: { field: keyof FormHistory; value: string }[]) {
    const currentHistory = { ...formHistory };
    
    updates.forEach(({ field, value }) => {
      if (!value.trim()) return;
      
      const fieldHistory = currentHistory[field] || [];
      // Remove if already exists and add to beginning
      const filteredHistory = fieldHistory.filter(item => item !== value.trim());
      const newFieldHistory = [value.trim(), ...filteredHistory].slice(0, 5); // Keep only last 5 entries
      
      currentHistory[field] = newFieldHistory;
    });
    
    saveFormHistory(currentHistory);
  }

  // Add value to form history
  function addToHistory(field: keyof FormHistory, value: string) {
    if (!value.trim()) return;
    
    const currentHistory = { ...formHistory };
    const fieldHistory = currentHistory[field] || [];
    
    // Remove if already exists and add to beginning
    const filteredHistory = fieldHistory.filter(item => item !== value);
    const newFieldHistory = [value, ...filteredHistory].slice(0, 5); // Keep only last 5 entries
    
    currentHistory[field] = newFieldHistory;
    saveFormHistory(currentHistory);
  }

  // Show suggestions for a field
  function showSuggestions(field: keyof FormHistory, currentValue: string = '') {
    const fieldHistory = formHistory[field] || [];
    let filtered = fieldHistory;
    
    // Filter based on current input
    if (currentValue.trim()) {
      filtered = fieldHistory.filter(item => 
        item.toLowerCase().includes(currentValue.toLowerCase())
      );
    }
    
    // Show suggestions if there are any, even on mobile
    if (filtered.length > 0) {
      setSuggestions({
        field,
        suggestions: filtered,
        show: true
      });
    } else {
      setSuggestions({ field: null, suggestions: [], show: false });
    }
  }

  // Enhanced function to handle both focus and input events
  function handleFieldFocus(field: keyof FormHistory, currentValue: string = '') {
    // Always try to show suggestions on focus
    showSuggestions(field, currentValue);
  }

  // Handle suggestion selection
  function selectSuggestion(value: string) {
    if (suggestions.field) {
      setForm(f => ({ ...f, [suggestions.field!]: value }));
      setSuggestions({ field: null, suggestions: [], show: false });
    }
  }

  async function fetchEvents() {
    const res = await axios.get('/api/events/get');
    setEvents(res.data.events);
  }

  function toggleEventSelection(eventId: string) {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
    
    // Clear event selection error when user selects an event
    if (fieldErrors.eventIds) {
      setFieldErrors(prev => ({ ...prev, eventIds: '' }));
    }
  }

  function handleDropdownToggle() {
    if (!showDropdown && dropdownRef.current) {
      // Calculate if dropdown should open up or down
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300; // max-height of dropdown
      
      // If not enough space below and more space above, open upward
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownDirection('up');
      } else {
        setDropdownDirection('down');
      }
    }
    setShowDropdown(!showDropdown);
  }

  function getSelectedEventsDisplay() {
    if (selectedEvents.length === 0) return 'לא נבחרו אירועים';
    return `נבחרו ${selectedEvents.length} מתוך ${events.length} אירועים`;
  }

  function update(k:string,v:string){ 
    setForm(f=>({...f,[k]:v})); 
    // Clear field error when user starts typing
    if (fieldErrors[k]) {
      setFieldErrors(prev => ({ ...prev, [k]: '' }));
    }
    
    // Show suggestions as user types
    if (['fullName', 'idNumber', 'phone', 'city'].includes(k)) {
      showSuggestions(k as keyof FormHistory, v);
    }
  }

  async function submit(e:any){
    e.preventDefault();
    setMessage('');
    setFieldErrors({});
    setIsSuccess(false);
    
    if(selectedEvents.length === 0) { 
      setFieldErrors({ eventIds: 'יש לבחור לפחות אירוע אחד' });
      return; 
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/signup',{ eventIds: selectedEvents, ...form });
      
      // שמירת היסטוריית טופס
      addToHistoryBatch([
        { field: 'fullName', value: form.fullName.trim() },
        { field: 'idNumber', value: form.idNumber.trim() },
        { field: 'phone', value: form.phone.trim() },
        { field: 'city', value: form.city.trim() }
      ]);
      
      // שומרים את הודעת ההצלחה מהשרת כדי להציג אותה על המסך!
      setMessage(response.data.message);
      setIsSuccess(true);
      
      setForm({ fullName:'', idNumber:'', phone:'', city:'', dateOfBirth:''});
      setSelectedEvents([]);
      setSuggestions({ field: null, suggestions: [], show: false });
      await fetchEvents();
      
      // נשאיר את ההודעה ל-6 שניות כדי שיספיקו לקרוא, ואז ננקה
      setTimeout(() => {
        setIsSuccess(false);
        setMessage('');
      }, 6000);

    } catch(err:any){
      const errorData = err.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Parse field-specific validation errors
        const newFieldErrors: Record<string, string> = {};
        
        errorData.errors.forEach((error: string) => {
          // Extract field name and message from Hebrew error format
          const fieldMappings = [
            { prefix: 'בחירת אירועים:', field: 'eventIds' },
            { prefix: 'שם מלא:', field: 'fullName' },
            { prefix: 'מספר זהות:', field: 'idNumber' },
            { prefix: 'מספר טלפון:', field: 'phone' },
            { prefix: 'עיר מגורים:', field: 'city' },
            { prefix: 'תאריך לידה:', field: 'dateOfBirth' }
          ];
          
          let fieldFound = false;
          for (const mapping of fieldMappings) {
            if (error.includes(mapping.prefix)) {
              newFieldErrors[mapping.field] = error.replace(mapping.prefix + ' ', '');
              fieldFound = true;
              break;
            }
          }
          
          // Fallback: if no prefix found, try to detect field from error content
          if (!fieldFound) {
            if (error.includes('זהות') || error.includes('ת.ז')) {
              newFieldErrors.idNumber = error;
            } else if (error.includes('טלפון')) {
              newFieldErrors.phone = error;
            } else if (error.includes('שם')) {
              newFieldErrors.fullName = error;
            } else if (error.includes('עיר')) {
              newFieldErrors.city = error;
            } else if (error.includes('לידה') || error.includes('גיל') || error.includes('18')) {
              newFieldErrors.dateOfBirth = error;
            } else if (error.includes('אירוע')) {
              newFieldErrors.eventIds = error;
            }
          }
        });
        
        setFieldErrors(newFieldErrors);
        
        // Also show a general message if there are field errors
        if (Object.keys(newFieldErrors).length > 0) {
          setMessage('יש לתקן את השגיאות בטופס');
        }
      } else {
        // מציג קודם כל את ההודעה המפורטת (message) ורק אם היא לא קיימת עובר ל-error הכללי
        setMessage(errorData?.message || errorData?.error || 'שגיאה בשליחת הטופס');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>MW Jobs - הרשמה לאירועי עבודה</title>
        <meta name="description" content="מערכת הרשמה לאירועי עבודה במגזר הפרטי תחת קבוצת MW פתרונות כח אדם. הרשמו לאירועי עבודה במספר קליקים." />
        <meta name="keywords" content="עבודה, אירועים, הרשמה, MW, כח אדם, משרות זמניות" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="MW Jobs - הרשמה לאירועי עבודה" />
        <meta property="og:description" content="מערכת הרשמה לאירועי עבודה במגזר הפרטי תחת קבוצת MW פתרונות כח אדם" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mw-jobs.vercel.app" />
      </Head>

      <div className={`landing-container ${loading ? 'loading' : ''}`}>
      <header className="header">
        <img src="/logo.svg" alt="MW Logo" className="company-logo" />
        <a href="https://wa.me/972538270508" className="whatsapp-button" target="_blank" rel="noopener noreferrer">
          דברו איתנו
          <img src="/whatsapp-icon.svg" alt="WhatsApp" className="whatsapp-icon" />
        </a>
      </header>

      <main className="main-content">
        <div className="form-container">
          <div className="form-header">
            <h1 className="form-title">טופס הרשמה לאירועים</h1>
            <p className="form-subtitle">תחת קבוצת MW פתרונות כח אדם</p>
          </div>

          <form onSubmit={submit} className="signup-form">
            <div className="form-row single">
              <div className="field-group full-width">
                <label className="field-label">אירועים</label>
                <div className={`field-input-container ${showDropdown ? 'dropdown-active' : ''}`}>
                  <div className="custom-multi-select" ref={dropdownRef}>
                    <div 
                      className={`field-input multi-select-trigger ${fieldErrors.eventIds ? 'error' : ''}`}
                      onClick={handleDropdownToggle}
                    >
                      {getSelectedEventsDisplay()}
                      <img src="/arrow-down.svg" alt="Select" className="dropdown-arrow" />
                    </div>
                    {showDropdown && (
                      <div className={`multi-select-dropdown ${dropdownDirection === 'up' ? 'dropdown-up' : ''}`}>
                        {events.map(event => (
                          <div 
                            key={event.id} 
                            className={`multi-select-option ${selectedEvents.includes(event.id) ? 'selected' : ''} ${event.isFull ? 'disabled' : ''}`}
                            onClick={() => !event.isFull && toggleEventSelection(event.id)}
                          >
                            <div className="checkbox-container">
                              <input 
                                type="checkbox" 
                                checked={selectedEvents.includes(event.id)}
                                disabled={event.isFull || event.status === 'frozen'}
                                readOnly
                              />
                            </div>
                            <div className="event-display-container">
                              <div className="event-name">
                                {event.name}
                                {event.min_age ? <span style={{color: '#e74c3c', fontSize: '0.85em', marginRight: '6px', fontWeight: 'bold'}}>(מגיל {event.min_age}+)</span> : null}
                                {event.status === 'frozen' ? 
                                  <span className="event-unavailable-indicator"> (לא זמין)</span> :
                                  event.isFull && <span className="event-full-indicator"> (מלא)</span>
                                }
                              </div>
                              <div className="event-details">
                                {formatDateRangeDisplay(event.startDate, event.endDate)}
                              </div>
                              <div className="event-details">
                                {formatTimeRangeDisplay(event.startTime, event.endTime)}
                              </div>
                              <div className="event-details" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                 מחיר לשעה: {event.hourlyRate} ש"ח
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {fieldErrors.eventIds && (
                    <div className="field-error">{fieldErrors.eventIds}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label className="field-label">שם מלא</label>
                <div className={`field-input-container ${suggestions.show && suggestions.field === 'fullName' ? 'dropdown-active' : ''}`} ref={el => suggestionRefs.current['fullName'] = el}>
                  <input 
                    required 
                    value={form.fullName} 
                    onChange={e=>update('fullName', e.target.value)}
                    onFocus={() => handleFieldFocus('fullName', form.fullName)}
                    placeholder="שם מלא"
                    autoComplete="name"
                    className={`field-input ${fieldErrors.fullName ? 'error' : ''}`}
                  />
                  {suggestions.show && suggestions.field === 'fullName' && (
                    <div className="suggestions-dropdown">
                      {suggestions.suggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="suggestion-item"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  {fieldErrors.fullName && (
                    <div className="field-error">{fieldErrors.fullName}</div>
                  )}
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">מספר זהות (ת.ז)</label>
                <div className={`field-input-container ${suggestions.show && suggestions.field === 'idNumber' ? 'dropdown-active' : ''}`} ref={el => suggestionRefs.current['idNumber'] = el}>
                  <input 
                    required 
                    value={form.idNumber} 
                    onChange={e=>update('idNumber', e.target.value)}
                    onFocus={() => handleFieldFocus('idNumber', form.idNumber)}
                    placeholder="מספר זהות"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    className={`field-input ${fieldErrors.idNumber ? 'error' : ''}`}
                  />
                  {suggestions.show && suggestions.field === 'idNumber' && (
                    <div className="suggestions-dropdown">
                      {suggestions.suggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="suggestion-item"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  {fieldErrors.idNumber && (
                    <div className="field-error">{fieldErrors.idNumber}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label className="field-label">מספר טלפון</label>
                <div className={`field-input-container ${suggestions.show && suggestions.field === 'phone' ? 'dropdown-active' : ''}`} ref={el => suggestionRefs.current['phone'] = el}>
                  <input 
                    required 
                    value={form.phone} 
                    onChange={e=>update('phone', e.target.value)}
                    onFocus={() => handleFieldFocus('phone', form.phone)}
                    placeholder="טלפון"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel"
                    className={`field-input ${fieldErrors.phone ? 'error' : ''}`}
                  />
                  {suggestions.show && suggestions.field === 'phone' && (
                    <div className="suggestions-dropdown">
                      {suggestions.suggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="suggestion-item"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  {fieldErrors.phone && (
                    <div className="field-error">{fieldErrors.phone}</div>
                  )}
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">עיר מגורים</label>
                <div className={`field-input-container ${suggestions.show && suggestions.field === 'city' ? 'dropdown-active' : ''}`} ref={el => suggestionRefs.current['city'] = el}>
                  <input 
                    required 
                    value={form.city} 
                    onChange={e=>update('city', e.target.value)}
                    onFocus={() => handleFieldFocus('city', form.city)}
                    placeholder="עיר מגורים"
                    autoComplete="address-level2"
                    className={`field-input ${fieldErrors.city ? 'error' : ''}`}
                  />
                  {suggestions.show && suggestions.field === 'city' && (
                    <div className="suggestions-dropdown">
                      {suggestions.suggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="suggestion-item"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  {fieldErrors.city && (
                    <div className="field-error">{fieldErrors.city}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row single">
              <div className="field-group full-width">
                <label className="field-label">תאריך לידה</label>
                <div className="field-input-container">
                  <input 
                    required 
                    type="date"
                    value={form.dateOfBirth} 
                    onChange={e=>update('dateOfBirth', e.target.value)}
                    autoComplete="bday"
                    className={`field-input ${fieldErrors.dateOfBirth ? 'error' : ''}`}
                  />
                  {fieldErrors.dateOfBirth && (
                    <div className="field-error">{fieldErrors.dateOfBirth}</div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className={`submit-button ${isSuccess ? 'success' : ''}`}
                disabled={loading || selectedEvents.length === 0 || !form.fullName.trim() || !form.idNumber.trim() || !form.phone.trim() || !form.city.trim() || !form.dateOfBirth.trim()}
              >
                {loading ? 'שולח...' : isSuccess ? 'נרשמת בהצלחה' : 'שליחה'}
                <img src="/submit-icon.svg" alt="Send" className="submit-icon" />
              </button>
             {message && (
                <div style={{ 
                  color: isSuccess ? '#155724' : '#721c24', 
                  backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'}`,
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '15px', 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  fontSize: '1em',
                  whiteSpace: 'pre-line' // שומר על ירידת שורות אם יש כמה שגיאות
                }}>
                  {message}
                </div>
              )}
            </div>
          </form>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-disclaimer">
            MW אינה המעסיקה הישירה שלכם
          </div>
          <div className="footer-links">
            <a href="/privacy" rel="noopener noreferrer">מדיניות פרטיות</a>
            <span className="footer-separator">|</span>
            <a href="/terms" rel="noopener noreferrer">תנאי שימוש</a>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
