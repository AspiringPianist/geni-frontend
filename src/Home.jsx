import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate, useNavigation } from 'react-router-dom';
import Chatbot from './Chatbot';
import Dashboard from './Dashboard';
import Classroom from './components/Classroom';
import CreateClassroom from './components/CreateClassroom';
import CreateAssignment from './components/CreateAssignment';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { AuthProvider } from './contexts/AuthContext';
import Loading from "./components/Loading"; // Import the loading component
console.log(import.meta.env);

// Modal Component
const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-roboto font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-white-500 hover:text-white-700">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ href, onClick, children }) => (
  <li className="ml-6">
    <a href={href} onClick={onClick} className="text-white hover:text-blue-600 font-roboto font-medium transition-colors duration-200">
      {children}
    </a>
  </li>
);

// Button Component
const Button = ({ children, onClick, type = "button", className = "", textColor = "white" }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-6 py-2 bg-gray-600 text-${textColor} rounded-md font-roboto font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
  >
    {children}
  </button>
);

// Profile Card Component
const ProfileCard = ({ user }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center px-14">
      <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-blue-100" />
      <h2 className="text-xl font-roboto font-semibold text-white mb-2">Welcome, {user.displayName}!</h2>
      <p className="mb-4 text-gray-300 font-roboto">{user.email}</p>
      <Button onClick={async () => {
        const idToken = await user.idToken;
        navigate('/dashboard', { state: { userId: user.uid, idToken } });
      }}>
        Continue Learning
      </Button>
    </div>
  );
};

// Header Component
const Header = ({ isAuthenticated, currentUser, onLogin, onLogout }) => (
  <header className="flex justify-between items-center px-8 py-4 bg-gray-900 shadow-sm">
    <div className="text-2xl font-roboto font-bold text-blue-600">Tibby's Classroom</div>
    <nav>
      <ul className="flex items-center">
        <NavItem href="/">Home</NavItem>
        <NavItem href="#courses">Courses</NavItem>
        <NavItem href="#team">Team</NavItem>
        {isAuthenticated ? (
          <>
            <NavItem href="/chatbot">My Chatbot</NavItem>
            <NavItem href="/profile">
              <img src={currentUser.photoURL} alt={currentUser.displayName} className="h-10 rounded-full border-2 border-blue-100" />
            </NavItem>
            <NavItem href="#" onClick={onLogout}>Logout</NavItem>
          </>
        ) : (
          <NavItem href="#" onClick={onLogin}>Login with Google</NavItem>
        )}
      </ul>
    </nav>
  </header>
);

// Hero Section Component
const HeroSection = ({ isAuthenticated, currentUser, onLogin }) => (
  <section className="px-8 py-16 flex flex-col md:flex-row justify-center bg-gray-900 gap-x-4">
    <div className="md:w-1/2 mb-8 md:mb-0 flex flex-col">
      <h1 className="text-4xl md:text-5xl font-roboto font-bold text-white mb-4">
        Experience <span className="text-blue-600">Multi-Modal</span> Learning
      </h1>
      <p className="text-lg text-gray-300 font-roboto mb-6">
        Personalized AI-Guided Learning Paths.
      </p>
      {isAuthenticated ? (
        <ProfileCard user={currentUser} />
      ) : (
        <div className="flex space-x-4">
          <Button onClick={onLogin}>Login with Google</Button>
          <Button className="text-black bg-gray-100 hover:bg-gray-200" textColor='black'>Explore Courses</Button>
        </div>
      )}
    </div>
    <div className="justify-center items-center flex flex-row gap-x-3 md:mt-10">
      <img src="/hero.jpeg" alt="Hero" className="rounded-3xl size-100 md:w-1/2" />
      <img src="/hero2.jpeg" alt="Hero" className="rounded-3xl size-100 md:w-1/2" />
    </div>
  </section>
);

// Benefit Card Component
const BenefitCard = ({ number, title, description }) => (
  <div className="p-6 bg-gray-800 rounded-lg shadow-sm">
    <h3 className="text-lg font-roboto font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-300 font-roboto">{description}</p>
  </div>
);

