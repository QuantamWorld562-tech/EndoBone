import { useState } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  Send,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Activity,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Mail
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';

export default function SupportModal() {
  const { isSupportModalOpen, setIsSupportModalOpen } = usePatientContext();

  const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'contact' | 'faq'
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState('normal');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isSupportModalOpen) return null;

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTicketSubject('');
      setTicketMessage('');
      setTimeout(() => setSubmittedSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Clinical Support &amp; Knowledge Base
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Endocrine reference guidelines, AI risk synthesis documentation, and direct technical support.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSupportModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close Support"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={14} /> Clinical Reference Guide
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'contact'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={14} /> Submit Support Request
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'faq'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={14} /> AI Decision Engine FAQs
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: Clinical Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-4 text-xs text-teal-900 flex items-start gap-3">
                <FlaskConical size={18} className="text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">Endocrine Biomarker Diagnostic Standards</span>
                  <span className="text-teal-800/90 leading-relaxed">
                    EndoBone AI links biochemical turnover kinetics with quantitative 3D CT cortical thickness values to estimate pre-operative screw loosening and subsidence risk.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Parathyroid Hormone (PTH)</div>
                  <div className="text-[11px] font-mono text-blue-600 font-semibold mt-0.5">Range: 15.0 – 65.0 pg/mL</div>
                  <p className="text-slate-500 mt-1.5 text-[11px] leading-relaxed">
                    Elevated PTH indicates secondary hyperparathyroidism or high bone resorption, reducing trabecular density in proximal femur.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">25-OH Vitamin D</div>
                  <div className="text-[11px] font-mono text-blue-600 font-semibold mt-0.5">Range: 30.0 – 100.0 ng/mL</div>
                  <p className="text-slate-500 mt-1.5 text-[11px] leading-relaxed">
                    Deficiency (&lt; 20 ng/mL) impairs calcium absorption and impairs secondary bone mineralization during implant osseointegration.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Total Serum Calcium</div>
                  <div className="text-[11px] font-mono text-blue-600 font-semibold mt-0.5">Range: 8.6 – 10.3 mg/dL</div>
                  <p className="text-slate-500 mt-1.5 text-[11px] leading-relaxed">
                    Hypocalcemia triggers compensatory parathyroid hormone release, exacerbating structural osteoporosis.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">C-Telopeptide (CTX-I)</div>
                  <div className="text-[11px] font-mono text-blue-600 font-semibold mt-0.5">Range: &lt; 300 pg/mL</div>
                  <p className="text-slate-500 mt-1.5 text-[11px] leading-relaxed">
                    Direct biochemical marker of active osteoclastic bone resorption and osteopenia progression rate.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Submit Support Ticket */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              {submittedSuccess ? (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center space-y-2 animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Request Submitted Successfully</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Ticket #EB-{Math.floor(100000 + Math.random() * 900000)} has been logged with the EndoBone Clinical Informatics Team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Subject / Issue Topic</label>
                      <input
                        type="text"
                        required
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="e.g. 3D Model Rendering or Biomarker Scale Query"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Priority Level</label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="low">Low (General Inquiry)</option>
                        <option value="normal">Normal (Workflow Question)</option>
                        <option value="high">High (Urgent Pre-Op Planning)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Detailed Description</label>
                    <textarea
                      required
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe clinical inquiry, anomaly, or software feedback in detail..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400 font-medium">
                      Direct Email: <a href="mailto:support@endobone.ai" className="text-teal-600 font-bold underline">support@endobone.ai</a>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Send size={13} />
                      <span>{isSubmitting ? 'Sending Request...' : 'Submit Request'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">How is the Volumetric BMD (vBMD) Computed?</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  vBMD is synthesized by cross-referencing patient DEXA T-scores with local HU (Hounsfield Units) attenuation values extracted from CT DICOM slice stacks.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Does the AI Assessment Replace Clinical Judgement?</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  No. EndoBone AI is a Clinical Decision Support System (CDSS) intended to augment pre-operative surgical assessment. Final operative decisions rest with the attending surgeon.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">How do I export the Pre-Surgical Summary to PDF?</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Navigate to Pre-Surgical Summary and click &quot;Export PDF&quot;. The interface triggers a print stylesheet optimized for formal clinical medical records.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={() => setIsSupportModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
