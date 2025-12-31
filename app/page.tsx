'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, List, Plus, Clock, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

// --- CẤU HÌNH ---
// Thay CLIENT ID của bạn vào đây
const GOOGLE_CLIENT_ID = "368805619566-inobhf1at6k946jtdgnd2t4vd93l1210.apps.googleusercontent.com"; 

// --- TYPE DEFINITIONS ---
type EventType = 'work' | 'personal' | 'health';
interface MyEvent {
  id: string; // ID dạng chuỗi để tương thích Google
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: EventType;
}

// --- COMPONENT LOGIN GOOGLE (Đã nâng cấp để trả về Token) ---
const GoogleCalendarManager = ({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) => {
  const login = useGoogleLogin({
    // QUAN TRỌNG: Đổi scope để xin quyền GHI (Thêm/Sửa/Xóa)
    scope: 'https://www.googleapis.com/auth/calendar', 
    onSuccess: (tokenResponse) => {
      onLoginSuccess(tokenResponse.access_token);
    },
    onError: error => console.log('Login Failed:', error)
  });

  return (
    <button 
      onClick={() => login()}
      className="google-btn"
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', 
        justifyContent: 'center', padding: '10px', background: '#fff', 
        border: '1px solid #ddd', borderRadius: 10, fontWeight: 700, 
        color: '#4b5563', marginBottom: 15, cursor: 'pointer'
      }}
    >
      <RefreshCw size={16} /> Kết nối Google Calendar
    </button>
  );
};

// --- MAIN WRAPPER ---
export default function CalendarAppWrapper() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CalendarApp />
    </GoogleOAuthProvider>
  );
}

