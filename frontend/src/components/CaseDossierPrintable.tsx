"use client";

import React from 'react';

interface CaseDossierPrintableProps {
    data: any;
    documentType: 'docket' | 'statement' | 'callout' | 'warnAndCaution';
}

export default function CaseDossierPrintable({ data, documentType }: CaseDossierPrintableProps) {
    const dossier = data?.dossier || {};
    const docket = dossier.occurrenceDocket || {};
    const wc = dossier.warnAndCaution || {};
    const signatures = dossier.signatures || {};

    const Header = () => (
        <div className="text-center mb-10">
            <img src="/kmu_logo.png" alt="KMU Logo" className="h-24 w-24 mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900">Kapasa Makasa University</h1>
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-800">Security Department</h2>
            <div className="w-40 h-1 bg-gray-900 mx-auto mt-2"></div>
        </div>
    );

    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <div className="border-y-2 border-gray-900 py-2 my-6 text-center">
            <h3 className="text-xl font-black uppercase tracking-widest">{children}</h3>
        </div>
    );

    const InfoRow = ({ label, value, dots = true }: { label: string, value?: string, dots?: boolean }) => (
        <div className="flex items-end gap-2 mb-4">
            <span className="font-bold uppercase text-sm whitespace-nowrap">{label}:</span>
            <span className={`flex-1 border-gray-400 min-h-[1.5rem] ${dots ? 'border-b border-dotted' : ''} text-lg font-serif px-2`}>
                {value || ''}
            </span>
        </div>
    );

    if (documentType === 'docket') {
        return (
            <div className="p-16 bg-white text-black min-h-screen font-serif" id="printable-docket">
                <Header />
                <SectionTitle>Occurrence Docket Cover</SectionTitle>

                <div className="grid grid-cols-1 gap-2 mt-8">
                    <InfoRow label="Investigating Officer" value={docket.investigatingOfficer} />
                    <InfoRow label="Occurrence Book Number" value={docket.occurrenceBookNumber} />
                    <InfoRow label="Date & Time Reported" value={docket.dateTimeReported} />
                </div>

                <div className="grid grid-cols-2 gap-12 mt-12">
                    <div className="space-y-4">
                        <h4 className="font-bold underline text-center mb-6">PARTICULARS OF THE COMPLAINANT</h4>
                        <InfoRow label="Name" value={docket.complainant?.name} />
                        <InfoRow label="Residential Address" value={docket.complainant?.address} />
                        <InfoRow label="SIN/Phone No" value={docket.complainant?.phone} />
                        <InfoRow label="Year of study" value={docket.complainant?.yearOfStudy} />
                        <InfoRow label="Program of study" value={docket.complainant?.programOfStudy} />
                        <InfoRow label="Sex/Age" value={`${docket.complainant?.sex || ''} / ${docket.complainant?.age || ''}`} />
                        <InfoRow label="Nationality/Tribe" value={`${docket.complainant?.nationality || ''} / ${docket.complainant?.tribe || ''}`} />
                        <InfoRow label="Village" value={docket.complainant?.village} />
                        <InfoRow label="Chief" value={docket.complainant?.chief} />
                        <InfoRow label="District" value={docket.complainant?.district} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold underline text-center mb-6">PARTICULARS OF THE ACCUSED</h4>
                        <InfoRow label="Name" value={docket.accused?.name} />
                        <InfoRow label="Residential Address" value={docket.accused?.address} />
                        <InfoRow label="SIN/Phone No" value={docket.accused?.phone} />
                        <InfoRow label="Year of study" value={docket.accused?.yearOfStudy} />
                        <InfoRow label="Program of study" value={docket.accused?.programOfStudy} />
                        <InfoRow label="Sex/Age" value={`${docket.accused?.sex || ''} / ${docket.accused?.age || ''}`} />
                        <InfoRow label="Nationality/Tribe" value={`${docket.accused?.nationality || ''} / ${docket.accused?.tribe || ''}`} />
                        <InfoRow label="Village" value={docket.accused?.village} />
                        <InfoRow label="Chief" value={docket.accused?.chief} />
                        <InfoRow label="District" value={docket.accused?.district} />
                    </div>
                </div>

                <div className="mt-12 space-y-6">
                    <InfoRow label="Offence" value={docket.offence} />
                    <div className="flex flex-col gap-2">
                        <span className="font-bold uppercase text-sm">Date, Time and Place of occurrence:</span>
                        <p className="border-b border-dotted border-gray-400 min-h-[4rem] px-2 text-lg">{docket.occurrenceDetails}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <InfoRow label="Value of damaged or stolen property" value={docket.damagedValue} />
                        <InfoRow label="Value of property recovered" value={docket.recoveredValue} />
                    </div>
                    <InfoRow label="Manner and date of disposal by the disciplinary committee" value={docket.disposalManner} />
                </div>

                <div className="mt-20 flex justify-between">
                    <div className="text-center">
                        {signatures.investigatingOfficer && <img src={signatures.investigatingOfficer} className="h-16 w-32 mx-auto object-contain" />}
                        <div className="w-48 border-t border-gray-900 pt-2 font-bold uppercase text-xs">Investigating Officer</div>
                    </div>
                    <div className="text-center">
                        {signatures.complainant && <img src={signatures.complainant} className="h-16 w-32 mx-auto object-contain" />}
                        <div className="w-48 border-t border-gray-900 pt-2 font-bold uppercase text-xs">Complainant Signature</div>
                    </div>
                </div>
            </div>
        );
    }

    if (documentType === 'statement') {
        return (
            <div className="p-16 bg-white text-black min-h-screen font-serif" id="printable-statement">
                <Header />
                <SectionTitle>Statement Pad</SectionTitle>
                {dossier.statements?.map((s: any, idx: number) => (
                    <div key={idx} className="page-break-after-always">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 mt-10">
                            <InfoRow label="Full Name" value={s.fullName} />
                            <InfoRow label="SIN No" value={s.sin} />
                            <InfoRow label="Sex/Age" value={`${s.sex || ''} / ${s.age || ''}`} />
                            <InfoRow label="Occupation/Prog" value={s.occupation} />
                            <InfoRow label="Phone No" value={s.phone} />
                            <InfoRow label="Tribe" value={s.tribe} />
                            <InfoRow label="Village" value={s.village} />
                            <InfoRow label="Chief" value={s.chief} />
                            <InfoRow label="District" value={s.district} />
                            <InfoRow label="Residential Address" value={s.residentialAddress} />
                            <InfoRow label="Business Address" value={s.businessAddress} />
                        </div>
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                                <p className="text-sm italic font-bold">Taken on {s.takenAt} at {s.time || '____'} hours.</p>
                                {s.audioUrl && <span className="text-[10px] border border-black px-2 py-0.5 rounded font-black uppercase">Audio Statement Recorded</span>}
                            </div>
                            <div className="text-lg leading-[2.5rem] underline decoration-dotted decoration-gray-300 underline-offset-8 whitespace-pre-wrap min-h-[40vh]">
                                {s.content}
                            </div>
                        </div>
                        <div className="mt-12 text-center italic font-bold">"Read over and admitted to be correctly recorded."</div>
                        <div className="mt-16 flex justify-end">
                            <div className="text-center">
                                {s.signature && <img src={s.signature} className="h-16 w-32 mx-auto object-contain" />}
                                <div className="w-64 border-t border-gray-900 pt-2 font-bold uppercase text-xs">Signature of Deponent</div>
                                <div className="text-[10px] mt-1">Date: {s.takenAt} • Time: {s.time}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (documentType === 'warnAndCaution') {
        return (
            <div className="p-16 bg-white text-black min-h-screen font-serif" id="printable-warnandcaution">
                <Header />
                <SectionTitle>Warn and Caution</SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8 mt-10">
                    <InfoRow label="Full Names" value={wc.fullName} />
                    <InfoRow label="Sex" value={wc.sex} />
                    <InfoRow label="Tribe" value={wc.tribe} />
                    <InfoRow label="Age" value={wc.age} />
                    <InfoRow label="Residential Address" value={wc.address} />
                    <InfoRow label="Village" value={wc.village} />
                    <InfoRow label="Chief" value={wc.chief} />
                    <InfoRow label="District" value={wc.district} />
                    <InfoRow label="Program of Study" value={wc.program} />
                    <InfoRow label="Occupation" value={wc.occupation} />
                    <InfoRow label="SIN" value={wc.sin} />
                    <InfoRow label="Phone No" value={wc.phone} />
                </div>

                <div className="bg-gray-50 border p-6 my-8 italic text-sm font-bold">
                    Taken on: {wc.takenAt} at {wc.time} hours. <br />
                    At: {wc.place} At Kapasa Makasa University in the Chinsali District of Muchinga Province...
                </div>

                <div className="text-lg leading-relaxed space-y-6 text-justify">
                    <p>
                        I have been warned and cautioned that a case of <strong>{wc.offence}</strong>
                        which was committed on <strong>{wc.occurrenceDate}</strong> at <strong>{wc.occurrenceTime}</strong> hours
                        at {wc.occurrencePlace} is being investigated against me.
                    </p>
                    <p>
                        I have further been warned and cautioned to make any statement in reply to the allegation against me but that, I am not obliged to make any statement against myself. I have also been informed that any statement that will be taken down in writing, I am not obliged to answer any question put across to me but if I do, it will be taken down in writing and may be used in the University disciplinary proceedings.
                    </p>
                    <p>
                        I have been informed that should this matter be referred to a disciplinary hearing, I may bring my own witness(es) to the hearing. I have also been informed that I am not obliged to answer any question that may incriminate me, whether civil or criminal arising out of the alleged conduct.
                    </p>
                </div>

                <div className="mt-24 flex justify-end">
                    <div className="text-center">
                        {wc.signature && <img src={wc.signature} className="h-16 w-32 mx-auto object-contain" />}
                        <div className="w-64 border-t border-gray-900 pt-2 font-bold uppercase text-xs">Accused Signature / Left Thumb Print</div>
                        <div className="text-[10px] mt-1">Date: {wc.takenAt} • Time: {wc.time}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (documentType === 'callout') {
        return (
            <div className="p-16 bg-white text-black h-[50vh] border-2 border-double border-black m-8 font-serif" id="printable-callout">
                <Header />
                <SectionTitle>Call Out</SectionTitle>
                <div className="space-y-4 text-lg">
                    <InfoRow label="Full Names" value={wc.fullName} />
                    <div className="grid grid-cols-3 gap-4">
                        <InfoRow label="Sex" value={wc.sex} />
                        <InfoRow label="Age" value={wc.age} />
                        <InfoRow label="SIN" value={wc.sin} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Program" value={wc.program} />
                        <InfoRow label="Year" value={wc.yearOfStudy} />
                    </div>
                    <InfoRow label="Residential Address" value={wc.address} />
                    <p className="mt-8 font-bold">You are required to report to the Security Officer's office at ____________ hours on ____________ without fail.</p>
                    <InfoRow label="Appointment" value="" />
                    <div className="mt-12 flex justify-end">
                        <div className="w-48 border-t border-gray-900 pt-2 font-bold uppercase text-center text-xs">Signature</div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
