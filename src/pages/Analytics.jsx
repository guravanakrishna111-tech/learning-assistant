import React, { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './Analytics.css'

const Analytics = ({ Tasks = [] }) => {
  const getEmoji = (category) => {
    const emojis = { Study: '📚', Work: '💼', Personal: '🎯', Health: '💪' }
    return emojis[category] || '📋'
  }

  const analyticsData = useMemo(() => {
    const tasks = Tasks || []
    const completedTasks = tasks.filter(t => t.completed)
    const totalTasks = tasks.length

    // Category distribution
    const categoryCount = {}
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })

    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
      completed: tasks.filter(t => t.category === name && t.completed).length,
      emoji: getEmoji(name)
    }))

    // Priority distribution
    const priorityCount = { High: 0, Medium: 0, Low: 0 }
    tasks.forEach(task => {
      const priority = task.priority || 'Medium'
      if (priority in priorityCount) priorityCount[priority]++
    })

    // Weekly data (simulated)
    const weeklyData = [
      { day: 'Mon', completed: 3, pending: 4 },
      { day: 'Tue', completed: 4, pending: 3 },
      { day: 'Wed', completed: 5, pending: 2 },
      { day: 'Thu', completed: 2, pending: 5 },
      { day: 'Fri', completed: 6, pending: 1 },
      { day: 'Sat', completed: 4, pending: 2 },
      { day: 'Sun', completed: 3, pending: 3 }
    ]

    const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0

    // Productivity score (0-100)
    const productivity = Math.min(100, completionRate + (completedTasks.length * 2))

    return {
      totalTasks,
      completedTasks: completedTasks.length,
      completionRate,
      productivity,
      categoryData,
      priorityCount,
      weeklyData
    }
  }, [Tasks])

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']

  return (
    <div className='AnalyticsContainer'>
      <div className='AnalyticsContent'>
        <div className='AnalyticsHeader'>
          <h1>📈 Analytics Dashboard</h1>
          <p>Your productivity insights and metrics</p>
        </div>

        {/* Key Metrics */}
        <div className='MetricsGrid'>
          <div className='MetricCard'>
            <div className='MetricIcon'>📋</div>
            <div className='MetricInfo'>
              <h3>Total Tasks</h3>
              <p className='MetricValue'>{analyticsData.totalTasks}</p>
            </div>
          </div>

          <div className='MetricCard'>
            <div className='MetricIcon'>✅</div>
            <div className='MetricInfo'>
              <h3>Completed</h3>
              <p className='MetricValue'>{analyticsData.completedTasks}</p>
            </div>
          </div>

          <div className='MetricCard'>
            <div className='MetricIcon'>📊</div>
            <div className='MetricInfo'>
              <h3>Completion Rate</h3>
              <p className='MetricValue'>{analyticsData.completionRate}%</p>
            </div>
          </div>

          <div className='MetricCard'>
            <div className='MetricIcon'>⚡</div>
            <div className='MetricInfo'>
              <h3>Productivity Score</h3>
              <p className='MetricValue'>{Math.min(100, analyticsData.productivity)}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className='ChartsGrid'>
          {/* Weekly Tasks Chart */}
          <div className='ChartBox'>
            <h3>📅 Weekly Task Completion</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className='ChartBox'>
            <h3>📂 Tasks by Category</h3>
            {analyticsData.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <p>No tasks yet</p>
              </div>
            )}
          </div>

          {/* Priority Distribution */}
          <div className='ChartBox'>
            <h3>🎯 Tasks by Priority</h3>
            <div className='PriorityList'>
              <div className='PriorityItem'>
                <span className='PriorityName'>🔴 High Priority</span>
                <div className='ProgressBar'>
                  <div
                    className='ProgressFill'
                    style={{
                      width: `${(analyticsData.priorityCount.High / analyticsData.totalTasks) * 100 || 0}%`,
                      backgroundColor: '#EF4444'
                    }}
                  ></div>
                </div>
                <span className='PriorityCount'>{analyticsData.priorityCount.High}</span>
              </div>

              <div className='PriorityItem'>
                <span className='PriorityName'>🟠 Medium Priority</span>
                <div className='ProgressBar'>
                  <div
                    className='ProgressFill'
                    style={{
                      width: `${(analyticsData.priorityCount.Medium / analyticsData.totalTasks) * 100 || 0}%`,
                      backgroundColor: '#F59E0B'
                    }}
                  ></div>
                </div>
                <span className='PriorityCount'>{analyticsData.priorityCount.Medium}</span>
              </div>

              <div className='PriorityItem'>
                <span className='PriorityName'>🟢 Low Priority</span>
                <div className='ProgressBar'>
                  <div
                    className='ProgressFill'
                    style={{
                      width: `${(analyticsData.priorityCount.Low / analyticsData.totalTasks) * 100 || 0}%`,
                      backgroundColor: '#10B981'
                    }}
                  ></div>
                </div>
                <span className='PriorityCount'>{analyticsData.priorityCount.Low}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className='ChartBox'>
            <h3>📊 Category Breakdown</h3>
            <div className='CategoryBreakdown'>
              {analyticsData.categoryData.length > 0 ? (
                analyticsData.categoryData.map((cat, idx) => (
                  <div key={idx} className='CategoryItem'>
                    <span className='CategoryName'>
                      {cat.emoji} {cat.name}
                    </span>
                    <div className='CategoryStats'>
                      <span>{cat.value} tasks</span>
                      <span className='Completed'>{cat.completed} done</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  <p>No task categories yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Productivity Insights */}
        <div className='InsightsBox'>
          <h3>💡 Productivity Insights</h3>
          <div className='InsightsList'>
            <div className='InsightItem'>
              <span className='InsightIcon'>✨</span>
              <p>Great work! You've completed <strong>{analyticsData.completionRate}%</strong> of your tasks.</p>
            </div>
            <div className='InsightItem'>
              <span className='InsightIcon'>🎯</span>
              <p>Your most active category is <strong>
                {analyticsData.categoryData.length > 0
                  ? analyticsData.categoryData.reduce((a, b) => a.value > b.value ? a : b).name
                  : 'Not available'
                }
              </strong></p>
            </div>
            <div className='InsightItem'>
              <span className='InsightIcon'>⚡</span>
              <p>Keep up the momentum! Your productivity score is <strong>{Math.min(100, analyticsData.productivity)}/100</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