function CalendarApp() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'month' | 'schedule'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // State cho Google Token
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<EventType>('work');

  // --- 1. LOCAL STORAGE LOGIC ---
  useEffect(() => {
    const savedData = localStorage.getItem('my-calendar-data');
    if (savedData) setEvents(JSON.parse(savedData));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('my-calendar-data', JSON.stringify(events));
  }, [events, isLoaded]);

  // --- 2. GOOGLE LOGIC ---
  
  // Khi đăng nhập thành công
  const handleGoogleLoginSuccess = async (token: string) => {
    setGoogleToken(token); // Lưu token để dùng cho việc ADD sau này
    
    // Gọi API lấy lịch về luôn để đồng bộ
    try {
      const res = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeMin: new Date().toISOString(), maxResults: 50, singleEvents: true, orderBy: 'startTime' },
      });

      const googleEvents = res.data.items.map((item: any) => {
        const start = item.start.dateTime || item.start.date;
        const dateObj = new Date(start);
        return {
          id: item.id,
          title: item.summary || '(Không tiêu đề)',
          date: dateObj.toISOString().split('T')[0],
          time: item.start.dateTime ? dateObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'Cả ngày',
          type: 'work',
        };
      });

      setEvents(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newEvents = googleEvents.filter((e: MyEvent) => !existingIds.has(e.id));
        return [...prev, ...newEvents];
      });
      
      alert('Đã kết nối và đồng bộ lịch từ Google!');
    } catch (error) {
      console.error(error);
      alert('Lỗi khi lấy dữ liệu Google');
    }
  };

  // --- 3. ADD EVENT LOGIC (SỬA ĐỔI LỚN) ---
  const handleSaveEvent = async () => {
    if (!formTitle) return alert('Vui lòng nhập nội dung!');

    // 1. Tạo object sự kiện cho App Local
    const tempId = Date.now().toString(); // ID tạm
    const newLocalEvent: MyEvent = {
      id: tempId,
      title: formTitle,
      date: selectedDateStr,
      time: formTime,
      type: formType,
    };

    // 2. Lưu vào Local ngay lập tức (cho nhanh)
    setEvents(prev => [...prev, newLocalEvent]);
    setIsModalOpen(false); // Đóng modal luôn cho mượt
    setFormTitle(''); // Reset form

    // 3. Nếu đã đăng nhập Google -> Đẩy lên Google Calendar
    if (googleToken) {
      try {
        // Tính toán thời gian bắt đầu và kết thúc (mặc định sự kiện dài 1 tiếng)
        // Format ISO: 2025-01-01T09:00:00+07:00
        const startDateTime = new Date(`${selectedDateStr}T${formTime}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 tiếng

        const googlePayload = {
          summary: formTitle,
          description: `Được tạo từ App Lịch Của Tôi (${formType === 'work' ? 'Công việc' : formType === 'health' ? 'Sức khỏe' : 'Cá nhân'})`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Lấy múi giờ hiện tại của máy
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          // Tô màu sự kiện trên Google (Opsional)
          colorId: formType === 'personal' ? '11' : formType === 'health' ? '10' : '9' 
        };

        const res = await axios.post(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          googlePayload,
          { headers: { Authorization: `Bearer ${googleToken}` } }
        );

        // (Tùy chọn) Cập nhật lại ID trong local bằng ID thật của Google trả về
        // Để sau này xóa/sửa dễ hơn. 
        console.log("Đã lưu lên Google thành công!", res.data);
        
      } catch (error) {
        console.error("Lỗi khi lưu lên Google:", error);
        alert("Đã lưu vào máy, nhưng Lỗi khi đẩy lên Google (Có thể token hết hạn). Hãy kết nối lại.");
      }
    }
  };

  const handleDeleteEvent = (id: string) => {
    if(confirm('Bạn có chắc muốn xóa lịch này (Chỉ xóa trên App, không xóa trên Google)?')) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  // --- RENDER HELPERS ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDateStr;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      const dailyEvents = events.filter(e => e.date === dateStr);
      const hasEvent = dailyEvents.length > 0;
      let typeClass = hasEvent ? `type-${dailyEvents[0].type}` : '';
      
      // @ts-ignore
      const lunarDate = Lunar.fromDate(new Date(year, month, day));

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDateStr(dateStr)}
          className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${typeClass}`}
        >
          <span className="solar">{day}</span>
          <span className="lunar">{lunarDate.getDay()}/{lunarDate.getMonth()}</span>
        </div>
      );
    }
    return days;
  };

  const filteredEvents = events.filter(e => e.date === selectedDateStr);

  if (!isLoaded) return null;

  return (
    <div className="app-container">
      <header className="app-header"><h1>Lịch Của Tôi</h1></header>

      <div className="content-wrapper">
        {/* Nút Kết nối Google */}
        {!googleToken ? (
          <GoogleCalendarManager onLoginSuccess={handleGoogleLoginSuccess} />
        ) : (
          <div style={{padding: 10, background: '#dcfce7', color:'#166534', borderRadius:10, marginBottom:15, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:5}}>
            <CheckCircle size={16}/> Đã kết nối Google (Chế độ Ghi)
          </div>
        )}

        <div className="tab-nav">
          <button className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`} onClick={() => setActiveTab('month')}>
            <Calendar size={18} /> Lịch tháng
          </button>
          <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            <List size={18} /> Lịch trình
          </button>
        </div>

        {activeTab === 'month' && (
          <div className="tab-content animate-fade">
            <div className="card">
              <div className="calendar-header">
                <h3>Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</h3>
                <div style={{display:'flex', gap:5}}>
                  <button onClick={handlePrevMonth}><ChevronLeft size={18}/></button>
                  <button onClick={handleNextMonth}><ChevronRight size={18}/></button>
                </div>
              </div>
              <div className="week-days"><span>CN</span><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span></div>
              <div className="days-grid">{renderCalendarGrid()}</div>
            </div>

            <div>
              <h4 style={{fontSize:14, fontWeight:600, color:'#6b7280', marginBottom:10}}>
                Chi tiết ngày {selectedDateStr.split('-').reverse().join('/')}:
              </h4>
              {filteredEvents.length > 0 ? (
                filteredEvents.map(evt => (
                  <EventItem key={evt.id} evt={evt} onDelete={() => handleDeleteEvent(evt.id)} />
                ))
              ) : (
                <div style={{textAlign:'center', padding:20, color:'#9ca3af', fontStyle:'italic', border:'1px dashed #e5e7eb', borderRadius:12}}>
                  Không có lịch trình
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="tab-content animate-fade">
            <div className="card">
              <label style={{display:'block',marginBottom:8,fontWeight:600,fontSize:13}}>Chọn ngày:</label>
              <input type="date" className="form-control" style={{marginBottom:0}} value={selectedDateStr} onChange={(e) => setSelectedDateStr(e.target.value)} />
            </div>
             {filteredEvents.map(evt => (
                <EventItem key={evt.id} evt={evt} onDelete={() => handleDeleteEvent(evt.id)} />
              ))}
              {filteredEvents.length === 0 && <div style={{textAlign:'center', padding:20, color:'#9ca3af'}}>Ngày này rảnh rỗi</div>}
          </div>
        )}
      </div>

      <button className="fab-btn" onClick={() => setIsModalOpen(true)}><Plus size={28} /></button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{fontSize:18, fontWeight:700, marginBottom:20}}>Thêm Lịch Mới</h3>
            
            <label style={{fontSize:12, fontWeight:700, color:'#6b7280', display:'block', marginBottom:5}}>NỘI DUNG</label>
            <input autoFocus type="text" className="form-control" placeholder="Ví dụ: Họp team..." value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />

            <div style={{display:'flex', gap:10}}>
              <div style={{flex:1}}>
                <label style={{fontSize:12, fontWeight:700, color:'#6b7280', display:'block', marginBottom:5}}>NGÀY</label>
                <input type="date" className="form-control" value={selectedDateStr} onChange={(e) => setSelectedDateStr(e.target.value)} />
              </div>
              <div style={{width:'35%'}}>
                <label style={{fontSize:12, fontWeight:700, color:'#6b7280', display:'block', marginBottom:5}}>GIỜ</label>
                <input type="time" className="form-control" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
            </div>

            <label style={{fontSize:12, fontWeight:700, color:'#6b7280', display:'block', marginBottom:5}}>PHÂN LOẠI</label>
            <div className="type-selector">
              <button className={`work ${formType === 'work' ? 'selected' : ''}`} onClick={() => setFormType('work')}>Công Việc</button>
              <button className={`health ${formType === 'health' ? 'selected' : ''}`} onClick={() => setFormType('health')}>Sức Khoẻ</button>
              <button className={`personal ${formType === 'personal' ? 'selected' : ''}`} onClick={() => setFormType('personal')}>Cá Nhân</button>
            </div>
            
            {/* Chú thích nhỏ để người dùng biết */}
            {googleToken && <div style={{fontSize:11, color:'#166534', marginBottom:15, textAlign:'center'}}>* Sự kiện sẽ được đồng bộ lên Google Calendar</div>}

            <div className="modal-actions">
              <button className="cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="save" onClick={handleSaveEvent}>Lưu Lịch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const EventItem = ({ evt, onDelete }: { evt: MyEvent, onDelete: () => void }) => {
  return (
    <div className="event-item">
      <div style={{flex:1}}>
        <h4>{evt.title}</h4>
        <div className="time"><Clock size={12}/> {evt.time}</div>
      </div>
      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
        <span className={`tag ${evt.type}`}>
          {evt.type === 'work' ? 'Công Việc' : evt.type === 'health' ? 'Sức Khoẻ' : 'Cá Nhân'}
        </span>
        <button onClick={onDelete} style={{border:'none', background:'none', color:'#ef4444', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:3}}>
          <Trash2 size={14}/> Xóa
        </button>
      </div>
    </div>
  );
};