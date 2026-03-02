"use client";

import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { API_BASE_URL } from '../config/constants';
import { authHeaders } from '../utils/api';
import SmartStudentSearch from './SmartStudentSearch';
import SmartStaffSearch from './SmartStaffSearch';

interface CaseDossierFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CaseDossierForm({ onSuccess, onCancel }: CaseDossierFormProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const sigPad = useRef<any>(null);

    // Form State
    const [formData, setFormData] = useState<any>({
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
            }
        }
    });

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('kmu_case_draft');
        if (saved) {
            try {
                setFormData(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('kmu_case_draft', JSON.stringify(formData));
    }, [formData]);

    const updateNested = (path: string, value: any) => {
        const keys = path.split('.');
        const newData = { ...formData };
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
                    student_id: formData.dossier.occurrenceDocket.accused.phone // fallback or use specific SIN
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
                            <Field label="Investigating Officer" value={formData.dossier.occurrenceDocket.investigatingOfficer} onChange={(v) => updateNested('dossier.occurrenceDocket.investigatingOfficer', v)} />
                            <Field label="OB Number" value={formData.ob_number} onChange={(v) => { setFormData({ ...formData, ob_number: v }); updateNested('dossier.occurrenceDocket.occurrenceBookNumber', v); }} />
                            <Field label="Date & Time Reported" type="datetime-local" value={formData.dossier.occurrenceDocket.dateTimeReported} onChange={(v) => updateNested('dossier.occurrenceDocket.dateTimeReported', v)} />
                        </div>

                        <section className="space-y-4">
                            <h3 className="font-bold text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded uppercase tracking-wider">Particulars of Complainant</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Full Name" value={formData.dossier.occurrenceDocket.complainant.name} onChange={(v) => updateNested('dossier.occurrenceDocket.complainant.name', v)} />
                                <Field label="SIN / Phone" value={formData.dossier.occurrenceDocket.complainant.phone} onChange={(v) => updateNested('dossier.occurrenceDocket.complainant.phone', v)} />
                                <Field label="Residential Address" value={formData.dossier.occurrenceDocket.complainant.address} onChange={(v) => updateNested('dossier.occurrenceDocket.complainant.address', v)} />
                                <Field label="Program / Year" value={formData.dossier.occurrenceDocket.complainant.programOfStudy} onChange={(v) => updateNested('dossier.occurrenceDocket.complainant.programOfStudy', v)} />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="font-bold text-sm bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 p-2 rounded uppercase tracking-wider">Particulars of Accused</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Full Name" value={formData.dossier.occurrenceDocket.accused.name} onChange={(v) => updateNested('dossier.occurrenceDocket.accused.name', v)} />
                                <Field label="SIN / Phone" value={formData.dossier.occurrenceDocket.accused.phone} onChange={(v) => updateNested('dossier.occurrenceDocket.accused.phone', v)} />
                                <Field label="Residential Address" value={formData.dossier.occurrenceDocket.accused.address} onChange={(v) => updateNested('dossier.occurrenceDocket.accused.address', v)} />
                                <Field label="Program / Year" value={formData.dossier.occurrenceDocket.accused.programOfStudy} onChange={(v) => updateNested('dossier.occurrenceDocket.accused.programOfStudy', v)} />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <Field label="Offence" value={formData.dossier.occurrenceDocket.offence} onChange={(v) => updateNested('dossier.occurrenceDocket.offence', v)} placeholder="e.g. Theft of university property" />
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Details of Occurrence</label>
                                <textarea rows={4} className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm" value={formData.dossier.occurrenceDocket.occurrenceDetails} onChange={(e) => updateNested('dossier.occurrenceDocket.occurrenceDetails', e.target.value)} />
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
                            <SignatureField label="Investigating Officer Signature" onEnd={(data) => updateNested('dossier.signatures.investigatingOfficer', data)} />
                            <SignatureField label="Complainant Signature" onEnd={(data) => updateNested('dossier.signatures.complainant', data)} />
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

function Field({ label, value, onChange, type = "text", placeholder = "" }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-kmuGreen outline-none transition"
            />
        </div>
    );
}

function StatementList({ formData, setFormData }: any) {
    const [activeStatement, setActiveStatement] = useState<any>(null);

    const addStatement = () => {
        const newStatement = {
            id: Date.now(), fullName: '', content: '', takenAt: new Date().toISOString().slice(0, 10),
            phone: '', residentialAddress: '', tribe: '', village: '', active: true
        };
        setActiveStatement(newStatement);
    };

    const saveActive = () => {
        const updated = [...formData.dossier.statements, activeStatement];
        setFormData('dossier.statements', updated);
        setActiveStatement(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <h3 className="font-bold uppercase tracking-widest text-xs">Recorded Statements ({formData.dossier.statements.length})</h3>
                <button onClick={addStatement} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg">+ ADD STATEMENT</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {formData.dossier.statements.map((s: any, i: number) => (
                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/40">
                        <div className="flex justify-between font-bold text-sm">
                            <span>{s.fullName}</span>
                            <span className="text-gray-400">{s.takenAt}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.content}</p>
                    </div>
                ))}
            </div>

            {activeStatement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <h4 className="text-xl font-bold mb-6">Record New Statement</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <Field label="Full Name" value={activeStatement.fullName} onChange={(v: any) => setActiveStatement({ ...activeStatement, fullName: v })} />
                            <Field label="Date" type="date" value={activeStatement.takenAt} onChange={(v: any) => setActiveStatement({ ...activeStatement, takenAt: v })} />
                            <Field label="Phone" value={activeStatement.phone} onChange={(v: any) => setActiveStatement({ ...activeStatement, phone: v })} />
                            <Field label="Residential Address" value={activeStatement.residentialAddress} onChange={(v: any) => setActiveStatement({ ...activeStatement, residentialAddress: v })} />
                        </div>
                        <textarea
                            placeholder="I do recall very well that..."
                            rows={10}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm mb-6"
                            value={activeStatement.content}
                            onChange={(e) => setActiveStatement({ ...activeStatement, content: e.target.value })}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setActiveStatement(null)} className="px-6 py-2 text-gray-500 font-bold">CANCEL</button>
                            <button onClick={saveActive} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg">SAVE STATEMENT</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WarnAndCaution({ formData, updateNested }: any) {
    const wc = formData.dossier.warnAndCaution;
    return (
        <div className="space-y-6">
            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-xs leading-relaxed text-red-900 dark:text-red-300 italic">
                "I have been warned and cautioned that a case of <strong>{formData.dossier.occurrenceDocket.offence || '[OFFENCE]'}</strong> which was committed on {formData.dossier.occurrenceDocket.dateTimeReported.split('T')[0]} is being investigated against me. I have further been warned and cautioned to make any statement in reply to the allegation but that, I am not obliged to make any statement against myself..."
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Statement Place" value={wc.place} onChange={(v: any) => updateNested('dossier.warnAndCaution.place', v)} placeholder="e.g. Kapasa Makasa University" />
                <Field label="Village" value={wc.village} onChange={(v: any) => updateNested('dossier.warnAndCaution.village', v)} />
                <Field label="Chief" value={wc.chief} onChange={(v: any) => updateNested('dossier.warnAndCaution.chief', v)} />
                <Field label="District" value={wc.district} onChange={(v: any) => updateNested('dossier.warnAndCaution.district', v)} />
                <Field label="Tribe" value={wc.tribe} onChange={(v: any) => updateNested('dossier.warnAndCaution.tribe', v)} />
                <Field label="Age" value={wc.age} onChange={(v: any) => updateNested('dossier.warnAndCaution.age', v)} />
            </div>
        </div>
    );
}

function SignatureField({ label, onEnd }: any) {
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
