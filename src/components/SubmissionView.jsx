import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export default function SubmissionView() {
  const { classroomId, assignmentId, studentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(
          `/api/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${currentUser.idToken}`,
            },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch submission');
        const data = await response.json();
        setSubmission(data);
        setGrade(data.grade || '');
        setFeedback(data.feedback || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [classroomId, assignmentId, studentId, currentUser]);

  const handleGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!grade || !feedback) {
        throw new Error('Grade and feedback are required');
      }

      const response = await fetch(
        `/api/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${studentId}/grade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.idToken}`,
          },
          body: JSON.stringify({
            grade: Number(grade),
            feedback,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save grade');
      }

      // Show success message
      alert('Grade saved successfully!');
      // Return to grading overview
      navigate(`/classroom/${classroomId}/assignment/${assignmentId}/grade`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!submission) return <div>Submission not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Submission</h1>
          <p className="text-gray-400">
            Submitted by {submission.student_name} on{' '}
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submission Content */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Answers</h2>
            {submission.answers && Object.entries(submission.answers).map(([index, answer]) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-medium mb-2">Question {Number(index) + 1}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{answer}</p>
              </div>
            ))}
          </div>

          {/* Grading Form */}
          <div className="bg-gray-800 rounded-lg p-6 h-fit sticky top-8">
            <h2 className="text-2xl font-semibold mb-6">Grade Submission</h2>
            <form onSubmit={handleGrade} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Grade</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded min-h-[150px]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg font-medium
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {saving ? 'Saving...' : 'Save Grade'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