// Benefits Section Component
const BenefitsSection = () => {
  const benefits = [
    { number: "01", title: "Flexible Learning", description: "Fit your coursework around your schedule." },
    { number: "02", title: "Expert Instruction", description: "Learn from industry leaders." },
    { number: "03", title: "Diverse Courses", description: "Explore a wide range of topics." },
    { number: "04", title: "Practical Projects", description: "Build real-world skills." },
    { number: "05", title: "Updated Curriculum", description: "Stay current with industry trends." },
    { number: "06", title: "Interactive Learning", description: "Engage with hands-on content." },
  ];

  return (
    <section className="px-8 py-16 bg-gray-900">
      <h2 className="text-3xl font-roboto font-bold text-white mb-8">Benefits</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {benefits.map((benefit, idx) => (
          <BenefitCard
            key={idx}
            number={benefit.number}
            title={benefit.title}
            description={benefit.description}
          />
        ))}
      </div>
    </section>
  );
};

// Course Card Component
const CourseCard = ({ title, instructor, description, image }) => (
  <div className="p-6 bg-gray-800 rounded-lg shadow-sm flex flex-col md:flex-row">
    <img
      src={image}
      alt={title}
      className="w-full md:w-1/3 rounded-md mb-4 md:mb-0 md:mr-4 max-h-40 object-cover"
    />
    <div>
      <h3 className="text-lg font-roboto font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-50 font-roboto mb-2">By {instructor}</p>
      <p className="text-gray-300 font-roboto mb-6">{description}</p>
      <Button className="bg-gray-600 hover:bg-green-700">Get Now</Button>
    </div>
  </div>
);

// Courses Section Component
const CoursesSection = () => {
  const courses = [
    {
      title: "Web Design Fundamentals",
      instructor: "John Smith",
      description: "Learn the basics of web design, including HTML, CSS, and responsive design.",
      image: "/courses/web_design.jpg",
    },
    {
      title: "UI/UX Design",
      instructor: "Emily Johnson",
      description: "Master the art of creating intuitive user interfaces and experiences.",
      image: "/courses/uiux.jpg",

    },
    {
      title: "Mobile App Development",
      instructor: "David Brown",
      description: "Build native mobile apps using industry-leading frameworks.",
      image: "/courses/appdev.jpg",

    },
    {
      title: "Generative AI",
      instructor: "Unnath Chittimalla",
      description: "Explore the intersection of AI and creativity with generative models.",
      image: "/courses/genai.jpg",

    }
  ];

  return (
    <section id="courses" className="px-8 py-16 bg-gray-900">
      <h2 className="text-3xl font-roboto font-bold text-white mb-8">Popular Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course, idx) => (
          <CourseCard
            key={idx}
            title={course.title}
            instructor={course.instructor}
            description={course.description}
            image={course.image}
          />
        ))}
      </div>
    </section>
  );
};

// Team Member Card Component (Updated for Google theme)
const TeamMemberCard = ({ name, linkedIn, image }) => (
  <div className="p-6 bg-gray-800 rounded-lg shadow-sm text-center">
    <a href={linkedIn} target="_blank" rel="noopener noreferrer">
      <img src={image} alt={name} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-blue-100" />
      <h3 className="text-lg font-roboto font-semibold text-white">{name}</h3>
    </a>
  </div>
);

// Team Section Component
const TeamSection = () => {
  const teamMembers = [
    {
      name: "Prakrititz Borah",
      linkedIn: "https://www.linkedin.com/in/prakrititz-borah-348b04287/",
      image: "https://res.cloudinary.com/teepublic/image/private/s--YuICndWD--/c_crop,x_10,y_10/c_fit,h_830/c_crop,g_north_west,h_1038,w_1038,x_-134,y_-96/l_upload:v1565806151:production:blanks:vdbwo35fw6qtflw9kezw/fl_layer_apply,g_north_west,x_-245,y_-207/b_rgb:ffffff/c_limit,f_auto,h_630,q_auto:good:420,w_630/v1689579937/production/designs/47962090_0.jpg",
    },
    {
      name: "Sriram Srikanth",
      linkedIn: "https://www.linkedin.com/in/sriram-srikanth-066376284/",
      image: "https://res.cloudinary.com/teepublic/image/private/s--YuICndWD--/c_crop,x_10,y_10/c_fit,h_830/c_crop,g_north_west,h_1038,w_1038,x_-134,y_-96/l_upload:v1565806151:production:blanks:vdbwo35fw6qtflw9kezw/fl_layer_apply,g_north_west,x_-245,y_-207/b_rgb:ffffff/c_limit,f_auto,h_630,q_auto:good:420,w_630/v1689579937/production/designs/47962090_0.jpg",
    },
    {
      name: "Unnath Chittimalla",
      linkedIn: "https://www.linkedin.com/in/unnath-chittimalla-08aaaa287/",
      image: "https://res.cloudinary.com/teepublic/image/private/s--YuICndWD--/c_crop,x_10,y_10/c_fit,h_830/c_crop,g_north_west,h_1038,w_1038,x_-134,y_-96/l_upload:v1565806151:production:blanks:vdbwo35fw6qtflw9kezw/fl_layer_apply,g_north_west,x_-245,y_-207/b_rgb:ffffff/c_limit,f_auto,h_630,q_auto:good:420,w_630/v1689579937/production/designs/47962090_0.jpg",
    },
    {
      name: "Areen Patil",
      linkedIn: "https://www.linkedin.com/in/areen-patil-98679128b/",
      image: "https://res.cloudinary.com/teepublic/image/private/s--YuICndWD--/c_crop,x_10,y_10/c_fit,h_830/c_crop,g_north_west,h_1038,w_1038,x_-134,y_-96/l_upload:v1565806151:production:blanks:vdbwo35fw6qtflw9kezw/fl_layer_apply,g_north_west,x_-245,y_-207/b_rgb:ffffff/c_limit,f_auto,h_630,q_auto:good:420,w_630/v1689579937/production/designs/47962090_0.jpg",
    },
  ];

  return (
    <section id="team" className="px-8 py-6 bg-gray-900">
      <h2 className="text-3xl font-roboto font-bold text-white mb-8">Our Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {teamMembers.map((member, idx) => (
          <TeamMemberCard
            key={idx}
            name={member.name}
            linkedIn={member.linkedIn}
            image={member.image}
          />
        ))}
      </div>
    </section>
  );
};

