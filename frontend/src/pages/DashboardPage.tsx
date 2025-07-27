import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { 
  PlusIcon, 
  FolderIcon, 
  CodeBracketIcon,
  ClockIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const recentProjects = [
    {
      id: '1',
      name: 'My React App',
      framework: 'React',
      lastModified: '2 hours ago',
      collaborators: 3,
    },
    {
      id: '2',
      name: 'Next.js Portfolio',
      framework: 'Next.js',
      lastModified: '1 day ago',
      collaborators: 1,
    },
    {
      id: '3',
      name: 'Vue Dashboard',
      framework: 'Vue.js',
      lastModified: '3 days ago',
      collaborators: 2,
    },
  ];

  const quickActions = [
    {
      title: 'Create New Project',
      description: 'Start a new project from scratch or use a template',
      icon: PlusIcon,
      href: '/projects/new',
      color: 'bg-blue-500',
    },
    {
      title: 'Browse Projects',
      description: 'View and manage all your projects',
      icon: FolderIcon,
      href: '/projects',
      color: 'bg-green-500',
    },
    {
      title: 'Open IDE',
      description: 'Jump into the development environment',
      icon: CodeBracketIcon,
      href: '/ide',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Ready to build something amazing?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/settings">
                <Button variant="outline">Settings</Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Projects
              </h2>
              <Link to="/projects">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentProjects.map((project) => (
                  <div key={project.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FolderIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.framework}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {project.lastModified}
                        </div>
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {project.collaborators}
                        </div>
                        <Link to={`/ide/${project.id}`}>
                          <Button size="sm">Open</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">5</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Projects</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">24h</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Time This Week</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">8</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Collaborators</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
