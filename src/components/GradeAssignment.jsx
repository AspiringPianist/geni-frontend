import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export default function GradeAssignment() {
  const { classroomId, assignmentId } = useParams();
  const { currentUser } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [useAI, setUseAI] = useState(false);

  const refreshSubmissions = async () => {
    try {
      const submissionsResponse = await fetch(
        `/api/submissions/${assignmentId}?classroom_id=${classroomId}`,
        {
          headers: {
            Authorization: `Bearer ${currentUser.idToken}`,
          },
        }
      );
      if (!submissionsResponse.ok) throw new Error('Failed to fetch submissions');
      const submissionsData = await submissionsResponse.json();
      setSubmissions(submissionsData);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assignment details
        const assignmentResponse = await fetch(
          `/api/classrooms/${classroomId}/assignments/${assignmentId}`,
          {
            headers: {
              Authorization: `Bearer ${currentUser.idToken}`,
            },
          }
        );
        if (!assignmentResponse.ok) throw new Error('Failed to fetch assignment');
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData);

        await refreshSubmissions();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroomId, assignmentId, currentUser]);

  const handleGradeAll = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/classrooms/${classroomId}/assignments/${assignmentId}/grade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.idToken}`
          },
          body: JSON.stringify({ useAI })
        }
      );

      if (!response.ok) throw new Error('Failed to process submissions');
      
      // Refresh submissions after grading
      await refreshSubmissions();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualGrade = async (submissionId, grade, feedback) => {
    try {
      const response = await fetch(
        `/api/classrooms/${classroomId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.idToken}`
          },
          body: JSON.stringify({ grade, feedback })
        }
      );

      if (!response.ok) throw new Error('Failed to grade submission');
      await refreshSubmissions();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!assignment) return <div>Assignment not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <p className="text-gray-400 mt-2">
              Total Submissions: {assignment.submissionCount || 0}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span>Use AI Grading</span>
            </label>
            <button
              onClick={handleGradeAll}
              disabled={processing}
              className={`bg-blue-600 text-white px-6 py-2 rounded-lg
                ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {processing ? 'Processing...' : 'Grade All Submissions'}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Submissions ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <p className="text-gray-400">No submissions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="py-2">Student</th>
                    <th className="py-2">Submitted</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Grade</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-gray-700">
                      <td className="py-4">
                        <div>
                          <div className="font-medium">{submission.student_name}</div>
                          <div className="text-sm text-gray-400">{submission.student_email}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        {new Date(submission.submissionDate).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded ${
                          submission.status === 'graded' ? 'bg-green-600' :
                          submission.status === 'pending_review' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="py-4">{submission.grade || 'Not graded'}</td>
                      <td className="py-4">
                        <button
                          onClick={() => window.location.href = `/classroom/${classroomId}/assignment/${assignmentId}/submission/${submission.id}/grade`}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Grade Submission
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
