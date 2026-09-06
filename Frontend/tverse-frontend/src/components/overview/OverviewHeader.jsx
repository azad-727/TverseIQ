import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import './OverviewHeader.css';

export function OverviewHeader() {
  const [showDate, setShowDate] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedDate, setSelectedDate] = useState('This Month');
  const [selectedCompare, setSelectedCompare] = useState('Previous Period');

  const dateRef = useRef();
  const compareRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dateRef.current && !dateRef.current.contains(event.target)) setShowDate(false);
      if (compareRef.current && !compareRef.current.contains(event.target)) setShowCompare(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dateOptions = ['Today', 'This Week', 'This Month', 'Last 30 Days', 'This Year'];
  const compareOptions = ['Previous Period', 'Previous Year', 'Custom Range', 'No Comparison'];

  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="overview-header">
      <div className="overview-header-left">
        <h1 className="overview-greeting">
          Dashboard <span className="title-dot"></span>
        </h1>
        <p className="overview-date" style={{ fontSize: '15px', fontWeight: '500' }}>{date}</p>
      </div>
      <div className="overview-header-right">
        
        <div className="dropdown-container" ref={dateRef}>
          <button className="overview-btn-primary" onClick={() => setShowDate(!showDate)}>
            <Calendar size={16} />
            {selectedDate}
          </button>
          {showDate && (
            <div className="dropdown-menu">
              {dateOptions.map(opt => (
                <div key={opt} className={`dropdown-item ${selectedDate === opt ? 'active' : ''}`} onClick={() => { setSelectedDate(opt); setShowDate(false); }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dropdown-container" ref={compareRef}>
          <button className="overview-btn-secondary" onClick={() => setShowCompare(!showCompare)}>
            Compare: {selectedCompare.split(' ')[0]}
            <ChevronDown size={16} />
          </button>
          {showCompare && (
            <div className="dropdown-menu">
              {compareOptions.map(opt => (
                <div key={opt} className={`dropdown-item ${selectedCompare === opt ? 'active' : ''}`} onClick={() => { setSelectedCompare(opt); setShowCompare(false); }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
