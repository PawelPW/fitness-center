import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { App as CapacitorApp } from '@capacitor/app';
import { useCapacitorBackButton } from './hooks/useCapacitorBackButton';
import apiService from './services/api.js';
import secureStorage from './utils/secureStorage.js';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
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
import Profile from './pages/Profile';
import WorkoutPlanner from './pages/WorkoutPlanner';
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
  const [showProfile, setShowProfile] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
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

  // Scroll to top whenever navigation changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [navigationStack]);

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

  const handleViewProfile = () => {
    setShowProfile(true);
    setShowSettings(false);
    setNavigationStack(prev => [...prev, 'profile']);
  };

  const handleProfileBack = () => {
    setShowProfile(false);
    setShowSettings(true);
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const handleUpdateUser = async (updatedUser) => {
    setUser(updatedUser);
    // Persist updated user data to secure storage so it survives app restarts
    await secureStorage.set('fitness-user', JSON.stringify(updatedUser));
  };

  const handleViewPlanner = () => {
    setShowPlanner(true);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setSelectedSession(null);
    setShowStats(false);
    setShowCalendar(false);
    setShowSettings(false);
    setNavigationStack(prev => [...prev, 'planner']);
  };

  const handlePlannerBack = () => {
    setShowPlanner(false);
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
        case 'profile':
          handleProfileBack();
          break;
        case 'planner':
          handlePlannerBack();
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

  const handleStartWorkout = async (session) => {
    console.log('FE-7: handleStartWorkout called with session:', session);

    // Check if this is a planned session (has id and completed=false)
    if (session && session.id && session.completed === false) {
      // FE-7: Fetch full program data if session has a program
      let programData = null;
      if (session.training_program_id) {
        try {
          console.log('FE-7: Fetching program data for training_program_id:', session.training_program_id);
          programData = await apiService.getTrainingProgramById(session.training_program_id);
          console.log('FE-7: Raw API response:', programData);
          console.log('FE-7: Program has exercises:', programData?.exercises?.length || 0);

          // CRITICAL FIX: Verify we actually got exercise data
          if (!programData || !programData.exercises || programData.exercises.length === 0) {
            console.warn('FE-7: Program fetched but has no exercises!', programData);
          }
        } catch (error) {
          console.error('FE-7: Failed to fetch program data:', error);
          alert(`Failed to load workout program: ${error.message || 'Unknown error'}. You can continue with an ad-hoc workout.`);
          // Continue without program data - user can still do ad-hoc workout
        }
      } else {
        console.log('FE-7: No training_program_id, starting ad-hoc workout');
      }

      // Starting from planned session
      const workoutData = {
        type: session.type,
        plannedSessionId: session.id,
        plannedDate: session.date,
        scheduledTime: session.scheduled_time,
        notes: session.notes,
        // FE-7: Include program data if available
        program: programData,
        training_program_id: session.training_program_id,
      };

      console.log('FE-7: Setting activeWorkout with structure:', {
        ...workoutData,
        program: programData ? {
          id: programData.id,
          name: programData.name,
          exerciseCount: programData.exercises?.length || 0
        } : null
      });
      setActiveWorkout(workoutData);
    } else if (session && session.training_program_id) {
      // Starting from training program (existing behavior)
      console.log('FE-7: Starting from training program directly');
      setActiveWorkout(session);
    } else if (session && session.type) {
      // Starting a generic workout (fallback)
      console.log('FE-7: Starting generic workout');
      setActiveWorkout(session);
    } else {
      console.warn('Invalid session data for starting workout', session);
      return;
    }

    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setSelectedSession(null);
    setShowExerciseList(false);
    setShowCalendar(false);
    setShowPlanner(false);
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
      <ToastProvider>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
        <ToastContainer />
      </ToastProvider>
    );
  }

  // Show welcome screen for returning users
  if (user && showWelcome) {
    return (
      <ToastProvider>
        <Welcome user={user} onComplete={handleWelcomeComplete} />
        <ToastContainer />
      </ToastProvider>
    );
  }

  // Wrap all views with ToastProvider
  return (
    <ToastProvider>
      {/* Show active workout session */}
      {user && activeWorkout && (
        <WorkoutSession
          program={activeWorkout}
          plannedSessionId={activeWorkout.plannedSessionId}
          onComplete={handleWorkoutComplete}
          onCancel={handleWorkoutCancel}
        />
      )}

      {/* Show workout completion summary */}
      {user && workoutCompleted && (
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
      )}

      {/* Show training builder */}
      {user && showTrainingBuilder && (
        <TrainingBuilder
          onBack={handleBackToTrainingList}
          existingProgram={editingTraining}
        />
      )}

      {/* Show training list */}
      {user && showTrainingList && (
        <TrainingList
          onBack={handleBackToDashboard}
          onCreateTraining={handleCreateTraining}
          onEditTraining={handleEditTraining}
          onStartWorkout={handleStartWorkout}
        />
      )}

      {/* Show exercise list */}
      {user && showExerciseList && <ExerciseList onBack={handleBackToDashboard} />}

      {/* Show statistics if showStats is true */}
      {user && showStats && <ExerciseStats onBack={handleStatsBack} />}

      {/* Show calendar if showCalendar is true */}
      {user && showCalendar && (
        <TrainingCalendar onBack={handleCalendarBack} onStartWorkout={handleStartWorkout} />
      )}

      {/* Show profile if showProfile is true */}
      {user && showProfile && (
        <Profile onBack={handleProfileBack} user={user} onUpdateUser={handleUpdateUser} />
      )}

      {/* Show planner if showPlanner is true */}
      {user && showPlanner && <WorkoutPlanner onBack={handlePlannerBack} onStartWorkout={handleStartWorkout} />}

      {/* Show settings if showSettings is true */}
      {user && showSettings && (
        <Settings onBack={handleSettingsBack} onLogout={handleLogout} onViewProfile={handleViewProfile} user={user} />
      )}

      {/* Show training detail if a session is selected */}
      {user && selectedSession && (
        <TrainingDetail
          session={selectedSession}
          onBack={handleBackToDashboard}
        />
      )}

      {/* Show dashboard if logged in */}
      {user && !selectedSession && !showExerciseList && !showTrainingList && !showTrainingBuilder && !showStats && !showCalendar && !showSettings && !showProfile && !showPlanner && !activeWorkout && !workoutCompleted && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onViewSession={handleViewSession}
          onManageExercises={handleManageExercises}
          onManageTrainings={handleManageTrainings}
          onViewStats={handleViewStats}
          onViewCalendar={handleViewCalendar}
          onViewSettings={handleViewSettings}
          onViewPlanner={handleViewPlanner}
          onStartWorkout={handleStartWorkout}
        />
      )}

      {/* Show login/signup if not logged in */}
      {!user && <Login onLogin={handleLogin} />}

      {/* Toast container for notifications */}
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
