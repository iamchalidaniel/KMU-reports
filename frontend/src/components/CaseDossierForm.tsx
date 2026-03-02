"use client";

import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { API_BASE_URL } from '../config/constants';
import { authHeaders } from '../utils/api';
import SmartStudentSearch from './SmartStudentSearch';
import Notification, { useNotification } from './Notification';
import ConfirmDialog from './ConfirmDialog';

interface Particulars {
    name: string; address: string; phone: string; yearOfStudy: string; programOfStudy: string;
    sex: string; age: string; nationality: string; tribe: string; village: string; chief: string; district: string;
    sin: string;
}

interface OccurrenceDocket {
    investigatingOfficer: string;
    occurrenceBookNumber: string;
    dateTimeReported: string;
    complainant: Particulars;
    accused: Particulars;
    offence: string;
    occurrenceDetails: string;
    damagedValue: string;
    recoveredValue: string;
    disposalManner: string;
}

interface Statement {
    id: number;
    fullName: string;
    content: string;
    takenAt: string;
    phone: string;
    residentialAddress: string;
    tribe: string;
    village: string;
    active: boolean;
    audioUrl: string;
    sin?: string;
    signature?: string | null;
}

interface WarnAndCaution {
    fullName: string; sex: string; tribe: string; age: string; address: string; village: string;
    chief: string; district: string; program: string; occupation: string; sin: string; phone: string;
    takenAt: string; place: string; offence: string; occurrenceDate: string; occurrenceTime: string;
    occurrencePlace: string; signature: string;
}

export interface CaseDossier {
    occurrenceDocket: OccurrenceDocket;
    statements: Statement[];
    warnAndCaution: WarnAndCaution;
    signatures: {
        investigatingOfficer?: string | null;
        complainant?: string | null;
    };
}

export interface FormData {
    case_number: string;
    case_type: string;
    dossier: CaseDossier;
}

interface CaseDossierFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Partial<FormData>;
}

