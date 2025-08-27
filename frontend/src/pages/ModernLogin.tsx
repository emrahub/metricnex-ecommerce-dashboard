import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';

const ModernLogin: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { authService } = await import('../services/authService');
      const response = await authService.login(formData);
      
      if (response.success && response.data) {
        authService.storeAuthData(response.data);
        navigate('/');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 via-secondary-100/20 to-accent-100/20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-secondary-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-accent-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-primary-300/30 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center bg-white rounded-2xl shadow-2xl border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <PresentationChartLineIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="mt-6">
            <h1 className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              MetricNex
            </h1>
            <h2 className="mt-2 text-center text-lg font-medium text-gray-700">
              Analytics Dashboard'a Giriş
            </h2>
            <p className="mt-3 text-center text-sm text-gray-500">
              Güçlü analitikler, kolay raporlama
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fade-in">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Beni hatırla
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Şifremi unuttum?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 hover:from-primary-700 hover:via-primary-600 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 text-center">
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-primary-800 font-medium">Demo Giriş Bilgileri</p>
                <p className="text-xs text-primary-700 mt-1">
                  Email: admin@example.com<br />
                  Password: password
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Giriş yaparak <span className="text-primary-600">Kullanım Şartları</span> ve <span className="text-primary-600">Gizlilik Politikası</span>'nı kabul etmiş sayılırsınız
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernLogin;