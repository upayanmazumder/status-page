'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '../AuthProvider/AuthProvider';
import axios, { baseURL } from '../../../utils/api';
import type { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import md5 from 'md5';
import { useNotification } from '../../Notification/Notification';
import { Button, Input, Card } from '../../ui';

export default function AuthenticatePage() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
  });
  const { notify } = useNotification();
  const [error, setError] = useState<string | null>(null);

  const getGravatarUrl = (email: string) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${baseURL}/auth/google`;
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post('/auth/login', loginData);
      login(res.data.token);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      notify(
        error?.response?.data?.message || 'Login failed. Please check your credentials.',
        'error'
      );
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const profilePicture = getGravatarUrl(registerData.email);
      await axios.post('/auth/register', {
        ...registerData,
        profilePicture,
        name: registerData.name,
      });
      notify('Registration successful! You can now login.', 'success');
      setActiveTab('login');
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      notify(error?.response?.data?.message || 'Registration failed.', 'error');
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <Card variant="elevated" padding="lg" className="w-full max-w-lg mx-auto">
      {error && (
        <motion.div
          className="mb-4 p-4 bg-red-600 text-white rounded-lg text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      <div className="flex justify-center gap-6 mb-6 border-b border-gray-700 pb-2">
        {['login', 'register'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as 'login' | 'register');
              setError(null);
            }}
            className={`text-lg font-semibold pb-1 transition-all duration-300 ${
              activeTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-indigo-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Button
        onClick={handleGoogleLogin}
        variant="secondary"
        fullWidth
        leftIcon={<FaGoogle className="text-red-500" />}
        className="mb-6 bg-white text-gray-800 hover:bg-gray-100"
      >
        Sign in with Google
      </Button>

      <AnimatePresence mode="wait">
        {activeTab === 'login' ? (
          <motion.form
            key="login"
            onSubmit={handleLoginSubmit}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={formVariants}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Input
              type="email"
              placeholder="Email"
              value={loginData.email}
              onChange={e => setLoginData({ ...loginData, email: e.target.value })}
              leftIcon={<FaEnvelope />}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              leftIcon={<FaLock />}
              required
            />
            <Button type="submit" fullWidth className="mt-6">
              Login
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="register"
            onSubmit={handleRegisterSubmit}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={formVariants}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Input
              value={registerData.name}
              onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
              placeholder="Name"
              leftIcon={<FaUser />}
              required
            />
            <Input
              type="email"
              value={registerData.email}
              onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
              placeholder="Email"
              leftIcon={<FaEnvelope />}
              required
            />
            <Input
              value={registerData.username}
              onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
              placeholder="Username"
              leftIcon={<FaUser />}
              required
            />
            <Input
              type="password"
              value={registerData.password}
              onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
              placeholder="Password"
              leftIcon={<FaLock />}
              required
            />
            <Button type="submit" fullWidth className="mt-6">
              Register
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
