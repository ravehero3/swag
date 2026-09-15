import React, { useState } from 'react';
import { Close, Plus, FileText, Share2, Edit3 } from 'lucide-react';

type JourneyDetail = {
  journey: { id: number; name: string };
  steps: any[];
};

type Template = { id: number; name: string; subject: string; preheader: string; blocks: any[] };

type Props = {
  detail: JourneyDetail | null;
  templates: Template[];
  openStepForm: (step?: any, insertIdx?: number) => void;
  addStepAtIdx: (insertIdx: number, delayDays: number) => void;
  onClose: () => void;
};

export const JourneyEmailModal: React.FC<Props> = ({ detail, templates, openStepForm, addStepAtIdx, onClose }) => {
  const [scheduleDays, setScheduleDays] = useState(0);

  if (!detail) return null;

  const firstStep = detail.steps[0];
  const firstTemplate = templates.find(t => t.id === firstStep?.template_id);
  const secondStep = detail.steps[1];
  const secondTemplate = templates.find(t => t.id === secondStep?.template_id);

  const renderTemplatePreview = (tpl: Template | undefined) => (
    <div style={{ padding: '12px', background: '#111', borderRadius: '6px', border: '1px solid #333' }}>
      <div style={{ fontWeight: 600, color: '#eee', marginBottom: '4px' }}>{tpl?.subject || 'No subject'}</div>
      <div style={{ color: '#aaa', fontSize: '12px' }}>{tpl?.preheader || 'No preheader'}</div>
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        marginTop: '24px',
        padding: '24px',
        background: 'rgba(20,20,20,0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        color: '#fff',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'none',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
        }}
        aria-label="Close modal"
      >
        <Close size={18} />
      </button>

      <h3 style={{ marginBottom: '16px' }}>Journey: {detail.journey.name}</h3>

      {/* First email container */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: '#0B99FC' }}>First email</span>
          <button
            onClick={() => openStepForm(firstStep)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0B99FC',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>
        {renderTemplatePreview(firstTemplate)}
      </div>

      {/* Info bubble */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#ccc',
          marginBottom: '12px',
        }}
      >
        This email is the first message that will be sent when the journey is triggered.
      </div>

      {/* Connector line */}
      <div style={{ width: '2px', height: '40px', background: '#444', margin: '0 auto' }} />

      {/* Second container */}
      <div style={{ marginTop: '12px' }}>
        {secondStep ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#0B99FC' }}>Next email</span>
              <button
                onClick={() => openStepForm(secondStep)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0B99FC',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            </div>
            {renderTemplatePreview(secondTemplate)}
          </div>
        ) : (
          <div
            style={{
              padding: '20px',
              border: '2px dashed #555',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#777',
              cursor: 'pointer',
            }}
            onClick={() => addStepAtIdx(1, scheduleDays)}
          >
            <Plus size={24} style={{ marginBottom: '8px' }} />
            <div>Add next email step</div>
          </div>
        )}
      </div>

      {/* Schedule selector */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label htmlFor="schedule" style={{ color: '#ccc' }}>
          Send in
        </label>
        <select
          id="schedule"
          value={scheduleDays}
          onChange={e => setScheduleDays(parseInt(e.target.value))}
          style={{
            background: '#111',
            color: '#eee',
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '4px 8px',
          }}
        >
          <option value={0}>0 days (immediate)</option>
          <option value={1}>1 day</option>
          <option value={2}>2 days</option>
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
        </select>
      </div>
    </div>
  );
};
