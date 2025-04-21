import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Crosshair, MessageSquare, X } from 'lucide-react';

interface VisualFeedbackSelectorProps {
  onFeedbackSelected: (feedback: {
    type: 'screenshot' | 'area' | 'point';
    position?: { x: number; y: number; width?: number; height?: number };
    screenshot?: string;
    comment?: string;
  }) => void;
  containerRef: React.RefObject<HTMLElement>;
}

const VisualFeedbackSelector: React.FC<VisualFeedbackSelectorProps> = ({ 
  onFeedbackSelected,
  containerRef 
}) => {
  const [activeTab, setActiveTab] = useState<string>('screenshot');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
  const [comment, setComment] = useState('');
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset selection when tab changes
  useEffect(() => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [activeTab]);

  // Handle screenshot capture
  const captureScreenshot = async () => {
    if (!containerRef.current) return;
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create canvas context');
      
      // Set canvas dimensions to match container
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Draw container content to canvas
      // Note: This will only work for same-origin content
      try {
        // If the container has an iframe, try to capture its content
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
          context.drawImage(iframe, 0, 0, rect.width, rect.height);
        } else {
          // Otherwise, try to capture the container itself
          // This uses html2canvas which would need to be imported
          if (typeof html2canvas !== 'undefined') {
            const canvas = await html2canvas(containerRef.current, {
              allowTaint: true,
              useCORS: true
            });
            return canvas.toDataURL('image/png');
          }
        }
        
        return canvas.toDataURL('image/png');
      } catch (error) {
        console.error('Error capturing screenshot:', error);
        // Return a placeholder image or null
        return null;
      }
    } catch (error) {
      console.error('Error setting up screenshot capture:', error);
      return null;
    }
  };

  const handleScreenshotCapture = async () => {
    const screenshot = await captureScreenshot();
    onFeedbackSelected({
      type: 'screenshot',
      screenshot,
      comment
    });
    setComment('');
  };

  // Handle area selection
  const startAreaSelection = () => {
    setIsSelecting(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setSelectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionStart || !selectionEnd) return;
    
    // Calculate selection dimensions
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    // Minimum size check
    if (width < 10 || height < 10) {
      // Treat as a point selection instead
      onFeedbackSelected({
        type: 'point',
        position: { x: selectionStart.x, y: selectionStart.y },
        comment
      });
    } else {
      onFeedbackSelected({
        type: 'area',
        position: { x, y, width, height },
        comment
      });
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setComment('');
  };

  // Calculate selection box style
  const getSelectionBoxStyle = () => {
    if (!selectionStart || !selectionEnd) return { display: 'none' };
    
    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      display: 'block'
    };
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-md">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2