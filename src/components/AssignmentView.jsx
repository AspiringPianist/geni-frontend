import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export default function AssignmentView({ mode = 'submit' }) {
  const { classroomId, assignmentId } = useParams();
  const { currentUser } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assignment details
        const assignmentResponse = await fetch(`/api/classrooms/${classroomId}/assignments/${assignmentId}`, {
          headers: {
            Authorization: `Bearer ${currentUser.idToken}`,
          },
        });
        if (!assignmentResponse.ok) throw new Error('Failed to fetch assignment');
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData);

        // If in view mode, fetch submission
        if (mode === 'view') {
          const submissionResponse = await fetch(
            `/api/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${currentUser.uid}`,
            {
              headers: {
                Authorization: `Bearer ${currentUser.idToken}`,
              },
            }
          );
          if (!submissionResponse.ok) throw new Error('Failed to fetch submission');
          const submissionData = await submissionResponse.json();
          setSubmission(submissionData);
          setAnswers(submissionData.answers || {});
        } else {
          // Initialize empty answers for submit mode
          const initialAnswers = {};
          assignmentData.questions.forEach((q, idx) => {
            initialAnswers[idx] = '';
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroomId, assignmentId, currentUser, mode]);

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
        
        {mode === 'view' && submission && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="mb-4">
              <span className="text-gray-400">Status: </span>
              <span className={`font-semibold ${
                submission.status === 'graded' ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {submission.status === 'graded' ? 'Graded' : 'Pending Review'}
              </span>
            </div>
            {submission.status === 'graded' && (
              <div className="mb-4">
                <span className="text-gray-400">Grade: </span>
                <span className="font-semibold">{submission.grade}/100</span>
                {submission.feedback && (
                  <div className="mt-2">
                    <span className="text-gray-400">Feedback: </span>
                    <p className="text-white">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
