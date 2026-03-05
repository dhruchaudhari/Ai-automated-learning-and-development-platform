import React, { useState, useEffect } from "react";
import ModalContainer from "./ModalContainer";
import {
    FaInfoCircle,
    FaCheckCircle,
    FaSpinner,
    FaExclamationCircle,
    FaUser,
    FaGraduationCap,
    FaBrain,
    FaFileAlt,
    FaBullhorn,
    FaLightbulb,
} from "react-icons/fa";
import { DEGREE_SPECIALIZATIONS } from "../utils/constants";
import { advertisementAPI } from "../utils/api";

/* ───────────────────────────────────────────
   Section collapse helper for Info Pane
   ─────────────────────────────────────────── */
const InfoSection = ({ title, icon: Icon, children }) => (
    <div className="mb-4 bg-white/50 border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
            {Icon && <Icon className="text-gray-400 text-sm" />}
            <span className="text-[13px] font-medium text-gray-700">{title}</span>
        </div>
        <div className="p-3 space-y-3">
            {children}
        </div>
    </div>
);

/* ───────────────────────────────────────────
   Field info row
   ─────────────────────────────────────────── */
const FieldInfo = ({ field, rules, headers }) => (
    <div className="text-[12px] leading-relaxed">
        <div className="flex items-baseline gap-1.5">
            <span className="font-medium text-gray-800">{field}:</span>
            <span className="text-gray-600">{rules}</span>
        </div>
        {headers && (
            <div className="text-[10px] text-gray-400 mt-0.5">
                Accepts: {headers.join(", ")}
            </div>
        )}
    </div>
);

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
const BulkUploadCorrectionModal = ({ isOpen, onClose, records, onSubmit, isSubmitting }) => {
    const [editedRecords, setEditedRecords] = useState([]);
    const [activeAds, setActiveAds] = useState([]);

    // Load Active Advertisements
    useEffect(() => {
        if (isOpen) {
            advertisementAPI
                .getAll()
                .then((res) => {
                    const ads = res.data?.data || res.data || [];
                    setActiveAds(ads.map((ad) => ad.name || ad.title || "Untitled"));
                })
                .catch(() => setActiveAds([]));
        }
    }, [isOpen]);

    // Load Records
    useEffect(() => {
        if (isOpen && records) {
            setEditedRecords(
                records.map((r) => ({
                    ...r.originalData,
                    row: r.row,
                    name: r.name,
                    originalFieldErrors: r.fieldErrors,
                }))
            );
        }
    }, [isOpen, records]);

    const handleChange = (index, field, value) => {
        const newRecords = [...editedRecords];
        newRecords[index] = { ...newRecords[index], [field]: value };
        setEditedRecords(newRecords);
    };

    const handleSave = () => {
        const formattedRecords = editedRecords.map((r) => ({
            fullName: r.fullName,
            fathersName: r.fathersName,
            email: r.email,
            mobile: r.mobile,
            gender: r.gender,
            dob: r.dob,
            password: r.password || "User@123",
            permanentAddress: r.permanentAddress,
            state: r.state,
            advertisements: r.advertisements,
            technical: r.technical,
            creative: r.creative,
            cognitive: r.cognitive,
            tools: r.tools,
            ethics: r.ethics,
            profileImage: r.profileImage,
            resume: r.resume,
            identityProof: r.identityProof,
            education: {
                tenth: {
                    board: r.tenthBoard || "",
                    passingYear: parseInt(r.tenthPassingYear) || 1950,
                    percentage: parseFloat(r.tenthPercentage) || 0,
                    marksheetUrl: r.tenthMarksheet || "",
                },
                twelfth: {
                    board: r.twelfthBoard || "",
                    passingYear: parseInt(r.twelfthPassingYear) || 1950,
                    percentage: parseFloat(r.twelfthPercentage) || 0,
                    marksheetUrl: r.twelfthMarksheet || "",
                },
                graduation: {
                    degree: r.graduationDegree || "",
                    specialization: r.graduationSpecialization || "",
                    passingYear: parseInt(r.graduationPassingYear) || 1950,
                    percentage: parseFloat(r.graduationPercentage) || 0,
                    cgpa: r.graduationCGPA !== undefined && r.graduationCGPA !== "" ? parseFloat(r.graduationCGPA) : null,
                    marksheetUrl: r.graduationMarksheet || "",
                },
                qualifyingDegree: {
                    degree: r.qualifyingDegree || "",
                    specialization: r.qualifyingSpecialization || "",
                    percentage: r.qualifyingPercentage !== undefined && r.qualifyingPercentage !== "" ? parseFloat(r.qualifyingPercentage) : 0,
                    marksheetUrl: r.qualifyingMarksheet || "",
                },
            },
        }));

        onSubmit(formattedRecords);
    };

    if (!isOpen) return null;

    // Render text input or select based on options
    const renderField = (idx, label, field, type = "text", options = null, optionalText = "") => {
        const record = editedRecords[idx];
        const hasError = record.originalFieldErrors?.[field];

        return (
            <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500 block">
                    {label} {optionalText && <span className="text-gray-400 font-normal">({optionalText})</span>}
                </label>
                {options ? (
                    <select
                        className={`w-full px-2.5 py-1.5 border rounded-md text-[13px] transition-colors focus:ring-2 focus:ring-primary-100 outline-none
              ${hasError ? "border-red-300 bg-red-50 text-red-900 focus:border-red-400" : "border-gray-200 bg-white focus:border-primary-400"}
            `}
                        value={record[field] || ""}
                        onChange={(e) => handleChange(idx, field, e.target.value)}
                    >
                        <option value="">Select option...</option>
                        {options.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={type}
                        className={`w-full px-2.5 py-1.5 border rounded-md text-[13px] transition-colors focus:ring-2 focus:ring-primary-100 outline-none
              ${hasError ? "border-red-300 bg-red-50 text-red-900 focus:border-red-400" : "border-gray-200 bg-white focus:border-primary-400"}
            `}
                        value={record[field] || ""}
                        onChange={(e) => handleChange(idx, field, e.target.value)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                    />
                )}
                {hasError && (
                    <div className="flex items-start gap-1 mt-1">
                        <FaExclamationCircle className="text-red-500 text-[10px] mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-red-500 font-medium leading-tight">{hasError}</p>
                    </div>
                )}
            </div>
        );
    };

    const degreeOptions = Object.keys(DEGREE_SPECIALIZATIONS);
    const gradDegreeOptions = degreeOptions.filter((d) => d.startsWith("Bachelor"));
    const pgDegreeOptions = degreeOptions.filter((d) => d.startsWith("Master"));

    return (
        <ModalContainer isOpen={isOpen} onClose={onClose} title="Validation errors" size="max-w-[95vw] w-full" footer={null}>
            <div className="flex flex-col h-[88vh] bg-slate-50/50">

                {/* Header Ribbon */}
                <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <FaInfoCircle size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-gray-800">Please correct the highlighted errors</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Rows that failed validation require correction before they can be synchronized.</p>
                        </div>
                    </div>
                    <div className="px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium text-sm flex items-center gap-2">
                        <FaExclamationCircle />
                        <span>{editedRecords.length} rows need attention</span>
                    </div>
                </div>

                {/* Main Split Content */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Pane: Error Rows (Correction Area) */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                        <div className="space-y-6">
                            {editedRecords.map((record, idx) => {
                                const gradDegree = record.graduationDegree;
                                const gradSpecOptions = gradDegree && DEGREE_SPECIALIZATIONS[gradDegree] ? DEGREE_SPECIALIZATIONS[gradDegree] : null;

                                const pgDegree = record.qualifyingDegree;
                                const pgSpecOptions = pgDegree && DEGREE_SPECIALIZATIONS[pgDegree] ? DEGREE_SPECIALIZATIONS[pgDegree] : null;

                                return (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                                        <div className="bg-gray-50/80 px-5 py-3 border-b flex justify-between items-center">
                                            <span className="text-[13px] font-medium text-gray-500">Row {record.row} from spreadsheet</span>
                                            <span className="text-[13px] font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-md border border-primary-100">
                                                {record.name || "Unknown name"}
                                            </span>
                                        </div>

                                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                                            {/* Personal */}
                                            <div className="space-y-4">
                                                <h4 className="text-[13px] font-medium text-gray-800 border-b pb-2">Personal info</h4>
                                                {renderField(idx, "Full name", "fullName")}
                                                {renderField(idx, "Father's name", "fathersName")}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {renderField(idx, "Gender", "gender", "text", ["Male", "Female", "Other"])}
                                                    {renderField(idx, "Date of birth", "dob", "date")}
                                                </div>
                                                {renderField(idx, "Email address", "email", "email")}
                                                {renderField(idx, "Mobile number", "mobile", "tel")}
                                                {renderField(idx, "State", "state")}
                                                {renderField(idx, "Permanent address", "permanentAddress")}
                                            </div>

                                            {/* Education Base */}
                                            <div className="space-y-4">
                                                <h4 className="text-[13px] font-medium text-gray-800 border-b pb-2">School education</h4>

                                                <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
                                                    <span className="text-[11px] font-medium text-slate-500">10th grade</span>
                                                    {renderField(idx, "Board", "tenthBoard")}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {renderField(idx, "Passing year", "tenthPassingYear")}
                                                        {renderField(idx, "Percentage", "tenthPercentage")}
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
                                                    <span className="text-[11px] font-medium text-slate-500">12th grade</span>
                                                    {renderField(idx, "Board", "twelfthBoard")}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {renderField(idx, "Passing year", "twelfthPassingYear")}
                                                        {renderField(idx, "Percentage", "twelfthPercentage")}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Education Higher */}
                                            <div className="space-y-4">
                                                <h4 className="text-[13px] font-medium text-gray-800 border-b pb-2">Higher education</h4>

                                                <div className="p-3 bg-blue-50/50 rounded-lg space-y-3 border border-blue-50">
                                                    <span className="text-[11px] font-medium text-blue-600">Graduation (required)</span>
                                                    {renderField(idx, "Degree", "graduationDegree", "text", gradDegreeOptions)}
                                                    {renderField(idx, "Specialization", "graduationSpecialization", "text", gradSpecOptions)}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {renderField(idx, "Percentage", "graduationPercentage")}
                                                        {renderField(idx, "CGPA", "graduationCGPA", "text", null, "optional")}
                                                    </div>
                                                    {renderField(idx, "Passing year", "graduationPassingYear")}
                                                </div>

                                                <div className="p-3 bg-violet-50/50 rounded-lg space-y-3 border border-violet-50">
                                                    <span className="text-[11px] font-medium text-violet-600">Qualifying master's (optional)</span>
                                                    {renderField(idx, "Degree", "qualifyingDegree", "text", pgDegreeOptions)}
                                                    {renderField(idx, "Specialization", "qualifyingSpecialization", "text", pgSpecOptions)}
                                                    {renderField(idx, "Percentage", "qualifyingPercentage")}
                                                </div>
                                            </div>

                                            {/* Skills, Ads, Docs */}
                                            <div className="space-y-4">
                                                <h4 className="text-[13px] font-medium text-gray-800 border-b pb-2">Skills & assignments</h4>

                                                <div className="space-y-3">
                                                    {renderField(idx, "Advertisements", "advertisements", "text", activeAds.length > 0 ? [...activeAds, ""] : null, "select active ad")}

                                                    <div className="grid grid-cols-2 gap-3">
                                                        {renderField(idx, "Technical skills", "technical")}
                                                        {renderField(idx, "Creative skills", "creative")}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {renderField(idx, "Cognitive skills", "cognitive")}
                                                        {renderField(idx, "Tools", "tools")}
                                                    </div>
                                                    {renderField(idx, "Ethics & values", "ethics")}

                                                    <div className="pt-2">
                                                        <span className="text-[11px] font-medium text-emerald-600 block mb-2">Document links</span>
                                                        {renderField(idx, "Profile photo URL", "profileImage")}
                                                        {renderField(idx, "Resume URL", "resume")}
                                                        {renderField(idx, "Identity proof URL", "identityProof")}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Pane: Info Reference */}
                    <div className="w-[380px] shrink-0 border-l border-gray-200 bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.02)] flex flex-col">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                <FaLightbulb className="text-amber-500" /> Validation reference
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                            <div className="space-y-4">
                                <p className="text-[12px] text-gray-500 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                    Refer to these rules to fix the errors highlighted in red. The system enforces strict matching for dropdown fields.
                                </p>

                                <InfoSection title="Personal information" icon={FaUser}>
                                    <FieldInfo field="Email" rules="Must be valid and unique" headers={["email", "emailid"]} />
                                    <FieldInfo field="Mobile" rules="Exactly 10 digits" headers={["mobile", "phone"]} />
                                    <FieldInfo field="Gender" rules="Male, Female, or Other" />
                                    <FieldInfo field="Date of birth" rules="Valid past date (YYYY-MM-DD)" />
                                </InfoSection>

                                <InfoSection title="Education requirements" icon={FaGraduationCap}>
                                    <FieldInfo field="Passing year" rules="Between 1950 and current year" />
                                    <FieldInfo field="Percentage" rules="0 to 100" />
                                    <FieldInfo field="CGPA" rules="0 to 10 (if provided instead of %)" />
                                    <div className="mt-3 text-[11px] bg-amber-50 p-2 rounded text-amber-800 border border-amber-100">
                                        <strong>Important:</strong> Graduation and Qualifying degree names, as well as their specializations, must exactly match the options available in the dropdowns.
                                    </div>
                                </InfoSection>

                                <InfoSection title="Skills & capabilities" icon={FaBrain}>
                                    <FieldInfo field="Format" rules="Comma-separated values" />
                                    <div className="text-[11px] text-gray-500 mt-1">
                                        At least one item must be provided for every skill category (Technical, Creative, Cognitive, Tools, Ethics).
                                    </div>
                                </InfoSection>

                                <InfoSection title="Advertisements" icon={FaBullhorn}>
                                    <FieldInfo field="Format" rules="Exact advertisement name" />
                                    <div className="text-[11px] text-gray-500 mt-1">
                                        Users must be assigned to at least one active advertisement. You must select from the dropdown.
                                    </div>
                                </InfoSection>

                                <InfoSection title="Document URLs" icon={FaFileAlt}>
                                    <FieldInfo field="Links" rules="Valid URLs required" />
                                    <div className="text-[11px] text-gray-500 mt-1">
                                        Profile photo, resume, and ID proof require valid external links to the documents.
                                    </div>
                                </InfoSection>

                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Action Area */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end items-center gap-4 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] z-10">
                    <button
                        onClick={onClose}
                        className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                        Cancel and discard
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <FaSpinner className="animate-spin text-sm" /> Saving corrections...
                            </>
                        ) : (
                            <>
                                Synchronize records <FaCheckCircle className="text-sm" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </ModalContainer>
    );
};

export default BulkUploadCorrectionModal;
