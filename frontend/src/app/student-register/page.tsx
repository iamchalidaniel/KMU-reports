"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../config/constants";

type Status = "idle" | "submitting" | "success" | "error";

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Account Security
  const [sin, setSin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Academic Details
  const [name, setName] = useState(""); // Full Name
  const [program, setProgram] = useState("");
  const [year, setYear] = useState("2026");
  const [yearOfStudy, setYearOfStudy] = useState("4");
  const [deliveryMode, setDeliveryMode] = useState("FULLTIME");

  // Step 3: Personal Info
  const [firstName, setFirstName] = useState("");
  const [surName, setSurName] = useState("");
  const [nrc, setNrc] = useState("");
  const [passport, setPassport] = useState("");
  const [gender, setGender] = useState("MALE");
  const [maritalStatus, setMaritalStatus] = useState("SINGLE");
  const [nationality, setNationality] = useState("zambian");
  const [dateOfBirth, setDateOfBirth] = useState("2004-04-23");

  // Step 4: Address & Accommodation
  const [contact, setContact] = useState(""); // Also stored as phone
  const [province, setProvince] = useState("");
  const [town, setTown] = useState("");
  const [address, setAddress] = useState("");
  const [roomNo, setRoomNo] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => {
    if (step === 1) {
      if (!sin || !email || !password || !confirmPassword) {
        setError("Please fill in all required fields in this section.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    } else if (step === 2) {
      if (!program) {
        setError("Program is required.");
        return;
      }
    } else if (step === 3) {
      if (!firstName || !surName || !nrc) {
        setError("First Name, Surname and NRC are required.");
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      nextStep();
      return;
    }

    if (!roomNo) {
      setError("Room Number is required.");
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const res = await fetch(`${API_BASE_URL}/student-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sin,
          name: `${firstName} ${surName}`.trim(),
          contact, email, program, roomNo, password,
          year, gender, yearOfStudy, status: "REGISTERED", deliveryMode,
          firstName, surName, nrc, passport, maritalStatus, nationality,
          dateOfBirth, province, town, address, phone: contact
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed");
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center uppercase tracking-tight">
          Student Registration
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 text-center">
          Institutional Enrollment Portal • Authorized Personnel Only
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {status === "success" && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
            <p className="mb-2">Registration successful! You can now login with your Student ID and password.</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-green-800 underline font-medium hover:text-green-900"
            >
              Go to Login →
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="mb-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-8 text-sm text-green-700 dark:text-green-300 text-center animate-in fade-in scale-95 duration-300">
            <div className="text-4xl mb-4">🎉</div>
            <p className="mb-4 font-bold text-lg uppercase tracking-tight">Registration successful!</p>
            <p className="mb-8 font-medium opacity-80 uppercase text-[10px] tracking-widest">Your account has been created. Use your Student ID to access the dashboard.</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full bg-green-600 text-white rounded-lg py-3.5 font-bold hover:bg-green-700 transition-all shadow-sm uppercase text-[10px] tracking-widest"
            >
              Access Identity Matrix
            </button>
          </div>
        )}

        {status !== "success" && (
          <>
            {/* Progress Indicator */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 border ${step >= s
                      ? 'bg-kmuGreen text-white border-kmuGreen shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-100 dark:border-gray-700'
                      }`}
                  >
                    {s}
                  </div>
                ))}
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-kmuGreen transition-all duration-500 ease-out"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-4 text-center">
                Phase {step} of 4 • <span className="text-gray-900 dark:text-white">{
                  step === 1 ? "ACCOUNT SECURITY" :
                    step === 2 ? "ACADEMIC DETAILS" :
                      step === 3 ? "PERSONAL INFO" : "ADDRESS & ACCOMMODATION"
                }</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField label="SIN (Student ID)" value={sin} onChange={setSin} placeholder="e.g. 2024-000123" required />
                  <FormField label="Email" value={email} onChange={setEmail} placeholder="student@kmu.ac.zm" type="email" required />
                  <div className="relative">
                    <FormField
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      placeholder="At least 6 characters"
                      type={showPassword ? "text" : "password"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute bottom-2.5 right-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <FormField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Re-enter password"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField label="Program of Study" value={program} onChange={setProgram} placeholder="BSc ICT Education" required />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Academic Year" value={year} onChange={setYear} placeholder="2026" />
                    <FormField label="Year of Study" value={yearOfStudy} onChange={setYearOfStudy} placeholder="4" />
                  </div>
                  <SelectField
                    label="Delivery Mode"
                    value={deliveryMode}
                    onChange={setDeliveryMode}
                    options={[
                      { value: 'FULLTIME', label: 'Full-time' },
                      { value: 'DISTANCE', label: 'Distance' },
                      { value: 'PARTTIME', label: 'Part-time' }
                    ]}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="First Name" value={firstName} onChange={setFirstName} placeholder="DANIEL" required />
                    <FormField label="Surname" value={surName} onChange={setSurName} placeholder="CHALI" required />
                  </div>
                  <FormField label="NRC" value={nrc} onChange={setNrc} placeholder="310820/46/1" required />
                  <FormField label="Passport" value={passport} onChange={setPassport} placeholder="Optional" />
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Gender"
                      value={gender}
                      onChange={setGender}
                      options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]}
                    />
                    <SelectField
                      label="Marital Status"
                      value={maritalStatus}
                      onChange={setMaritalStatus}
                      options={[{ value: 'SINGLE', label: 'Single' }, { value: 'MARRIED', label: 'Married' }]}
                    />
                  </div>
                  <FormField label="Nationality" value={nationality} onChange={setNationality} placeholder="Zambian" />
                  <FormField label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField label="Phone / Contact" value={contact} onChange={setContact} placeholder="0772273500" required />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Province" value={province} onChange={setProvince} placeholder="MUCHINGA" />
                    <FormField label="Town" value={town} onChange={setTown} placeholder="CHINSALI" />
                  </div>
                  <FormField label="Address" value={address} onChange={setAddress} placeholder="CHOSHI" />
                  <FormField label="Room Number" value={roomNo} onChange={setRoomNo} placeholder="Z407" required />
                </div>
              )}

              <div className="flex gap-3 pt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase text-[10px] tracking-widest border border-gray-200 dark:border-gray-700"
                  >
                    Previous
                  </button>
                )}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className={`flex-[2] py-3 rounded-lg font-bold text-white transition-all shadow-sm uppercase text-[10px] tracking-widest ${status === "submitting"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-kmuGreen hover:bg-green-700 active:scale-95"
                    }`}
                >
                  {status === "submitting" ? "Registering..." : step < 4 ? "Continue" : "Complete Registration"}
                </button>
              </div>

              <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-kmuGreen font-bold hover:underline ml-1"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", required = false }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-tighter ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-kmuGreen outline-none transition-all"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-tighter ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-kmuGreen outline-none transition-all"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

