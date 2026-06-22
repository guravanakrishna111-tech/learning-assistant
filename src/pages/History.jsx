import React, { useState, useEffect, useMemo } from 'react'
import './History.css'
import { getCalculationHistory, deleteCalculation, clearCalculationHistory, onCalculationsChange } from '../firebase/firebaseService';

const History = ({ user, Tasks = [] }) => {
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const taskHistory = useMemo(() => (Tasks || []).filter((task) => task.completed), [Tasks]);

  // Load calculation history on mount and user change
  useEffect(() => {
    if (user?.uid) {
      getCalculationHistory(user.uid)
        .then(data => {
          setCalculationHistory(data);
        })
        .catch(err => {
          console.error('Error loading calculation history:', err);
          setError('Failed to load calculation history');
        });

      // Real-time listener for calculation changes
      const unsubscribe = onCalculationsChange(user.uid, (data) => {
        setCalculationHistory(data);
      });

      return unsubscribe;
    }
  }, [user?.uid]);

  const deleteCalculationHistory = async (index) => {
    try {
      if (!user?.uid) return;
      const calcToDelete = calculationHistory[index];
      await deleteCalculation(user.uid, calcToDelete);
    } catch (err) {
      console.error('Error deleting calculation:', err);
      setError('Failed to delete calculation');
    }
  };

  const clearAllCalculationHistory = async () => {
    try {
      if (window.confirm('Are you sure you want to clear all calculation history?')) {
        if (!user?.uid) return;
        await clearCalculationHistory(user.uid);
      }
    } catch (err) {
      console.error('Error clearing calculation history:', err);
      setError('Failed to clear history');
    }
  };

  const filteredCalculations = calculationHistory.filter(calc =>
    calc.expression?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.result?.toString().includes(searchTerm)
  );

  const stats = useMemo(() => {
    const tasks = Tasks || [];
    const totalTasks = tasks.length;
    const completedTasksCount = taskHistory.length;
    const completionRate = totalTasks ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
    const totalCalculations = calculationHistory.length;
    return {
      totalTasks,
      completedTasks: completedTasksCount,
      completionRate,
      totalCalculations,
      averageTime: '2.5 mins'
    };
  }, [calculationHistory, taskHistory, Tasks]);

  if (!user) {
    return (
      <div className='HistoryContainer'>
        <div className='HistoryContent'>
          <p style={{ textAlign: 'center', color: '#666' }}>Please sign in to view your history</p>
        </div>
      </div>
    );
  }

  return (
    <div className='HistoryContainer'>
      <div className='HistoryContent'>
        <div className='HistoryHeader'>
          <h1>📚 History & Analytics</h1>
          <p>Track your progress and completed activities</p>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

        <div className='StatsOverview'>
          <div className='StatCard'>
            <div className='StatIcon'>📋</div>
            <div className='StatDetails'>
              <h3>Total Tasks</h3>
              <p className='StatValue'>{stats.totalTasks}</p>
            </div>
          </div>
          <div className='StatCard'>
            <div className='StatIcon'>✅</div>
            <div className='StatDetails'>
              <h3>Completed</h3>
              <p className='StatValue'>{stats.completedTasks}</p>
            </div>
          </div>
          <div className='StatCard'>
            <div className='StatIcon'>📊</div>
            <div className='StatDetails'>
              <h3>Completion Rate</h3>
              <p className='StatValue'>{stats.completionRate}%</p>
            </div>
          </div>
          <div className='StatCard'>
            <div className='StatIcon'>🔢</div>
            <div className='StatDetails'>
              <h3>Calculations</h3>
              <p className='StatValue'>{stats.totalCalculations}</p>
            </div>
          </div>
        </div>

        <div className='TabContainer'>
          <div className='TabButtons'>
            <button className={`TabBtn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>📊 All Activities</button>
            <button className={`TabBtn ${activeTab === 'calculations' ? 'active' : ''}`} onClick={() => setActiveTab('calculations')}>🔢 Calculations</button>
            <button className={`TabBtn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>✅ Completed Tasks</button>
          </div>

          {activeTab === 'all' && (
            <div className='TabContent'>
              <h2>📊 All Activities</h2>
              {calculationHistory.length === 0 && taskHistory.length === 0 ? (
                <div className='EmptyState'>
                  <p className='EmptyIcon'>📭</p>
                  <p>No activities yet. Start by completing tasks or making calculations!</p>
                </div>
              ) : (
                <div className='ActivityList'>
                  {taskHistory.length > 0 && (
                    <div className='ActivitySection'>
                      <h3>✅ Completed Tasks</h3>
                      {taskHistory.slice().reverse().map((task, index) => (
                        <div key={index} className='ActivityItem TaskItem'>
                          <div className='ActivityInfo'>
                            <span className='ActivityType'>✔️ Task Completed</span>
                            <span className='ActivityDetail'>{task.text}</span>
                          </div>
                          <span className='ActivityTime'>
                            {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Today'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {calculationHistory.length > 0 && (
                    <div className='ActivitySection'>
                      <h3>🔢 Recent Calculations</h3>
                      {calculationHistory.slice(-5).reverse().map((calc, index) => (
                        <div key={index} className='ActivityItem CalculationItem'>
                          <div className='ActivityInfo'>
                            <span className='ActivityType'>🧮 Calculation</span>
                            <span className='ActivityDetail'>{calc.expression} = {calc.result}</span>
                          </div>
                          <span className='ActivityTime'>{calc.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'calculations' && (
            <div className='TabContent'>
              <div className='TabHeader'>
                <h2>🔢 Calculation History</h2>
                {calculationHistory.length > 0 && (
                  <button className='ClearBtn' onClick={clearAllCalculationHistory}>🗑️ Clear All</button>
                )}
              </div>

              <div className='SearchBox'>
                <input
                  type='text'
                  placeholder='Search calculations...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='SearchInput'
                />
              </div>

              {filteredCalculations.length === 0 ? (
                <div className='EmptyState'>
                  <p className='EmptyIcon'>🔢</p>
                  <p>{searchTerm ? 'No calculations found matching your search' : 'No calculation history yet'}</p>
                </div>
              ) : (
                <div className='HistoryTable'>
                  <div className='TableHeader'>
                    <div className='TableCell'>Expression</div>
                    <div className='TableCell'>Result</div>
                    <div className='TableCell'>Time</div>
                    <div className='TableCell'>Action</div>
                  </div>
                  {filteredCalculations.slice().reverse().map((calc, index) => {
                    const realIndex = calculationHistory.length - 1 - index
                    return (
                      <div key={index} className='TableRow'>
                        <div className='TableCell'>{calc.expression}</div>
                        <div className='TableCell Result'>{calc.result}</div>
                        <div className='TableCell'>{calc.timestamp || 'N/A'}</div>
                        <div className='TableCell Action'>
                          <button className='DeleteBtn' onClick={() => deleteCalculationHistory(realIndex)}>🗑️</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className='TabContent'>
              <h2>✅ Completed Tasks</h2>
              {taskHistory.length === 0 ? (
                <div className='EmptyState'>
                  <p className='EmptyIcon'>📭</p>
                  <p>No completed tasks yet. Complete a task to see it here!</p>
                </div>
              ) : (
                <div className='CompletedTasksList'>
                  {taskHistory.slice().reverse().map((task, index) => (
                    <div key={index} className='CompletedTaskItem'>
                      <div className='TaskCheckmark'>✓</div>
                      <div className='TaskInfo'>
                        <h4>{task.text}</h4>
                        <div className='TaskMeta'>
                          {task.category && <span className='Category'>{task.category}</span>}
                          {task.priority && <span className='Priority'>{task.priority}</span>}
                          <span className='CompletedDate'>
                            Completed: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Today'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History
