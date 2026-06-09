import { useState, useEffect } from 'react'
import { Routes, Route } from "react-router-dom";
import './App.css'

import Navbar from "./Components/Navbar";
import ErrorBoundary from "./Components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import History from "./pages/History";
import Profile from "./pages/Profile";
import TaskManagerPage from "./pages/TaskManagerPage";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Resources from "./pages/Resources";
import PerformancePrediction from "./pages/PerformancePrediction";
import { onAuthChange, getTasks, saveTasks, onResourcesChange } from './firebase/firebaseService';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

const [Tasks, setTasks] = useState([]);
const [resources, setResources] = useState([]);

// Auth state listener
useEffect(() => {
  const unsubscribe = onAuthChange((currentUser) => {
    setUser(currentUser);
    setLoading(false);
    if (!currentUser) {
      setTasks([]);
      setResources([]);
    }
  });
  return unsubscribe;
}, []);

// Load tasks from Firestore when user changes
useEffect(() => {
  if (user?.uid) {
    getTasks(user.uid).then(data => {
      setTasks(data);
    }).catch(error => {
      console.error('Error loading tasks:', error);
      setTasks([]);
    });
  }
}, [user]);

// Load resources in real time when user changes
useEffect(() => {
  if (!user?.uid) return undefined;

  const unsubscribe = onResourcesChange(user.uid, (data) => {
    setResources(data);
  });

  return unsubscribe;
}, [user?.uid]);

// Save tasks to Firestore whenever they change
useEffect(() => {
  if (user?.uid && Tasks.length > 0) {
    saveTasks(user.uid, Tasks).catch(error => {
      console.error('Error saving tasks:', error);
    });
  }
}, [Tasks, user?.uid]);

// Fetch initial tasks if empty
useEffect(() => {
  if (user?.uid && Tasks.length === 0) {
    fetch("https://jsonplaceholder.typicode.com/todos?_limit=10")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(item => ({
          text: item.title,
          completed: item.completed
        }));
        setTasks(formatted);
      })
      .catch(error => console.error('Error fetching initial tasks:', error));
  }
}, [user?.uid]);

const completedTasks = Tasks.filter(t => t.completed).length;
const score = Tasks.length ? Math.round((completedTasks / Tasks.length) * 100) : 0;

if (loading) {
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
}

return (
  <>
    <Navbar user={user} />

    <ErrorBoundary>
      <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            user={user}
            Tasks={Tasks}
            setTasks={setTasks}
            completedTasks={completedTasks}
            score={score}
            resources={resources}
          />
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/calculator" element={<Calculator user={user} />} />
      <Route path="/history" element={<History user={user} Tasks={Tasks} completedTasks={completedTasks} />} />
      <Route path="/profile" element={<Profile user={user} score={score} Tasks={Tasks} />} />
      <Route path="/tasks" element={<TaskManagerPage user={user} Tasks={Tasks} setTasks={setTasks} />} />
      <Route path="/analytics" element={<Analytics user={user} Tasks={Tasks} />} />
      <Route path="/resources" element={<Resources user={user} resources={resources} />} />
      <Route path="/settings" element={<Settings user={user} Tasks={Tasks} setTasks={setTasks} />} />
      <Route path="/prediction" element={<PerformancePrediction user={user} />} />

      </Routes>
    </ErrorBoundary>
  </>
);
};

export default App;
