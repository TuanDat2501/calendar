'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, List, Plus, Clock, Trash2 } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import './globals.scss';
// --- TYPE DEFINITIONS ---
type EventType = 'work' | 'personal' | 'health';
interface MyEvent {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: EventType;
}

export default function CalendarApp() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'month' | 'schedule'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dữ liệu ban đầu rỗng, sẽ được nạp từ LocalStorage sau
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // Cờ kiểm tra đã load xong chưa

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<EventType>('work');

  // --- 1. LOGIC LƯU TRỮ (LOCAL STORAGE) ---
  
  // Load dữ liệu khi App vừa mở
  useEffect(() => {
    const savedData = localStorage.getItem('my-calendar-data');
    if (savedData) {
      setEvents(JSON.parse(savedData));
    } else {
      // Nếu chưa có dữ liệu (lần đầu dùng), tạo vài data mẫu
      const mockData: MyEvent[] = [
        { id: 1, title: 'Cài đặt App thành công', date: new Date().toISOString().split('T')[0], time: '08:00', type: 'work' }
      ];
      setEvents(mockData);
    }
    setIsLoaded(true);
  }, []);

  // Tự động Lưu mỗi khi biến 'events' thay đổi
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('my-calendar-data', JSON.stringify(events));
    }
  }, [events, isLoaded]);


  // --- 2. LOGIC LỊCH ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleSaveEvent = () => {
    if (!formTitle) return alert('Vui lòng nhập nội dung!');
    const newEvent: MyEvent = {
      id: Date.now(),
      title: formTitle,
      date: selectedDateStr,
      time: formTime,
      type: formType,
    };
    
    // Thêm vào đầu danh sách
    setEvents(prev => [...prev, newEvent]);
    
    // Reset & Đóng modal
    setIsModalOpen(false);
    setFormTitle('');
  };

  const handleDeleteEvent = (id: number) => {
    if(confirm('Bạn có chắc muốn xóa lịch này?')) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  // --- 3. RENDER UI ---
  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Ô trống đầu tháng
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
    }

    // Render ngày
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDateStr;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      const dailyEvents = events.filter(e => e.date === dateStr);
      const hasEvent = dailyEvents.length > 0;
      
      // Lấy màu của sự kiện đầu tiên để tô nền
      let typeClass = '';
      if (hasEvent) typeClass = `type-${dailyEvents[0].type}`;
      
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

  // Lọc sự kiện cho ngày đang chọn
  const filteredEvents = events.filter(e => e.date === selectedDateStr);

  // Nếu chưa load xong dữ liệu thì chưa hiển thị gì để tránh giật
  if (!isLoaded) return null;

  return (
    <div className="app-container">
      <header className="app-header"><h1>Lịch Của Tôi</h1></header>

      <div className="content-wrapper">
        <div className="tab-nav">
          <button className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`} onClick={() => setActiveTab('month')}>
            <Calendar size={18} /> Lịch tháng
          </button>
          <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            <List size={18} /> Lịch trình
          </button>
        </div>

        {/* --- TAB THÁNG --- */}
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
              <div className="week-days">
                <span>CN</span><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span>
              </div>
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

        {/* --- TAB LỊCH TRÌNH --- */}
        {activeTab === 'schedule' && (
          <div className="tab-content animate-fade">
            <div className="card">
              <label style={{display:'block',marginBottom:8,fontWeight:600,fontSize:13}}>Chọn ngày:</label>
              <input type="date" className="form-control" style={{marginBottom:0}} 
                value={selectedDateStr} onChange={(e) => setSelectedDateStr(e.target.value)} />
            </div>
             {filteredEvents.map(evt => (
                <EventItem key={evt.id} evt={evt} onDelete={() => handleDeleteEvent(evt.id)} />
              ))}
              {filteredEvents.length === 0 && <div style={{textAlign:'center', padding:20, color:'#9ca3af'}}>Ngày này rảnh rỗi</div>}
          </div>
        )}
      </div>

      <button className="fab-btn" onClick={() => setIsModalOpen(true)}><Plus size={28} /></button>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{fontSize:18, fontWeight:700, marginBottom:20}}>Thêm Lịch Mới</h3>
            
            <label style={{fontSize:12, fontWeight:700, color:'#6b7280', display:'block', marginBottom:5}}>NỘI DUNG</label>
            <input autoFocus type="text" className="form-control" placeholder="Ví dụ: Đi chạy bộ..." 
              value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />

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

// Component con hiển thị 1 dòng (Đã tách ra cho gọn)
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
        {/* Nút xóa nhỏ */}
        <button onClick={onDelete} style={{border:'none', background:'none', color:'#ef4444', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:3}}>
          <Trash2 size={14}/> Xóa
        </button>
      </div>
    </div>
  );
};