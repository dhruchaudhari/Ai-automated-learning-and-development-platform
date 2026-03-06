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

const degreeOptions = Object.keys(DEGREE_SPECIALIZATIONS);
const gradDegreeOptions = degreeOptions.filter((d) => d.startsWith("Bachelor"));
const pgDegreeOptions = degreeOptions.filter((d) => d.startsWith("Master"));

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
const BulkUploadCorrectionModal = ({ isOpen, onClose, records, mapping = {}, onSubmit, onRecordUpdate, isSubmitting, uploadedFileName }) => {
    const [editedRecords, setEditedRecords] = useState([]);
    const [activeAds, setActiveAds] = useState([]);
    const lastRecordsRef = React.useRef(null);

    // Load Active Advertisements
    useEffect(() => {
        if (isOpen) {
            advertisementAPI
                .getActive()
                .then((res) => {
                    const ads = res.data?.data || res.data || [];
                    setActiveAds(ads.map((ad) => ad.name || ad.title || "Untitled"));
                })
                .catch(() => setActiveAds([]));
        }
    }, [isOpen]);

    const validateField = (field, value, record) => {
        let error = null;
        const currentYear = new Date().getFullYear();

        // 1:1 Required Fields from Register.jsx
        const requiredFields = [
            "fullName", "fathersName", "gender", "email", "password",
            "mobile", "dob", "permanentAddress", "state", "tenthBoard", "tenthPassingYear",
            "tenthPercentage", "twelfthBoard", "twelfthPassingYear", "twelfthPercentage",
            "graduationDegree", "graduationSpecialization", "graduationPassingYear", "graduationPercentage",
            "advertisements", "technical", "creative", "cognitive", "tools", "ethics",
            "profileImage", "resume", "tenthMarksheet", "twelfthMarksheet", "graduationMarksheet", "identityProof"
        ];

        // Required check
        if (requiredFields.includes(field)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                return `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
            }
        }

        // Specific pattern/option checks (skip if empty as required check handled it)
        if (value) {
            switch (field) {
                case "fullName":
                case "fathersName":
                    if (value.length < 3) error = `${field === 'fullName' ? 'Full' : "Father's"} name must be at least 3 characters`;
                    else if (value.length > 100) error = `${field === 'fullName' ? 'Full' : "Father's"} name is too long (max 100 characters)`;
                    else if (!/^[A-Za-z\s.]+$/.test(value)) error = `${field === 'fullName' ? 'Full' : "Father's"} name should contain only letters, spaces, and dots`;
                    break;
                case "mobile":
                    let cleanPhone = String(value || "").replace(/\D/g, "");
                    // Support +91 or 91 prefix
                    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
                        cleanPhone = cleanPhone.substring(2);
                    }
                    if (!cleanPhone) return "Mobile number is required";
                    if (cleanPhone.length !== 10) return "India phone numbers must have 10 digits";
                    if (!/^[6-9]\d{9}$/.test(cleanPhone))
                        return "Invalid India number. Must start with 6, 7, 8, or 9";
                    return "";
                case "email":
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) error = "Invalid email format";
                    break;
                case "dob":
                    if (new Date(value) > new Date()) error = "Date of birth cannot be in the future";
                    break;
                case "permanentAddress":
                    if (value.length < 10) error = "Address must be at least 10 characters long";
                    else if (value.length > 500) error = "Address cannot exceed 500 characters";
                    break;
                case "gender":
                    if (!["Male", "Female", "Other"].includes(value)) error = "Gender must be Male, Female, or Other";
                    break;
                case "graduationDegree": {
                    const match = gradDegreeOptions.find(opt => opt.toLowerCase() === value.toLowerCase());
                    if (!match) error = "Must select a valid Bachelor's degree";
                    break;
                }
                case "graduationSpecialization": {
                    const options = record?.graduationDegree && DEGREE_SPECIALIZATIONS[record.graduationDegree] ? DEGREE_SPECIALIZATIONS[record.graduationDegree] : [];
                    const match = options.find(opt => opt.toLowerCase() === value.toLowerCase());
                    if (!match) error = "Invalid specialization for the selected degree";
                    break;
                }
                case "qualifyingDegree": {
                    const match = pgDegreeOptions.find(opt => opt.toLowerCase() === value.toLowerCase());
                    if (!match) error = "Must select a valid Master's degree";
                    break;
                }
                case "qualifyingSpecialization": {
                    const options = record?.qualifyingDegree && DEGREE_SPECIALIZATIONS[record.qualifyingDegree] ? DEGREE_SPECIALIZATIONS[record.qualifyingDegree] : [];
                    const match = options.find(opt => opt.toLowerCase() === value.toLowerCase());
                    if (!match) error = "Invalid specialization for the selected qualifying degree";
                    break;
                }
                case "advertisements": {
                    const adsArray = Array.isArray(value) ? value : (value ? value.split(/[,;]/).map(s => s.trim()) : []);
                    if (adsArray.length === 0) {
                        error = "At least one advertisement must be selected";
                    } else {
                        const invalidAds = adsArray.filter(ad => !activeAds.some(opt => opt.toLowerCase() === ad.toLowerCase()));
                        if (invalidAds.length > 0) {
                            error = `Invalid advertisement(s): ${invalidAds.join(", ")}`;
                        }
                    }
                    break;
                }
                case "tenthPercentage":
                case "twelfthPercentage":
                case "graduationPercentage":
                case "qualifyingPercentage":
                    const percent = parseFloat(value);
                    if (isNaN(percent)) error = "Please enter a valid percentage";
                    else if (percent < 0 || percent > 100) error = "Percentage must be between 0 and 100";
                    break;
                case "graduationCGPA":
                    const cgpa = parseFloat(value);
                    if (isNaN(cgpa)) error = "Please enter a valid CGPA";
                    else if (cgpa < 0 || cgpa > 10) error = "CGPA must be between 0 and 10";
                    break;
                case "tenthPassingYear":
                case "twelfthPassingYear":
                case "graduationPassingYear":
                    const year = parseInt(value);
                    if (isNaN(year)) error = "Please enter a valid year";
                    else if (year < 1950 || year > currentYear) error = `Year must be between 1950 and ${currentYear}`;
                    break;
                case "technical":
                case "creative":
                case "cognitive":
                case "tools":
                case "ethics":
                    if (!value) error = "At least one skill is required";
                    break;
            }
        }
        return error;
    };

    // Load Records with Initial Normalization & Validation Sync
    // Only re-initialize when records prop truly changes (new server data), NOT on parent re-renders from onRecordUpdate
    useEffect(() => {
        if (!isOpen || !records || !mapping) return;

        // Skip re-initialization if records haven't actually changed
        if (lastRecordsRef.current === records) return;
        lastRecordsRef.current = records;

        const normalizedRecords = records.map((r) => {
            const data = {
                ...r.originalData,
                row: r.row,
                name: r.name,
                currentFieldErrors: { ...r.fieldErrors }
            };

            // 1. Synchronize logical fields from mapping if missing
            Object.entries(mapping).forEach(([logical, original]) => {
                if (data[original] !== undefined && (data[logical] === undefined || data[logical] === "")) {
                    data[logical] = data[original];
                }
            });

            // 1b. Normalize mobile: strip +91 or 91 prefix for display & validation
            if (data.mobile) {
                let cleanMobile = String(data.mobile).replace(/\D/g, '');
                if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
                    cleanMobile = cleanMobile.substring(2);
                }
                data.mobile = cleanMobile;
            }

            // 2. Normalization for dropdown fields
            const dropdownFields = [
                { field: "graduationDegree", options: gradDegreeOptions },
                { field: "qualifyingDegree", options: pgDegreeOptions },
                { field: "graduationSpecialization", getOptions: (rec) => rec.graduationDegree ? DEGREE_SPECIALIZATIONS[rec.graduationDegree] || [] : [] },
                { field: "qualifyingSpecialization", getOptions: (rec) => rec.qualifyingDegree ? DEGREE_SPECIALIZATIONS[rec.qualifyingDegree] || [] : [] },
                { field: "advertisements", options: activeAds }
            ];

            dropdownFields.forEach(({ field, options, getOptions }) => {
                const currentVal = data[field];
                if (currentVal) {
                    const availableOptions = getOptions ? getOptions(data) : (options || []);

                    if (field === "advertisements") {
                        const adsArray = Array.isArray(currentVal) ? currentVal : String(currentVal).split(/[,;]/).map(s => s.trim());
                        data[field] = adsArray.map(ad => {
                            const match = availableOptions.find(opt => opt.toLowerCase() === ad.toLowerCase());
                            return match || ad;
                        });
                    } else {
                        const match = availableOptions.find(opt => opt.toLowerCase() === String(currentVal).toLowerCase());
                        if (match) {
                            data[field] = match;
                        }
                    }
                } else if (field === "advertisements") {
                    data[field] = [];
                }
            });

            // 3. Full re-validation to ensure UI consistency
            const validationKeys = [
                "fullName", "fathersName", "gender", "email", "mobile", "dob", "permanentAddress", "state",
                "tenthBoard", "tenthPassingYear", "tenthPercentage", "twelfthBoard", "twelfthPassingYear", "twelfthPercentage",
                "graduationDegree", "graduationSpecialization", "graduationPassingYear", "graduationPercentage", "graduationCGPA",
                "qualifyingDegree", "qualifyingSpecialization", "qualifyingPercentage",
                "advertisements", "technical", "creative", "cognitive", "tools", "ethics",
                "profileImage", "resume", "tenthMarksheet", "twelfthMarksheet", "graduationMarksheet", "identityProof"
            ];

            const newErrors = { ...data.currentFieldErrors };
            validationKeys.forEach(f => {
                const err = validateField(f, data[f], data);
                if (err) newErrors[f] = err;
                // We purposefully do NOT delete newErrors[f] here if err is null,
                // because we need to preserve the backend validation errors (like uniqueness constraints)
                // that pass frontend formatting checks.
                else if (newErrors[f] === null || newErrors[f] === undefined) {
                    delete newErrors[f];
                }
            });
            data.currentFieldErrors = newErrors;

            return data;
        });
        setEditedRecords(normalizedRecords);
    }, [isOpen, records, activeAds, mapping]);

    const handleChange = (index, field, value) => {
        let newValue = value;

        // Enforce input constraints from Register.jsx
        if (field === 'fullName' || field === 'fathersName') {
            newValue = value.replace(/[^a-zA-Z\s.]/g, '');
            newValue = newValue.replace(/\s{2,}/g, ' ');
        } else if (field === 'mobile') {
            newValue = value.replace(/[^\d]/g, '').slice(0, 10);
        } else if (field === 'email') {
            newValue = value.toLowerCase().replace(/[^\w@.-]/g, '');
        } else if (field.includes('Percentage') || field === 'graduationCGPA') {
            newValue = value.replace(/[^\d.]/g, '');
        } else if (field.includes('PassingYear')) {
            newValue = value.replace(/\D/g, '').slice(0, 4);
        }

        // Case-insensitive normalization for system options
        if (["graduationDegree", "graduationSpecialization", "qualifyingDegree", "qualifyingSpecialization", "advertisements"].includes(field)) {
            let options = [];
            if (field === "graduationDegree") options = gradDegreeOptions;
            else if (field === "qualifyingDegree") options = pgDegreeOptions;
            else if (field === "graduationSpecialization") options = editedRecords[index]?.graduationDegree ? DEGREE_SPECIALIZATIONS[editedRecords[index].graduationDegree] || [] : [];
            else if (field === "qualifyingSpecialization") options = editedRecords[index]?.qualifyingDegree ? DEGREE_SPECIALIZATIONS[editedRecords[index].qualifyingDegree] || [] : [];
            else if (field === "advertisements") options = activeAds;

            if (field === "advertisements") {
                // If it's advertisements, we handle arrays and normalize each item
                const adsArray = Array.isArray(value) ? value : (value ? value.split(/[,;]/).map(s => s.trim()) : []);
                newValue = adsArray.map(ad => {
                    const match = options.find(opt => opt.toLowerCase() === ad.toLowerCase());
                    return match || ad;
                });
            } else {
                const match = options.find(opt => opt.toLowerCase() === value.toLowerCase());
                if (match) newValue = match; // Normalize to system casing
            }
        }

        const newRecords = [...editedRecords];
        newRecords[index] = { ...newRecords[index], [field]: newValue };

        // Live validation
        const updatedRecord = newRecords[index];
        const error = validateField(field, newValue, updatedRecord);
        const newErrors = { ...(updatedRecord.currentFieldErrors || {}) };

        if (error) {
            newErrors[field] = error;
        } else {
            delete newErrors[field];
        }

        // Cross-field validation: Specialization depends on Degree changes
        if (field === "graduationDegree") {
            const specError = validateField("graduationSpecialization", updatedRecord.graduationSpecialization, updatedRecord);
            if (specError) newErrors.graduationSpecialization = specError;
            else delete newErrors.graduationSpecialization;
        }
        if (field === "qualifyingDegree") {
            const pgSpecError = validateField("qualifyingSpecialization", updatedRecord.qualifyingSpecialization, updatedRecord);
            if (pgSpecError) newErrors.qualifyingSpecialization = pgSpecError;
            else delete newErrors.qualifyingSpecialization;
        }

        updatedRecord.currentFieldErrors = newErrors;
        setEditedRecords(newRecords);
    };

    const handleSave = () => {
        const formattedRecords = editedRecords.map((r) => {
            // Helper to parse comma-separated skills into arrays
            const parseSkills = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                return val.split(',').map(s => s.trim()).filter(Boolean);
            };

            // Helper to parse advertisements into array
            const parseAds = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                return val.split(/[,;]/).map(s => s.trim()).filter(Boolean);
            };

            return {
                fullName: r.fullName,
                fathersName: r.fathersName,
                email: r.email,
                mobile: r.mobile ? (r.mobile.length === 10 ? `+91${r.mobile}` : r.mobile) : "",
                gender: r.gender,
                dob: r.dob,
                password: r.password || "User@123",
                confirmPassword: r.password || "User@123", // Required for validation parity
                isEmailVerified: true, // Bulk upload users are pre-verified via admin
                permanentAddress: r.permanentAddress,
                state: r.state,
                advertisements: parseAds(r.advertisements),
                skillSets: {
                    technical: parseSkills(r.technical),
                    creative: parseSkills(r.creative),
                    cognitive: parseSkills(r.cognitive),
                    tools: parseSkills(r.tools),
                    ethics: parseSkills(r.ethics),
                },
                profileImage: r.profileImage,
                resumeUrl: r.resume, // Map to User schema 'resumeUrl'
                identityProofUrl: r.identityProof, // Map to User schema 'identityProofUrl'
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
                row: r.row,
                originalData: r.originalData || r
            };
        });

        onSubmit(formattedRecords);
    };

    if (!isOpen) return null;

    // Render text input or select based on options
    const renderField = (idx, label, field, type = "text", options = null, optionalText = "") => {
        const record = editedRecords[idx];
        const hasError = record.currentFieldErrors?.[field];

        // Specific UI for Multi-select Advertisements
        if (field === "advertisements" && options) {
            const currentVal = record[field];
            const selectedAds = Array.isArray(currentVal) ? currentVal : (currentVal ? String(currentVal).split(/[,;]/).map(s => s.trim()) : []);

            return (
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-500 block">
                        {label} {optionalText && <span className="text-gray-400 font-normal">({optionalText})</span>}
                    </label>
                    <div className={`w-full max-h-[140px] overflow-y-auto p-2 border rounded-md bg-white transition-colors focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-400 scrollbar-thin
                        ${hasError ? "border-red-300 bg-red-50/10" : "border-gray-200"}
                    `}>
                        {options.map((opt) => {
                            const isChecked = selectedAds.some(ad => String(ad).toLowerCase() === String(opt).toLowerCase());
                            return (
                                <label key={opt} className="flex items-center gap-2 px-1 py-1 hover:bg-primary-50 active:bg-primary-100 rounded cursor-pointer group transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            // When interacting with checkboxes, we only want to keep VALID options
                                            // This filters out any junk data from the original file
                                            const validSelectedAds = selectedAds.filter(ad =>
                                                options.some(opt => String(opt).toLowerCase() === String(ad).toLowerCase())
                                            );

                                            let newSelected;
                                            if (e.target.checked) {
                                                newSelected = [...validSelectedAds, opt];
                                            } else {
                                                newSelected = validSelectedAds.filter(ad => String(ad).toLowerCase() !== String(opt).toLowerCase());
                                            }
                                            handleChange(idx, field, newSelected);
                                        }}
                                    />
                                    <span className={`text-[11px] leading-tight transition-colors truncate
                                        ${isChecked ? "text-primary-700 font-bold" : "text-gray-600 font-medium"}
                                    `} title={opt}>
                                        {opt}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    {hasError && (
                        <div className="flex items-start gap-1 mt-1">
                            <FaExclamationCircle className="text-red-500 text-[10px] mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-red-500 font-medium leading-tight">{hasError}</p>
                        </div>
                    )}
                </div>
            );
        }

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
                        value={record[field] === "none" ? "" : (record[field] || "")}
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


    const rowsWithErrors = editedRecords.filter(r => Object.keys(r.currentFieldErrors || {}).length > 0).length;
    const totalRemainingErrors = editedRecords.reduce((acc, r) => acc + Object.keys(r.currentFieldErrors || {}).length, 0);

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
                            <h3 className="text-base font-medium text-gray-800">
                                Please correct the highlighted errors {uploadedFileName && <span className="text-gray-500 font-normal">in <span className="font-medium text-gray-700">{uploadedFileName}</span></span>}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">Rows that failed validation require correction before they can be synchronized.</p>
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 border rounded-lg font-medium text-sm flex items-center gap-2 transition-colors
                        ${totalRemainingErrors > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}
                    `}>
                        {totalRemainingErrors > 0 ? (
                            <>
                                <FaExclamationCircle />
                                <span>{rowsWithErrors} rows need attention ({totalRemainingErrors} errors remaining)</span>
                            </>
                        ) : (
                            <>
                                <FaCheckCircle />
                                <span>All validation errors resolved!</span>
                            </>
                        )}
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

                                        <div className="bg-gray-50/80 px-5 py-3 border-b">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[13px] font-medium text-gray-500">Row {record.row} from spreadsheet</span>
                                                <span className="text-[13px] font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-md border border-primary-100">
                                                    {record.name || "Unknown name"}
                                                </span>
                                            </div>
                                            {record.currentFieldErrors?.generic && (
                                                <div className="mt-3 text-[12px] font-medium text-red-700 bg-red-50/80 px-3 py-2 rounded border border-red-200 flex items-center gap-2">
                                                    <FaExclamationCircle className="text-red-500 shrink-0" />
                                                    <span>Server Error: {record.currentFieldErrors.generic}</span>
                                                </div>
                                            )}
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
                                                    {renderField(idx, "Advertisements", "advertisements", "text", activeAds.length > 0 ? activeAds : null, "select active ad")}

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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className={`px-8 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2
                ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5 active:translate-y-0"}
              `}
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <FaCheckCircle />
                                    <span>Save & Synchronize</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </ModalContainer>
    );
};

export default BulkUploadCorrectionModal;
