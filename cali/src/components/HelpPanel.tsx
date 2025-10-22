import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import styles from './HelpPanel.module.css';

interface Props {
  formData: any;
  setFormData: (data: any) => void;
}

export function HelpPanel({ formData, setFormData }: Props) {
  const [selectedField, setSelectedField] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [helpText, setHelpText] = useState<string>('Click a form field to get help.');

  useEffect(() => {
    const handleFocus = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.name) {
        setSelectedField(target);
        fetchExplanation(target.dataset.label || '');
      }
    };
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  async function fetchExplanation(label: string) {
    if (!label) return;
    setHelpText('Loading help...');
    const res = await fetch('http://localhost:3000/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
    const data = await res.json();
    setHelpText(data.explanation);
  }

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = function (event: any) {
      const transcript = event.results[0][0].transcript;
      if (selectedField?.name) {
        setFormData({ ...formData, [selectedField.name]: transcript });
      }
    };
  };

  return (
    <Card className={`mt-4 p-3 ${styles.panel}`}>
      <strong>Field Help:</strong>
      <p>{helpText}</p>
      <Button variant="outline-secondary" onClick={startDictation} disabled={!selectedField}>
        Speak Your Answer
      </Button>
    </Card>
  );
}