export default function CaseDossierForm({ onSuccess, onCancel, initialData }: CaseDossierFormProps) {
    const { notification, showNotification, hideNotification } = useNotification();
    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Helpers
    const generateCaseNumber = () => {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `KMU/SEC/${year}/${rand}`;
    };

    // Form State
    const [formData, setFormData] = useState<FormData>({
        case_number: '',
        case_type: 'single_student',
        dossier: {
            occurrenceDocket: {
                investigatingOfficer: '',
                occurrenceBookNumber: '',
                dateTimeReported: new Date().toISOString().slice(0, 16),
                complainant: {
                    name: '', address: '', phone: '', yearOfStudy: '', programOfStudy: '',
                    sex: '', age: '', nationality: '', tribe: '', village: '', chief: '', district: '', sin: ''
                },
                accused: {
                    name: '', address: '', phone: '', yearOfStudy: '', programOfStudy: '',
                    sex: '', age: '', nationality: '', tribe: '', village: '', chief: '', district: '', sin: ''
                },
                offence: '',
                occurrenceDetails: '',
                damagedValue: '',
                recoveredValue: '',
                disposalManner: ''
            },
            statements: [],
            warnAndCaution: {
                fullName: '', sex: '', tribe: '', age: '', address: '', village: '',
                chief: '', district: '', program: '', occupation: '', sin: '', phone: '',
                takenAt: '', place: '', offence: '', occurrenceDate: '', occurrenceTime: '',
                occurrencePlace: '', signature: ''
            },
            signatures: {
                investigatingOfficer: null,
                complainant: null
            }
        }
    });

    // Auto-generate Case Number on load if empty
    useEffect(() => {
        if (!formData.case_number && !initialData?.case_number) {
            const num = generateCaseNumber();
            setFormData(prev => ({ ...prev, case_number: num }));
            updateNested('dossier.occurrenceDocket.occurrenceBookNumber', num);
        }
    }, []);

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('kmu_case_draft');
        let baseData = formData;
        if (saved) {
            try { baseData = JSON.parse(saved); } catch (e) { console.error('Failed to load draft', e); }
        }

        if (initialData) {
            const merged = { ...baseData, ...initialData };
            if (initialData.dossier) {
                merged.dossier = { ...baseData.dossier, ...initialData.dossier };
                if (initialData.dossier.occurrenceDocket) {
                    merged.dossier.occurrenceDocket = { ...baseData.dossier.occurrenceDocket, ...initialData.dossier.occurrenceDocket };
                    if (initialData.dossier.occurrenceDocket.accused) {
                        merged.dossier.occurrenceDocket.accused = { ...baseData.dossier.occurrenceDocket.accused, ...initialData.dossier.occurrenceDocket.accused };
                    }
                }
                if (initialData.dossier.warnAndCaution) {
                    merged.dossier.warnAndCaution = { ...baseData.dossier.warnAndCaution, ...initialData.dossier.warnAndCaution };
                }
            }
            setFormData(merged);
        } else if (saved) {
            setFormData(baseData);
        }
    }, [initialData]);

    useEffect(() => {
        localStorage.setItem('kmu_case_draft', JSON.stringify(formData));
    }, [formData]);

    const updateNested = (path: string, value: any) => {
        const keys = path.split('.');
        const newData = { ...formData } as any;
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        setFormData(newData);
    };

    const clearDraft = () => {
        setShowConfirmDiscard(true);
    };

    const confirmClearDraft = () => {
        localStorage.removeItem('kmu_case_draft');
        onCancel();
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    ...formData,
                    ob_number: formData.case_number, // Maintain compatibility with backend field name
                    incident_date: formData.dossier.occurrenceDocket.dateTimeReported.split('T')[0],
                    description: formData.dossier.occurrenceDocket.occurrenceDetails,
                    offense_type: formData.dossier.occurrenceDocket.offence,
                    student_id: formData.dossier.occurrenceDocket.accused.sin || formData.dossier.occurrenceDocket.accused.phone
                })
            });
            if (!res.ok) throw new Error(await res.text());
            localStorage.removeItem('kmu_case_draft');
            onSuccess();
        } catch (err: any) { showNotification('error', `Error: ${err.message}`); } finally { setLoading(false); }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden max-w-5xl mx-auto">
            {/* Header & Progress */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">New Case Report</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">University Disciplinary System • Case Entry</p>
                    </div>
                    <button onClick={clearDraft} className="text-[10px] bg-red-50 dark:bg-red-900/10 text-red-600 px-3 py-1.5 rounded-lg font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition uppercase tracking-widest">Discard Draft</button>
                </div>

                <div className="flex gap-2 h-1.5 w-full mb-3">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className={`${step === 1 ? 'text-red-600' : 'hidden sm:block'}`}>I. Incident Details</span>
                    <span className={`${step === 2 ? 'text-red-600' : 'hidden sm:block'}`}>II. Witness Statements</span>
                    <span className={`${step === 3 ? 'text-red-600' : 'hidden sm:block'}`}>III. Warning and Caution</span>
                    <span className={`${step === 4 ? 'text-red-600' : 'hidden sm:block'}`}>IV. Review & Sign</span>
                    <span className="sm:hidden text-red-600">Step {step}/4</span>
                </div>
            </div>

            <div className="p-4 sm:p-12 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Field label="Investigating Officer" value={formData.dossier.occurrenceDocket.investigatingOfficer} onChange={(v: string) => updateNested('dossier.occurrenceDocket.investigatingOfficer', v)} />
                            <Field label="Case Number (Auto-generated)" value={formData.case_number} onChange={(v: string) => { setFormData({ ...formData, case_number: v }); updateNested('dossier.occurrenceDocket.occurrenceBookNumber', v); }} />
                            <Field label="Date & Time of Incident" type="datetime-local" value={formData.dossier.occurrenceDocket.dateTimeReported} onChange={(v: string) => updateNested('dossier.occurrenceDocket.dateTimeReported', v)} />
                        </div>

                        <section className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 gap-4">
                                <div>
                                    <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Complainant Details</h3>
                                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Search or enter student details</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <SmartStudentSearch
                                        placeholder="Search Registry..."
                                        className="w-full"
                                        onStudentSelect={(s: any) => {
                                            updateNested('dossier.occurrenceDocket.complainant', {
                                                name: s.fullName,
                                                address: s.address || `${s.province || ''}, ${s.town || ''}`,
                                                phone: s.phone || '',
                                                yearOfStudy: String(s.yearOfStudy || s.year || ''),
                                                programOfStudy: s.program || s.department || '',
                                                sex: s.gender, age: s.age || '', nationality: s.nationality || '',
                                                tribe: s.tribe || '', village: s.village || '',
                                                chief: s.chief || '', district: s.district || '', sin: s.studentId || s.nrc || ''
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Full Name" value={formData.dossier.occurrenceDocket.complainant.name} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.name', v)} />
                                <Field label="Residential Address" value={formData.dossier.occurrenceDocket.complainant.address} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.address', v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Student ID (SIN)" value={formData.dossier.occurrenceDocket.complainant.sin} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.sin', v)} />
                                    <Field label="Phone Number" value={formData.dossier.occurrenceDocket.complainant.phone} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.phone', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Program" value={formData.dossier.occurrenceDocket.complainant.programOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.programOfStudy', v)} />
                                    <Field label="Year" value={formData.dossier.occurrenceDocket.complainant.yearOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.yearOfStudy', v)} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-red-50/50 dark:bg-red-950/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 gap-4">
                                <div>
                                    <h3 className="font-bold text-[10px] uppercase tracking-widest text-red-600">Accused Student Details</h3>
                                    <p className="text-[10px] text-red-400 font-semibold mt-0.5">Search or enter accused student information</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <SmartStudentSearch
                                        placeholder="Search Student..."
                                        className="w-full"
                                        onStudentSelect={(s: any) => {
                                            const addr = s.address || `${s.province || ''}, ${s.town || ''}`;
                                            const phoneNum = s.phone || '';
                                            const prog = s.program || s.department || '';
                                            const yr = String(s.yearOfStudy || s.year || '');
                                            const sinId = s.studentId || s.nrc || '';

                                            updateNested('dossier.occurrenceDocket.accused', {
                                                name: s.fullName, address: addr, phone: phoneNum, yearOfStudy: yr,
                                                programOfStudy: prog, sex: s.gender, age: s.age || '',
                                                nationality: s.nationality || '', tribe: s.tribe || '',
                                                village: s.village || s.town || '', chief: s.chief || '',
                                                district: s.district || s.province || '', sin: sinId
                                            });

                                            updateNested('dossier.warnAndCaution', {
                                                ...formData.dossier.warnAndCaution,
                                                fullName: s.fullName, sex: s.gender, tribe: s.tribe || '',
                                                age: s.age || '', address: addr, village: s.village || s.town || '',
                                                chief: s.chief || '', district: s.district || s.province || '',
                                                program: prog, sin: sinId, phone: phoneNum,
                                                takenAt: new Date().toLocaleDateString(), place: 'Kapasa Makasa University'
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Full Name" value={formData.dossier.occurrenceDocket.accused.name} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.name', v)} />
                                <Field label="Residential Address" value={formData.dossier.occurrenceDocket.accused.address} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.address', v)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Student ID (SIN)" value={formData.dossier.occurrenceDocket.accused.sin} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.sin', v)} />
                                    <Field label="Phone Number" value={formData.dossier.occurrenceDocket.accused.phone} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.phone', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Program" value={formData.dossier.occurrenceDocket.accused.programOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.programOfStudy', v)} />
                                    <Field label="Year" value={formData.dossier.occurrenceDocket.accused.yearOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.yearOfStudy', v)} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <Field label="Offense Category" value={formData.dossier.occurrenceDocket.offence} onChange={(v: string) => updateNested('dossier.occurrenceDocket.offence', v)} placeholder="e.g. Theft, Bad Conduct, Policy Violation" />
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Incident Description</label>
                                <textarea rows={4} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 shadow-sm font-sans outline-none transition" value={formData.dossier.occurrenceDocket.occurrenceDetails} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateNested('dossier.occurrenceDocket.occurrenceDetails', e.target.value)} placeholder="Provide a detailed description of the incident in chronological order..." />
                            </div>
                        </section>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <StatementList formData={formData} setFormData={updateNested} showNotification={showNotification} />
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                        <WarnAndCautionComponent formData={formData} updateNested={updateNested} />
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">✅</div>
                            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">Case Report Submission</h3>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-2 max-w-lg mx-auto font-sans font-medium">Please review all details before submitting. By signing below, you confirm that the information provided is accurate and will be added to the official KMU Disciplinary Records.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SignatureField label="Investigating Officer's Signature" onEnd={(data: string | null) => updateNested('dossier.signatures.investigatingOfficer', data)} />
                            <SignatureField label="Complainant's Signature" onEnd={(data: string | null) => updateNested('dossier.signatures.complainant', data)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
                    className="px-6 py-2.5 font-bold text-[10px] text-gray-500 hover:text-red-600 transition uppercase tracking-widest border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>

                {step < 4 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-all text-[10px] uppercase tracking-widest"
                    >
                        Next: {['Incident Details', 'Witness Statements', 'Warning and Caution'][step]} →
                    </button>
                ) : (
                    <button
                        onClick={handleFinalSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg shadow-sm hover:opacity-90 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
                    >
                        {loading ? 'Submitting Case...' : '🔒 Submit and Sign Case Report'}
                    </button>
                )}
            </div>

            <ConfirmDialog
                isOpen={showConfirmDiscard}
                title="Discard Draft"
                message="Are you sure you want to delete this case draft? All entered information will be lost."
                confirmLabel="Discard Draft"
                onConfirm={confirmClearDraft}
                onCancel={() => setShowConfirmDiscard(false)}
                type="danger"
            />

            {notification?.isVisible && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                    isVisible={notification.isVisible}
                    onClose={hideNotification}
                />
            )}
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest ml-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none transition font-sans shadow-sm"
            />
        </div>
    );
}

function StatementList({ formData, setFormData, showNotification }: { formData: FormData, setFormData: (path: string, value: any) => void, showNotification: any }) {
    const [activeStatement, setActiveStatement] = useState<Statement | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const recognition = useRef<any>(null);
    const chunks = useRef<Blob[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = true;
            recognition.current.interimResults = true;

            recognition.current.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                if (activeStatement) {
                    setActiveStatement((prev) => prev ? ({
                        ...prev,
                        content: (prev.content + ' ' + transcript).trim()
                    }) : null);
                }
            };
        }
    }, [activeStatement]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            chunks.current = [];
            mediaRecorder.current.ondataavailable = (e: any) => { if (e.data.size > 0) chunks.current.push(e.data); };
            mediaRecorder.current.onstop = async () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                await uploadAudio(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.current.start();
            setIsRecording(true);
            if (recognition.current) { recognition.current.start(); setIsTranscribing(true); }
        } catch (err) { showNotification('error', 'Microphone access denied'); }
    };

    const stopRecording = () => {
        if (mediaRecorder.current?.state !== 'inactive') mediaRecorder.current?.stop();
        if (recognition.current) recognition.current.stop();
        setIsRecording(false);
        setIsTranscribing(false);
    };

    const uploadAudio = async (blob: Blob) => {
        if (!activeStatement) return;
        const file = new File([blob], `st_${Date.now()}.webm`, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('file', file);
        fd.append('caseId', 'temp_' + Date.now());
        try {
            const res = await fetch(`${API_BASE_URL}/evidence`, {
                method: 'POST',
                headers: { ...authHeaders() },
                body: fd
            });
            if (res.ok) {
                const data = await res.json();
                setActiveStatement(prev => prev ? ({ ...prev, audioUrl: data.filename }) : null);
            }
        } catch (err) { }
    };

    const saveActive = () => {
        if (!activeStatement) return;
        const exists = formData.dossier.statements.findIndex(st => st.id === activeStatement.id);
        let updated;
        if (exists > -1) { updated = [...formData.dossier.statements]; updated[exists] = activeStatement; }
        else { updated = [...formData.dossier.statements, activeStatement]; }
        setFormData('dossier.statements', updated);
        setActiveStatement(null);
        stopRecording();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                    <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Recorded Statements</h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{formData.dossier.statements.length} statements recorded</p>
                </div>
                <button onClick={() => setActiveStatement({ id: Date.now(), fullName: '', content: '', takenAt: new Date().toISOString().slice(0, 10), phone: '', residentialAddress: '', tribe: '', village: '', active: true, audioUrl: '' })} className="px-4 py-2 bg-red-600 text-white font-bold text-[10px] rounded-lg hover:bg-red-700 transition-all uppercase tracking-widest shadow-sm">+ Add Statement</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {formData.dossier.statements.map((s: Statement, i: number) => (
                    <div key={i} className="p-6 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-800/20 hover:border-red-200 transition-all group relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-tight">{s.fullName || 'Witness Name'}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{s.takenAt}</span>
                                    {s.audioUrl && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                                    {s.signature && <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Signed</span>}
                                </div>
                            </div>
                            <button onClick={() => setActiveStatement(s)} className="opacity-0 group-hover:opacity-100 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 hover:text-red-600 transition-all">⚙️</button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed line-clamp-2 font-sans">{s.content}</p>
                    </div>
                ))}
            </div>

            {activeStatement && (
                <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" onClick={() => { setActiveStatement(null); stopRecording(); }} />
                    <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl border-t-4 border-red-600 p-8 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Record Statement</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enter statement details below</p>
                            </div>
                            <div className="flex gap-2">
                                {!isRecording ? (
                                    <button onClick={startRecording} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition flex items-center gap-2"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Start Voice Recording</button>
                                ) : (
                                    <button onClick={stopRecording} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span> Stop Recording</button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <Field label="Name" value={activeStatement.fullName} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, fullName: v }) : null)} />
                            <Field label="Date" type="date" value={activeStatement.takenAt} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, takenAt: v }) : null)} />
                            <Field label="Phone Number" value={activeStatement.phone} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, phone: v }) : null)} />
                            <Field label="Residential Address" value={activeStatement.residentialAddress} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, residentialAddress: v }) : null)} />
                        </div>

                        <div className="relative mb-8">
                            {isTranscribing && <div className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full border border-red-100"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span><span className="text-[9px] font-bold text-red-600 uppercase">Recording...</span></div>}
                            <textarea placeholder="Record or type the statement here..." rows={8} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-6 py-4 text-sm focus:ring-2 focus:ring-red-500 shadow-sm font-sans outline-none leading-relaxed" value={activeStatement.content} onChange={(e: any) => setActiveStatement(prev => prev ? ({ ...prev, content: e.target.value }) : null)} />
                        </div>

                        <SignatureField label="Signature" onEnd={(data) => setActiveStatement(prev => prev ? ({ ...prev, signature: data }) : null)} />

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => { setActiveStatement(null); stopRecording(); }} className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition">Cancel</button>
                            <button onClick={saveActive} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-sm text-[10px] uppercase tracking-widest hover:bg-red-700 transition">Save Statement</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WarnAndCautionComponent({ formData, updateNested }: { formData: FormData, updateNested: (path: string, value: any) => void }) {
    const wc = formData.dossier.warnAndCaution;
    const docket = formData.dossier.occurrenceDocket;
    return (
        <div className="space-y-8">
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900 dark:text-white">KAPASA MAKASA UNIVERSITY</h2>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">University Disciplinary Procedure</h3>
                <h4 className="text-lg font-bold uppercase text-red-600 mt-4 tracking-tight">Official Warning and Caution Statement</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Field label="Full Name" value={wc.fullName} onChange={(v) => updateNested('dossier.warnAndCaution.fullName', v)} />
                <Field label="Gender" value={wc.sex} onChange={(v) => updateNested('dossier.warnAndCaution.sex', v)} />
                <Field label="Age" value={wc.age} onChange={(v) => updateNested('dossier.warnAndCaution.age', v)} />
                <Field label="Tribe" value={wc.tribe} onChange={(v) => updateNested('dossier.warnAndCaution.tribe', v)} />
                <Field label="Phone Number" value={wc.phone} onChange={(v) => updateNested('dossier.warnAndCaution.phone', v)} />
                <Field label="SIN / NRC" value={wc.sin} onChange={(v) => updateNested('dossier.warnAndCaution.sin', v)} />
                <div className="md:col-span-2 lg:col-span-3">
                    <Field label="Residential Address" value={wc.address} onChange={(v) => updateNested('dossier.warnAndCaution.address', v)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                <Field label="Date & Time" value={wc.takenAt} onChange={(v) => updateNested('dossier.warnAndCaution.takenAt', v)} />
                <Field label="Place" value={wc.place} onChange={(v) => updateNested('dossier.warnAndCaution.place', v)} />
                <Field label="District" value={wc.district} onChange={(v) => updateNested('dossier.warnAndCaution.district', v)} />
                <Field label="Chief" value={wc.chief} onChange={(v) => updateNested('dossier.warnAndCaution.chief', v)} />
            </div>

            <div className="p-4 sm:p-8 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/30 font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-red-200/10 text-6xl font-bold uppercase -rotate-12 pointer-events-none">CAUTION</div>
                <div className="space-y-6 relative z-10">
                    <div className="font-semibold italic border-l-4 border-red-600 pl-4 py-2 bg-white/50 dark:bg-black/20 rounded-r-lg">
                        <div className="flex flex-wrap items-center gap-y-2">
                            I have been warned and cautioned that a case of
                            <input className="mx-2 border-b-2 border-red-200 bg-transparent px-2 font-bold italic text-red-700 outline-none w-full sm:w-64 uppercase tracking-tighter" value={wc.offence || docket.offence} onChange={(e) => updateNested('dossier.warnAndCaution.offence', e.target.value)} />
                            which was committed on
                            <input type="date" className="mx-2 border-b-2 border-red-200 bg-transparent px-2 font-bold outline-none italic w-full sm:w-auto" value={wc.occurrenceDate || (docket.dateTimeReported ? docket.dateTimeReported.split('T')[0] : '')} onChange={(e) => updateNested('dossier.warnAndCaution.occurrenceDate', e.target.value)} />
                            at place
                            <input className="mx-2 border-b-2 border-red-200 bg-transparent px-2 font-bold outline-none italic w-full sm:w-40" value={wc.occurrencePlace || ''} onChange={(e) => updateNested('dossier.warnAndCaution.occurrencePlace', e.target.value)} />
                            is being investigated against me.
                        </div>
                    </div>
                    <p className="font-medium">
                        I am further cautioned that I am not obliged to make any statement against myself. Any statement provided will be documented and may be utilized in formal KMU Disciplinary Proceedings.
                    </p>
                    <p className="font-medium text-[10px] text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-black/20 p-4 rounded-lg italic border border-gray-100 dark:border-gray-800 opacity-80">
                        I acknowledge the right to legal counsel or witnesses. No person shall be compelled to incriminate themselves.
                    </p>
                </div>

                <div className="mt-8 pt-8 border-t border-red-100 dark:border-red-900/50">
                    <SignatureField label="Accused Signature" onEnd={(data) => updateNested('dossier.warnAndCaution.signature', data)} />
                </div>
            </div>
        </div>
    );
}

function SignatureField({ label, onEnd }: { label: string, onEnd: (data: string | null) => void }) {
    const sigCanvas = useRef<any>(null);
    const [hasSig, setHasSig] = useState(false);
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{label}</label>
                <button onClick={() => { sigCanvas.current.clear(); onEnd(null); setHasSig(false); }} className="text-[9px] text-red-500 font-bold hover:underline uppercase tracking-widest">Clear Signature</button>
            </div>
            <div className={`bg-gray-50 dark:bg-gray-800/80 border border-dashed rounded-xl overflow-hidden h-40 transition-all ${hasSig ? 'border-red-200 bg-white dark:bg-gray-900' : 'border-gray-100 dark:border-gray-800'}`}>
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor='#000'
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                    onEnd={() => { if (sigCanvas.current) { onEnd(sigCanvas.current.toDataURL()); setHasSig(true); } }}
                />
            </div>
        </div>
    );
}
