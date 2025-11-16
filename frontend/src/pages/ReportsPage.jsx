import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Users, BookOpen, TrendingUp } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState('last30days');

  const reportTypes = [
    {
      id: 'enrollment',
      title: 'Enrollment Report',
      description: 'Student enrollment statistics by course and semester',
      icon: Users,
      color: 'bg-blue-500',
      data: {
        totalEnrollments: 1234,
        newEnrollments: 87,
        dropouts: 12,
        completionRate: '94%'
      }
    },
    {
      id: 'performance',
      title: 'Academic Performance',
      description: 'Grade distribution and performance analytics',
      icon: TrendingUp,
      color: 'bg-green-500',
      data: {
        averageGrade: '85%',
        passRate: '92%',
        topPerformers: 45,
        improvementRate: '+5%'
      }
    },
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Class attendance patterns and statistics',
      icon: Calendar,
      color: 'bg-purple-500',
      data: {
        overallAttendance: '88%',
        regularAttendees: 1089,
        chronicallyAbsent: 34,
        attendanceTrend: '+2%'
      }
    },
    {
      id: 'courses',
      title: 'Course Analytics',
      description: 'Course popularity, completion rates, and feedback',
      icon: BookOpen,
      color: 'bg-orange-500',
      data: {
        totalCourses: 56,
        activeCourses: 42,
        completionRate: '87%',
        satisfaction: '4.3/5'
      }
    }
  ];

  const handleGenerateReport = (reportType) => {
    setSelectedReport(reportType);
    // Here you would typically call an API to generate the report
    console.log('Generating report:', reportType.id, 'for date range:', dateRange);
  };

  const handleDownloadReport = (format) => {
    // Here you would typically trigger a download
    console.log('Downloading report in format:', format);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports and analyze system data</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Settings</h2>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="last3months">Last 3 months</option>
            <option value="last6months">Last 6 months</option>
            <option value="lastyear">Last year</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                
                {/* Quick Stats */}
                <div className="space-y-2 mb-4">
                  {Object.entries(report.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => handleGenerateReport(report)}
                  className="w-full btn-primary text-sm py-2"
                >
                  Generate Report
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generated Report Display */}
      {selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedReport.title} - {dateRange.replace(/([A-Z])/g, ' $1')}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadReport('pdf')}
                  className="btn-outline text-sm py-2 px-3 flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => handleDownloadReport('excel')}
                  className="btn-outline text-sm py-2 px-3 flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Chart/Report Content Placeholder */}
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Report Generated Successfully</h3>
              <p className="text-gray-600">This is a preview of the {selectedReport.title.toLowerCase()}. The actual report would contain detailed charts, tables, and analytics.</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no report is selected */}
      {!selectedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <EmptyState
            icon={BarChart3}
            title="No report selected"
            description="Choose a report type above to generate comprehensive analytics and insights."
          />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;