// Footer Component (Google-themed)
const Footer = () => (
  <footer className="bg-gray-800 py-5 text-center text-gray-100">
    <p className="font-roboto">GDG Solution Challenge 2025</p>
    <p className="font-roboto mt-2">
      Powered by <span className="text-blue-400 font-medium">Google</span>
    </p>
  </footer>
);

const Layout = ({ children, isAuthenticated, currentUser, onLogin, onLogout }) => {
  const location = useLocation();
  const isChatbotPage = location.pathname === '/chatbot';
  return (
    <div className="min-h-screen bg-gray font-roboto">
      {!isChatbotPage && (
        <Header
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      )}
      {children}
      {!isChatbotPage && <Footer />}
    </div>
  );
};

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Add this state

  useEffect(() => {
    const initializeAuthState = async () => {
      setIsLoading(true); // Set loading when starting
      try {
        const storedUser = localStorage.getItem('currentUser');
        console.log('Stored User:', storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
              const idToken = await user.getIdToken();
              const userData = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                idToken,
              };
              setCurrentUser(userData);
              setIsAuthenticated(true);
              localStorage.setItem('currentUser', JSON.stringify(userData));
            } else {
              setCurrentUser(null);
              setIsAuthenticated(false);
              localStorage.removeItem('currentUser');
            }
          });
          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false); // Clear loading when done
      }
    };
    initializeAuthState();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const userData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        idToken,
      };
      setCurrentUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRoleSubmit = async () => {
    if (!selectedRole) return;

    try {
      const idToken = currentUser.idToken;
      await fetch('/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          role: selectedRole,
          email: currentUser.email,
          name: currentUser.displayName
        })
      });
      setRoleModalOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <Router>
      <AuthProvider>
        <Layout
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLogin={handleGoogleLogin}
          onLogout={handleLogout}
        >
          {isLoading ? <Loading /> : (
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <HeroSection
                      isAuthenticated={isAuthenticated}
                      currentUser={currentUser}
                      onLogin={handleGoogleLogin}
                    />
                    <BenefitsSection />
                    <CoursesSection />
                    <TeamSection />
                  </>
                }
              />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/classroom/:classroomId" element={<Classroom />} />
              <Route path="/create-classroom" element={<CreateClassroom />} />
              <Route path="/classroom/:classroomId/create-assignment" element={<CreateAssignment />} />
              <Route path="/classroom/:classroomId/assignment/:assignmentId/grade" element={<Classroom view="grade" />} />
              <Route path="/classroom/:classroomId/assignment/:assignmentId/submit" element={<Classroom view="submit" />} />
            </Routes>
          )}

          {/* Role Selection Modal */}
          <Modal
            title="Select Your Role"
            isOpen={roleModalOpen}
            onClose={() => setRoleModalOpen(false)}
          >
            <div className="space-y-4">
              <p className="text-gray-600 font-roboto">Please select your role to continue:</p>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-roboto"
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <Button onClick={handleRoleSubmit} className="w-full">Submit</Button>
            </div>
          </Modal>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default Home;