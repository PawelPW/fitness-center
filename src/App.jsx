import React, { useState, useEffect } from 'react';
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
import './styles/App.css';

function App() {
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
  };

  const handleManageExercises = () => {
    setShowExerciseList(true);
    setSelectedSession(null);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
  };

  const handleManageTrainings = () => {
    setShowTrainingList(true);
    setShowExerciseList(false);
    setSelectedSession(null);
    setShowTrainingBuilder(false);
    setEditingTraining(null);
  };

  const handleCreateTraining = () => {
    setShowTrainingBuilder(true);
    setShowTrainingList(false);
    setEditingTraining(null);
  };

  const handleEditTraining = (training) => {
    setEditingTraining(training);
    setShowTrainingBuilder(true);
    setShowTrainingList(false);
  };

  const handleBackToDashboard = () => {
    setSelectedSession(null);
    setShowExerciseList(false);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setEditingTraining(null);
  };

  const handleBackToTrainingList = () => {
    setShowTrainingBuilder(false);
    setShowTrainingList(true);
    setEditingTraining(null);
  };

  const handleStartWorkout = (program) => {
    setActiveWorkout(program);
    setShowTrainingList(false);
    setShowTrainingBuilder(false);
    setSelectedSession(null);
    setShowExerciseList(false);
  };

  const handleWorkoutComplete = (completionData) => {
    setWorkoutCompleted(completionData);
    setActiveWorkout(null);
  };

  const handleWorkoutCancel = () => {
    if (window.confirm('Are you sure you want to cancel this workout? Your progress will not be saved.')) {
      setActiveWorkout(null);
    }
  };

  const handleCloseWorkoutSummary = () => {
    setWorkoutCompleted(null);
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
          <h1 className="completion-title">Workout Complete! 🎉</h1>
          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-value">{workoutCompleted.duration}</span>
              <span className="stat-label">Minutes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workoutCompleted.calories}</span>
              <span className="stat-label">Calories</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workoutCompleted.exercisesCompleted}/{workoutCompleted.totalExercises}</span>
              <span className="stat-label">Exercises</span>
            </div>
          </div>
          <button onClick={handleCloseWorkoutSummary} className="return-dashboard-btn">
            Return to Dashboard
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
      />
    );
  }

  // Show login/signup if not logged in
  return <Login onLogin={handleLogin} />;
}

export default App;
