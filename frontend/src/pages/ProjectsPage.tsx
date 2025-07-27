import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  PlusIcon, 
  FolderIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const ProjectsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFramework, setFilterFramework] = useState('all');

  const projects = [
    {
      id: '1',
      name: 'My React App',
      description: 'A modern React application with TypeScript',
      framework: 'React',
      lastModified: '2 hours ago',
      collaborators: 3,
      isPublic: false,
    },
    {
      id: '2',
      name: 'Next.js Portfolio',
      description: 'Personal portfolio website built with Next.js',
      framework: 'Next.js',
      lastModified: '1 day ago',
      collaborators: 1,
      isPublic: true,
    },
    {
      id: '3',
      name: 'Vue Dashboard',
      description: 'Admin dashboard using Vue.js and Tailwind CSS',
      framework: 'Vue.js',
      lastModified: '3 days ago',
      collaborators: 2,
      isPublic: false,
    },
    {
      id: '4',
      name: 'E-commerce Store',
      description: 'Full-stack e-commerce application',
      framework: 'Next.js',
      lastModified: '1 week ago',
      collaborators: 5,
      isPublic: false,
    },
  ];

  const frameworks = ['all', 'React', 'Next.js', 'Vue.js', 'Vanilla'];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFramework = filterFramework === 'all' || project.framework === filterFramework;
    return matchesSearch && matchesFramework;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Projects
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage and organize your development projects
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link to="/projects/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <select
              value={filterFramework}
              onChange={(e) => setFilterFramework(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {frameworks.map(framework => (
                <option key={framework} value={framework}>
                  {framework === 'all' ? 'All Frameworks' : framework}
                </option>
              ))}
            </select>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No projects found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterFramework !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new project.'
                }
              </p>
              {!searchTerm && filterFramework === 'all' && (
                <div className="mt-6">
                  <Link to="/projects/new">
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create New Project
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <FolderIcon className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.framework}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {project.description}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {project.lastModified}
                        </div>
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {project.collaborators}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {project.isPublic && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Link to={`/ide/${project.id}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          Open IDE
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
