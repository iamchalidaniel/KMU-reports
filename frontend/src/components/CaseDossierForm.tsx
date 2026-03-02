"use client";

import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { API_BASE_URL } from '../config/constants';
import { authHeaders } from '../utils/api';
import SmartStudentSearch from './SmartStudentSearch';

interface Particulars {
    name: string; address: string; phone: string; yearOfStudy: string; programOfStudy: string;
    sex: string; age: string; nationality: string; tribe: string; village: string; chief: string; district: string;
    sin?: string;
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
    ob_number: string;
    case_type: string;
    dossier: CaseDossier;
}

interface CaseDossierFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Partial<FormData>;
}

export default function CaseDossierForm({ onSuccess, onCancel, initialData }: CaseDossierFormProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<FormData>({
        ob_number: '',
        case_type: 'single_student',
        dossier: {
            occurrenceDocket: {
                investigatingOfficer: '',
                occurrenceBookNumber: '',
                dateTimeReported: new Date().toISOString().slice(0, 16),
                complainant: {
                    name: '', address: '', phone: '', yearOfStudy: '', programOfStudy: '',
                    sex: '', age: '', nationality: '', tribe: '', village: '', chief: '', district: ''
                },
                accused: {
                    name: '', address: '', phone: '', yearOfStudy: '', programOfStudy: '',
                    sex: '', age: '', nationality: '', tribe: '', village: '', chief: '', district: ''
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

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('kmu_case_draft');
        let baseData = formData;
        if (saved) {
            try {
                baseData = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }

        if (initialData) {
            // Deep merge initialData into baseData
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
        if (window.confirm('Erase all metadata and discard current inquiry?')) {
            localStorage.removeItem('kmu_case_draft');
            onCancel();
        }
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders()
                },
                body: JSON.stringify({
                    ...formData,
                    incident_date: formData.dossier.occurrenceDocket.dateTimeReported.split('T')[0],
                    description: formData.dossier.occurrenceDocket.occurrenceDetails,
                    offense_type: formData.dossier.occurrenceDocket.offence,
                    student_id: formData.dossier.occurrenceDocket.accused.phone.includes('-') || formData.dossier.occurrenceDocket.accused.phone.length > 10 ? null : formData.dossier.occurrenceDocket.accused.phone
                })
            });

            if (!res.ok) throw new Error(await res.text());
            localStorage.removeItem('kmu_case_draft');
            onSuccess();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden max-w-5xl mx-auto font-serif">
            {/* Header & Progress */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-10 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Forensic Dossier Initialization</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Operational Protocol v2.5</p>
                    </div>
                    <button onClick={clearDraft} className="text-[10px] bg-red-50 dark:bg-red-900/10 text-red-600 px-4 py-2 rounded-xl font-black hover:bg-red-100 transition uppercase tracking-widest">Discard Metadata</button>
                </div>

                <div className="flex gap-3 h-2 w-full mb-4">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`flex-1 rounded-full transition-all duration-700 ${step >= s ? 'bg-red-600 shadow-sm shadow-red-500/20' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                </div>
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                    <span className={step === 1 ? 'text-red-600' : ''}>I. Occurrence Docket</span>
                    <span className={step === 2 ? 'text-red-600' : ''}>II. Testimony Registry</span>
                    <span className={step === 3 ? 'text-red-600' : ''}>III. Cautionary Phase</span>
                    <span className={step === 4 ? 'text-red-600' : ''}>IV. Protocol Seal</span>
                </div>
            </div>

            <div className="p-12 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {step === 1 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Field label="Investigating Officer" value={formData.dossier.occurrenceDocket.investigatingOfficer} onChange={(v: string) => updateNested('dossier.occurrenceDocket.investigatingOfficer', v)} />
                            <Field label="OB Number" value={formData.ob_number} onChange={(v: string) => { setFormData({ ...formData, ob_number: v }); updateNested('dossier.occurrenceDocket.occurrenceBookNumber', v); }} />
                            <Field label="Protocol Datetime" type="datetime-local" value={formData.dossier.occurrenceDocket.dateTimeReported} onChange={(v: string) => updateNested('dossier.occurrenceDocket.dateTimeReported', v)} />
                        </div>

                        <section className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 gap-4">
                                <div>
                                    <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-gray-400">Complainant Designation</h3>
                                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Identify or manually input particulars</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <SmartStudentSearch
                                        placeholder="Query Registry..."
                                        className="w-full"
                                        onStudentSelect={(s: any) => {
                                            updateNested('dossier.occurrenceDocket.complainant', {
                                                name: s.fullName,
                                                address: s.address || `${s.province || ''}, ${s.town || ''}`,
                                                phone: s.phone || s.studentId,
                                                yearOfStudy: s.yearOfStudy || s.year,
                                                programOfStudy: s.program || s.department,
                                                sex: s.gender, age: s.age || '', nationality: s.nationality || '',
                                                tribe: s.tribe || '', village: s.village || '',
                                                chief: s.chief || '', district: s.district || '', sin: s.nrc || ''
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Legal Full Name" value={formData.dossier.occurrenceDocket.complainant.name} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.name', v)} />
                                <Field label="SIN / Contact Index" value={formData.dossier.occurrenceDocket.complainant.phone} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.phone', v)} />
                                <Field label="Residential Matrix" value={formData.dossier.occurrenceDocket.complainant.address} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.address', v)} />
                                <Field label="Programmatic Status" value={formData.dossier.occurrenceDocket.complainant.programOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.programOfStudy', v)} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-red-50/50 dark:bg-red-950/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 gap-4">
                                <div>
                                    <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-red-600">Accused Designation</h3>
                                    <p className="text-[10px] text-red-400 font-bold mt-0.5 whitespace-nowrap">Target core compliance subject</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <SmartStudentSearch
                                        placeholder="Target Search..."
                                        className="w-full"
                                        onStudentSelect={(s: any) => {
                                            const addr = s.address || `${s.province || ''}, ${s.town || ''}`;
                                            const phoneNum = s.phone || s.studentId;
                                            const prog = s.program || s.department;
                                            const yr = s.yearOfStudy || s.year;

                                            updateNested('dossier.occurrenceDocket.accused', {
                                                name: s.fullName, address: addr, phone: phoneNum, yearOfStudy: yr,
                                                programOfStudy: prog, sex: s.gender, age: s.age || '',
                                                nationality: s.nationality || '', tribe: s.tribe || '',
                                                village: s.village || s.town || '', chief: s.chief || '',
                                                district: s.district || s.province || '', sin: s.nrc || ''
                                            });

                                            updateNested('dossier.warnAndCaution', {
                                                ...formData.dossier.warnAndCaution,
                                                fullName: s.fullName, sex: s.gender, tribe: s.tribe || '',
                                                age: s.age || '', address: addr, village: s.village || s.town || '',
                                                chief: s.chief || '', district: s.district || s.province || '',
                                                program: prog, sin: s.nrc || '', phone: phoneNum,
                                                takenAt: new Date().toLocaleDateString(), place: 'Kapasa Makasa University'
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Legal Full Name" value={formData.dossier.occurrenceDocket.accused.name} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.name', v)} />
                                <Field label="SIN / Contact Index" value={formData.dossier.occurrenceDocket.accused.phone} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.phone', v)} />
                                <Field label="Residential Matrix" value={formData.dossier.occurrenceDocket.accused.address} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.address', v)} />
                                <Field label="Programmatic Status" value={formData.dossier.occurrenceDocket.accused.programOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.programOfStudy', v)} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <Field label="Offence Classification" value={formData.dossier.occurrenceDocket.offence} onChange={(v: string) => updateNested('dossier.occurrenceDocket.offence', v)} placeholder="e.g. Strategic Theft / Policy Violation" />
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Occurrence Meta-Details</label>
                                <textarea rows={6} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[2rem] px-8 py-6 text-sm focus:ring-2 focus:ring-red-500 shadow-inner font-sans outline-none" value={formData.dossier.occurrenceDocket.occurrenceDetails} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateNested('dossier.occurrenceDocket.occurrenceDetails', e.target.value)} placeholder="Describe the operational incident in full chronological detail..." />
                            </div>
                        </section>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <StatementList formData={formData} setFormData={updateNested} />
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
                        <WarnAndCautionComponent formData={formData} updateNested={updateNested} />
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-12">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-10 rounded-[3rem] border border-emerald-100 dark:border-emerald-900/30 text-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✅</div>
                            <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-400 uppercase italic tracking-tighter">Protocol Finalization</h3>
                            <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80 mt-2 max-w-lg mx-auto font-sans font-medium">Authentication required. By sealing this dossier, you commit all metadata to the formal KMU Disciplinary Registry. This action generates a permanent operational record.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <SignatureField label="Investigating Authority Seal" onEnd={(data: string | null) => updateNested('dossier.signatures.investigatingOfficer', data)} />
                            <SignatureField label="Complainant Affirmation Seal" onEnd={(data: string | null) => updateNested('dossier.signatures.complainant', data)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Navigation */}
            <div className="p-10 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
                    className="px-8 py-4 font-black text-[10px] text-gray-400 hover:text-red-600 transition uppercase tracking-[0.3em]"
                >
                    {step === 1 ? 'Abort' : 'Previous Phase'}
                </button>

                {step < 4 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="px-12 py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/30 hover:shadow-red-500/40 hover:-translate-y-1 active:translate-y-0 transition-all text-[10px] uppercase tracking-[0.2em] transform"
                    >
                        Advance Protocol: {['Intelligence Ingress', 'Testimony Archive', 'Cautionary Seal'][step - 1]} →
                    </button>
                ) : (
                    <button
                        onClick={handleFinalSubmit}
                        disabled={loading}
                        className="px-12 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all text-[10px] uppercase tracking-[0.2em] disabled:opacity-50"
                    >
                        {loading ? 'Committing Metadata...' : '🔒 Seal Forensic Dossier'}
                    </button>
                )}
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-bold focus:ring-2 focus:ring-red-500 shadow-inner outline-none transition font-sans"
            />
        </div>
    );
}

function StatementList({ formData, setFormData }: { formData: FormData, setFormData: (path: string, value: any) => void }) {
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
        } catch (err) { alert('Microphone access denied'); }
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
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                <div>
                    <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-gray-400">Recorded Testimonies</h3>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{formData.dossier.statements.length} identities processed</p>
                </div>
                <button onClick={() => setActiveStatement({ id: Date.now(), fullName: '', content: '', takenAt: new Date().toISOString().slice(0, 10), phone: '', residentialAddress: '', tribe: '', village: '', active: true, audioUrl: '' })} className="px-6 py-3 bg-red-600 text-white font-black text-[10px] rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all uppercase tracking-widest">+ Ingress Testimony</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {formData.dossier.statements.map((s: Statement, i: number) => (
                    <div key={i} className="p-8 border border-gray-100 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-gray-800/20 hover:border-red-200 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tighter italic">{s.fullName || 'Unidentified Subject'}</h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{s.takenAt}</span>
                                    {s.audioUrl && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                                    {s.signature && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Seal Affixed</span>}
                                </div>
                            </div>
                            <button onClick={() => setActiveStatement(s)} className="opacity-0 group-hover:opacity-100 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 hover:text-red-600 transition-all">⚙️</button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-4 leading-relaxed line-clamp-2 font-sans">{s.content}</p>
                    </div>
                ))}
            </div>

            {activeStatement && (
                <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={() => { setActiveStatement(null); stopRecording(); }} />
                    <div className="relative bg-white dark:bg-gray-900 w-full max-w-3xl rounded-[3rem] shadow-2xl border-t-8 border-red-600 p-12 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Testimony Submission</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ingress Authorization Required</p>
                            </div>
                            <div className="flex gap-2">
                                {!isRecording ? (
                                    <button onClick={startRecording} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition flex items-center gap-2"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Begin Feed</button>
                                ) : (
                                    <button onClick={stopRecording} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span> Terminate Feed</button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <Field label="Subject Designation" value={activeStatement.fullName} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, fullName: v }) : null)} />
                            <Field label="Dossier Timestamp" type="date" value={activeStatement.takenAt} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, takenAt: v }) : null)} />
                            <Field label="Contact Identifier" value={activeStatement.phone} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, phone: v }) : null)} />
                            <Field label="Residential Matrix" value={activeStatement.residentialAddress} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, residentialAddress: v }) : null)} />
                        </div>

                        <div className="relative mb-10">
                            {isTranscribing && <div className="absolute top-6 right-8 flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full border border-red-100"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span><span className="text-[9px] font-black text-red-600 uppercase">Streaming...</span></div>}
                            <textarea placeholder="Neural feed or manual transcription console..." rows={10} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[2rem] px-8 py-8 text-sm focus:ring-2 focus:ring-red-500 shadow-inner font-sans outline-none leading-relaxed" value={activeStatement.content} onChange={(e: any) => setActiveStatement(prev => prev ? ({ ...prev, content: e.target.value }) : null)} />
                        </div>

                        <SignatureField label="Subject Affirmation Seal" onEnd={(data) => setActiveStatement(prev => prev ? ({ ...prev, signature: data }) : null)} />

                        <div className="flex justify-end gap-3 mt-10">
                            <button onClick={() => { setActiveStatement(null); stopRecording(); }} className="px-8 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Discard Entry</button>
                            <button onClick={saveActive} className="px-10 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 text-[10px] uppercase tracking-widest">Commit Testimony</button>
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
        <div className="space-y-12">
            <div className="text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900 dark:text-white">KAPASA MAKASA UNIVERSITY</h2>
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mt-2">Security Authority • Cautionary Framework</h3>
                <h4 className="text-xl font-black uppercase text-red-600 italic mt-6 tracking-tight">Official Warn and Caution</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Field label="Subject Designation" value={wc.fullName} onChange={(v) => updateNested('dossier.warnAndCaution.fullName', v)} />
                <Field label="Sex Index" value={wc.sex} onChange={(v) => updateNested('dossier.warnAndCaution.sex', v)} />
                <Field label="Age Matrix" value={wc.age} onChange={(v) => updateNested('dossier.warnAndCaution.age', v)} />
                <Field label="Ethnic Identification" value={wc.tribe} onChange={(v) => updateNested('dossier.warnAndCaution.tribe', v)} />
                <Field label="Contact Vector" value={wc.phone} onChange={(v) => updateNested('dossier.warnAndCaution.phone', v)} />
                <Field label="Registry SIN/NRC" value={wc.sin} onChange={(v) => updateNested('dossier.warnAndCaution.sin', v)} />
                <div className="md:col-span-2 lg:col-span-3">
                    <Field label="Residential Matrix" value={wc.address} onChange={(v) => updateNested('dossier.warnAndCaution.address', v)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-10 bg-gray-50 dark:bg-gray-800/30 rounded-[2.5rem]">
                <Field label="Taken Datetime" value={wc.takenAt} onChange={(v) => updateNested('dossier.warnAndCaution.takenAt', v)} />
                <Field label="Operational Place" value={wc.place} onChange={(v) => updateNested('dossier.warnAndCaution.place', v)} />
                <Field label="District Index" value={wc.district} onChange={(v) => updateNested('dossier.warnAndCaution.district', v)} />
                <Field label="Chiefdom Alpha" value={wc.chief} onChange={(v) => updateNested('dossier.warnAndCaution.chief', v)} />
            </div>

            <div className="p-12 bg-red-50/50 dark:bg-red-950/10 rounded-[3rem] border border-red-100 dark:border-red-900/30 font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-red-200/20 text-8xl font-black uppercase -rotate-12 pointer-events-none">CAUTION</div>
                <div className="space-y-8 relative z-10">
                    <p className="font-medium italic border-l-4 border-red-600 pl-6 py-2 bg-white/50 dark:bg-black/20 rounded-r-xl">
                        I have been warned and cautioned that a case of
                        <input className="inline-block mx-2 border-b-2 border-red-200 bg-transparent px-2 font-black italic text-red-700 outline-none w-64 uppercase tracking-tighter" value={wc.offence || docket.offence} onChange={(e) => updateNested('dossier.warnAndCaution.offence', e.target.value)} />
                        which was committed on
                        <input type="date" className="inline-block mx-2 border-b-2 border-red-200 bg-transparent px-2 font-black outline-none italic" value={wc.occurrenceDate || (docket.dateTimeReported ? docket.dateTimeReported.split('T')[0] : '')} onChange={(e) => updateNested('dossier.warnAndCaution.occurrenceDate', e.target.value)} />
                        at place
                        <input className="inline-block mx-2 border-b-2 border-red-200 bg-transparent px-2 font-black outline-none italic w-40" value={wc.occurrencePlace || ''} onChange={(e) => updateNested('dossier.warnAndCaution.occurrencePlace', e.target.value)} />
                        is being investigated against me.
                    </p>
                    <p className="font-medium">
                        I am further cautioned that I am not obliged to make any statement against myself. Any statement provided will be documented and may be utilized in formal KMU Disciplinary Proceedings.
                    </p>
                    <p className="font-medium text-xs text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-black/20 p-6 rounded-2xl italic border border-gray-100 dark:border-gray-800 opacity-80">
                        I acknowledge the right to legal counsel or witnesses. No person shall be compelled to incriminate themselves.
                    </p>
                </div>

                <div className="mt-12 pt-12 border-t border-red-100 dark:border-red-900/50">
                    <SignatureField label="Accused Acceptance Seal" onEnd={(data) => updateNested('dossier.warnAndCaution.signature', data)} />
                </div>
            </div>
        </div>
    );
}

function SignatureField({ label, onEnd }: { label: string, onEnd: (data: string | null) => void }) {
    const sigCanvas = useRef<any>(null);
    const [hasSig, setHasSig] = useState(false);
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">{label}</label>
                <button onClick={() => { sigCanvas.current.clear(); onEnd(null); setHasSig(false); }} className="text-[9px] text-red-500 font-black hover:underline uppercase tracking-widest">Wipe Seal</button>
            </div>
            <div className={`bg-gray-50 dark:bg-gray-800/80 border-2 border-dashed rounded-[2rem] overflow-hidden h-48 transition-all duration-500 ${hasSig ? 'border-red-200 bg-white dark:bg-gray-900' : 'border-gray-100 dark:border-gray-800'}`}>
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
