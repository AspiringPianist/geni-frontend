import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import Loading from "./components/Loading";
import { Link, useNavigate } from 'react-router-dom';

async function getUser(userId, idToken) {
  const response = await fetch(`/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return await response.json();
}

// Classroom Card Component
const ClassroomCard = ({ classroom, isTeacher }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
      <h3 className="text-xl font-bold text-white mb-2">{classroom.name}</h3>
      <p className="text-gray-300 mb-4">{classroom.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-gray-400">
          {isTeacher ? 'Teaching' : 'Enrolled'}
        </span>
        <Link
          to={`/classroom/${classroom.id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Enter Classroom
        </Link>
      </div>
    </div>
  );
};

const AssignmentCard = ({ assignment, classroomId, userRole }) => {
  const navigate = useNavigate();
  
  return (
      <div className="bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-white mb-2">{assignment.title}</h3>
          <p className="text-gray-300 mb-4">{assignment.description}</p>
          <div className="flex gap-2">
              <button
                  onClick={() => navigate(`/classroom/${classroomId}/assignment/${assignment.id}/view`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                  View
              </button>
              {userRole === 'student' && (
                  <button
                      onClick={() => navigate(`/classroom/${classroomId}/assignment/${assignment.id}/submit`)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                      Submit
                  </button>
              )}
              {userRole === 'teacher' && (
                  <button
                      onClick={() => navigate(`/classroom/${classroomId}/assignment/${assignment.id}/grade`)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                      Grade
                  </button>
              )}
          </div>
      </div>
  );
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teachingClassrooms, setTeachingClassrooms] = useState([]);
  const [enrolledClassrooms, setEnrolledClassrooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentUser?.idToken) return;
        
        // Fetch user data first
        const userResponse = await fetch(`/users/${currentUser.uid}`, {
          headers: { Authorization: `Bearer ${currentUser.idToken}` },
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await userResponse.json();
        setUser(userData);
        console.log('User data:', userData);

        // Fetch teaching classrooms for teachers
        if (userData.role === 'teacher' && Array.isArray(userData.teachingClassrooms)) {
          const teachingPromises = userData.teachingClassrooms.map(async (classroomId) => {
            const response = await fetch(`/api/classrooms/${classroomId}`, {
              headers: { Authorization: `Bearer ${currentUser.idToken}` },
            });
            if (!response.ok) throw new Error(`Failed to fetch classroom ${classroomId}`);
            const data = await response.json();
            return {
              ...data,
              id: classroomId // Ensure we have the id in the classroom object
            };
          });

          const teachingData = await Promise.all(teachingPromises);
          console.log('Teaching classrooms:', teachingData);
          setTeachingClassrooms(teachingData);
        }

        // Fetch enrolled classrooms for students
        if (userData.role === 'student' && Array.isArray(userData.enrolledClassrooms)) {
          const enrolledPromises = userData.enrolledClassrooms.map(async (classroomId) => {
            const response = await fetch(`/api/classrooms/${classroomId}`, {
              headers: { Authorization: `Bearer ${currentUser.idToken}` },
            });
            if (!response.ok) throw new Error(`Failed to fetch classroom ${classroomId}`);
            const data = await response.json();
            return {
              ...data,
              id: classroomId // Ensure we have the id in the classroom object
            };
          });

          const enrolledData = await Promise.all(enrolledPromises);
          console.log('Enrolled classrooms:', enrolledData);
          setEnrolledClassrooms(enrolledData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    try {
      if (!joinCode.trim()) {
        throw new Error('Please enter a class code');
      }

      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.idToken}`
        },
        body: JSON.stringify({ code: joinCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to join classroom');
      }

      const newClassroom = await response.json();
      setEnrolledClassrooms(prev => [...prev, newClassroom]);
      setJoinCode('');
    } catch (err) {
      console.error('Join classroom error:', err);
      setError(err.message);
    }
  };

  if (loading) return <Loading/>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Please log in</div>;

  return user.role === 'teacher' ? (
    <TeacherDashboard
      teachingClassrooms={teachingClassrooms}
      currentUser={currentUser}
    />
  ) : (
    <StudentDashboard
      enrolledClassrooms={enrolledClassrooms}
      joinCode={joinCode}
      setJoinCode={setJoinCode}
      handleJoinClassroom={handleJoinClassroom}
      currentUser={currentUser}
    />
  );
}

// Add Learning Aids section to TeacherDashboard
function TeacherDashboard({ teachingClassrooms, currentUser }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!teachingClassrooms.length) return;
      
      try {
        const allAssignments = await Promise.all(
          teachingClassrooms.map(async (classroom) => {
            const response = await fetch(`/api/classrooms/${classroom.id}/assignments`, {
              headers: { Authorization: `Bearer ${currentUser.idToken}` },
            });
            if (!response.ok) throw new Error(`Failed to fetch assignments for ${classroom.id}`);
            const assignments = await response.json();
            return assignments;
          })
        );
        setAssignments(allAssignments.flat());
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    };

    fetchAssignments();
  }, [teachingClassrooms, currentUser]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <Link
            to="/create-classroom"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Create New Classroom
          </Link>
        </header>

        {/* Learning Aids Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Learning Aids</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/visual-summary"
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700"
            >
              <h3 className="text-xl font-semibold mb-2">Visual Summaries</h3>
              <p className="text-gray-400">Create visual concept maps and summaries</p>
            </Link>
            <Link
              to="/quiz-generator"
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700"
            >
              <h3 className="text-xl font-semibold mb-2">Quiz Generator</h3>
              <p className="text-gray-400">Generate interactive quizzes</p>
            </Link>
            <Link
              to="/chat-assistant"
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700"
            >
              <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
              <p className="text-gray-400">Get help with lesson planning</p>
            </Link>
          </div>
        </section>

        {/* Classrooms Grid */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">My Classrooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachingClassrooms.map((classroom) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                isTeacher={true}
              />
            ))}
          </div>
        </section>

        {/* Assignments Section */}
        <section className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Recent Assignments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-700">
                  <th className="p-4">Class</th>
                  <th className="p-4">Assignment</th>
                  <th className="p-4">Submissions</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-gray-700">
                    <td className="p-4">{assignment.className}</td>
                    <td className="p-4">{assignment.title}</td>
                    <td className="p-4">
                      {Object.keys(assignment.submissions || {}).length} submitted
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/classroom/${assignment.classroomId}/assignment/${assignment.id}/grade`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// Similarly add Learning Aids to StudentDashboard
function StudentDashboard({ enrolledClassrooms, joinCode, setJoinCode, handleJoinClassroom, currentUser }) {
  const [assignments, setAssignments] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!enrolledClassrooms.length) return;
      
      try {
        const allAssignments = await Promise.all(
          enrolledClassrooms.map(async (classroom) => {
            const response = await fetch(`/api/classrooms/${classroom.id}/assignments`, {
              headers: { Authorization: `Bearer ${currentUser.idToken}` },
            });
            const assignments = await response.json();
            return assignments.map(a => ({ ...a, className: classroom.name }));
          })
        );
        setAssignments(allAssignments.flat());
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    };

    fetchAssignments();
  }, [enrolledClassrooms, currentUser]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
        </header>

        {/* Learning Aids Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Learning Aids</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/visual-summary"
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700"
            >
              <h3 className="text-xl font-semibold mb-2">Visual Summaries</h3>
              <p className="text-gray-400">View concept maps and summaries</p>
            </Link>
            <Link
              to="/quiz"
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700"
            >
              <h3 className="text-xl font-semibold mb-2">Practice Quizzes</h3>
              <p className="text-gray-400">Test your knowledge</p>
            </Link>
            <Link
              to="/chat-assistant"
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700"
            >
              <h3 className="text-xl font-semibold mb-2">AI Study Assistant</h3>
              <p className="text-gray-400">Get help with your studies</p>
            </Link>
          </div>
        </section>

        {/* Join Class Section */}
        <section className="mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Join a Class</h2>
            <form onSubmit={handleJoinClassroom} className="flex gap-4">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter class code"
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Join
              </button>
            </form>
          </div>
        </section>

        {/* Enrolled Classes */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">My Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledClassrooms.map((classroom) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                isTeacher={false}
              />
            ))}
          </div>
        </section>

        {/* Assignments Section */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Active Assignments</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-700">
                  <th className="p-4">Class</th>
                  <th className="p-4">Assignment</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-t border-gray-700">
                    <td className="p-4">{assignment.className}</td>
                    <td className="p-4">{assignment.title}</td>
                    <td className="p-4">{new Date(assignment.dueDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {assignment.submissions?.[currentUser.uid] ? 'Submitted' : 'Pending'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(
                          `/classroom/${assignment.classroomId}/assignment/${assignment.id}/${
                            assignment.submissions?.[currentUser.uid] ? 'view' : 'submit'
                          }`
                        )}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        {assignment.submissions?.[currentUser.uid] ? 'View' : 'Submit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}