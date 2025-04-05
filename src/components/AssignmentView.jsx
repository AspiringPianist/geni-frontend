import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export default function AssignmentView({ mode = 'submit' }) {
  const { classroomId, assignmentId } = useParams();
  const { currentUser } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/classrooms/${classroomId}/assignments/${assignmentId}`, {
          headers: {
            Authorization: `Bearer ${currentUser.idToken}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch assignment');
        const data = await response.json();
        setAssignment(data);
        // Initialize answers object
        const initialAnswers = {};
        data.questions.forEach((q, idx) => {
          initialAnswers[idx] = '';
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [classroomId, assignmentId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('answer_text', JSON.stringify(answers));
      
      const response = await fetch(
        `/api/classrooms/${classroomId}/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentUser.idToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to submit assignment');
      
      // Show success message before redirecting
      alert("Assignment submitted successfully! Your teacher will review and grade it.");
      // Redirect to classroom page
      window.location.href = `/classroom/${classroomId}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!assignment) return <div>Assignment not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{assignment.title}</h1>
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="text-gray-300 mb-4">{assignment.description}</p>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Total Points: {assignment.totalPoints}</span>
            {assignment.dueDate && (
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {assignment.questions.map((question, idx) => (
            <div key={idx} className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                Question {idx + 1} ({question.marks} points)
              </h3>
              <p className="text-gray-300 mb-4">{question.question_text}</p>
              <textarea
                value={answers[idx]}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                className="w-full bg-gray-700 text-white rounded p-3 min-h-[100px]"
                placeholder="Enter your answer here..."
                disabled={mode === 'view'}
              />
            </div>
          ))}

          {mode === 'submit' && (
            <button
              type="submit"
              disabled={submitting}
              className={`w-full bg-blue-600 text-white py-3 rounded-lg font-medium
                ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
