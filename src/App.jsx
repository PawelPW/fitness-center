import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { App as CapacitorApp } from '@capacitor/app';
import { useCapacitorBackButton } from './hooks/useCapacitorBackButton';
import apiService from './services/api.js';
import secureStorage from './utils/secureStorage.js';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import TrainingDetail from './pages/TrainingDetail';
import ExerciseList from './pages/ExerciseList';
import TrainingList from './pages/TrainingList';
import TrainingBuilder from './pages/TrainingBuilder';
import WorkoutSession from './pages/WorkoutSession';
import ExerciseStats from './pages/ExerciseStats';
import TrainingCalendar from './pages/TrainingCalendar';
import Settings from './pages/Settings';
import './styles/App.css';

function App() {
  const { t } = useTranslation('common');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showTrainingList, setShowTrainingList] = useState(false);
  const [showTrainingBuilder, setShowTrainingBuilder] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutCompleted, setWorkoutCompleted] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [navigationStack, setNavigationStack] = useState(['dashboard']);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await apiService.getToken();
        const savedUserJson = await secureStorage.get('fitness-user');

        if (token && savedUserJson) {
          const userData = JSON.parse(savedUserJson);
          setUser(userData);
          setShowWelcome(true); // Show welcome screen for returning users
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const handleLogin = async (userData) => {
    setUser(userData);
    await secureStorage.set('fitness-user', JSON.stringify(userData));
    setShowWelcome(false); // Go straight to dashboard
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  const handleLogout = async () => {
    await apiService.logout();
    await secureStorage.remove('fitness-user');
    setUser(null);
    setShowWelcome(false);
    setSelectedSession(null);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setEditingTraining(null);
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setNavigationStack(prev => [...prev, 'trainingDetail']);
  };

  const handleManageExercises = () => {
    setShowExerciseList(true);
    setSelectedSession(null);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setNavigationStack(prev => [...prev, 'exerciseList']);
  };

  const handleManageTrainings = () => {
    setShowTrainingList(true);
    setShowExerciseList(false);
    setSelectedSession(null);
    setShowTrainingBuilder(false);
    setEditingTraining(null);
    setNavigationStack(prev => [...prev, 'trainingList']);
  };

  const handleCreateTraining = () => {
    setShowTrainingBuilder(true);
    setShowTrainingList(false);
    setEditingTraining(null);
    setNavigationStack(prev => [...prev, 'trainingBuilder']);
  };

  const handleEditTraining = (training) => {
    setEditingTraining(training);
    setShowTrainingBuilder(true);
    setShowTrainingList(false);
    setNavigationStack(prev => [...prev, 'trainingBuilder']);
  };

  const handleBackToDashboard = () => {
    setSelectedSession(null);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setEditingTraining(null);
    setNavigationStack(['dashboard']);
  };

  const handleBackToTrainingList = () => {
    setShowTrainingBuilder(false);
    setShowTrainingList(true);
    setEditingTraining(null);
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const handleViewStats = () => {
    setShowStats(true);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setSelectedSession(null);
    setNavigationStack(prev => [...prev, 'stats']);
  };

  const handleStatsBack = () => {
    setShowStats(false);
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const handleViewCalendar = () => {
    setShowCalendar(true);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setSelectedSession(null);
    setShowStats(false);
    setNavigationStack(prev => [...prev, 'calendar']);
  };

  const handleCalendarBack = () => {
    setShowCalendar(false);
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const handleViewSettings = () => {
    setShowSettings(true);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setSelectedSession(null);
    setShowStats(false);
    setShowCalendar(false);
    setNavigationStack(prev => [...prev, 'settings']);
  };

  const handleSettingsBack = () => {
    setShowSettings(false);
    setNavigationStack(prev => prev.slice(0, -1));
  };

  // Capacitor back button handler
  const handleBackButton = () => {
    // Check navigation stack depth
    if (navigationStack.length > 1) {
      const currentView = navigationStack[navigationStack.length - 1];

      // Route back based on current view
      switch(currentView) {
        case 'trainingDetail':
          handleBackToDashboard();
          break;
        case 'exerciseList':
          handleBackToDashboard();
          break;
        case 'trainingList':
          handleBackToDashboard();
          break;
        case 'trainingBuilder':
          handleBackToTrainingList();
          break;
        case 'stats':
          handleStatsBack();
          break;
        case 'calendar':
          handleCalendarBack();
          break;
        case 'settings':
          handleSettingsBack();
          break;
        case 'workoutSession':
          handleWorkoutCancel();
          break;
        default:
          handleBackToDashboard();
      }
    } else {
      // At root dashboard - show exit confirmation
      if (window.confirm(t('app.exitConfirm'))) {
        CapacitorApp.exitApp();
      }
    }
  };

  // Use Capacitor back button hook
  useCapacitorBackButton(handleBackButton);

  const handleStartWorkout = (program) => {
    setActiveWorkout(program);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setSelectedSession(null);
    setShowExerciseList(false);
    setNavigationStack(prev => [...prev, 'workoutSession']);
  };

  const handleWorkoutComplete = (completionData) => {
    setWorkoutCompleted(completionData);
    setActiveWorkout(null);
    setNavigationStack(['dashboard']);
  };

  const handleWorkoutCancel = () => {
    if (window.confirm(t('app.cancelWorkoutConfirm'))) {
      setActiveWorkout(null);
      setNavigationStack(prev => prev.slice(0, -1));
    }
  };

  const handleCloseWorkoutSummary = () => {
    setWorkoutCompleted(null);
    setNavigationStack(['dashboard']);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Show welcome screen for returning users
  if (user && showWelcome) {
    return <Welcome user={user} onComplete={handleWelcomeComplete} />;
  }

  // Show active workout session
  if (user && activeWorkout) {
    return (
      <WorkoutSession
        program={activeWorkout}
        onComplete={handleWorkoutComplete}
        onCancel={handleWorkoutCancel}
      />
    );
  }

  // Show workout completion summary
  if (user && workoutCompleted) {
    return (
      <div className="completion-screen">
        <div className="completion-card">
          <h1 className="completion-title">{t('app.workoutComplete.title')}</h1>
          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-value">{workoutCompleted.duration}</span>
              <span className="stat-label">{t('app.workoutComplete.minutes')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workoutCompleted.calories}</span>
              <span className="stat-label">{t('app.workoutComplete.calories')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workoutCompleted.exercisesCompleted}/{workoutCompleted.totalExercises}</span>
              <span className="stat-label">{t('app.workoutComplete.exercises')}</span>
            </div>
          </div>
          <button onClick={handleCloseWorkoutSummary} className="return-dashboard-btn">
            {t('app.workoutComplete.returnToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  // Show training builder
  if (user && showTrainingBuilder) {
    return (
      <TrainingBuilder
        onBack={handleBackToTrainingList}
        existingProgram={editingTraining}
      />
    );
  }

  // Show training list
  if (user && showTrainingList) {
    return (
      <TrainingList
        onBack={handleBackToDashboard}
        onCreateTraining={handleCreateTraining}
        onEditTraining={handleEditTraining}
        onStartWorkout={handleStartWorkout}
      />
    );
  }

  // Show exercise list
  if (user && showExerciseList) {
    return <ExerciseList onBack={handleBackToDashboard} />;
  }

  // Show statistics if showStats is true
  if (user && showStats) {
    return <ExerciseStats onBack={handleStatsBack} />;
  }

  // Show calendar if showCalendar is true
  if (user && showCalendar) {
    return <TrainingCalendar onBack={handleCalendarBack} />;
  }

  // Show settings if showSettings is true
  if (user && showSettings) {
    return <Settings onBack={handleSettingsBack} />;
  }

  // Show training detail if a session is selected
  if (user && selectedSession) {
    return (
      <TrainingDetail
        session={selectedSession}
        onBack={handleBackToDashboard}
      />
    );
  }

  // Show dashboard if logged in
  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onViewSession={handleViewSession}
        onManageExercises={handleManageExercises}
        onManageTrainings={handleManageTrainings}
        onViewStats={handleViewStats}
        onViewCalendar={handleViewCalendar}
        onViewSettings={handleViewSettings}
      />
    );
  }

  // Show login/signup if not logged in
  return <Login onLogin={handleLogin} />;
}

export default App;
