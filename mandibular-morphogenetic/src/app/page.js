'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, Award, FileText, Settings, UploadCloud, User, UserCheck, 
  Camera, LogOut, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Mail, Lock, 
  Building, MapPin, Eye, EyeOff, Check, X, Shield, BookOpen, Download, Share2, 
  ZoomIn, ZoomOut, Maximize2, Moon, Sun, Bell, HelpCircle, ChevronRight, RefreshCw, 
  Smartphone, Monitor, Info, Edit3, Trash2, Calendar, FileSpreadsheet, Send, Sparkles
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Page() {
  // Navigation & Shell State
  const [screen, setScreen] = useState('splash');
  const [navigationHistory, setNavigationHistory] = useState(['splash']);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // User Authentication / Profile State
  const [accounts, setAccounts] = useState([
    { 
      email: 'sarah.wilson@dentalai.org', 
      password: 'password123', 
      name: 'Dr. Sarah Wilson', 
      clinic: 'Metro Dental & Maxillofacial Clinic', 
      department: 'Orthodontics & Dentofacial Orthopedics' 
    }
  ]);
  const [resetEmail, setResetEmail] = useState('');

  const [user, setUser] = useState({
    name: 'Dr. Sarah Wilson',
    email: 'sarah.wilson@dentalai.org',
    clinic: 'Metro Dental & Maxillofacial Clinic',
    department: 'Orthodontics & Dentofacial Orthopedics',
    designation: 'Dentist',
    phone: '+1 (555) 234-5678',
    photo: null
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...user });
  
  // App Interaction State
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStepText, setAnalysisStepText] = useState('');
  
  // Interactive Landmark Coordinates (SVG Canvas coordinates, default values)
  const [co, setCo] = useState({ x: 130, y: 90 });  // Condylion (Top Condyle)
  const [go, setGo] = useState({ x: 100, y: 250 }); // Gonion (Mandibular Angle)
  const [me, setMe] = useState({ x: 260, y: 280 }); // Menton (Bottom Chin)
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1, 1.5, 2
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  
  // Confidence Scores (AI Detection)
  const [confidenceScores, setConfidenceScores] = useState({
    co: 98.4,
    go: 96.2,
    me: 99.1,
    mean: 97.9
  });

  // Recent Scans (Patient records)
  const [recentScans, setRecentScans] = useState([
    {
      id: 'sc-001',
      patientName: 'James Anderson',
      age: 28,
      gender: 'Male',
      type: 'OPG Scan',
      date: 'Today, 9:30 AM',
      status: 'Processed', // Processed (Green), Pending (Orange), Completed (Blue)
      metrics: { angle: 122, height: 61.2, length: 110.5 },
      co: { x: 128, y: 95 },
      go: { x: 98, y: 245 },
      me: { x: 255, y: 275 }
    },
    {
      id: 'sc-002',
      patientName: 'Emily Chen',
      age: 34,
      gender: 'Female',
      type: 'OPG Scan',
      date: 'Yesterday, 4:15 PM',
      status: 'Pending',
      metrics: { angle: 0, height: 0, length: 0 },
      co: null,
      go: null,
      me: null
    },
    {
      id: 'sc-003',
      patientName: 'Michael Davis',
      age: 42,
      gender: 'Male',
      type: 'OPG Scan',
      date: '2 Days Ago',
      status: 'Completed',
      metrics: { angle: 118, height: 63.8, length: 112.1 },
      co: { x: 132, y: 88 },
      go: { x: 102, y: 252 },
      me: { x: 265, y: 285 }
    },
    {
      id: 'sc-004',
      patientName: 'Sophia Rodriguez',
      age: 22,
      gender: 'Female',
      type: 'OPG Scan',
      date: '4 Days Ago',
      status: 'Completed',
      metrics: { angle: 125, height: 58.4, length: 104.2 },
      co: { x: 125, y: 102 },
      go: { x: 105, y: 242 },
      me: { x: 248, y: 278 }
    }
  ]);
  
  const [selectedScanId, setSelectedScanId] = useState('sc-001');

  // Supabase Auth and Sync Effect
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          handleSupabaseUser(session.user);
        }
      });

      // 2. Listen to Auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          handleSupabaseUser(session.user);
        } else {
          // If logged out or session ended, reset screen
          setUser({
            name: 'Guest User',
            email: '',
            clinic: 'Metro Dental Clinic',
            department: 'Orthodontics Department',
            designation: 'Dentist',
            phone: '',
            photo: null
          });
          setScreen('login');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Check URL parameters for password recovery redirection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
        setScreen('reset-password');
      }
    }
  }, []);

  const handleSupabaseUser = async (supabaseUser) => {
    try {
      // Fetch profile from 'profiles' table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      let currentProfile = profile;
      
      if (!profile) {
        // Create new profile if not exists
        const newProfile = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Dentist User',
          clinic: 'Metro Dental & Maxillofacial Clinic',
          department: 'Orthodontics & Dentofacial Orthopedics',
          designation: 'Dentist',
          phone: '',
          photo: null
        };
        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (!insertError && insertedData) {
          currentProfile = insertedData;
        } else {
          currentProfile = newProfile;
        }
      }

      if (currentProfile) {
        setUser({
          name: currentProfile.name || 'Dentist User',
          email: supabaseUser.email || '',
          clinic: currentProfile.clinic || 'Metro Dental & Maxillofacial Clinic',
          department: currentProfile.department || 'Orthodontics & Dentofacial Orthopedics',
          designation: currentProfile.designation || 'Dentist',
          phone: currentProfile.phone || '',
          photo: currentProfile.photo || null
        });
        setProfileForm({
          name: currentProfile.name || 'Dentist User',
          email: supabaseUser.email || '',
          clinic: currentProfile.clinic || 'Metro Dental & Maxillofacial Clinic',
          department: currentProfile.department || 'Orthodontics & Dentofacial Orthopedics',
          designation: currentProfile.designation || 'Dentist',
          phone: currentProfile.phone || '',
          photo: currentProfile.photo || null
        });
      }

      // Fetch patient scans from 'scans' table
      const { data: scans, error: scansError } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (scans && scans.length > 0) {
        const mappedScans = scans.map(s => ({
          id: s.id,
          patientName: s.patient_name,
          age: s.age,
          gender: s.gender,
          type: s.type,
          date: s.date,
          status: s.status,
          metrics: s.metrics || { angle: 0, height: 0, length: 0 },
          co: s.co,
          go: s.go,
          me: s.me,
          uploadedImage: s.uploaded_image
        }));
        setRecentScans(mappedScans);
        setSelectedScanId(mappedScans[0].id);
        if (mappedScans[0].co) setCo(mappedScans[0].co);
        if (mappedScans[0].go) setGo(mappedScans[0].go);
        if (mappedScans[0].me) setMe(mappedScans[0].me);
        if (mappedScans[0].uploadedImage) setUploadedImage(mappedScans[0].uploadedImage);
      }
      
      setNavigationHistory(['dashboard']);
      setScreen('dashboard');
    } catch (e) {
      console.error("Supabase Database error, falling back to local simulation:", e);
    }
  };

  const handleLogOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    showToast('Logged out of system securely', 'warning');
    setNavigationHistory(['splash']);
    setScreen('splash');
  };

  // Trigger Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Screen Navigation Wrapper
  const navigateTo = (newScreen) => {
    if (['login', 'signup', 'forgot-password', 'reset-password'].includes(newScreen)) {
      setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
    }
    setNavigationHistory(prev => [...prev, newScreen]);
    setScreen(newScreen);
  };

  const navigateBack = () => {
    if (navigationHistory.length > 1) {
      const updatedHistory = [...navigationHistory];
      updatedHistory.pop(); // Remove current
      const prev = updatedHistory[updatedHistory.length - 1];
      setNavigationHistory(updatedHistory);
      setScreen(prev);
    } else {
      setScreen('dashboard');
    }
  };

  // Dynamic calculations based on Co, Go, Me positions
  const getMetrics = () => {
    const dx1 = co.x - go.x;
    const dy1 = co.y - go.y;
    const dx2 = me.x - go.x;
    const dy2 = me.y - go.y;

    const dot = dx1 * dx2 + dy1 * dy2;
    const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1); // Condylion to Gonion (pixel distance)
    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2); // Gonion to Menton (pixel distance)

    let angle = 0;
    if (dist1 > 0 && dist2 > 0) {
      const cosTheta = dot / (dist1 * dist2);
      const clamped = Math.max(-1, Math.min(1, cosTheta));
      angle = Math.round((Math.acos(clamped) * 180) / Math.PI);
    }

    // Scaling factors (pixels to mm, mock calibration)
    const pxToMmHeight = 0.38; 
    const pxToMmLength = 0.45;

    const heightMm = parseFloat((dist1 * pxToMmHeight).toFixed(1));
    const lengthMm = parseFloat((dist2 * pxToMmLength).toFixed(1));

    return {
      gonialAngle: angle,
      mandHeight: heightMm,
      mandLength: lengthMm
    };
  };

  const metrics = getMetrics();

  // Handle Dragging Landmarks on Canvas
  const handleCanvasMouseDown = (pointName, e) => {
    e.stopPropagation();
    setDraggedPoint(pointName);
  };

  const handleCanvasMouseMove = (e) => {
    if (draggedPoint && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Account for zoom and pan if inside interactive mode
      let clientX = e.clientX;
      let clientY = e.clientY;
      
      // Support touch events
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      // Calculate relative position to SVG container (0 to 400 for width, 0 to 350 for height)
      const x = ((clientX - rect.left) / rect.width) * 400;
      const y = ((clientY - rect.top) / rect.height) * 350;

      // Constrain coordinates to canvas bounds
      const constrainedX = Math.max(10, Math.min(390, Math.round(x)));
      const constrainedY = Math.max(10, Math.min(340, Math.round(y)));

      if (draggedPoint === 'co') setCo({ x: constrainedX, y: constrainedY });
      if (draggedPoint === 'go') setGo({ x: constrainedX, y: constrainedY });
      if (draggedPoint === 'me') setMe({ x: constrainedX, y: constrainedY });
    } else if (isPanning && canvasRef.current) {
      // Handle panning if selected
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      const dx = clientX - panStart.x;
      const dy = clientY - panStart.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: clientX, y: clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedPoint(null);
    setIsPanning(false);
  };

  // Simulating AI Analysis Flow
  const startAIAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStepText('Uploading high-resolution OPG...');
    
    const steps = [
      { progress: 20, text: 'Preprocessing and normalizing dental radiograph...' },
      { progress: 45, text: 'Executing YOLOv8 keypoint detection model...' },
      { progress: 70, text: 'Localizing anatomic landmarks (Co, Go, Me)...' },
      { progress: 90, text: 'Computing morphometric angular & linear values...' },
      { progress: 100, text: 'Analysis completed successfully!' }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setAnalysisProgress(steps[currentStepIdx].progress);
        setAnalysisStepText(steps[currentStepIdx].text);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsAnalyzing(false);
          // Set random but logical detected points for new analysis
          setCo({ x: 135 + Math.floor(Math.random() * 20 - 10), y: 85 + Math.floor(Math.random() * 20 - 10) });
          setGo({ x: 105 + Math.floor(Math.random() * 16 - 8), y: 245 + Math.floor(Math.random() * 20 - 10) });
          setMe({ x: 255 + Math.floor(Math.random() * 20 - 10), y: 275 + Math.floor(Math.random() * 20 - 10) });
          
          // Add to recent scans list
          const newScanId = 'sc-' + Date.now();
          const freshScan = {
            id: newScanId,
            patientName: authForm.name || 'New Patient Scan',
            age: 26,
            gender: 'Female',
            type: 'OPG Scan',
            date: 'Today, Just Now',
            status: 'Processed',
            metrics: { angle: 123, height: 60.5, length: 108.4 },
            co: { x: 130, y: 90 },
            go: { x: 100, y: 250 },
            me: { x: 260, y: 280 },
            uploadedImage: uploadedImage === 'sample' ? null : uploadedImage
          };

          if (isSupabaseConfigured && supabase) {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                supabase.from('scans').insert([{
                  id: newScanId,
                  user_id: session.user.id,
                  patient_name: freshScan.patientName,
                  age: freshScan.age,
                  gender: freshScan.gender,
                  type: freshScan.type,
                  date: freshScan.date,
                  status: freshScan.status,
                  metrics: freshScan.metrics,
                  co: freshScan.co,
                  go: freshScan.go,
                  me: freshScan.me,
                  uploaded_image: freshScan.uploadedImage,
                  created_at: new Date()
                }]).then(({ error }) => {
                  if (error) console.error("Error inserting scan to Supabase:", error.message);
                });
              }
            });
          }

          setRecentScans(prev => [freshScan, ...prev]);
          setSelectedScanId(newScanId);
          showToast('AI Landmark Detection Finished!', 'success');
          setScreen('analysis');
        }, 800);
      }
    }, 1200);
  };

  // Mock Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        showToast('OPG Radiograph uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleOPG = () => {
    setUploadedFileName('sample_opg_radiograph.png');
    // Using a sample standard medical base64 representation or path. We will simulate with high-quality SVG/Canvas
    setUploadedImage('sample'); 
    showToast('Loaded standard sample OPG radiograph.');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              name: profileForm.name,
              clinic: profileForm.clinic,
              department: profileForm.department,
              designation: profileForm.designation,
              phone: profileForm.phone,
              photo: profileForm.photo,
              updated_at: new Date()
            });
          if (error) {
            showToast(error.message, 'warning');
            return;
          }
        }
      } catch (err) {
        console.error("Error saving profile to Supabase:", err);
      }
    }

    setUser({ ...profileForm });
    setAccounts(prev => prev.map(acc => {
      if (acc.email.toLowerCase() === profileForm.email.toLowerCase()) {
        return {
          ...acc,
          name: profileForm.name,
          clinic: profileForm.clinic,
          department: profileForm.department
        };
      }
      return acc;
    }));
    showToast('Profile configuration updated!', 'success');
    setScreen('dashboard');
  };

  // Switch tabs in bottom nav
  const handleTabClick = (tab) => {
    if (tab === 'home') {
      setNavigationHistory(['dashboard']);
      setScreen('dashboard');
    } else if (tab === 'upload') {
      setNavigationHistory(['upload-opg']);
      setScreen('upload-opg');
    } else if (tab === 'analysis') {
      setNavigationHistory(['analysis']);
      setScreen('analysis');
    } else if (tab === 'reports') {
      setNavigationHistory(['reports']);
      setScreen('reports');
    } else if (tab === 'settings') {
      setNavigationHistory(['settings']);
      setScreen('settings');
    }
  };

  const isAuthScreen = ['splash', 'login', 'signup', 'forgot-password', 'reset-password', 'reset-success'].includes(screen);

  return (
    <div className={`min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 flex flex-col font-sans ${darkMode ? 'dark bg-slate-950 text-slate-100' : ''}`}>
      
      {/* Top Application Header for Logged In Workspace (or non-auth pages) */}
      {!isAuthScreen && (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 shadow-sm flex items-center justify-between z-40 transition-colors sticky top-0">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-xs sm:text-sm md:text-base">
              Mandibular Morphogenetic Analysis System
            </span>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
              v2.4-Beta
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block ${
              isSupabaseConfigured 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
            }`}>
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Demo Mode'}
            </span>
          </div>

          {/* Desktop Top Tabs Navigation */}
          <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => handleTabClick('home')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${screen === 'dashboard' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleTabClick('upload')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${screen === 'upload-opg' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'}`}
            >
              Upload
            </button>
            <button 
              onClick={() => handleTabClick('analysis')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${['analysis', 'measurements'].includes(screen) ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'}`}
            >
              Analysis
            </button>
            <button 
              onClick={() => handleTabClick('reports')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${screen === 'reports' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'}`}
            >
              Reports
            </button>
            <button 
              onClick={() => handleTabClick('settings')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${screen === 'settings' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'}`}
            >
              Settings
            </button>
          </nav>
          
          <div className="flex items-center space-x-3">
            {/* Quick Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User details & profile logout shortcuts */}
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-3">
              <div 
                onClick={() => navigateTo('setup-profile')}
                className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-xs text-blue-600 dark:text-blue-300 cursor-pointer hover:scale-105 transition"
                title="Edit Profile"
              >
                {user.name.charAt(0)}
              </div>
              <button 
                onClick={handleLogOut}
                className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Workspace */}
      <main className={`flex-1 flex flex-col grid-bg ${screen === 'splash' ? '' : 'p-4 md:p-6 lg:p-8 justify-center items-center'}`}>
        
        {/* Toast Notifications */}
        {toast.show && (
          <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl animate-bounce border border-slate-800 dark:border-slate-200 text-sm">
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Dynamic Web Shell Wrapper */}
        <div className={`transition-all duration-500 flex flex-col ${
          screen === 'splash'
            ? 'w-full flex-1'
            : isAuthScreen
              ? 'w-full max-w-md bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden'
              : 'w-full max-w-7xl mx-auto flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden min-h-[720px]'
        }`}>
          
          {/* Screen Content Container */}
          <div className="flex-1 overflow-y-auto relative flex flex-col">

            {/* SCREEN 1: SPLASH SCREEN */}
            {screen === 'splash' && (
              <div className="flex-1 flex flex-col justify-between p-8 text-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-indigo-950 to-blue-900"></div>
                <div className="absolute inset-0 grid-bg opacity-10"></div>
                
                {/* Decorative glowing backdrops */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/20 blur-3xl rounded-full"></div>
                
                <div></div>

                {/* Main Logo & Identity */}
                <div className="flex flex-col items-center justify-center space-y-6 z-10">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-md border border-white/25 rounded-3xl flex items-center justify-center shadow-xl animate-pulse-ring relative">
                    <Activity className="h-12 w-12 text-white" />
                    <Sparkles className="h-5 w-5 text-amber-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                      Mandibular Morphogenetic<br/>
                      <span className="text-blue-100 font-medium">Analysis System</span>
                    </h1>
                    <div className="h-1 w-16 bg-white/50 mx-auto rounded-full"></div>
                    <p className="text-blue-100 text-xs md:text-sm tracking-wide font-light max-w-xs mx-auto">
                      AI-Powered OPG Landmark Detection & Radiographic Diagnostics
                    </p>
                  </div>
                </div>

                {/* Footer and Get Started */}
                <div className="space-y-6 z-10">
                  <button 
                    onClick={() => navigateTo('login')}
                    className="w-full bg-white text-blue-700 font-bold py-4 px-6 rounded-2xl shadow-xl hover:bg-slate-50 active:scale-[0.98] transition flex items-center justify-center space-x-2 text-sm"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-blue-200 opacity-80">
                    Secure clinical platform. Compliant with HIPAA standards.
                  </p>
                </div>
              </div>
            )}

            {/* SCREEN 2: CREATE ACCOUNT */}
            {screen === 'signup' && (
              <div className="flex-1 flex flex-col justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center space-x-2 -mt-4 mb-4">
                    <button onClick={navigateBack} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">Back</span>
                  </div>

                  {/* Header */}
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Account</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Create your account to continue</p>
                  </div>

                  {/* Form */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!authForm.name || !authForm.email || !authForm.password) {
                      showToast('Please fill out all fields', 'warning');
                      return;
                    }
                    if (/\s/.test(authForm.password)) {
                      showToast('Space not allowed', 'warning');
                      return;
                    }
                    if (authForm.password !== authForm.confirmPassword) {
                      showToast('Passwords do not match', 'warning');
                      return;
                    }
                    
                    if (isSupabaseConfigured && supabase) {
                      const { data, error } = await supabase.auth.signUp({
                        email: authForm.email,
                        password: authForm.password,
                        options: {
                          data: {
                            name: authForm.name
                          }
                        }
                      });
                      if (error) {
                        showToast(error.message, 'warning');
                      } else {
                        // Try to sign in immediately after signup (works when email confirmation is disabled)
                        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                          email: authForm.email,
                          password: authForm.password
                        });
                        if (signInError) {
                          // Email confirmation is still enabled — guide the user
                          showToast('Account created! Please check your email inbox and click the confirmation link, then sign in.', 'success');
                          navigateTo('login');
                        } else {
                          showToast('Account created and signed in successfully!', 'success');
                        }
                      }
                      return;
                    }

                    // Simulate signup, add credentials to database, transfer name to profile setup form
                    setAccounts(prev => [
                      ...prev,
                      { email: authForm.email, password: authForm.password, name: authForm.name, clinic: '', department: '' }
                    ]);
                    setProfileForm(prev => ({ 
                      ...prev, 
                      name: authForm.name, 
                      email: authForm.email,
                      clinic: '',
                      department: '',
                      designation: 'Dentist',
                      phone: ''
                    }));
                    showToast('Account created! Let\'s set up your profile.');
                    navigateTo('setup-profile');
                  }} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Dr. Jane Doe"
                          value={authForm.name}
                          onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="email" 
                          placeholder="doctor@institution.edu"
                          value={authForm.email}
                          onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                         <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          value={authForm.password || ''}
                          onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                          className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border ${authForm.password && /\s/.test(authForm.password) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'} rounded-xl text-sm focus:outline-none focus:ring-2 dark:text-white`}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {authForm.password && /\s/.test(authForm.password) && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Space not allowed
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          value={authForm.confirmPassword || ''}
                          onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                          className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border ${authForm.confirmPassword && /\s/.test(authForm.confirmPassword) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'} rounded-xl text-sm focus:outline-none focus:ring-2 dark:text-white`}
                        />
                      </div>
                      {authForm.confirmPassword && /\s/.test(authForm.confirmPassword) && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Space not allowed
                        </p>
                      )}
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition active:scale-[0.98] text-sm"
                    >
                      Create Account
                    </button>
                  </form>

                  {/* Dividers */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="w-[30%] h-px bg-slate-200 dark:bg-slate-700"></span>
                    <span>OR CONTINUE WITH</span>
                    <span className="w-[30%] h-px bg-slate-200 dark:bg-slate-700"></span>
                  </div>

                  {/* Google Login */}
                  <button 
                    onClick={() => {
                      setUser(prev => ({
                        ...prev,
                        name: 'Dr. Jane Miller',
                        email: 'jane.miller@clinicalai.com'
                      }));
                      showToast('Signed in via Google Workspace');
                      navigateTo('setup-profile');
                    }}
                    className="w-full py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 text-slate-700 dark:text-white transition"
                  >
                    <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.281 1.094 15.477 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.839 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Footer Link */}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <button onClick={() => navigateTo('login')} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* SCREEN 3: WELCOME BACK (LOGIN) */}
            {screen === 'login' && (
              <div className="flex-1 flex flex-col justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center space-x-2 -mt-4 mb-2">
                    <button onClick={navigateBack} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">Back</span>
                  </div>

                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome Back</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to your account</p>
                  </div>

                  {/* Form */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!authForm.email || !authForm.password) {
                      showToast('Please enter both email and password', 'warning');
                      return;
                    }
                    if (/\s/.test(authForm.password)) {
                      showToast('Space not allowed', 'warning');
                      return;
                    }

                    if (isSupabaseConfigured && supabase) {
                      const { data, error } = await supabase.auth.signInWithPassword({
                        email: authForm.email,
                        password: authForm.password
                      });
                      if (error) {
                        // Handle unconfirmed email: auto-resend confirmation or show guidance
                        if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed')) {
                          // Attempt to resend confirmation, then show helpful message
                          await supabase.auth.resend({ type: 'signup', email: authForm.email });
                          showToast('Your email is not confirmed. A new confirmation link has been sent to your inbox. Please check your email and click the link, then sign in again.', 'warning');
                        } else if (error.message.toLowerCase().includes('invalid login') || error.message.toLowerCase().includes('invalid credentials')) {
                          showToast('Invalid email or password. Please try again.', 'warning');
                        } else {
                          showToast(error.message, 'warning');
                        }
                      } else {
                        showToast('Successfully signed in!', 'success');
                      }
                      return;
                    }

                    const matchedAccount = accounts.find(
                      acc => acc.email.toLowerCase() === authForm.email.toLowerCase() && acc.password === authForm.password
                    );
                    if (matchedAccount) {
                      setUser({
                        ...user,
                        email: matchedAccount.email,
                        name: matchedAccount.name,
                        clinic: matchedAccount.clinic || 'Metro Dental Clinic',
                        department: matchedAccount.department || 'Orthodontics Department'
                      });
                      showToast('Successfully signed in!', 'success');
                      setNavigationHistory(['dashboard']);
                      setScreen('dashboard');
                    } else {
                      showToast('Invalid email or password', 'warning');
                    }
                  }} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="email" 
                          placeholder="doctor@institution.edu"
                          value={authForm.email || ''}
                          onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                        <button 
                          type="button"
                          onClick={() => navigateTo('forgot-password')} 
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          value={authForm.password || ''}
                          onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                          required
                          className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border ${authForm.password && /\s/.test(authForm.password) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'} rounded-xl text-sm focus:outline-none focus:ring-2 dark:text-white`}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {authForm.password && /\s/.test(authForm.password) && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Space not allowed
                        </p>
                      )}
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 dark:text-slate-400">
                        Remember Me
                      </label>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition active:scale-[0.98] text-sm"
                    >
                      Sign In
                    </button>
                  </form>

                  {/* Footer Link */}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Don&apos;t have an account?{' '}
                    <button onClick={() => navigateTo('signup')} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      Create New Account
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* SCREEN 4: FORGOT PASSWORD */}
            {screen === 'forgot-password' && (
              <div className="flex-1 flex flex-col justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center space-x-2 -mt-4 mb-4">
                    <button onClick={navigateBack} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">Back</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Forgot Password?</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter your email address to receive a password reset link.
                    </p>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const emailVal = e.target.elements[0].value;

                    if (isSupabaseConfigured && supabase) {
                      const { error } = await supabase.auth.resetPasswordForEmail(emailVal, {
                        redirectTo: `${window.location.origin}/?screen=reset-password`
                      });
                      if (error) {
                        showToast(error.message, 'warning');
                      } else {
                        setResetEmail(emailVal);
                        showToast('Reset link sent! Check your email inbox.', 'success');
                      }
                      return;
                    }

                    const matched = accounts.some(acc => acc.email.toLowerCase() === emailVal.toLowerCase());
                    if (!matched) {
                      showToast('No account found with this email', 'warning');
                      return;
                    }
                    setResetEmail(emailVal);
                    showToast('Reset link sent! Check your email inbox.', 'success');
                    navigateTo('reset-password');
                  }} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="email" 
                          placeholder="doctor@institution.edu"
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition active:scale-[0.98] text-sm"
                    >
                      Send Reset Link
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* SCREEN 5: RESET PASSWORD */}
            {screen === 'reset-password' && (
              <div className="flex-1 flex flex-col justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center space-x-2 -mt-4 mb-4">
                    <button onClick={navigateBack} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">Back</span>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reset Password</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enter a secure new password for your account</p>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!authForm.password || !authForm.confirmPassword) {
                      showToast('Please fill out all fields', 'warning');
                      return;
                    }
                    if (/\s/.test(authForm.password)) {
                      showToast('Space not allowed', 'warning');
                      return;
                    }
                    if (authForm.password !== authForm.confirmPassword) {
                      showToast('Passwords do not match', 'warning');
                      return;
                    }

                    if (isSupabaseConfigured && supabase) {
                      const { error } = await supabase.auth.updateUser({
                        password: authForm.password
                      });
                      if (error) {
                        showToast(error.message, 'warning');
                      } else {
                        showToast('Password updated successfully!', 'success');
                        navigateTo('reset-success');
                      }
                      return;
                    }

                    setAccounts(prev => prev.map(acc => {
                      if (acc.email.toLowerCase() === resetEmail.toLowerCase()) {
                        return { ...acc, password: authForm.password };
                      }
                      return acc;
                    }));
                    showToast('Password updated successfully!', 'success');
                    navigateTo('reset-success');
                  }} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={authForm.password || ''}
                          onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                          required
                          className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border ${authForm.password && /\s/.test(authForm.password) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'} rounded-xl text-sm focus:outline-none focus:ring-2 dark:text-white`}
                        />
                      </div>
                      {authForm.password && /\s/.test(authForm.password) && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Space not allowed
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={authForm.confirmPassword || ''}
                          onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                          required
                          className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border ${authForm.confirmPassword && /\s/.test(authForm.confirmPassword) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'} rounded-xl text-sm focus:outline-none focus:ring-2 dark:text-white`}
                        />
                      </div>
                      {authForm.confirmPassword && /\s/.test(authForm.confirmPassword) && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Space not allowed
                        </p>
                      )}
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition active:scale-[0.98] text-sm"
                    >
                      Reset Password
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* SCREEN 5 SUB: SUCCESS SCREEN */}
            {screen === 'reset-success' && (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Top Bar Navigation */}
                  <div className="w-full flex items-center space-x-2 -mt-4 mb-4 text-left">
                    <button onClick={() => {
                      setNavigationHistory(['splash']);
                      setScreen('login');
                    }} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">Back</span>
                  </div>

                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Password Updated</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your password has been changed successfully. You can now log in using your new credentials.
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      setNavigationHistory(['splash']);
                      setScreen('login');
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition active:scale-[0.98] text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 6: SET UP PROFILE */}
            {screen === 'setup-profile' && (
              <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center space-x-2 -mt-2 mb-4">
                    <button onClick={navigateBack} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">Back</span>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Set Up Your Profile</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Add credentials to customize your clinical reports</p>
                  </div>

                  <form onSubmit={handleProfileSave} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500 flex items-center justify-center text-slate-700 dark:text-white font-semibold text-2xl overflow-hidden shadow-md">
                          {profileForm.photo ? (
                            <img src={profileForm.photo} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>{profileForm.name ? profileForm.name.charAt(0) : 'D'}</span>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer shadow-md hover:scale-105 transition">
                          <Camera className="h-3.5 w-3.5" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setProfileForm({ ...profileForm, photo: reader.result });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span className="text-[10px] text-slate-400">Upload profile image (optional)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution / College / Clinic Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.clinic}
                        onChange={(e) => setProfileForm({ ...profileForm, clinic: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</label>
                        <input 
                          type="text" 
                          value={profileForm.department}
                          onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Designation</label>
                        <select 
                          value={profileForm.designation}
                          onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                          <option value="Student">Student</option>
                          <option value="Dentist">Dentist</option>
                          <option value="Researcher">Researcher</option>
                          <option value="Faculty">Faculty</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition active:scale-[0.98] text-sm"
                    >
                      Save & Continue
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* SCREEN 7: MAIN DASHBOARD (Home) */}
            {screen === 'dashboard' && (
              <div className="flex-1 p-5 space-y-6 bg-slate-50 dark:bg-slate-900/40 transition-colors">
                
                {/* Header Welcome Section */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Good Morning 👋</p>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h3>
                    <p className="text-[10px] text-slate-400 flex items-center">
                      <Building className="h-3 w-3 mr-1" />
                      {user.clinic}
                    </p>
                  </div>
                  
                  {/* User Profile Avatar click returns to Setup Profile for convenience */}
                  <button 
                    onClick={() => {
                      setProfileForm({ ...user });
                      navigateTo('setup-profile');
                    }}
                    className="w-12 h-12 rounded-full border-2 border-blue-500/30 overflow-hidden bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 shadow-md hover:scale-105 active:scale-95 transition"
                  >
                    {user.photo ? (
                      <img src={user.photo} alt="Doc Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.name.charAt(0)}</span>
                    )}
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search patients, reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                  />
                  <svg className="absolute left-3 top-3 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* QUICK ACTION GRID (2 x 2) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    {/* Action 1: Upload OPG */}
                    <button 
                      onClick={() => navigateTo('upload-opg')}
                      className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 text-left hover:scale-[1.02] active:scale-[0.98] hover:shadow-md transition duration-200 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                        <UploadCloud className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                      </div>
                      <span className="block font-bold text-slate-800 dark:text-white text-xs">Upload OPG</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Analyze new image</span>
                    </button>

                    {/* Action 2: Capture OPG */}
                    <button 
                      onClick={() => {
                        showToast('Accessing imaging camera roll...', 'success');
                        handleUseSampleOPG();
                        navigateTo('upload-opg');
                      }}
                      className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 text-left hover:scale-[1.02] active:scale-[0.98] hover:shadow-md transition duration-200 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                        <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                      </div>
                      <span className="block font-bold text-slate-800 dark:text-white text-xs">Capture OPG</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Simulate dental feed</span>
                    </button>

                    {/* Action 3: My Reports */}
                    <button 
                      onClick={() => navigateTo('reports')}
                      className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 text-left hover:scale-[1.02] active:scale-[0.98] hover:shadow-md transition duration-200 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                      </div>
                      <span className="block font-bold text-slate-800 dark:text-white text-xs">My Reports</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">View clinical output</span>
                    </button>

                    {/* Action 4: Landmark Guide */}
                    <button 
                      onClick={() => navigateTo('landmark-guide')}
                      className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 text-left hover:scale-[1.02] active:scale-[0.98] hover:shadow-md transition duration-200 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                      </div>
                      <span className="block font-bold text-slate-800 dark:text-white text-xs">Landmark Guide</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Anatomy tutorials</span>
                    </button>

                  </div>
                </div>

                {/* RECENT SCANS SECTION */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Scans</h4>
                    <button 
                      onClick={() => navigateTo('reports')} 
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      See All
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {recentScans
                      .filter(scan => scan.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((scan) => (
                        <div 
                          key={scan.id}
                          onClick={() => {
                            setSelectedScanId(scan.id);
                            if (scan.status === 'Processed' || scan.status === 'Completed') {
                              // Load coordinates for interactive editing
                              if (scan.co) {
                                setCo(scan.co);
                                setGo(scan.go);
                                setMe(scan.me);
                              }
                              navigateTo('reports');
                            } else {
                              showToast('Scan analysis pending. Initiating AI engine.', 'warning');
                              handleUseSampleOPG();
                              navigateTo('upload-opg');
                            }
                          }}
                          className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-3 shadow-2xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs uppercase">
                              {scan.patientName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-800 dark:text-white leading-tight">{scan.patientName}</p>
                              <span className="text-[10px] text-slate-400">{scan.type} • {scan.date}</span>
                            </div>
                          </div>
                          
                          {/* Badge Status */}
                          <div>
                            {scan.status === 'Processed' && (
                              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                Processed
                              </span>
                            )}
                            {scan.status === 'Pending' && (
                              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                                Pending
                              </span>
                            )}
                            {scan.status === 'Completed' && (
                              <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 8: UPLOAD OPG SCREEN */}
            {screen === 'upload-opg' && (
              <div className="flex-1 p-6 space-y-6 bg-slate-50 dark:bg-slate-900/40 transition-colors flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Top Bar Navigation */}
                  <div className="flex items-center space-x-2">
                    <button onClick={navigateBack} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Upload OPG</h3>
                  </div>

                  {/* Drag and Drop Zone */}
                  {!uploadedImage ? (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-3xl p-8 text-center bg-white dark:bg-slate-800 flex flex-col items-center justify-center space-y-4 min-h-[300px] transition cursor-pointer relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/80 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-slate-700 dark:text-white">Drag and drop your OPG radiograph</p>
                        <p className="text-[10px] text-slate-400">or click to browse local files</p>
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 w-full max-w-[200px]">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Supported formats</span>
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {['JPG', 'PNG', 'JPEG', 'DICOM'].map(f => (
                            <span key={f} className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[8px] font-bold px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Image preview before analysis */
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {uploadedImage === 'sample' ? (
                          /* Sample radiographic placeholder sketch using detailed dental OPG SVG */
                          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none">
                            <span className="text-[10px] text-blue-500/60 font-semibold mb-2 tracking-widest uppercase">Clinical Radiograph Preview</span>
                            <svg className="w-full h-32 opacity-40 text-slate-400" viewBox="0 0 400 200" fill="none">
                              {/* Draw mandible skeleton curve */}
                              <path d="M 50,30 Q 30,120 120,150 T 280,150 T 350,30" stroke="white" strokeWidth="8" strokeLinecap="round" />
                              {/* Teeth sketches */}
                              <g fill="white" opacity="0.6">
                                <rect x="150" y="130" width="10" height="15" rx="3" />
                                <rect x="165" y="130" width="10" height="15" rx="3" />
                                <rect x="180" y="130" width="10" height="15" rx="3" />
                                <rect x="195" y="130" width="10" height="15" rx="3" />
                                <rect x="210" y="130" width="10" height="15" rx="3" />
                                <rect x="225" y="130" width="10" height="15" rx="3" />
                                <rect x="240" y="130" width="10" height="15" rx="3" />
                              </g>
                            </svg>
                            <span className="text-[10px] text-slate-400 font-mono mt-2">{uploadedFileName}</span>
                          </div>
                        ) : (
                          <img src={uploadedImage} alt="Uploaded OPG" className="max-w-full max-h-full object-contain" />
                        )}
                        <button 
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white max-w-[200px] truncate">{uploadedFileName}</p>
                          <span className="text-[10px] text-slate-400">Ready for neural networks classification</span>
                        </div>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                          100% Loaded
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Load standard sample OPG link */}
                  {!uploadedImage && (
                    <button 
                      onClick={handleUseSampleOPG}
                      className="w-full py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition shadow-2xs"
                    >
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span>Use Clinical Sample Radiograph</span>
                    </button>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  {uploadedImage ? (
                    <button 
                      onClick={startAIAnalysis}
                      disabled={isAnalyzing}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition text-sm flex items-center justify-center space-x-2"
                    >
                      <Activity className="h-4 w-4 animate-spin" style={{ animationDuration: isAnalyzing ? '1s' : '0s' }} />
                      <span>{isAnalyzing ? 'Running AI Engine...' : 'Analyze OPG'}</span>
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-bold rounded-2xl text-sm cursor-not-allowed"
                    >
                      Select an image to analyze
                    </button>
                  )}
                </div>

                {/* Simulated AI Processing Modal Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-white text-center">
                    <div className="space-y-6 w-full max-w-xs">
                      {/* Scanning Box animation */}
                      <div className="w-48 h-48 border border-blue-500/40 rounded-3xl relative mx-auto overflow-hidden bg-slate-900 flex items-center justify-center">
                        <div className="animate-scan"></div>
                        <svg className="w-32 h-20 text-blue-500/30" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10,10 Q5,30 30,40 T70,40 T90,10" />
                        </svg>
                        <Activity className="h-8 w-8 text-blue-500 animate-pulse absolute" />
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-extrabold text-sm tracking-wide">YOLOv8 Processing</h4>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${analysisProgress}%` }}
                          ></div>
                        </div>

                        <p className="text-[10px] text-blue-300 font-mono h-8 flex items-center justify-center">
                          {analysisStepText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* SCREEN 9: AI ANALYSIS & SCREEN 10: MEASUREMENTS (Combined with toggle) */}
            {screen === 'analysis' && (
              <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/40 transition-colors flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setScreen('dashboard')} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">OPG AI Analysis</h3>
                    </div>
                    
                    {/* View Toggle tabs: Landmark Detection vs Measurements */}
                    <div className="bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg flex space-x-0.5 border border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => setZoomLevel(1)} // Reset zoom when toggling
                        className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase transition-all ${zoomLevel === 1 ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                      >
                        Landmarks
                      </button>
                      <button 
                        onClick={() => navigateTo('measurements')}
                        className="px-3 py-1 rounded-md text-[10px] font-extrabold uppercase text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                      >
                        Measurements
                      </button>
                    </div>
                  </div>

                  {/* Interactive Workspace Box */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 relative">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                        <Info className="h-3.5 w-3.5 mr-1 text-blue-500" />
                        Drag points to fine-tune landmarks
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded">
                        Confidence: {confidenceScores.mean}%
                      </span>
                    </div>

                    {/* Canvas / OPG Image Workspace */}
                    <div 
                      className="relative border border-slate-200 dark:border-slate-700 rounded-2xl aspect-[4/3.5] bg-slate-950 overflow-hidden select-none"
                      onMouseMove={handleCanvasMouseMove}
                      onTouchMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onTouchEnd={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    >
                      {/* Zoom and pan styling */}
                      <div 
                        className="w-full h-full relative"
                        style={{
                          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                          transformOrigin: 'center center',
                          transition: draggedPoint ? 'none' : 'transform 0.2s ease-out'
                        }}
                      >
                        {/* Radiograph background sketch */}
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950 via-slate-900 to-black"></div>
                        
                        {/* Grid overlay for medical calibration feel */}
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                        {/* HIGH FIDELITY MANDIBLE OUTLINE DRAWN BY SVG PATH DYNAMIC TO COORDINATES */}
                        <svg 
                          ref={canvasRef}
                          viewBox="0 0 400 350" 
                          className="w-full h-full absolute inset-0 z-10"
                        >
                          <defs>
                            <linearGradient id="jawGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#93c5fd" />
                              <stop offset="50%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#1e3a8a" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Upper Maxilla Sketch line */}
                          <path d="M 20,40 Q 150,55 380,45" stroke="#475569" strokeWidth="4" strokeDasharray="3,3" fill="none" opacity="0.4" />
                          
                          {/* Dental Arch tooth roots sketch */}
                          <path d="M 60,110 Q 140,115 320,115" stroke="#475569" strokeWidth="2" fill="none" opacity="0.3" />

                          {/* Dynamic Mandible Outline responding to Co, Go, Me positions */}
                          {/* Draws Ramus (Co -> Go) and Corpus (Go -> Me) with curves */}
                          <path
                            d={`M ${co.x},${co.y} 
                                C ${co.x - 10},${co.y + 40} ${go.x - 18},${go.y - 65} ${go.x},${go.y}
                                C ${go.x + 20},${go.y + 25} ${me.x - 55},${me.y + 12} ${me.x},${me.y}`}
                            fill="none"
                            stroke="url(#jawGradient)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            opacity="0.75"
                            filter="url(#glow)"
                            className="transition-all duration-75"
                          />

                          {/* Coronoid process skeletal outline (anterior to condyle) */}
                          <path
                            d={`M ${co.x + 40},${co.y + 15} C ${co.x + 35},${co.y + 45} ${co.x + 5},${co.y + 20} ${co.x},${co.y}`}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="3"
                            opacity="0.5"
                          />

                          {/* Connective Line Overlay representing measurements */}
                          <line x1={co.x} y1={co.y} x2={go.x} y2={go.y} stroke="#10b981" strokeWidth="2" strokeDasharray="4,2" opacity="0.8" />
                          <line x1={go.x} y1={go.y} x2={me.x} y2={me.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2" opacity="0.8" />

                          {/* Gonial Angle visual arc representation */}
                          {(() => {
                            const dx1 = co.x - go.x;
                            const dy1 = co.y - go.y;
                            const dx2 = me.x - go.x;
                            const dy2 = me.y - go.y;
                            const dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
                            const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
                            if(dist1 > 0 && dist2 > 0) {
                              const ax1 = go.x + (dx1 / dist1) * 35;
                              const ay1 = go.y + (dy1 / dist1) * 35;
                              const ax2 = go.x + (dx2 / dist2) * 35;
                              const ay2 = go.y + (dy2 / dist2) * 35;
                              return (
                                <path 
                                  d={`M ${ax1},${ay1} A 35,35 0 0,1 ${ax2},${ay2}`}
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="2.5"
                                  opacity="0.8"
                                />
                              );
                            }
                            return null;
                          })()}

                          {/* Landmark Nodes (Interactable) */}
                          
                          {/* 1. Condylion (Co) - Green */}
                          <g 
                            transform={`translate(${co.x}, ${co.y})`}
                            onMouseDown={(e) => handleCanvasMouseDown('co', e)}
                            onTouchStart={(e) => handleCanvasMouseDown('co', e)}
                            className="cursor-move group"
                          >
                            <circle r="12" fill="#10b981" opacity="0.25" className="animate-ping" />
                            <circle r="7" fill="#10b981" stroke="white" strokeWidth="2" className="shadow-lg group-hover:scale-125 transition-transform" />
                            {/* Attached label */}
                            <foreignObject x="10" y="-12" width="60" height="20">
                              <span className="bg-emerald-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow block w-max leading-none">Co (Condylion)</span>
                            </foreignObject>
                          </g>

                          {/* 2. Gonion (Go) - Orange */}
                          <g 
                            transform={`translate(${go.x}, ${go.y})`}
                            onMouseDown={(e) => handleCanvasMouseDown('go', e)}
                            onTouchStart={(e) => handleCanvasMouseDown('go', e)}
                            className="cursor-move group"
                          >
                            <circle r="12" fill="#f59e0b" opacity="0.25" className="animate-ping" />
                            <circle r="7" fill="#f59e0b" stroke="white" strokeWidth="2" className="shadow-lg group-hover:scale-125 transition-transform" />
                            <foreignObject x="-70" y="-8" width="60" height="20">
                              <span className="bg-amber-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow block w-max leading-none ml-auto">Go (Gonion)</span>
                            </foreignObject>
                          </g>

                          {/* 3. Menton (Me) - Blue */}
                          <g 
                            transform={`translate(${me.x}, ${me.y})`}
                            onMouseDown={(e) => handleCanvasMouseDown('me', e)}
                            onTouchStart={(e) => handleCanvasMouseDown('me', e)}
                            className="cursor-move group"
                          >
                            <circle r="12" fill="#3b82f6" opacity="0.25" className="animate-ping" />
                            <circle r="7" fill="#3b82f6" stroke="white" strokeWidth="2" className="shadow-lg group-hover:scale-125 transition-transform" />
                            <foreignObject x="10" y="2" width="60" height="20">
                              <span className="bg-blue-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow block w-max leading-none">Me (Menton)</span>
                            </foreignObject>
                          </g>
                        </svg>

                        {/* Interactive drag feedback visual aids */}
                        {draggedPoint && (
                          <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg border border-slate-700/80 pointer-events-none flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span>Adjusting {draggedPoint.toUpperCase()} landmark coords</span>
                          </div>
                        )}
                      </div>

                      {/* Floating zoom/pan controls */}
                      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col space-y-1.5 z-20">
                        <button 
                          onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setZoomLevel(1);
                            setPanOffset({ x: 0, y: 0 });
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                          title="Reset view"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Landmark Coordinates Table */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anatomic Coordinates</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Condylion Coords Card */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Condylion (Co)</span>
                        <p className="font-mono text-xs font-semibold dark:text-slate-200">X: {co.x} | Y: {co.y}</p>
                        <span className="text-[9px] text-slate-400 block">Conf: {confidenceScores.co}%</span>
                      </div>
                      
                      {/* Gonion Coords Card */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">Gonion (Go)</span>
                        <p className="font-mono text-xs font-semibold dark:text-slate-200">X: {go.x} | Y: {go.y}</p>
                        <span className="text-[9px] text-slate-400 block">Conf: {confidenceScores.go}%</span>
                      </div>

                      {/* Menton Coords Card */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">Menton (Me)</span>
                        <p className="font-mono text-xs font-semibold dark:text-slate-200">X: {me.x} | Y: {me.y}</p>
                        <span className="text-[9px] text-slate-400 block">Conf: {confidenceScores.me}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <div className="pt-4 flex space-x-3">
                  <button 
                    onClick={() => {
                      setCo({ x: 130, y: 90 });
                      setGo({ x: 100, y: 250 });
                      setMe({ x: 260, y: 280 });
                      showToast('Re-initialized coordinates');
                    }}
                    className="p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-50 active:scale-95 transition"
                    title="Reset Coordinates"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => navigateTo('measurements')}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition text-xs flex items-center justify-center space-x-2"
                  >
                    <span>View Morphometric Results</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

              </div>
            )}

            {/* SCREEN 10: MEASUREMENTS SCREEN (Morphometric Analysis) */}
            {screen === 'measurements' && (
              <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/40 transition-colors flex flex-col justify-between">
                
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setScreen('analysis')} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Morphometrics</h3>
                    </div>

                    <div className="bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg flex space-x-0.5 border border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => navigateTo('analysis')}
                        className="px-3 py-1 rounded-md text-[10px] font-extrabold uppercase text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                      >
                        Landmarks
                      </button>
                      <button 
                        disabled
                        className="px-3 py-1 rounded-md text-[10px] font-extrabold uppercase bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      >
                        Measurements
                      </button>
                    </div>
                  </div>

                  {/* Calculated metrics cards grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Gonial Angle Card */}
                    <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-1 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gonial Angle</span>
                      <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{metrics.gonialAngle}°</p>
                      <span className="bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[8px] font-extrabold px-1 rounded block w-max mx-auto leading-normal">Co-Go-Me</span>
                    </div>

                    {/* MandHeight Card */}
                    <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-1 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mand. Height</span>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.mandHeight} mm</p>
                      <span className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[8px] font-extrabold px-1 rounded block w-max mx-auto leading-normal">Co-Go</span>
                    </div>

                    {/* MandLength Card */}
                    <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-1 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mand. Length</span>
                      <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{metrics.mandLength} mm</p>
                      <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[8px] font-extrabold px-1 rounded block w-max mx-auto leading-normal">Go-Me</span>
                    </div>
                  </div>

                  {/* SVG Bar Chart Comparison */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Clinical Range Comparison</span>
                      <span className="text-[10px] text-blue-500 font-bold lowercase">Patient vs Normative</span>
                    </h4>

                    {/* Custom SVG Bar Chart */}
                    <div className="w-full flex items-center justify-center p-2">
                      <svg className="w-full max-w-[320px] h-36" viewBox="0 0 320 144" fill="none">
                        {/* Y-axis lines */}
                        <line x1="80" y1="10" x2="80" y2="120" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                        <line x1="160" y1="10" x2="160" y2="120" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                        <line x1="240" y1="10" x2="240" y2="120" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />

                        {/* Chart grid background labels */}
                        <text x="80" y="132" fill="#94a3b8" fontSize="8" textAnchor="middle">50%</text>
                        <text x="160" y="132" fill="#94a3b8" fontSize="8" textAnchor="middle">100% (Norm)</text>
                        <text x="240" y="132" fill="#94a3b8" fontSize="8" textAnchor="middle">150%</text>

                        {/* Row 1: Gonial Angle (120-130 is norm = 100%) */}
                        {/* Patient value percentage of norm (approx 122/125 = 98%) */}
                        <text x="5" y="30" fill="#64748b" className="dark:fill-slate-300 font-bold" fontSize="9">Angle</text>
                        {/* Normative Background Bar */}
                        <rect x="80" y="22" width="120" height="10" rx="3" fill="#e2e8f0" className="dark:fill-slate-700" />
                        {/* Active Patient Bar */}
                        <rect 
                          x="80" 
                          y="22" 
                          width={Math.min(200, (metrics.gonialAngle / 125) * 120)} 
                          height="10" 
                          rx="3" 
                          fill="url(#angleGradient)" 
                        />
                        <text x="310" y="30" fill="#2563eb" className="font-extrabold" fontSize="9" textAnchor="end">{metrics.gonialAngle}°</text>

                        {/* Row 2: Mand. Height (62mm is norm = 100%) */}
                        <text x="5" y="65" fill="#64748b" className="dark:fill-slate-300 font-bold" fontSize="9">Height</text>
                        <rect x="80" y="57" width="120" height="10" rx="3" fill="#e2e8f0" className="dark:fill-slate-700" />
                        <rect 
                          x="80" 
                          y="57" 
                          width={Math.min(200, (metrics.mandHeight / 62) * 120)} 
                          height="10" 
                          rx="3" 
                          fill="url(#heightGradient)" 
                        />
                        <text x="310" y="65" fill="#10b981" className="font-extrabold" fontSize="9" textAnchor="end">{metrics.mandHeight}mm</text>

                        {/* Row 3: Mand. Length (108mm is norm = 100%) */}
                        <text x="5" y="100" fill="#64748b" className="dark:fill-slate-300 font-bold" fontSize="9">Length</text>
                        <rect x="80" y="92" width="120" height="10" rx="3" fill="#e2e8f0" className="dark:fill-slate-700" />
                        <rect 
                          x="80" 
                          y="92" 
                          width={Math.min(200, (metrics.mandLength / 108) * 120)} 
                          height="10" 
                          rx="3" 
                          fill="url(#lengthGradient)" 
                        />
                        <text x="310" y="100" fill="#6366f1" className="font-extrabold" fontSize="9" textAnchor="end">{metrics.mandLength}mm</text>

                        {/* Gradients */}
                        <defs>
                          <linearGradient id="angleGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                          <linearGradient id="heightGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="lengthGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  {/* Morphometrics Table */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Reference Table</h4>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold uppercase text-[9px]">
                          <th className="pb-2">Metric</th>
                          <th className="pb-2">Patient</th>
                          <th className="pb-2">Normative Range</th>
                          <th className="pb-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        <tr>
                          <td className="py-2.5 font-bold">Gonial Angle</td>
                          <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 font-extrabold">{metrics.gonialAngle}°</td>
                          <td className="py-2.5 text-slate-500">120° - 130°</td>
                          <td className="py-2.5 text-right font-bold">
                            {metrics.gonialAngle < 120 ? (
                              <span className="text-amber-500">Hypodivergent</span>
                            ) : metrics.gonialAngle > 130 ? (
                              <span className="text-red-500">Hyperdivergent</span>
                            ) : (
                              <span className="text-emerald-500">Normodivergent</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">Mand. Height</td>
                          <td className="py-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{metrics.mandHeight} mm</td>
                          <td className="py-2.5 text-slate-500">55 - 68 mm</td>
                          <td className="py-2.5 text-right font-bold text-emerald-500">Normal</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">Mand. Length</td>
                          <td className="py-2.5 font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{metrics.mandLength} mm</td>
                          <td className="py-2.5 text-slate-500">95 - 110 mm</td>
                          <td className="py-2.5 text-right font-bold text-emerald-500">Normal</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Next CTA to Report */}
                <div className="pt-4">
                  <button 
                    onClick={() => {
                      // Save calculated metrics to the active scan
                      const updatedScans = recentScans.map(s => {
                        if (s.id === selectedScanId) {
                          return {
                            ...s,
                            metrics: {
                              angle: metrics.gonialAngle,
                              height: metrics.mandHeight,
                              length: metrics.mandLength
                            },
                            co, go, me
                          };
                        }
                        return s;
                      });

                      if (isSupabaseConfigured && supabase) {
                        supabase.from('scans').update({
                          metrics: {
                            angle: metrics.gonialAngle,
                            height: metrics.mandHeight,
                            length: metrics.mandLength
                          },
                          co, go, me
                        }).eq('id', selectedScanId).then(({ error }) => {
                          if (error) console.error("Error saving scan metrics to Supabase:", error.message);
                        });
                      }

                      setRecentScans(updatedScans);
                      showToast('Saved morphometric data');
                      navigateTo('reports');
                    }}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition text-xs flex items-center justify-center space-x-2"
                  >
                    <span>Generate Clinical Report</span>
                    <FileText className="h-4 w-4" />
                  </button>
                </div>

              </div>
            )}

            {/* SCREEN 11: REPORT SCREEN */}
            {screen === 'reports' && (() => {
              const activeScan = recentScans.find(s => s.id === selectedScanId) || recentScans[0];
              return (
                <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/40 transition-colors flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Top navigation */}
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setScreen('dashboard')} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Analysis Report</h3>
                    </div>

                    {/* Report Summary Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                      
                      {/* Patient Metadata Info */}
                      <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-sm text-slate-800 dark:text-white">{activeScan.patientName}</p>
                          <span className="text-[10px] text-slate-400">ID: {activeScan.id} • {activeScan.gender}, {activeScan.age} yrs</span>
                        </div>
                        <span className="bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                          OPG Radiograph
                        </span>
                      </div>

                      {/* Small preview scan */}
                      <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700 aspect-[4/2] relative flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950 via-slate-900 to-black"></div>
                        <svg className="w-full h-full p-2 opacity-50 text-slate-400" viewBox="0 0 400 200" fill="none">
                          {/* Re-render the mini jaw outline based on coords */}
                          <path
                            d={`M ${co.x},${co.y - 40} 
                                C ${co.x - 10},${co.y} ${go.x - 18},${go.y - 65} ${go.x},${go.y - 40}
                                C ${go.x + 20},${go.y - 15} ${me.x - 55},${me.y - 28} ${me.x},${me.y - 40}`}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute bottom-1 right-2 bg-slate-900/80 text-[8px] text-white px-2 py-0.5 rounded font-mono">
                          Computed Landmarks Visible
                        </div>
                      </div>

                      {/* Generated measurements metrics list */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Computed Morphometrics</span>
                        <div className="grid grid-cols-2 gap-3.5">
                          
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Gonial Angle</span>
                            <p className="font-mono text-base font-extrabold text-blue-600 dark:text-blue-400">
                              {activeScan.metrics.angle || metrics.gonialAngle}°
                            </p>
                            <span className="text-[8px] text-emerald-500 font-bold block">Normodivergent</span>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Mand. Height (Co-Go)</span>
                            <p className="font-mono text-base font-extrabold text-slate-800 dark:text-slate-200">
                              {activeScan.metrics.height || metrics.mandHeight} mm
                            </p>
                            <span className="text-[8px] text-slate-400 block">Norm: 55-68mm</span>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Mand. Length (Go-Me)</span>
                            <p className="font-mono text-base font-extrabold text-slate-800 dark:text-slate-200">
                              {activeScan.metrics.length || metrics.mandLength} mm
                            </p>
                            <span className="text-[8px] text-slate-400 block">Norm: 95-110mm</span>
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1 flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Analysis Date</span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{activeScan.date.split(',')[0]}</p>
                            <span className="text-[8px] text-slate-400 block">By: {user.name}</span>
                          </div>

                        </div>
                      </div>

                      {/* Doctor Sign-off details */}
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-3 text-[10px] text-slate-400 flex justify-between items-center font-mono">
                        <span>Status: Approved & Signed</span>
                        <span>Clinical AI certified</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 space-y-2">
                    <button 
                      onClick={() => showToast('Downloading PDF Report file...')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition text-xs flex items-center justify-center space-x-1.5"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download PDF Report</span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => showToast('Exported CSV coordinates')}
                        className="py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs flex items-center justify-center space-x-1"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Export CSV</span>
                      </button>
                      <button 
                        onClick={() => showToast('Shared reports link to clipboard')}
                        className="py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs flex items-center justify-center space-x-1"
                      >
                        <Share2 className="h-3.5 w-3.5 text-blue-500" />
                        <span>Share Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SCREEN 12: LANDMARK GUIDE SCREEN */}
            {screen === 'landmark-guide' && (
              <div className="flex-1 p-5 space-y-5 bg-slate-50 dark:bg-slate-900/40 transition-colors">
                
                {/* Header */}
                <div className="flex items-center space-x-2">
                  <button onClick={navigateBack} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Landmark Guide</h3>
                </div>

                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                  
                  {/* Guide 1: Condylion (Co) */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                        Co
                      </span>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">Condylion (Co)</h4>
                        <span className="text-[9px] text-slate-400">Anatomical Landmark</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
                      <p><strong className="text-slate-700 dark:text-slate-200">Description:</strong> The most superior and posterior point on the mandibular condyle head.</p>
                      <p><strong className="text-slate-700 dark:text-slate-200">Location:</strong> Easily located at the topmost curvature of the condylar process articulating in the glenoid fossa.</p>
                    </div>
                    {/* Anatomical Illustration placeholder */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded-2xl p-2 flex items-center justify-center">
                      <svg className="h-16 w-32 text-emerald-500/30" viewBox="0 0 100 50">
                        <path d="M10,40 Q10,10 30,10 T50,40" stroke="currentColor" strokeWidth="3" fill="none" />
                        <circle cx="30" cy="10" r="4" fill="#10b981" />
                        <text x="35" y="14" fill="#64748b" fontSize="8">Co Point</text>
                      </svg>
                    </div>
                  </div>

                  {/* Guide 2: Gonion (Go) */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                        Go
                      </span>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">Gonion (Go)</h4>
                        <span className="text-[9px] text-slate-400">Anatomical Landmark</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
                      <p><strong className="text-slate-700 dark:text-slate-200">Description:</strong> The constructed point at the intersection of the mandibular ramus tangent and the inferior mandibular base tangent.</p>
                      <p><strong className="text-slate-700 dark:text-slate-200">Location:</strong> Represents the geometric center of the outermost curvature at the corner/angle of the jaw.</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded-2xl p-2 flex items-center justify-center">
                      <svg className="h-16 w-32 text-amber-500/30" viewBox="0 0 100 50">
                        <path d="M10,10 L10,35 Q10,45 30,45 L80,45" stroke="currentColor" strokeWidth="3" fill="none" />
                        <circle cx="10" cy="45" r="4" fill="#f59e0b" />
                        <text x="20" y="40" fill="#64748b" fontSize="8">Go Point</text>
                      </svg>
                    </div>
                  </div>

                  {/* Guide 3: Menton (Me) */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                        Me
                      </span>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">Menton (Me)</h4>
                        <span className="text-[9px] text-slate-400">Anatomical Landmark</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
                      <p><strong className="text-slate-700 dark:text-slate-200">Description:</strong> The most inferior point on the symphyseal outline of the chin profile.</p>
                      <p><strong className="text-slate-700 dark:text-slate-200">Location:</strong> Articulated at the lowest bony projection of the mandible symphysis (chin center).</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded-2xl p-2 flex items-center justify-center">
                      <svg className="h-16 w-32 text-blue-500/30" viewBox="0 0 100 50">
                        <path d="M10,15 Q60,15 60,35 Q60,45 50,45 T30,45" stroke="currentColor" strokeWidth="3" fill="none" />
                        <circle cx="50" cy="45" r="4" fill="#3b82f6" />
                        <text x="56" y="42" fill="#64748b" fontSize="8">Me Point</text>
                      </svg>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* SCREEN 13: SETTINGS SCREEN */}
            {screen === 'settings' && (
              <div className="flex-1 p-5 space-y-5 bg-slate-50 dark:bg-slate-900/40 transition-colors">
                
                {/* Header */}
                <div className="flex items-center space-x-2">
                  <button onClick={() => setScreen('dashboard')} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Settings</h3>
                </div>

                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                  
                  {/* Supabase Status Card */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 ${isSupabaseConfigured ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 animate-pulse' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'} rounded-xl flex items-center justify-center`}>
                          <Shield className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 dark:text-white block">Supabase Integration</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {isSupabaseConfigured ? 'Connected to live cloud database' : 'Running in local simulated demo mode'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                        isSupabaseConfigured 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {isSupabaseConfigured ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    {!isSupabaseConfigured && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                        To activate cloud database authentication and persistent scan storage, enter your credentials in <code>.env.local</code>.
                      </p>
                    )}
                  </div>

                  {/* Option 1: Edit Profile details link */}
                  <button 
                    onClick={() => {
                      setProfileForm({ ...user });
                      navigateTo('setup-profile');
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition shadow-2xs group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-white block">Edit Profile Info</span>
                        <span className="text-[10px] text-slate-400 block">Manage names and credentials</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                  </button>

                  {/* Option 2: Change password link */}
                  <button 
                    onClick={() => navigateTo('reset-password')}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition shadow-2xs group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Lock className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-white block">Change Password</span>
                        <span className="text-[10px] text-slate-400 block">Update security password credentials</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                  </button>

                  {/* Option 3: Toggle Notifications setting */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 flex items-center justify-between text-left shadow-2xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Bell className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-white block">Notifications</span>
                        <span className="text-[10px] text-slate-400 block">Alert on completed AI batch analyses</span>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Option 4: Toggle Dark Mode */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 flex items-center justify-between text-left shadow-2xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-white block">Dark Mode</span>
                        <span className="text-[10px] text-slate-400 block">Toggle low-light visual settings</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Option 5: Help & Support */}
                  <button 
                    onClick={() => showToast('Help desk is online. Response in 1 hour.')}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition shadow-2xs group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <HelpCircle className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-white block">Help & Support</span>
                        <span className="text-[10px] text-slate-400 block">View API manuals and user guides</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                  </button>

                  {/* Option 6: Logout */}
                  <button 
                    onClick={handleLogOut}
                    className="w-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/55 rounded-2xl p-4 flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition shadow-2xs group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-red-100 dark:bg-red-950/80 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                        <LogOut className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-red-700 dark:text-red-300 block">Logout Securely</span>
                        <span className="text-[10px] text-red-500/70 block">Clear session authentication</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-red-400 group-hover:text-red-650" />
                  </button>

                </div>

              </div>
            )}

          </div>

          {/* BOTTOM NAVIGATION BAR (Visible only on mobile devices, hidden on desktop md+) */}
          {['dashboard', 'upload-opg', 'analysis', 'measurements', 'reports', 'settings'].includes(screen) && (
            <nav className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-2.5 flex justify-around items-center z-30 transition-colors shadow-lg">
              
              {/* Tab 1: Home */}
              <button 
                onClick={() => handleTabClick('home')}
                className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition ${screen === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                <Activity className="h-5 w-5" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">Home</span>
              </button>

              {/* Tab 2: Upload */}
              <button 
                onClick={() => handleTabClick('upload')}
                className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition ${screen === 'upload-opg' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                <UploadCloud className="h-5 w-5" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">Upload</span>
              </button>

              {/* Tab 3: Analysis */}
              <button 
                onClick={() => handleTabClick('analysis')}
                className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition ${['analysis', 'measurements'].includes(screen) ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                <Award className="h-5 w-5" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">Analysis</span>
              </button>

              {/* Tab 4: Reports */}
              <button 
                onClick={() => handleTabClick('reports')}
                className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition ${screen === 'reports' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                <FileText className="h-5 w-5" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">Reports</span>
              </button>

              {/* Tab 5: Settings */}
              <button 
                onClick={() => handleTabClick('settings')}
                className={`flex flex-col items-center space-y-1 py-1 px-3.5 rounded-xl transition ${screen === 'settings' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                <Settings className="h-5 w-5" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">Settings</span>
              </button>

            </nav>
          )}

        </div>

      </main>
      
      {/* Platform Info footer */}
      <footer className="text-center py-3 text-[10px] text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
        Mandibular Morphogenetic Analysis System (MMAS) • Designed for orthodontic researchers and dental clinics. HIPAA secure storage.
      </footer>
    </div>
  );
}
