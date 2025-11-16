import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, GraduationCap, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const { login, signup } = useAuth();

  // Validate password strength
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  // Determine role based on email domain
  const determineRole = (email) => {
    if (email === 'admin@edutrack.com' || email === 'admin1@edutrack.com') {
      return 'admin';
    } else if (email.endsWith('.edu.in')) {
      return 'student';
    } else if (email.endsWith('.ac.in')) {
      return 'teacher';
    }
    return 'student'; // default to student
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-determine role when email changes
    if (name === 'email') {
      const role = determineRole(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        role: role
      }));
    }

    // Validate password in real-time
    if (name === 'password' && !isLogin) {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation for registration
    if (!isLogin) {
      // Check if email domain is valid (allow admin@edutrack.com and admin1@edutrack.com exception)
      if (formData.email !== 'admin@edutrack.com' && formData.email !== 'admin1@edutrack.com' && !formData.email.endsWith('.edu.in') && !formData.email.endsWith('.ac.in')) {
        setError('Please use a valid institutional email (.edu.in for students or .ac.in for teachers)');
        setLoading(false);
        return;
      }

      // Validate password
      const passwordValidationErrors = validatePassword(formData.password);
      if (passwordValidationErrors.length > 0) {
        setError('Please fix the password requirements listed below');
        setLoading(false);
        return;
      }

      // Check if passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      let result;
      if (isLogin) {
        result = await login({ email: formData.email, password: formData.password });
      } else {
        // Remove confirmPassword before sending to backend
        const { confirmPassword, ...signupData } = formData;
        result = await signup(signupData);
      }

      if (!result.success) {
        setError(result.message);
        toast.error(result.message);
      } else {
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      }
    } catch (error) {
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative flex flex-col justify-center items-center text-white p-12">
          <GraduationCap className="h-20 w-20 mb-8" />
          <h1 className="text-4xl font-bold mb-4">EduTrack</h1>
          <p className="text-xl text-center text-primary-100 max-w-md">
            Your comprehensive educational management system for seamless learning and teaching.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3" />
              Track assignments and grades
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3" />
              Manage course materials
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3" />
              Stay updated with announcements
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:hidden mb-8">
            <GraduationCap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">EduTrack</h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isLogin 
                ? 'Please sign in to your account to continue.' 
                : 'Join EduTrack to start managing your education.'
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="student@university.edu.in or teacher@university.ac.in"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input pl-10"
                    />
                  </div>
                </div>

                {/* Password validation messages */}
                {passwordErrors.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      Password Requirements:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {passwordErrors.map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-yellow-400 rounded-full mr-2" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Role display */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">
                        Account Type: {formData.role === 'student' ? 'Student' : formData.role === 'teacher' ? 'Teacher' : 'Admin'}
                      </p>
                      <p className="text-xs text-blue-700">
                        {(formData.email === 'admin@edutrack.com' || formData.email === 'admin1@edutrack.com')
                          ? 'System Administrator Account' 
                          : `Automatically determined by email domain (${formData.role === 'student' ? '.edu.in' : '.ac.in'})`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Please wait...
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setPasswordErrors([]);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
                }}
                className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
