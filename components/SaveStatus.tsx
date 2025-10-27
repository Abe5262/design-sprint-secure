import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Clock } from './lucide-react';

const SaveStatus: React.FC = () => {
  const { lastSaved, language } = useAppContext();
  const [, setTick] = useState(0);

  // Update display every 5 seconds
  useEffect(() => {
    if (!lastSaved) return;

    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (!lastSaved) return null;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) {
      return language === 'ko' ? '방금 저장됨' :
             language === 'am' ? 'አሁን ተቀምጧል' :
             'Just saved';
    } else if (diffInSeconds < 60) {
      return language === 'ko' ? `${diffInSeconds}초 전` :
             language === 'am' ? `ከ${diffInSeconds} ሰከንዶች በፊት` :
             `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return language === 'ko' ? `${minutes}분 전` :
             language === 'am' ? `ከ${minutes} ደቂቃዎች በፊት` :
             `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return language === 'ko' ? `${hours}시간 전` :
             language === 'am' ? `ከ${hours} ሰዓቶች በፊት` :
             `${hours}h ago`;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="w-4 h-4" />
      <span>{formatTime(lastSaved)}</span>
    </div>
  );
};

export default SaveStatus;
