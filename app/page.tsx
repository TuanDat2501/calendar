'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, List, Plus, Clock } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import './globals.scss';
type EventType = 'work' | 'personal' | 'health';
interface MyEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  type: EventType;
}

export default function CalendarApp() {
  const [activeTab, setActiveTab] = useState<'month' | 'schedule'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dữ liệu mẫu (Đủ 3 loại để test màu)
  const [events, setEvents] = useState<MyEvent[]>([
    { id: 1, title: 'Họp Team', date: '2025-01-05', time: '09:00', type: 'work' },
    { id: 2, title: 'Đá bóng', date: '2025-01-06', time: '17:30', type: 'health' },
    { id: 3, title: 'Đi nhậu', date: '2025-01-08', time: '19:00', type: 'personal' },
    { id: 4, title: 'Deadline dự án', date: '2025-01-05', time: '14:00', type: 'work' }, // Ngày 05 có 2 sự kiện
  ]);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<EventType>('work');

  // Logic Helper
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleSaveEvent = () => {
    if (!formTitle) return alert('Nhập nội dung đi bạn!');
    const newEvent: MyEvent = {
      id: Date.now(),
      title: formTitle,
      date: selectedDateStr,
      time: formTime,
      type: formType,
    };
    setEvents([...events, newEvent]);
    setIsModalOpen(false);
    setFormTitle('');
  };

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

    // Các ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDateStr;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      // Tìm sự kiện trong ngày này
      const dailyEvents = events.filter(e => e.date === dateStr);
      const hasEvent = dailyEvents.length > 0;
      
      // Xác định loại sự kiện để tô màu chấm (Lấy loại của sự kiện đầu tiên nếu có nhiều cái)
      let typeClass = '';
      if (hasEvent) {
        typeClass = `type-${dailyEvents[0].type}`; 
      }
      
      const lunarDate = Lunar.fromDate(new Date(year, month, day));

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDateStr(dateStr)}
          className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''} ${typeClass}`}
        >
          <span className="solar">{day}</span>
          <span className="lunar">{lunarDate.getDay()}/{lunarDate.getMonth()}</span>
          {/* Dấu chấm sẽ tự đổi màu nhờ class typeClass */}
          <div className="dot"></div>
        </div>
      );
    }
    return days;
  };

  const filteredEvents = events.filter(e => e.date === selectedDateStr);

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
                  <div key={evt.id} className="event-item">
                    <div>
                      <h4>{evt.title}</h4>
                      <div className="time"><Clock size={12}/> {evt.time}</div>
                    </div>
                    <span className={`tag ${evt.type}`}>
                      {evt.type === 'work' ? 'Công Việc' : evt.type === 'health' ? 'Sức Khoẻ' : 'Cá Nhân'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{textAlign:'center', padding:20, color:'#9ca3af', fontStyle:'italic', border:'1px dashed #e5e7eb', borderRadius:12}}>
                  Chưa có lịch trình
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="tab-content animate-fade">
            <div className="card">
              <label style={{display:'block',marginBottom:8,fontWeight:600,fontSize:13}}>Chọn ngày:</label>
              <input type="date" className="form-control" style={{marginBottom:0}} 
                value={selectedDateStr} onChange={(e) => setSelectedDateStr(e.target.value)} />
            </div>
             {filteredEvents.map(evt => (
                <div key={evt.id} className="event-item">
                  <div>
                    <h4>{evt.title}</h4>
                    <div className="time"><Clock size={12}/> {evt.time}</div>
                  </div>
                  <span className={`tag ${evt.type}`}>
                    {evt.type === 'work' ? 'Công Việc' : evt.type === 'health' ? 'Sức Khoẻ' : 'Cá Nhân'}
                  </span>
                </div>
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