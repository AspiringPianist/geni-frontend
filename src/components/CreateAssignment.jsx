import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const DURATION_OPTIONS = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: 'custom', label: 'Custom' }
];

export default function CreateAssignment() {
  const { classroomId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    topic: '',
    difficulty: 'medium',
    duration: '60',
    customDuration: '',
    numQuestions: 5,
    learningObjectives: '',
    additionalRequirements: '',
    pdfFile: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formDataObj = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'pdfFile' && formData[key]) {
        formDataObj.append('pdf_file', formData[key]);
      } else {
        formDataObj.append(key, formData[key]);
      }
    });

    try {
      // Update the API endpoint to match the backend route
      const response = await fetch(`/api/classrooms/${classroomId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.idToken}`
        },
        body: JSON.stringify({
          topic: formData.topic,
          num_questions: formData.numQuestions,
          duration: formData.duration === 'custom' ? formData.customDuration : formData.duration,
          difficulty: formData.difficulty,
          learning_objectives: formData.learningObjectives.split('\n').filter(obj => obj.trim()),
          additional_requirements: formData.additionalRequirements || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create assignment');
      }

      navigate(`/classroom/${classroomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Assignment</h1>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {DURATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.numQuestions}
                onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {formData.duration === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-2">Custom Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={formData.customDuration}
                onChange={(e) => setFormData({ ...formData, customDuration: e.target.value })}
                className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Learning Objectives</label>
            <textarea
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px]"
              placeholder="Enter learning objectives (one per line)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Requirements</label>
            <textarea
              value={formData.additionalRequirements}
              onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
              className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload Reference Material (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFormData({ ...formData, pdfFile: e.target.files[0] })}
              className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-3 rounded-lg font-medium
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {loading ? 'Creating Assignment...' : 'Create Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
}