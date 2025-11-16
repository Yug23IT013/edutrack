import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+91 9876543210',
    address: '123 University Street, Education City',
    bio: 'Passionate about learning and education.',
    joinDate: '2024-01-15'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      // Here you would typically call an API to update the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '+91 9876543210',
      address: '123 University Street, Education City',
      bio: 'Passionate about learning and education.',
      joinDate: '2024-01-15'
    });
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="btn-secondary flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture and Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="h-32 w-32 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{formData.name}</h2>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user?.role)}`}>
              {user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1)}
            </span>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                Joined {formData.joinDate}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Full Name */}
            <div>
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{formData.name}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                {formData.email}
                <span className="ml-auto text-xs text-gray-500">Cannot be changed</span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+91 XXXXXXXXXX"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {formData.phone}
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="form-label">Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="form-input"
                  placeholder="Enter your address"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                  {formData.address}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="form-label">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="form-input"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {formData.bio}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Change Password</h4>
              <p className="text-sm text-gray-600 mb-4">Update your password to keep your account secure.</p>
              <button className="btn-outline text-sm">
                Change Password
              </button>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Notification Preferences</h4>
              <p className="text-sm text-gray-600 mb-4">Manage how you receive notifications.</p>
              <button className="btn-outline text-sm">
                Notification Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;