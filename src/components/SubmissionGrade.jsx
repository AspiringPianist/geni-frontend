import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export default function SubmissionGrade() {
  const { classroomId, assignmentId, submissionId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(
          `/api/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}`,
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
  }, [classroomId, assignmentId, submissionId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `/api/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.idToken}`,
          },
          body: JSON.stringify({
            grade: Number(grade),
            feedback,
            gradedBy: 'teacher'
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save grade');
      navigate(`/classroom/${classroomId}/assignment/${assignmentId}/grade`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!submission) return <div>Submission not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Grade Submission</h1>
          <p className="text-gray-400">
            Student: {submission.student_name}<br />
            Submitted: {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Student's Answer</h2>
            {submission.answers && Object.entries(submission.answers).map(([index, answer]) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-medium mb-2">Question {Number(index) + 1}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{answer}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 h-fit sticky top-8">
            <h2 className="text-2xl font-semibold mb-6">Grade & Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Grade (0-100)</label>
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
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Save Grade
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
