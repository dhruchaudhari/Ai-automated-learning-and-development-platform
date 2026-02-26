import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { userAPI, advertisementAPI } from '../utils/api';
import {
    UserCircleIcon,
    PencilIcon,
    TrashIcon,
    CameraIcon,
    XMarkIcon,
    CheckIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    AcademicCapIcon,
    MapPinIcon,
    DocumentTextIcon,
    EyeIcon,
    CodeBracketIcon,
    WrenchIcon,
    LightBulbIcon,
    PuzzlePieceIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import PreviewModal from './PreviewModal';
import AdDetailsModal from './AdDetailsModal';

const ProfileDetails = () => {
    const navigate = useNavigate();
    const { logout, user: authUser } = useAuth();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editForm, setEditForm] = useState({
        skillSets: {
            technical: [],
            creative: [],
            cognitive: [],
            tools: [],
            ethics: []
        }
    });
    const [newProfilePic, setNewProfilePic] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [activeAds, setActiveAds] = useState([]);
    const [selectedAdDetail, setSelectedAdDetail] = useState(null);

    useEffect(() => {
        fetchUserProfile();
        fetchActiveAds();
    }, []);

    const fetchActiveAds = async () => {
        try {
            const response = await advertisementAPI.getAll();
            setActiveAds(response.data.data || []);
        } catch (error) {
            console.error('Error fetching advertisements:', error);
        }
    };

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            const userData = response.data.user || response.data;

            // Normalize userData for consistent rendering
            if (userData) {
                console.log('Normalized User Data:', {
                    id: userData._id,
                    skillSets: userData.skillSets
                });
            }
            if (!userData.skillSets) {
                userData.skillSets = {
                    technical: [],
                    creative: [],
                    cognitive: [],
                    tools: [],
                    ethics: []
                };
            } else {
                userData.skillSets.technical = userData.skillSets.technical || [];
                userData.skillSets.creative = userData.skillSets.creative || [];
                userData.skillSets.cognitive = userData.skillSets.cognitive || [];
                userData.skillSets.tools = userData.skillSets.tools || [];
                userData.skillSets.ethics = userData.skillSets.ethics || [];
            }

            setUser(userData);

            // Map nested fields to flat form fields for editing
            const flatData = {
                fullName: userData.fullName || '',
                fathersName: userData.fathersName || '',
                email: userData.email || '',
                mobile: userData.mobile || '',
                gender: userData.gender || '',
                dob: userData.dob ? userData.dob.split('T')[0] : '',
                permanentAddress: userData.permanentAddress || '',
                state: userData.state || '',
                // Graduation
                graduationDegree: userData.education?.graduation?.degree || '',
                graduationSpecialization: userData.education?.graduation?.specialization || '',
                graduationPassingYear: userData.education?.graduation?.passingYear || '',
                graduationPercentage: userData.education?.graduation?.percentage || '',
                graduationCGPA: userData.education?.graduation?.cgpa || '',
                // 10th
                tenthBoard: userData.education?.tenth?.board || '',
                tenthPassingYear: userData.education?.tenth?.passingYear || '',
                tenthPercentage: userData.education?.tenth?.percentage || '',
                // 12th
                twelfthBoard: userData.education?.twelfth?.board || '',
                twelfthPassingYear: userData.education?.twelfth?.passingYear || '',
                twelfthPercentage: userData.education?.twelfth?.percentage || '',
                // Qualifying
                qualifyingDegree: userData.education?.qualifyingDegree?.degree || '',
                qualifyingSpecialization: userData.education?.qualifyingDegree?.specialization || '',
                qualifyingPercentage: userData.education?.qualifyingDegree?.percentage || '',
                advertisements: userData.advertisements ? userData.advertisements.map(ad => ad._id || ad) : [],
                skillSets: {
                    technical: userData.skillSets?.technical || [],
                    creative: userData.skillSets?.creative || [],
                    cognitive: userData.skillSets?.cognitive || [],
                    tools: userData.skillSets?.tools || [],
                    ethics: userData.skillSets?.ethics || []
                }
            };
            setEditForm(flatData);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset form to latest user data
        if (user) {
            const flatData = {
                fullName: user.fullName || '',
                fathersName: user.fathersName || '',
                email: user.email || '',
                mobile: user.mobile || '',
                gender: user.gender || '',
                dob: user.dob ? user.dob.split('T')[0] : '',
                permanentAddress: user.permanentAddress || '',
                state: user.state || '',
                graduationDegree: user.education?.graduation?.degree || '',
                graduationPassingYear: user.education?.graduation?.passingYear || '',
                graduationPercentage: user.education?.graduation?.percentage || '',
                graduationCGPA: user.education?.graduation?.cgpa || '',
                tenthBoard: user.education?.tenth?.board || '',
                tenthPassingYear: user.education?.tenth?.passingYear || '',
                tenthPercentage: user.education?.tenth?.percentage || '',
                twelfthBoard: user.education?.twelfth?.board || '',
                twelfthPassingYear: user.education?.twelfth?.passingYear || '',
                twelfthPercentage: user.education?.twelfth?.percentage || '',
                qualifyingDegree: user.education?.qualifyingDegree?.degree || '',
                qualifyingPercentage: user.education?.qualifyingDegree?.percentage || '',
                advertisements: user.advertisements ? user.advertisements.map(ad => ad._id || ad) : [],
                skillSets: {
                    technical: user.skillSets?.technical || [],
                    creative: user.skillSets?.creative || [],
                    cognitive: user.skillSets?.cognitive || [],
                    tools: user.skillSets?.tools || [],
                    ethics: user.skillSets?.ethics || []
                }
            };
            setEditForm(flatData);
        }
        setNewProfilePic(null);
        setPreviewUrl(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setNewProfilePic(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            const formData = new FormData();

            // Add all form fields as they are flat
            Object.keys(editForm).forEach(key => {
                if (editForm[key] !== undefined && editForm[key] !== null) {
                    if (key === 'advertisements' || key === 'skillSets') {
                        formData.append(key, JSON.stringify(editForm[key]));
                    } else {
                        formData.append(key, editForm[key]);
                    }
                }
            });

            // Add new profile picture if selected
            if (newProfilePic) {
                formData.append('profileImage', newProfilePic);
            }

            await userAPI.updateUser(user._id, formData);
            toast.success('Profile updated successfully!');

            // Refresh profile data
            await fetchUserProfile();

            // Update localStorage user data if needed (context usually handles this but good to sync)
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUserData = { ...storedUser, ...editForm };
            localStorage.setItem('user', JSON.stringify(updatedUserData));

            setIsEditing(false);
            setNewProfilePic(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await userAPI.deleteUser(user._id);
            toast.success('Account deleted successfully');
            logout();
            navigate('/login');
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error(error.response?.data?.message || 'Failed to delete account');
        }
    };

    const getProfileImageUrl = () => {
        if (previewUrl) return previewUrl;
        if (user?.profileImage) {
            // Mongoose getter should return full URL. If not, fallback.
            if (user.profileImage.startsWith('http')) return user.profileImage;
            const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
            return `${baseUrl}/${user.profileImage.replace(/^\\+|^\/+/, '')}`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-600">Unable to load profile. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            Profile Details
                        </span>
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base">View and manage your personal and academic information</p>
                </div>

                <div className="flex items-center gap-3">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={handleEditClick}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-all active:scale-95"
                            >
                                <PencilIcon className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100 active:scale-95"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete Account</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                            >
                                <XMarkIcon className="w-4 h-4" />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <CheckIcon className="w-4 h-4" />
                                )}
                                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-12">
                {/* Profile Banner/Header */}
                <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Profile Picture */}
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white/20 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-sm group-hover:border-primary-400 transition-all duration-300">
                                {getProfileImageUrl() ? (
                                    <img
                                        src={getProfileImageUrl()}
                                        alt={user.fullName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName) + '&background=random';
                                        }}
                                    />
                                ) : (
                                    <UserCircleIcon className="w-full h-full text-white/20 p-2" />
                                )}
                            </div>

                            {/* Change Picture Overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 bg-white rounded-2xl p-3 shadow-xl hover:bg-primary-50 transition-all duration-300 border border-gray-100 hover:scale-110 active:scale-90 group-hover:rotate-6"
                                title="Change Profile Picture"
                            >
                                <CameraIcon className="w-6 h-6 text-primary-600" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicChange}
                                className="hidden"
                            />
                        </div>

                        {/* Profile Identity */}
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{user.fullName}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 text-sm font-medium">
                                    <EnvelopeIcon className="w-4 h-4 text-primary-300" />
                                    {user.email}
                                </span>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${user.status === 'approved'
                                    ? 'bg-green-500 text-white'
                                    : user.status === 'rejected'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-amber-500 text-white'
                                    }`}>
                                    {user.status?.toUpperCase() || 'PENDING'}
                                </span>
                            </div>
                            {user.adminNotes && (
                                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-md">
                                    <p className="text-xs text-primary-200 font-bold uppercase tracking-wider mb-1 italic">Admin Feedback</p>
                                    <p className="text-white/80 text-sm leading-relaxed">{user.adminNotes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Information Sections */}
                <div className="p-6 md:p-10 space-y-12">
                    {isEditing ? (
                        /* Edit Form - Modern Layout */
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Personal Details Form */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 text-primary-700">
                                    <UserCircleIcon className="w-6 h-6" />
                                    <h3 className="text-xl font-bold tracking-tight">Personal Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-gray-50/50 border border-gray-100">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={editForm.fullName}
                                            onChange={handleInputChange}
                                            placeholder="Enter full name"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Father's Name</label>
                                        <input
                                            type="text"
                                            name="fathersName"
                                            value={editForm.fathersName}
                                            onChange={handleInputChange}
                                            placeholder="Enter father's name"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Mobile Number</label>
                                        <input
                                            type="tel"
                                            name="mobile"
                                            value={editForm.mobile}
                                            onChange={handleInputChange}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={editForm.gender}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all outline-none appearance-none"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={editForm.dob}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={editForm.state}
                                            onChange={handleInputChange}
                                            placeholder="Enter state"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Permanent Address</label>
                                        <textarea
                                            name="permanentAddress"
                                            value={editForm.permanentAddress}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="Enter full address"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all outline-none resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </section>

                            {/* Academic Details Form */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 text-secondary-700">
                                    <AcademicCapIcon className="w-6 h-6" />
                                    <h3 className="text-xl font-bold tracking-tight">Academic Qualifications</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-3xl bg-secondary-50/30 border border-secondary-100">
                                    <div className="md:col-span-2 lg:col-span-4 border-b border-secondary-100 pb-2 mb-2">
                                        <span className="text-xs font-black text-secondary-600 uppercase tracking-widest">Graduation</span>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Degree/Course</label>
                                        <select
                                            name="graduationDegree"
                                            value={editForm.graduationDegree}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        >
                                            <option value="">Select Bachelor's Degree</option>
                                            <option value="B.Tech / B.E. in Computer Science Engineering (CSE)">B.Tech / B.E. in Computer Science Engineering (CSE)</option>
                                            <option value="B.Tech / B.E. in Information Technology (IT)">B.Tech / B.E. in Information Technology (IT)</option>
                                            <option value="Bachelor of Computer Applications (BCA)">Bachelor of Computer Applications (BCA)</option>
                                            <option value="B.Sc. in Computer Science">B.Sc. in Computer Science</option>
                                            <option value="B.Sc. in Information Technology">B.Sc. in Information Technology</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Specialization</label>
                                        <input
                                            type="text"
                                            name="graduationSpecialization"
                                            value={editForm.graduationSpecialization}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Software Engineering"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Passing Year</label>
                                        <input
                                            type="number"
                                            name="graduationPassingYear"
                                            value={editForm.graduationPassingYear}
                                            onChange={handleInputChange}
                                            placeholder="2024"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Percentage/CGPA</label>
                                        <input
                                            type="text"
                                            name="graduationPercentage"
                                            value={editForm.graduationPercentage}
                                            onChange={handleInputChange}
                                            placeholder="85%"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-4 border-b border-secondary-100 pb-2 mt-4 mb-2">
                                        <span className="text-xs font-black text-secondary-600 uppercase tracking-widest">Schooling (10th & 12th)</span>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">10th Board</label>
                                        <input
                                            type="text"
                                            name="tenthBoard"
                                            value={editForm.tenthBoard}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">10th %</label>
                                        <input
                                            type="number"
                                            name="tenthPercentage"
                                            value={editForm.tenthPercentage}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">10th Year</label>
                                        <input
                                            type="number"
                                            name="tenthPassingYear"
                                            value={editForm.tenthPassingYear}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">12th/Diploma Board</label>
                                        <input
                                            type="text"
                                            name="twelfthBoard"
                                            value={editForm.twelfthBoard}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">12th %</label>
                                        <input
                                            type="number"
                                            name="twelfthPercentage"
                                            value={editForm.twelfthPercentage}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">12th Year</label>
                                        <input
                                            type="number"
                                            name="twelfthPassingYear"
                                            value={editForm.twelfthPassingYear}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-4 border-b border-secondary-100 pb-2 mt-4 mb-2">
                                        <span className="text-xs font-black text-secondary-600 uppercase tracking-widest">Qualifying Degree (Master's)</span>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Degree</label>
                                        <select
                                            name="qualifyingDegree"
                                            value={editForm.qualifyingDegree}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        >
                                            <option value="">Select Master's Degree (Optional)</option>
                                            <option value="M.Tech / M.E. in Computer Science Engineering (CSE)">M.Tech / M.E. in CSE</option>
                                            <option value="M.Tech / M.E. in Information Technology (IT)">M.Tech / M.E. in IT</option>
                                            <option value="Master of Computer Applications (MCA)">MCA</option>
                                            <option value="M.Sc. in Computer Science">M.Sc. in Computer Science</option>
                                            <option value="M.Sc. in Information Technology">M.Sc. in Information Technology</option>
                                            <option value="M.Tech in Software Engineering">M.Tech in Software Engineering</option>
                                            <option value="M.Tech in Computer Engineering">M.Tech in Computer Engineering</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Specialization</label>
                                        <input
                                            type="text"
                                            name="qualifyingSpecialization"
                                            value={editForm.qualifyingSpecialization}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Artificial Intelligence"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Qualifying %</label>
                                        <input
                                            type="number"
                                            name="qualifyingPercentage"
                                            value={editForm.qualifyingPercentage}
                                            onChange={handleInputChange}
                                            placeholder="80%"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-secondary-100 focus:border-secondary-400 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Skill Sets Form */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 text-amber-700">
                                    <WrenchIcon className="w-6 h-6" />
                                    <h3 className="text-xl font-bold tracking-tight">Skills & Expertise</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-amber-50/30 border border-amber-100">
                                    {Object.entries({
                                        technical: { label: 'Technical Skills', icon: <CodeBracketIcon className="w-4 h-4" /> },
                                        creative: { label: 'Creative Skills', icon: <LightBulbIcon className="w-4 h-4" /> },
                                        cognitive: { label: 'Cognitive Skills', icon: <PuzzlePieceIcon className="w-4 h-4" /> },
                                        tools: { label: 'Tools & Technologies', icon: <WrenchIcon className="w-4 h-4" /> },
                                        ethics: { label: 'Ethics & Values', icon: <ShieldCheckIcon className="w-4 h-4" /> }
                                    }).map(([key, { label, icon }]) => (
                                        <div key={key} className="space-y-3">
                                            <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                                                {icon} {label}
                                            </label>
                                            <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-3 bg-white/50 rounded-2xl border border-amber-100/50">
                                                {editForm.skillSets[key]?.length > 0 ? (
                                                    editForm.skillSets[key].map((skill, idx) => (
                                                        <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg group">
                                                            {skill}
                                                            <button
                                                                onClick={() => {
                                                                    const updatedSkills = { ...editForm.skillSets };
                                                                    updatedSkills[key] = updatedSkills[key].filter((_, i) => i !== idx);
                                                                    setEditForm(prev => ({ ...prev, skillSets: updatedSkills }));
                                                                }}
                                                                className="hover:text-amber-600"
                                                            >
                                                                <XMarkIcon className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No skills added</span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    id={`new-skill-${key}`}
                                                    placeholder={`Add ${label.toLowerCase()}...`}
                                                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-amber-100 outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.target.value.trim();
                                                            if (val) {
                                                                const updatedSkills = { ...editForm.skillSets };
                                                                updatedSkills[key] = [...(updatedSkills[key] || []), val];
                                                                setEditForm(prev => ({ ...prev, skillSets: updatedSkills }));
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const input = document.getElementById(`new-skill-${key}`);
                                                        const val = input.value.trim();
                                                        if (val) {
                                                            const updatedSkills = { ...editForm.skillSets };
                                                            updatedSkills[key] = [...(updatedSkills[key] || []), val];
                                                            setEditForm(prev => ({ ...prev, skillSets: updatedSkills }));
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all"
                                                >
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Job Advertisement Selection (Multi) */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 text-purple-700">
                                    <DocumentTextIcon className="w-6 h-6" />
                                    <h3 className="text-xl font-bold tracking-tight">Applied Advertisements</h3>
                                </div>
                                <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeAds.length > 0 ? (
                                            activeAds.map(ad => {
                                                const isSelected = (editForm.advertisements || []).includes(ad._id);
                                                return (
                                                    <div
                                                        key={ad._id}
                                                        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative group ${isSelected
                                                            ? 'border-purple-600 bg-purple-100/50 shadow-lg shadow-purple-100'
                                                            : 'border-white bg-white hover:border-purple-200'
                                                            }`}
                                                        onClick={() => {
                                                            const currentAds = editForm.advertisements || [];
                                                            const newAds = isSelected
                                                                ? currentAds.filter(id => id !== ad._id)
                                                                : [...currentAds, ad._id];
                                                            setEditForm(prev => ({ ...prev, advertisements: newAds }));
                                                        }}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className={`mt-1 w-6 h-6 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-600 border-purple-600 rotate-0' : 'border-gray-200 -rotate-12'
                                                                }`}>
                                                                {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className={`font-black uppercase tracking-tight truncate transition-colors ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                                                                        {ad.title}
                                                                    </p>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedAdDetail(ad);
                                                                        }}
                                                                        className="p-1.5 bg-gray-50 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                                        title="View full details"
                                                                    >
                                                                        <EyeIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                                                                    {ad.job && (
                                                                        <span className="text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                                            {typeof ad.job === 'object' ? ad.job.jobCode : 'JOB'}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                        {ad.role?.title || 'No Role'}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-300">•</span>
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                        {ad.department?.name || 'No Dept'}
                                                                    </span>
                                                                </div>

                                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                                                    Deadline: <span className="text-red-500">{new Date(ad.lastDateToApply).toLocaleDateString('en-IN', {
                                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                                    })}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full p-8 text-center bg-white/50 rounded-2xl border border-dashed border-gray-300">
                                                <p className="text-gray-500">No active advertisements available</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-4 text-[11px] text-purple-600 font-medium">
                                        * You can select multiple positions you are interested in.
                                    </p>
                                </div>
                            </section>
                        </div>
                    ) : (
                        /* Modern Display Grid */
                        <div className="space-y-16 animate-in fade-in duration-700">
                            {/* Personal Information */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-primary-100 rounded-xl">
                                        <UserCircleIcon className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Personal Profile</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <InfoCard
                                        icon={<EnvelopeIcon className="w-5 h-5" />}
                                        label="Email Address"
                                        value={user.email}
                                        className="border-primary-50"
                                    />
                                    <InfoCard
                                        icon={<PhoneIcon className="w-5 h-5" />}
                                        label="Mobile Number"
                                        value={user.mobile}
                                        className="border-blue-50"
                                    />
                                    <InfoCard
                                        icon={<CalendarIcon className="w-5 h-5" />}
                                        label="Date of Birth"
                                        value={user.dob ? new Date(user.dob).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        }) : null}
                                        className="border-purple-50"
                                    />
                                    <InfoCard
                                        icon={<UserCircleIcon className="w-5 h-5" />}
                                        label="Gender"
                                        value={user.gender}
                                        className="border-pink-50"
                                    />
                                    <InfoCard
                                        icon={<UserCircleIcon className="w-5 h-5" />}
                                        label="Father's Name"
                                        value={user.fathersName}
                                        className="border-indigo-50"
                                    />
                                    <InfoCard
                                        icon={<MapPinIcon className="w-5 h-5" />}
                                        label="Location"
                                        value={user.state}
                                        className="border-amber-50"
                                    />
                                    <div className="md:col-span-2 lg:col-span-3">
                                        <InfoCard
                                            icon={<MapPinIcon className="w-5 h-5" />}
                                            label="Permanent Address"
                                            value={user.permanentAddress}
                                            className="border-gray-50 bg-gray-50/30"
                                            isLong={true}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Academic Background */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-secondary-100 rounded-xl">
                                        <AcademicCapIcon className="w-6 h-6 text-secondary-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Academic Background</h3>
                                </div>

                                <div className="space-y-8">
                                    {/* Graduation Info */}
                                    <div className="bg-gradient-to-br from-secondary-50 to-white rounded-3xl p-8 border border-secondary-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="px-5 py-1.5 rounded-2xl bg-secondary-600 text-white text-xs font-black uppercase tracking-widest">Graduation Details</span>
                                            <div className="flex items-center gap-2">
                                                {user.education?.graduation?.marksheetUrl && (
                                                    <button
                                                        onClick={() => setPreviewDoc({ src: user.education.graduation.marksheetUrl, type: 'document' })}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-xs font-bold border border-red-100"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" /> View Degree
                                                    </button>
                                                )}
                                                {user.education?.graduation?.verified && (
                                                    <span className="flex items-center gap-1.5 text-secondary-600 text-sm font-bold">
                                                        <CheckIcon className="w-5 h-5" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                            <DetailItem label="Degree" value={user.education?.graduation?.degree} />
                                            <DetailItem label="Specialization" value={user.education?.graduation?.specialization} />
                                            <DetailItem label="Passout Year" value={user.education?.graduation?.passingYear} />
                                            <div className="flex gap-8">
                                                <DetailItem label="Percentage" value={user.education?.graduation?.percentage ? `${user.education.graduation.percentage}%` : null} />
                                                <DetailItem label="CGPA" value={user.education?.graduation?.cgpa} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Schooling Info */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-50">
                                                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">SSC / 10th Standard</span>
                                                {user.education?.tenth?.marksheetUrl && (
                                                    <button
                                                        onClick={() => setPreviewDoc({ src: user.education.tenth.marksheetUrl, type: 'document' })}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-xs font-bold border border-red-100"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" /> View Marksheet
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <DetailItem label="Board" value={user.education?.tenth?.board} />
                                                <DetailItem label="Year" value={user.education?.tenth?.passingYear} />
                                                <DetailItem label="Marks" value={user.education?.tenth?.percentage ? `${user.education.tenth.percentage}%` : null} />
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-50">
                                                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">HSC / Diploma</span>
                                                {user.education?.twelfth?.marksheetUrl && (
                                                    <button
                                                        onClick={() => setPreviewDoc({ src: user.education.twelfth.marksheetUrl, type: 'document' })}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-xs font-bold border border-red-100"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" /> View Marksheet
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <DetailItem label="Board" value={user.education?.twelfth?.board} />
                                                <DetailItem label="Year" value={user.education?.twelfth?.passingYear} />
                                                <DetailItem label="Marks" value={user.education?.twelfth?.percentage ? `${user.education.twelfth.percentage}%` : null} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Qualifying Degree (if exists) */}
                                    {user.education?.qualifyingDegree?.degree && (
                                        <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                            <div className="flex items-center justify-between mb-6 relative z-10">
                                                <span className="px-5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/10 text-xs font-black uppercase tracking-widest">Qualifying Degree</span>
                                                {user.education?.qualifyingDegree?.marksheetUrl && (
                                                    <button
                                                        onClick={() => setPreviewDoc({ src: user.education.qualifyingDegree.marksheetUrl, type: 'document' })}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all text-xs font-bold border border-white/20 relative z-10"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" /> View Degree
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                                                <DetailItem label="Post Graduation" value={user.education.qualifyingDegree.degree} isDark={true} />
                                                <DetailItem label="Specialization" value={user.education.qualifyingDegree.specialization} isDark={true} />
                                                <DetailItem label="Overall Score" value={user.education.qualifyingDegree.percentage ? `${user.education.qualifyingDegree.percentage}%` : null} isDark={true} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Skills & Expertise Section */}
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-amber-100 rounded-xl">
                                        <WrenchIcon className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Skills & Expertise</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries({
                                        technical: { label: 'Technical', icon: <CodeBracketIcon className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700' },
                                        creative: { label: 'Creative', icon: <LightBulbIcon className="w-5 h-5" />, color: 'bg-purple-50 text-purple-700' },
                                        cognitive: { label: 'Cognitive', icon: <PuzzlePieceIcon className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-700' },
                                        tools: { label: 'Tools', icon: <WrenchIcon className="w-5 h-5" />, color: 'bg-amber-50 text-amber-700' },
                                        ethics: { label: 'Ethics', icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-700' }
                                    }).map(([key, { label, icon, color }]) => (
                                        <div key={key} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 rounded-xl ${color}`}>
                                                    {icon}
                                                </div>
                                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">{label} Skills</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {user.skillSets[key]?.length > 0 ? (
                                                    user.skillSets[key].map((skill, idx) => (
                                                        <span key={idx} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-100">
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic font-medium px-2">Not added yet</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                    }
                                </div>
                            </section>

                            {/* Applied Advertisements Section */}
                            {(user.advertisements?.length > 0 || user.advertisement) && (
                                <section>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-purple-100 rounded-xl">
                                            <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Applied Advertisements</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {user.advertisements?.map((ad, index) => (
                                            <div
                                                key={ad._id || index}
                                                onClick={() => setSelectedAdDetail(ad)}
                                                className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                            <AcademicCapIcon className="w-5 h-5" />
                                                        </div>
                                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black uppercase rounded-lg">Advertisement {index + 1}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{ad.title || 'Untitled Position'}</h4>
                                                        {ad.lastDateToApply && new Date(ad.lastDateToApply) < new Date().setHours(0, 0, 0, 0) && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg border border-red-200">
                                                                Closed
                                                            </span>
                                                        )}
                                                    </div>
                                                    {ad.lastDateToApply && (
                                                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            Last Date: {new Date(ad.lastDateToApply).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short', year: 'numeric'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-purple-600 font-bold text-sm mt-2">
                                                    <span>View Details</span>
                                                    <EyeIcon className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}

                                        {/* Fallback for legacy advertisement field */}
                                        {!user.advertisements?.length && user.advertisement && (
                                            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                                            <AcademicCapIcon className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{user.advertisement.title || 'Untitled Position'}</h4>
                                                </div>
                                                {user.advertisement.detail && (
                                                    <button
                                                        onClick={() => setPreviewDoc({ src: user.advertisement.detail, type: 'document' })}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-700 font-bold rounded-2xl hover:bg-purple-100 transition-all border border-purple-100"
                                                    >
                                                        <EyeIcon className="w-5 h-5" /> View Advertisement PDF
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    )
                    }
                </div >
            </div >

            {/* Delete Modal Extension etc... */}
            {/* Same as before but styled consistently */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl scale-in-center">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-50 flex items-center justify-center text-red-600">
                                    <TrashIcon className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-3">Permanent Deletion?</h3>
                                <p className="text-gray-500 leading-relaxed mb-8">
                                    This will permanently remove your profile and all submitted documents from our workshops. <strong>This action is irreversible.</strong>
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95"
                                    >
                                        Confirm Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Preview Modal for Documents */}
            {
                previewDoc && (
                    <PreviewModal
                        preview={previewDoc}
                        onClose={() => setPreviewDoc(null)}
                    />
                )
            }
            {/* Ad Details Modal */}
            <AdDetailsModal
                isOpen={!!selectedAdDetail}
                onClose={() => setSelectedAdDetail(null)}
                advertisement={selectedAdDetail}
                onViewDocument={(src) => setPreviewDoc({ src, type: 'document' })}
            />
        </div>
    );
};

// Helper Components for Cleaner Main View
const InfoCard = ({ icon, label, value, className = "", isLong = false }) => (
    <div className={`p-6 rounded-3xl border border-gray-100 bg-white transition-all hover:shadow-lg hover:-translate-y-1 ${className}`}>
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-50 rounded-2xl text-gray-400">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`font-bold text-gray-900 truncate ${isLong ? 'whitespace-normal line-clamp-2' : ''}`}>
                    {value || <span className="text-gray-300 font-medium">Not Provided</span>}
                </p>
            </div>
        </div>
    </div>
);

const DetailItem = ({ label, value, isDark = false }) => (
    <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{label}</p>
        <p className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {value || <span className={isDark ? 'text-white/20' : 'text-gray-200'}>—</span>}
        </p>
    </div>
);

export default ProfileDetails;
