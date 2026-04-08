import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StatsSection from '../Components/StatsSection';
import TaskManager from '../Components/TaskManager';
import Hero from '../Components/Hero';
import './Dashboard.css';
import { saveStreak, getStreak, onStreakChange, saveTasks } from '../firebase/firebaseService';

const Dashboard = ({ user, Tasks = [], resources = [] }) => {
  const [localTasks, setLocalTasks] = useState(Tasks);
  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return undefined;
    }

    getStreak(user.uid)
      .then((data) => {
        if (data.streak) setStreak(data.streak);
        if (data.lastDate) setLastDate(data.lastDate);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading streak:', error);
        setLoading(false);
      });

    const unsubscribe = onStreakChange(user.uid, (data) => {
      if (data.streak) setStreak(data.streak);
      if (data.lastDate) setLastDate(data.lastDate);
    });

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    setLocalTasks(Tasks);
  }, [Tasks]);

  useEffect(() => {
    if (!user?.uid || localTasks.length === 0) return;

    saveTasks(user.uid, localTasks).catch((error) => {
      console.error('Error saving tasks:', error);
    });
  }, [localTasks, user?.uid]);

  const completedCount = localTasks.filter((task) => task.completed).length;
  const pendingCount = localTasks.length - completedCount;
  const scoreValue = localTasks.length ? Math.round((completedCount / localTasks.length) * 100) : 0;

  const resourceMetrics = useMemo(() => {
    const continueResource = resources.find((resource) => {
      const progress = Number(resource.progress) || 0;
      return progress > 0 && progress < 100;
    });

    return {
      total: resources.length,
      active: resources.filter((resource) => {
        const progress = Number(resource.progress) || 0;
        return progress > 0 && progress < 100;
      }).length,
      completed: resources.filter((resource) => resource.status === 'Completed').length,
      subjects: new Set(resources.map((resource) => resource.subject).filter(Boolean)).size,
      continueResource
    };
  }, [resources]);

  const handleTaskComplete = async (index) => {
    try {
      const today = new Date().toDateString();
      const updatedTasks = [...localTasks];
      updatedTasks[index].completed = !updatedTasks[index].completed;
      setLocalTasks(updatedTasks);

      if (updatedTasks[index].completed && lastDate !== today && user?.uid) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        await saveStreak(user.uid, nextStreak, today);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="DashboardContainer">
        <p style={{ textAlign: 'center', color: '#666' }}>
          Please <a href="/login" style={{ color: '#667eea' }}>sign in</a> to view your dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="DashboardContainer">
      <Hero />

      <div className="DashboardContent">
        <div className="MetricsSection">
          <div className="MetricCard primary">
            <div className="MetricIcon">Tasks</div>
            <div className="MetricDetails">
              <h3>Total Tasks</h3>
              <p className="MetricNumber">{localTasks.length}</p>
            </div>
            <div className="MetricBar">
              <div className="Bar" style={{ width: '100%', background: '#667eea' }}></div>
            </div>
          </div>

          <div className="MetricCard success">
            <div className="MetricIcon">Done</div>
            <div className="MetricDetails">
              <h3>Completed</h3>
              <p className="MetricNumber">{completedCount}</p>
            </div>
            <div className="MetricBar">
              <div
                className="Bar"
                style={{
                  width: completedCount > 0 ? `${(completedCount / Math.max(localTasks.length, 1)) * 100}%` : '0%',
                  background: '#10B981'
                }}
              ></div>
            </div>
          </div>

          <div className="MetricCard warning">
            <div className="MetricIcon">Next</div>
            <div className="MetricDetails">
              <h3>Pending</h3>
              <p className="MetricNumber">{pendingCount}</p>
            </div>
            <div className="MetricBar">
              <div
                className="Bar"
                style={{
                  width: pendingCount > 0 ? `${(pendingCount / Math.max(localTasks.length, 1)) * 100}%` : '0%',
                  background: '#F59E0B'
                }}
              ></div>
            </div>
          </div>

          <div className="MetricCard fire">
            <div className="MetricIcon">Streak</div>
            <div className="MetricDetails">
              <h3>Streak</h3>
              <p className="MetricNumber">{streak}</p>
            </div>
            <div className="MetricBar">
              <div className="Bar" style={{ width: `${Math.min(100, streak * 10)}%`, background: '#EF4444' }}></div>
            </div>
          </div>
        </div>

        <div className="ScoreSection">
          <div className="ScoreCard">
            <h2>Productivity Score</h2>
            <div className="ScoreDisplay">
              <div className="CircularProgress">
                <svg viewBox="0 0 36 36" className="CircularSvg">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" strokeWidth="3"></circle>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#667eea"
                    strokeWidth="3"
                    strokeDasharray={`${scoreValue} 100`}
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  ></circle>
                </svg>
                <div className="ScoreText">
                  <span className="ScoreValue">{scoreValue}%</span>
                  <span className="ScoreLabel">Complete</span>
                </div>
              </div>
            </div>
            <p className="ScoreMessage">
              {scoreValue >= 80
                ? 'Excellent work!'
                : scoreValue >= 60
                  ? 'Good progress!'
                  : scoreValue >= 40
                    ? 'Keep going!'
                    : 'Get started!'}
            </p>
          </div>
        </div>

        <div className="ResourceSpotlightSection">
          <div className="ResourceSpotlightCard">
            <div className="ResourceSpotlightHeader">
              <div>
                <span className="ResourceEyebrow">Resources hub</span>
                <h2>Keep your study material and your task flow together.</h2>
              </div>
              <Link to="/resources" className="ResourceLinkButton">Open Resources</Link>
            </div>

            <div className="ResourceSpotlightGrid">
              <div className="ResourceMiniCard">
                <span>Total saved</span>
                <strong>{resourceMetrics.total}</strong>
              </div>
              <div className="ResourceMiniCard">
                <span>Continue later</span>
                <strong>{resourceMetrics.active}</strong>
              </div>
              <div className="ResourceMiniCard">
                <span>Completed</span>
                <strong>{resourceMetrics.completed}</strong>
              </div>
              <div className="ResourceMiniCard">
                <span>Subjects</span>
                <strong>{resourceMetrics.subjects}</strong>
              </div>
            </div>

            <div className="ResourceFocusRow">
              <div className="ResourceFocusText">
                <h3>{resourceMetrics.continueResource ? resourceMetrics.continueResource.title : 'No resource paused right now'}</h3>
                <p>
                  {resourceMetrics.continueResource
                    ? `${resourceMetrics.continueResource.subject} - Resume from ${resourceMetrics.continueResource.resumePoint || 'your saved note'}`
                    : 'Add links, notes, PDFs, videos, and other study material with manual subject tags and resume points.'}
                </p>
              </div>
              <div className="ResourceFocusBadge">
                {resourceMetrics.continueResource
                  ? `${resourceMetrics.continueResource.progress || 0}% ready to continue`
                  : 'Build your resource library'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="TaskManagerSection">
        <TaskManager Tasks={localTasks} setTasks={setLocalTasks} score={scoreValue} onTaskComplete={handleTaskComplete} />
      </div>

      <div className="StatsWrapper">
        <StatsSection completed={completedCount} total={localTasks.length} />
      </div>
    </div>
  );
};

export default Dashboard;
