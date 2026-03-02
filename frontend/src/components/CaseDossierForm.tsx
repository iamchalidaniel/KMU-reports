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
        localStorage.removeItem('kmu_case_draft');
        onCancel();
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden max-w-4xl mx-auto">
            {/* Header & Progress */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Case Creation Dossier</h2>
                    <button onClick={clearDraft} className="text-xs text-red-500 font-bold hover:underline">DISCARD DRAFT</button>
                </div>

                <div className="flex gap-2 h-1.5 w-full">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-kmuGreen' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Occurrence Docket</span>
                    <span>Statements</span>
                    <span>Warn & Caution</span>
                    <span>Finalize</span>
                </div>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Field label="Investigating Officer" value={formData.dossier.occurrenceDocket.investigatingOfficer} onChange={(v: string) => updateNested('dossier.occurrenceDocket.investigatingOfficer', v)} />
                            <Field label="OB Number" value={formData.ob_number} onChange={(v: string) => { setFormData({ ...formData, ob_number: v }); updateNested('dossier.occurrenceDocket.occurrenceBookNumber', v); }} />
                            <Field label="Date & Time Reported" type="datetime-local" value={formData.dossier.occurrenceDocket.dateTimeReported} onChange={(v: string) => updateNested('dossier.occurrenceDocket.dateTimeReported', v)} />
                        </div>

                        <section className="space-y-4">
                            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                <h3 className="font-bold text-sm uppercase tracking-wider">Particulars of Complainant</h3>
                                <SmartStudentSearch
                                    placeholder="Search Student..."
                                    className="w-full"
                                    onStudentSelect={(s: any) => {
                                        updateNested('dossier.occurrenceDocket.complainant', {
                                            name: s.fullName,
                                            address: s.address || `${s.province || ''}, ${s.town || ''}`,
                                            phone: s.phone || s.studentId,
                                            yearOfStudy: s.yearOfStudy || s.year,
                                            programOfStudy: s.program || s.department,
                                            sex: s.gender,
                                            age: s.age || '',
                                            nationality: s.nationality || '',
                                            tribe: s.tribe || '',
                                            village: s.village || '',
                                            chief: s.chief || '',
                                            district: s.district || '',
                                            sin: s.nrc || ''
                                        });
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Full Name" value={formData.dossier.occurrenceDocket.complainant.name} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.name', v)} />
                                <Field label="SIN / Phone" value={formData.dossier.occurrenceDocket.complainant.phone} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.phone', v)} />
                                <Field label="Residential Address" value={formData.dossier.occurrenceDocket.complainant.address} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.address', v)} />
                                <Field label="Program / Year" value={formData.dossier.occurrenceDocket.complainant.programOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.complainant.programOfStudy', v)} />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                <h3 className="font-bold text-sm text-red-700 dark:text-red-400 uppercase tracking-wider">Particulars of Accused</h3>
                                <div className="flex gap-2">
                                    <SmartStudentSearch
                                        placeholder="Search Student..."
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
                                                district: s.district || s.province || '',
                                                sin: s.nrc || ''
                                            });

                                            // Pre-fill Warn & Caution
                                            updateNested('dossier.warnAndCaution', {
                                                ...formData.dossier.warnAndCaution,
                                                fullName: s.fullName,
                                                sex: s.gender,
                                                tribe: s.tribe || '',
                                                age: s.age || '',
                                                address: addr,
                                                village: s.village || s.town || '',
                                                chief: s.chief || '',
                                                district: s.district || s.province || '',
                                                program: prog,
                                                sin: s.nrc || '',
                                                phone: phoneNum,
                                                takenAt: new Date().toLocaleDateString(),
                                                place: 'Kapasa Makasa University'
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Full Name" value={formData.dossier.occurrenceDocket.accused.name} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.name', v)} />
                                <Field label="SIN / Phone" value={formData.dossier.occurrenceDocket.accused.phone} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.phone', v)} />
                                <Field label="Residential Address" value={formData.dossier.occurrenceDocket.accused.address} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.address', v)} />
                                <Field label="Program / Year" value={formData.dossier.occurrenceDocket.accused.programOfStudy} onChange={(v: string) => updateNested('dossier.occurrenceDocket.accused.programOfStudy', v)} />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <Field label="Offence" value={formData.dossier.occurrenceDocket.offence} onChange={(v: string) => updateNested('dossier.occurrenceDocket.offence', v)} placeholder="e.g. Theft of university property" />
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Details of Occurrence</label>
                                <textarea rows={4} className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm" value={formData.dossier.occurrenceDocket.occurrenceDetails} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateNested('dossier.occurrenceDocket.occurrenceDetails', e.target.value)} />
                            </div>
                        </section>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <StatementList formData={formData} setFormData={updateNested} />
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <WarnAndCaution formData={formData} updateNested={updateNested} />
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-center">
                            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Ready to Finalize</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">All data has been preserved in your browser's local storage. This will formally register the case in the KMU Registry.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SignatureField label="Investigating Officer Signature" onEnd={(data: string | null) => updateNested('dossier.signatures.investigatingOfficer', data)} />
                            <SignatureField label="Complainant Signature" onEnd={(data: string | null) => updateNested('dossier.signatures.complainant', data)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Nav */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
                    className="px-6 py-2 font-bold text-gray-500 hover:text-gray-700 transition"
                >
                    {step === 1 ? 'CANCEL' : 'BACK'}
                </button>

                {step < 4 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="px-10 py-3 bg-kmuGreen text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition"
                    >
                        NEXT: {step === 1 ? 'Witness Statements' : step === 2 ? 'Warn & Caution' : 'Signatures'}
                    </button>
                ) : (
                    <button
                        onClick={handleFinalSubmit}
                        disabled={loading}
                        className="px-10 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50"
                    >
                        {loading ? 'SUBMITTING...' : 'REGISTER CASE'}
                    </button>
                )}
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-kmuGreen outline-none transition"
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

            recognition.current.onerror = (event: any) => {
                console.error('STT Error:', event.error);
                setIsTranscribing(false);
            };
        }
    }, [activeStatement]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            chunks.current = [];

            mediaRecorder.current.ondataavailable = (e: any) => {
                if (e.data.size > 0) chunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                await uploadAudio(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);

            if (recognition.current) {
                recognition.current.start();
                setIsTranscribing(true);
            }
        } catch (err) {
            console.error('Recording error:', err);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.stop();
        }
        if (recognition.current) {
            recognition.current.stop();
        }
        setIsRecording(false);
        setIsTranscribing(false);
    };

    const uploadAudio = async (blob: Blob) => {
        if (!activeStatement) return;
        const file = new File([blob], `statement_${Date.now()}.webm`, { type: 'audio/webm' });
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('caseId', 'temp_' + Date.now()); // Temporary ID until case is created

        try {
            const res = await fetch(`${API_BASE_URL}/evidence`, {
                method: 'POST',
                headers: { ...authHeaders() },
                body: formDataUpload
            });
            if (res.ok) {
                const data = await res.json();
                setActiveStatement((prev) => prev ? ({ ...prev, audioUrl: data.filename }) : null);
            }
        } catch (err) {
            console.error('Audio upload failed:', err);
        }
    };

    const addStatement = () => {
        const newStatement = {
            id: Date.now(), fullName: '', content: '', takenAt: new Date().toISOString().slice(0, 10),
            phone: '', residentialAddress: '', tribe: '', village: '', active: true, audioUrl: ''
        };
        setActiveStatement(newStatement);
    };

    const saveActive = () => {
        if (!activeStatement) return;
        const existingIndex = formData.dossier.statements.findIndex(st => st.id === activeStatement.id);
        let updated;
        if (existingIndex > -1) {
            updated = [...formData.dossier.statements];
            updated[existingIndex] = activeStatement;
        } else {
            updated = [...formData.dossier.statements, activeStatement];
        }
        setFormData('dossier.statements', updated);
        setActiveStatement(null);
        stopRecording();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <h3 className="font-bold uppercase tracking-widest text-xs">Recorded Statements ({formData.dossier.statements.length})</h3>
                <button onClick={addStatement} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg">+ ADD STATEMENT</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {formData.dossier.statements.map((s: Statement, i: number) => (
                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/40 relative group">
                        <div className="flex justify-between font-bold text-sm">
                            <span>{s.fullName}</span>
                            <div className="flex items-center gap-3">
                                {s.audioUrl && <span className="text-emerald-500 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Audio Attached</span>}
                                {s.signature && <span className="text-blue-500 text-[10px] bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Signed</span>}
                                <span className="text-gray-400">{s.takenAt}</span>
                                <button
                                    onClick={() => setActiveStatement(s)}
                                    className="text-kmuGreen hover:text-kmuOrange text-[10px] font-bold uppercase tracking-widest ml-4 transition"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.content}</p>
                    </div>
                ))}
            </div>

            {activeStatement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="text-xl font-bold">Record New Statement</h4>
                            <div className="flex gap-2">
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-lg border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                                        Start Audio & STT
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-black transition"
                                    >
                                        <span className="h-2 w-2 bg-white"></span>
                                        Stop Recording
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <Field label="Full Name" value={activeStatement.fullName} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, fullName: v }) : null)} />
                            <Field label="Date" type="date" value={activeStatement.takenAt} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, takenAt: v }) : null)} />
                            <Field label="Phone" value={activeStatement.phone} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, phone: v }) : null)} />
                            <Field label="Residential Address" value={activeStatement.residentialAddress} onChange={(v: string) => setActiveStatement(prev => prev ? ({ ...prev, residentialAddress: v }) : null)} />
                        </div>

                        <div className="relative">
                            {isTranscribing && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Listening...</span>
                                </div>
                            )}
                            <textarea
                                placeholder="Start recording or type the statement here..."
                                rows={8}
                                className={`w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-xl px-4 py-3 text-sm mb-6 transition-all ${isTranscribing ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-gray-100 dark:border-gray-800'}`}
                                value={activeStatement.content}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActiveStatement(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                            />
                        </div>

                        <div className="mb-6">
                            <SignatureField
                                label="Statement Signature"
                                onEnd={(data) => setActiveStatement(prev => prev ? ({ ...prev, signature: data }) : null)}
                            />
                            {activeStatement.signature && (
                                <div className="mt-2 text-center">
                                    <div className="text-[10px] text-emerald-500 font-bold uppercase">Signature Saved Successfully</div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setActiveStatement(null); stopRecording(); }} className="px-6 py-2 text-gray-500 font-bold">CANCEL</button>
                            <button onClick={saveActive} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg">SAVE STATEMENT</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WarnAndCaution({ formData, updateNested }: { formData: FormData, updateNested: (path: string, value: any) => void }) {
    const wc = formData.dossier.warnAndCaution;
    const docket = formData.dossier.occurrenceDocket;

    return (
        <div className="space-y-6">
            <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-lg font-bold uppercase tracking-tight">KAPASA MAKASA UNIVERSITY</h2>
                <h3 className="text-md font-bold uppercase">Security Department</h3>
                <h4 className="text-sm font-bold uppercase text-red-600">Warn and Caution</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Names" value={wc.fullName} onChange={(v) => updateNested('dossier.warnAndCaution.fullName', v)} />
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Sex" value={wc.sex} onChange={(v) => updateNested('dossier.warnAndCaution.sex', v)} />
                    <Field label="Age" value={wc.age} onChange={(v) => updateNested('dossier.warnAndCaution.age', v)} />
                </div>
                <Field label="Tribe" value={wc.tribe} onChange={(v) => updateNested('dossier.warnAndCaution.tribe', v)} />
                <Field label="Residential Address" value={wc.address} onChange={(v) => updateNested('dossier.warnAndCaution.address', v)} />
                <Field label="Village" value={wc.village} onChange={(v) => updateNested('dossier.warnAndCaution.village', v)} />
                <Field label="Chief" value={wc.chief} onChange={(v) => updateNested('dossier.warnAndCaution.chief', v)} />
                <Field label="District" value={wc.district} onChange={(v) => updateNested('dossier.warnAndCaution.district', v)} />
                <Field label="Program of Study" value={wc.program} onChange={(v) => updateNested('dossier.warnAndCaution.program', v)} />
                <Field label="Occupation" value={wc.occupation} onChange={(v) => updateNested('dossier.warnAndCaution.occupation', v)} />
                <Field label="SIN / NRC" value={wc.sin} onChange={(v) => updateNested('dossier.warnAndCaution.sin', v)} />
                <Field label="Phone No" value={wc.phone} onChange={(v) => updateNested('dossier.warnAndCaution.phone', v)} />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <Field label="Taken on (Day & Date)" value={wc.takenAt} onChange={(v) => updateNested('dossier.warnAndCaution.takenAt', v)} />
                    </div>
                    <Field label="at (Time)" type="time" value={wc.occurrenceTime || ''} onChange={(v) => updateNested('dossier.warnAndCaution.occurrenceTime', v)} />
                    <Field label="At (Place)" value={wc.place} onChange={(v) => updateNested('dossier.warnAndCaution.place', v)} />
                </div>
                <p className="text-[11px] text-gray-500 italic">
                    At Kapasa Makasa University in the Chinsali District of Muchinga Province of the Republic of Zambia.
                </p>
            </div>

            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-[13px] leading-relaxed text-gray-800 dark:text-gray-200">
                <div className="space-y-4">
                    <p>
                        I have been warned and cautioned that a case of
                        <input
                            className="inline-block mx-1 border-b border-gray-400 bg-transparent px-1 font-bold min-w-[200px] outline-none text-red-700"
                            value={wc.offence || docket.offence}
                            onChange={(e) => updateNested('dossier.warnAndCaution.offence', e.target.value)}
                            placeholder="[OFFENCE]"
                        />
                        which was committed on
                        <input
                            type="date"
                            className="inline-block mx-1 border-b border-gray-400 bg-transparent outline-none"
                            value={wc.occurrenceDate || (docket.dateTimeReported ? docket.dateTimeReported.split('T')[0] : '')}
                            onChange={(e) => updateNested('dossier.warnAndCaution.occurrenceDate', e.target.value)}
                        />
                        at
                        <input
                            type="time"
                            className="inline-block mx-1 border-b border-gray-400 bg-transparent outline-none"
                            value={wc.occurrenceTime || ''}
                            onChange={(e) => updateNested('dossier.warnAndCaution.occurrenceTime', e.target.value)}
                        />
                        hours (at place)
                        <input
                            className="inline-block mx-1 border-b border-gray-400 bg-transparent px-1 outline-none w-32"
                            value={wc.occurrencePlace || ''}
                            onChange={(e) => updateNested('dossier.warnAndCaution.occurrencePlace', e.target.value)}
                            placeholder="[at place]"
                        />
                        is being investigated against me.
                    </p>

                    <p>
                        I have further been warned and cautioned to make any statement in reply to the allegation against me but that, I am not obliged to make any statement against myself. I have also been informed that any statement that will be taken down in writing, I am not obliged to answer any question put across to me but if I do, it will be taken down in writing and may be used in the University disciplinary proceedings.
                    </p>

                    <p>
                        I have been informed that should this matter be referred to a disciplinary hearing, I may bring my own witness(es) to the hearing. I have also been informed that I am not obliged to answer any question that may incriminate me, whether civil or criminal arising out of the alleged conduct.
                    </p>
                </div>

                <div className="mt-8 border-t pt-6">
                    <SignatureField label="Accused Signature" onEnd={(data) => updateNested('dossier.warnAndCaution.signature', data)} />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <Field label="Date" type="date" value={new Date().toISOString().split('T')[0]} onChange={() => { }} />
                        <Field label="Time" type="time" value={new Date().toTimeString().slice(0, 5)} onChange={() => { }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SignatureField({ label, onEnd }: { label: string, onEnd: (data: string | null) => void }) {
    const sigCanvas = useRef<any>(null);

    const handleClear = () => {
        sigCanvas.current.clear();
        onEnd(null);
    };

    const handleEnd = () => {
        if (sigCanvas.current) {
            onEnd(sigCanvas.current.toDataURL());
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">{label}</label>
                <button onClick={handleClear} className="text-[8px] text-red-500 font-bold hover:underline uppercase">Clear</button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-40">
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor='#000'
                    canvasProps={{ className: 'w-full h-full' }}
                    onEnd={handleEnd}
                />
            </div>
        </div>
    );
}
