import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Chatbot from '../Chatbot';
import { useParams, useNavigate } from 'react-router-dom';  // Add useNavigate
import Loading from './Loading';
import { Navigate } from 'react-router-dom';
const AssignmentList = ({ assignments, isTeacher, onGrade, onSubmit, onCreateAssignment }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const getSubmissionStatus = (assignment) => {
    const submission = assignment.submissions?.[currentUser.uid];
    if (!submission) return 'pending';
    return submission.status === 'graded' ? 'graded' : 'submitted';
  };

  const getButtonConfig = (assignment) => {
    const status = getSubmissionStatus(assignment);
    
    switch(status) {
      case 'graded':
        return {
          text: 'View Grade',
          className: 'bg-green-600 hover:bg-green-700',
          onClick: () => navigate(`/classroom/${assignment.classroomId}/assignment/${assignment.id}/view`)
        };
      case 'submitted':
        return {
          text: 'View Submission',
          className: 'bg-yellow-600 hover:bg-yellow-700',
          onClick: () => navigate(`/classroom/${assignment.classroomId}/assignment/${assignment.id}/view`)
        };
      default:
        return {
          text: 'Submit',
          className: 'bg-blue-600 hover:bg-blue-700',
          onClick: () => onSubmit(assignment.id)
        };
    }
  };

  return (
    <div className="space-y-4">
      {isTeacher && (
        <div className="mb-6">
          <button
            onClick={onCreateAssignment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center"
          >
            <span className="mr-2">+</span> Create Assignment
          </button>
        </div>
      )}
      
      {assignments.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          {isTeacher ? "Create your first assignment to get started!" : "No assignments yet"}
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
              <p className="text-gray-300 mt-2">{assignment.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-gray-400">
                  <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
                  <span className="ml-4">Points: {assignment.totalPoints}</span>
                  {!isTeacher && (
                    <span className="ml-4">
                      Status: {
                        assignment.submissions?.[currentUser.uid]?.status === 'graded' ? (
                          <span className="text-green-500">Graded</span>
                        ) : assignment.submissions?.[currentUser.uid] ? (
                          <span className="text-yellow-500">Submitted</span>
                        ) : (
                          <span className="text-red-500">Pending</span>
                        )
                      }
                    </span>
                  )}
                </div>
                {isTeacher ? (
                  <div className="space-x-2">
                    <button 
                      onClick={() => onGrade(assignment.id)} 
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Grade ({Object.keys(assignment.submissions || {}).length})
                    </button>
                    <button
                      onClick={() => window.open(`/api/download-assignment-pdf/?assignment_id=${assignment.id}&include_answers=true`, '_blank')}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={getButtonConfig(assignment).onClick}
                    className={`px-4 py-2 rounded ${getButtonConfig(assignment).className}`}
                  >
                    {getButtonConfig(assignment).text}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PublicChat = ({ messages, onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg ${
              msg.type === 'system' 
                ? 'bg-gray-700 text-gray-300' 
                : msg.type === 'user' 
                  ? 'bg-blue-600 text-white ml-auto' 
                  : 'bg-gray-800 text-white'
            }`}
          >
            <p>{msg.text}</p>
            <small className="text-gray-400">{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded"
            placeholder="Type a message..."
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

const Classroom = ({ view = "main" }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();  // Add this line
  const [activeTab, setActiveTab] = useState('chat');
  const [classroom, setClassroom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [publicMessages, setPublicMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add useParams hook to get classroomId
  const { classroomId } = useParams();

  useEffect(() => {
    const fetchClassroomData = async () => {
      try {
        // Check if we have classroomId and currentUser before making requests
        if (!classroomId || !currentUser?.idToken) {
          setError('Missing classroom ID or user authentication');
          setLoading(false);
          return;
        }

        const headers = { 'Authorization': `Bearer ${currentUser.idToken}` };
        
        // Fetch classroom details
        const classroomResponse = await fetch(`/api/classrooms/${classroomId}`, {
          headers
        });
        if (!classroomResponse.ok) throw new Error('Failed to fetch classroom');
        const classroomData = await classroomResponse.json();
        setClassroom(classroomData);

        // Fetch assignments
        const assignmentsResponse = await fetch(`/api/classrooms/${classroomId}/assignments`, {
          headers
        });
        if (!assignmentsResponse.ok) throw new Error('Failed to fetch assignments');
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData);

        // Fetch public chat messages
        const messagesResponse = await fetch(`/api/classrooms/${classroomId}/messages`, {
          headers
        });
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
        const messagesData = await messagesResponse.json();
        setPublicMessages(messagesData);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomId, currentUser]);

  const handleSendPublicMessage = async (text) => {
    try {
      if (!classroomId || !currentUser?.idToken) {
        throw new Error('Missing classroom ID or user authentication');
      }

      const response = await fetch(`/api/classrooms/${classroomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.idToken}`
        },
        body: JSON.stringify({ text, chatId: classroomId })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setPublicMessages(prev => [...prev, newMessage]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGradeAssignment = async (assignmentId) => {
    // Navigate to grading interface
    window.location.href = `/classroom/${classroomId}/assignment/${assignmentId}/grade`;
  };

  const handleSubmitAssignment = async (assignmentId) => {
    // Navigate to submission interface
    window.location.href = `/classroom/${classroomId}/assignment/${assignmentId}/submit`;
  };

  const handleCreateAssignment = () => {
    navigate(`/classroom/${classroomId}/create-assignment`);  // Update this line to match the route
  };

  // Show loading or error states early if necessary
  if (!classroomId) return <div className="text-white">Invalid classroom ID</div>;
  if (loading) return <Loading/>;
  if (error) return <div className="text-white">Error: {error}</div>;
  if (!classroom) return <div className="text-white">Classroom not found</div>;

  const isTeacher = classroom.teacherId === currentUser.uid;

  const renderView = () => {
    switch (view) {
      case 'grade':
        return <GradeAssignment />;
      case 'submit':
        return <AssignmentView mode="submit" />;
      case 'view':
        return <AssignmentView mode="view" />;
      default:
        return (
          <>
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded ${activeTab === 'chat' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Public Chat
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 rounded ${activeTab === 'assignments' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Assignments
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded ${activeTab === 'ai' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                AI Assistant
              </button>
            </div>

            <main className="bg-gray-800 rounded-lg min-h-[600px] p-4">
              {activeTab === 'chat' && (
                <PublicChat
                  messages={publicMessages}
                  onSendMessage={handleSendPublicMessage}
                />
              )}
              {activeTab === 'assignments' && (
                <AssignmentList
                  assignments={assignments}
                  isTeacher={isTeacher}
                  onGrade={handleGradeAssignment}
                  onSubmit={handleSubmitAssignment}
                  onCreateAssignment={handleCreateAssignment}
                  currentUser={currentUser}
                />
              )}
              {activeTab === 'ai' && (
                <Chatbot course={{ chatId: `classroom_${classroomId}` }} />
              )}
            </main>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{classroom?.name}</h1>
          <p className="text-gray-400">{classroom?.description}</p>
          {isTeacher && classroom?.joinCode && (
            <div className="mt-2 p-2 bg-gray-800 rounded inline-block">
              <span className="text-gray-400">Class Code: </span>
              <span className="font-mono text-white">{classroom.joinCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(classroom.joinCode);
                }}
                className="ml-2 text-blue-400 hover:text-blue-300"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          )}
        </header>

        {renderView()}
      </div>
    </div>
  );
};

export default Classroom;