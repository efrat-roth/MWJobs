  import { useSession, signIn, signOut } from 'next-auth/react';
  import { useEffect, useState } from 'react';
  import axios from 'axios';
  import { formatDateRangeDisplay, formatTimeRangeDisplay } from '../../lib/utils/common';
  import { EventStatus } from '../../lib/types';

  interface AdminEvent {
    id:string; name:string; startDate:string; endDate:string; 
    startTime:string; endTime:string; status:string;
    worker_limit:number; hourlyRate: number; signups_count:number;
    displayText: string;
  }

  interface EditEvent {
    id: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    worker_limit: number;
    hourlyRate: number;
    status?: EventStatus;
  }

  export default function AdminPage() {
    const { data:session, status } = useSession();
    const [events,setEvents] = useState<AdminEvent[]>([]);
    const [form,setForm] = useState({
      name:'', 
      startDate:'', 
      endDate:'', 
      startTime:'', 
      endTime:'', 
      workerLimit:50,
      hourlyRate: 40, 
      description:''
    });
    const [loading,setLoading]= useState(false);
    const [error,setError]= useState('');
    const [message,setMessage]= useState('');
    const [endTimeManuallySet, setEndTimeManuallySet] = useState(false);
    const [editingEvent, setEditingEvent] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditEvent | null>(null);
    const [clients, setClients] = useState<{name: string, email: string}[]>([]);
    const [selectedClientMode, setSelectedClientMode] = useState<'none' | 'existing' | 'new'>('none');
    const [existingClientEmail, setExistingClientEmail] = useState('');
    const [newClientName, setNewClientName] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');

    async function fetchEvents(){
      try {
        const res = await axios.get('/api/events/get?admin=1');
        setEvents(res.data.events);
      } catch(e:any){
        setError(e.response?.data?.error || 'Error');
      }
    }

    async function fetchClients() {
      try {
        const res = await axios.get('/api/clients/get');
        setClients(res.data.clients || []);
      } catch(e) {
        console.error('Error fetching clients', e);
      }
    }

    useEffect(()=>{
      if(session?.isAdmin) {
        fetchEvents();
        fetchClients();
      }
    },[session]);

    function update(k:string,v:any){ setForm(f=>({...f,[k]:v})); }

    // Add 6 hours to a time string
    function addSixHours(timeString: string): string {
      if (!timeString) return '';
      
      const timeParts = timeString.split(':');
      if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) return timeString;
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      if (isNaN(hours) || isNaN(minutes)) return timeString;
      
      const newHours = (hours + 6) % 24;
      
      return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Round time to nearest 5-minute interval (for browsers that don't respect step)
    function roundToFiveMinutes(timeString: string): string {
      if (!timeString) return '';
      
      const timeParts = timeString.split(':');
      if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) return timeString;
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      if (isNaN(hours) || isNaN(minutes)) return timeString;
      
      const roundedMinutes = Math.round(minutes / 5) * 5;
      
      // Handle minute overflow
      let finalHours = hours;
      let finalMinutes = roundedMinutes;
      
      if (finalMinutes >= 60) {
        finalHours = (finalHours + 1) % 24;
        finalMinutes = 0;
      }
      
      return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
    }

    // Handle start time change with automatic end time calculation
    function handleStartTimeChange(newStartTime: string) {
      const roundedStartTime = roundToFiveMinutes(newStartTime);
      
      // Always update the end time if it hasn't been manually set by the user
      if (roundedStartTime && !endTimeManuallySet) {
        const autoEndTime = addSixHours(roundedStartTime);
        setForm(f => ({
          ...f,
          startTime: roundedStartTime,
          endTime: autoEndTime
        }));
      } else {
        // Just update start time without affecting end time
        setForm(f => ({ ...f, startTime: roundedStartTime }));
      }
    }

    // Handle end time change
    function handleEndTimeChange(newEndTime: string) {
      const roundedEndTime = roundToFiveMinutes(newEndTime);
      // Mark that user has manually set the end time
      setEndTimeManuallySet(true);
      setForm(f => ({ ...f, endTime: roundedEndTime }));
    }

    // Reset the manual flag when form is cleared
    function resetForm() {
      setForm({
        name:'', 
        startDate:'', 
        endDate:'', 
        startTime:'', 
        endTime:'', 
        workerLimit:50, 
        hourlyRate: 40,
        description:''
      });
      setEndTimeManuallySet(false);
      setSelectedClientMode('none');
      setExistingClientEmail('');
      setNewClientName('');
      setNewClientEmail('');
    }
 
    async function createEvent(e:any){
      e.preventDefault();
      setLoading(true); setError(''); setMessage('');
      
      // הגדרת המייל והשם שישלחו לשרת
      const clientEmailToSend = selectedClientMode === 'new' ? newClientEmail : (selectedClientMode === 'existing' ? existingClientEmail : undefined);
      const clientNameToSend = selectedClientMode === 'new' ? newClientName : undefined;

      try {
        await axios.post('/api/events/add', {
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
          startTime: form.startTime,
          endTime: form.endTime || form.startTime,
          workerLimit: Number(form.workerLimit),
          hourlyRate: Number(form.hourlyRate),
          description: form.description,
          // השדות החדשים שהוספנו:
          clientEmail: clientEmailToSend,
          clientName: clientNameToSend
        });
        setMessage('אירוע נוצר בהצלחה');
        resetForm();
        await fetchEvents();
      } catch(err:any){
        setError(err.response?.data?.error || 'שגיאה ביצירת האירוע');
      } finally {
        setLoading(false);
      }
    }

    async function deleteEvent(id:string){
      if(!confirm('האם אתה בטוח שברצונך למחוק את האירוע?')) return;
      try {
        await axios.post('/api/events/delete', { id });
        await fetchEvents();
      } catch(err:any){
        alert(err.response?.data?.error || 'שגיאה במחיקת האירוע');
      }
    }

    function startEditing(event: AdminEvent) {
      setEditingEvent(event.id);
      setEditForm({
        id: event.id,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        worker_limit: event.worker_limit,
        hourlyRate: event.hourlyRate,
        status: event.status as EventStatus
      });
    }

    function cancelEditing() {
      setEditingEvent(null);
      setEditForm(null);
    }

    async function saveEdit() {
      if (!editForm) return;
      
      try {
        const updateData: any = {
          id: editForm.id
        };
        
        // Only include changed fields
        const originalEvent = events.find(e => e.id === editForm.id);
        if (!originalEvent) return;
        
        if (editForm.startDate !== originalEvent.startDate) updateData.startDate = editForm.startDate;
        if (editForm.endDate !== originalEvent.endDate) updateData.endDate = editForm.endDate;
        if (editForm.startTime !== originalEvent.startTime) updateData.startTime = editForm.startTime;
        if (editForm.endTime !== originalEvent.endTime) updateData.endTime = editForm.endTime;
        if (editForm.worker_limit !== originalEvent.worker_limit) updateData.workerLimit = editForm.worker_limit;
        if (editForm.hourlyRate !== originalEvent.hourlyRate) updateData.hourlyRate = editForm.hourlyRate; // הוספת השורה
        // Check if status changed
        if (editForm.status !== originalEvent.status) updateData.status = editForm.status;
        
        await axios.patch('/api/events/update', updateData);
        await fetchEvents();
        setEditingEvent(null);
        setEditForm(null);
        setMessage('האירוע עודכן בהצלחה');
        setTimeout(() => setMessage(''), 3000);
      } catch(err:any) {
        alert(err.response?.data?.error || 'שגיאה בעדכון האירוע');
      }
    }

    async function toggleFreeze(eventId: string, currentFrozen: boolean) {
      try {
        let newStatus: string;
        if (currentFrozen) {
          // When unfreezing, check if event should be 'full' or 'open'
          const event = events.find(e => e.id === eventId);
          if (event && event.signups_count >= event.worker_limit) {
            newStatus = 'full';
          } else {
            newStatus = 'open';
          }
        } else {
          // When freezing, always set to 'frozen'
          newStatus = 'frozen';
        }
        
        await axios.patch('/api/events/update', { 
          id: eventId, 
          status: newStatus
        });
        await fetchEvents();
        setMessage(currentFrozen ? 'האירוע הופשר' : 'האירוע הוקפא');
        setTimeout(() => setMessage(''), 3000);
      } catch(err:any) {
        alert(err.response?.data?.error || 'שגיאה בעדכון סטטוס האירוע');
      }
    }

    function getStatusInHebrew(status: string): string {
      switch(status) {
        case 'open': return 'פתוח';
        case 'full': return 'מלא';
        case 'archived': return 'בארכיון';
        case 'frozen': return 'קפוא';
        default: return status;
      }
    }

    function isEventAvailableForSignup(event: AdminEvent): boolean {
      const now = new Date();
      const eventEnd = new Date(event.endDate);
      return eventEnd > now && event.status !== 'frozen';
    }

    if(status === 'loading') {
      return (
        <div className="admin-login-container">
          <div className="admin-login-card">
            <h2 className="admin-login-title">טוען...</h2>
          </div>
        </div>
      );
    }

    if(!session) {
      return (
        <div className="admin-login-container">
          <div className="admin-login-card">
            <h2 className="admin-login-title">כניסת מנהלים</h2>
            <button 
              onClick={()=>signIn('google')} 
              className="admin-login-btn"
            >
              התחבר עם Google
            </button>
          </div>
        </div>
      );
    }

    if(!(session as any).isAdmin) {
      return (
        <div className="admin-unauthorized">
          <div className="admin-unauthorized-card">
            <h2 className="admin-unauthorized-title">אין הרשאה</h2>
            <p className="admin-unauthorized-text">אין לך הרשאה לגשת לעמוד זה</p>
            <button onClick={()=>signOut()} className="admin-btn">
              התנתק
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`admin-container ${loading ? 'admin-loading' : ''}`}>
        <header className="admin-header">
          <div className="admin-header-content">
            <h1 className="admin-title">ניהול אירועים MW</h1>
            <div className="admin-user-info">
              <span>מחובר כ: {session.user?.email}</span>
              <button onClick={()=>signOut()} className="admin-signout-btn">
                התנתק
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-card">
            <h2 className="admin-card-title">יצירת אירוע חדש</h2>
            <form onSubmit={createEvent} className="admin-form">
              <div className="admin-field-group" style={{ backgroundColor: '#eef2f6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <label className="admin-field-label">בחר לקוח (לשיתוף הגיליון)</label>
                <select 
                  className="admin-field-input"
                  value={selectedClientMode === 'new' ? 'new' : existingClientEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'new') {
                      setSelectedClientMode('new');
                      setExistingClientEmail('');
                    } else if (val !== '') {
                      setSelectedClientMode('existing');
                      setExistingClientEmail(val);
                    } else {
                      setSelectedClientMode('none');
                      setExistingClientEmail('');
                    }
                  }}
                >
                  <option value="">-- ללא שיתוף לקוח --</option>
                  {clients.map((c, i) => (
                    <option key={i} value={c.email}>{c.name} ({c.email})</option>
                  ))}
                  <option value="new" style={{ fontWeight: 'bold' }}>+ הוסף לקוח חדש...</option>
                </select>
              </div>

              {selectedClientMode === 'new' && (
                <div className="admin-form-row" style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                  <div className="admin-field-group">
                    <label className="admin-field-label">שם הלקוח החדש</label>
                    <input 
                      value={newClientName}
                      onChange={e => setNewClientName(e.target.value)}
                      placeholder="שם חברה / לקוח"
                      className="admin-field-input"
                    />
                  </div>
                  <div className="admin-field-group">
                    <label className="admin-field-label">מייל הלקוח החדש</label>
                    <input 
                      type="email"
                      value={newClientEmail}
                      onChange={e => setNewClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="admin-field-input"
                    />
                  </div>
                </div>
              )}  
              <div className="admin-field-group">
                <label className="admin-field-label">שם האירוע</label>
                <input 
                  required 
                  value={form.name} 
                  onChange={e=>update('name',e.target.value)}
                  placeholder="הכנס שם אירוע"
                  className="admin-field-input"
                />
              </div>
              
              <div className="admin-form-row">
                <div className="admin-field-group">
                  <label className="admin-field-label">תאריך התחלה</label>
                  <input 
                    required 
                    type="date" 
                    value={form.startDate} 
                    onChange={e=>update('startDate',e.target.value)}
                    className="admin-field-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">תאריך סיום (אופציונלי)</label>
                  <input 
                    type="date" 
                    value={form.endDate} 
                    onChange={e=>update('endDate',e.target.value)}
                    className="admin-field-input"
                  />
                </div>
              </div>
              
              <div className="admin-form-row">
                <div className="admin-field-group">
                  <label className="admin-field-label">שעת התחלה</label>
                  <input 
                    required 
                    type="time" 
                    step="300"
                    value={form.startTime} 
                    onChange={e=>handleStartTimeChange(e.target.value)}
                    className="admin-field-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">שעת סיום (אופציונלי)</label>
                  <input 
                    type="time" 
                    step="300"
                    value={form.endTime} 
                    onChange={e=>handleEndTimeChange(e.target.value)}
                    className="admin-field-input"
                  />
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">מספר עובדים מקסימלי</label>
                <input 
                  required 
                  type="number" 
                  value={form.workerLimit} 
                  onChange={e=>update('workerLimit',e.target.value)}
                  placeholder="50"
                  className="admin-field-input"
                />
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">מחיר לשעה</label>
                <input 
                  required 
                  type="number" 
                  value={form.hourlyRate} 
                  onChange={e=>update('hourlyRate', Number(e.target.value))}
                  placeholder="40"
                  className="admin-field-input"
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">תיאור (אופציונלי)</label>
                <input 
                  value={form.description} 
                  onChange={e=>update('description',e.target.value)}
                  placeholder="תיאור האירוע"
                  className="admin-field-input"
                />
              </div>

              <button disabled={loading} className="admin-btn">
                {loading ? 'יוצר...' : 'צור אירוע'}
              </button>

              {error && <div className="admin-message error">{error}</div>}
              {message && <div className="admin-message success">{message}</div>}
            </form>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">רשימת אירועים</h2>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>פעולות</th>
                    <th>הקפאה</th>
                    <th>סטטוס</th>
                    <th>הרשמות</th>
                    <th>תקופה</th>
                    <th>מחיר לשעה</th>
                    <th>שם האירוע</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e=>(
                    <tr key={e.id}>
                      <td>
                        {editingEvent === e.id ? (
                          <div className="edit-actions">
                            <button 
                              onClick={saveEdit} 
                              className="admin-btn primary small"
                            >
                              שמור
                            </button>
                            <button 
                              onClick={cancelEditing} 
                              className="admin-btn secondary small"
                            >
                              בטל
                            </button>
                          </div>
                        ) : (
                          <div className="event-actions">
                            {e.status !== 'frozen' && (
                              <button 
                                onClick={() => startEditing(e)} 
                                className="admin-btn secondary small"
                              >
                                ערוך
                              </button>
                            )}
                            <button 
                              onClick={()=>deleteEvent(e.id)} 
                              className="admin-btn danger small"
                            >
                              מחק
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {/* Show freeze/unfreeze button for all future events */}
                        {(() => {
                          const now = new Date();
                          const eventEnd = new Date(e.endDate);
                          return eventEnd > now;
                        })() && (
                          <button 
                            onClick={() => toggleFreeze(e.id, e.status === 'frozen')}
                            className={`admin-btn ${e.status === 'frozen' ? 'warning' : 'secondary'} small`}
                          >
                            {e.status === 'frozen' ? 'הפשר' : 'הקפא'}
                          </button>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${e.status} ${e.status === 'frozen' ? 'frozen' : ''}`}>
                          {e.status === 'frozen' ? 'קפוא' : getStatusInHebrew(e.status)}
                        </span>
                      </td>
                      <td>
                        {editingEvent === e.id && editForm ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <input 
                              type="number"
                              value={editForm.worker_limit}
                              onChange={(ev) => setEditForm({...editForm, worker_limit: Number(ev.target.value)})}
                              className="admin-field-input small"
                              placeholder="עובדים"
                            />
                            <input 
                              type="number"
                              value={editForm.hourlyRate}
                                onChange={(ev) => setEditForm({...editForm, hourlyRate: Number(ev.target.value)})}
                              className="admin-field-input small"
                              placeholder="מחיר לשעה"
                            />
                          </div>
                        ) : (
                          <div>
                            {`${e.signups_count}/${e.worker_limit}`}
                            <br />
                            <small>{e.hourlyRate}₪ לשעה</small>
                          </div>
                        )}
                      </td>
                      <td>
                        {editingEvent === e.id && editForm ? (
                          <div className="edit-datetime">
                            <div className="edit-date-row">
                              <input 
                                type="date"
                                value={editForm.startDate}
                                onChange={(ev) => setEditForm({...editForm, startDate: ev.target.value})}
                                className="admin-field-input small"
                              />
                              <span>עד</span>
                              <input 
                                type="date"
                                value={editForm.endDate}
                                onChange={(ev) => setEditForm({...editForm, endDate: ev.target.value})}
                                className="admin-field-input small"
                              />
                            </div>
                            <div className="edit-time-row">
                              <input 
                                type="time"
                                value={editForm.startTime}
                                onChange={(ev) => setEditForm({...editForm, startTime: ev.target.value})}
                                className="admin-field-input small"
                              />
                              <span>עד</span>
                              <input 
                                type="time"
                                value={editForm.endTime}
                                onChange={(ev) => setEditForm({...editForm, endTime: ev.target.value})}
                                className="admin-field-input small"
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{whiteSpace: 'pre-line'}}>
                            {formatDateRangeDisplay(e.startDate, e.endDate)}
                            {'\n'}
                            {formatTimeRangeDisplay(e.startTime, e.endTime)}
                          </div>
                        )}
                      </td>
                      <td>{e.hourlyRate} ש"ח </td>
                      <td>{e.name}</td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{textAlign: 'center', padding: '32px', color: '#9CA3AF'}}>
                        אין אירועים להצגה
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }
