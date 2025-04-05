import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronRight, ChevronLeft, BookOpen, X, Send, Mic, Plus, Trash, Share2, FileUp, ArrowDown } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import VisualSummary from './VisualSummary';
import MarkdownRenderer from './MarkdownRenderer';
import Loading from './components/Loading';

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

// Sidebar Item Component
const SidebarItem = ({ title, lessons, isActive, onClick, chatId }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <div
        onClick={onClick}
        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
          isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-500 bg-gray-600 text-white'
        }`}
      >
        <span className="font-roboto font-medium">{title}</span>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      {isOpen && (
        <ul className="ml-4 mt-2 space-y-2">
          {lessons.map((lesson, idx) => (
            <li
              key={idx}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 font-roboto text-sm"
            >
              {lesson.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ courses, setCourses, activeCourse, setActiveCourse, isSidebarOpen, toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const auth = getAuth();

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCourse = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/chats/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ title: 'New Chat ' + Date.now().toString().slice(-4) })
      });
      const data = await response.json();
      setCourses(prev => [...prev, {
        chatId: data.chatId,
        title: 'New Chat ' + Date.now().toString().slice(-4),
        lessons: []
      }]);
    } catch (error) {
      console.error('Add course error:', error);
    }
  };

  const handleRemoveCourse = () => {
    console.log("Remove Course clicked");
  };

  const handleShareCourse = () => {
    console.log("Share Course clicked");
  };

  return (
    <div
      className={`bg-gray-800 border-gray-700 h-screen p-6 flex flex-col transition-all duration-300 shadow-sm ${
        isSidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        {isSidebarOpen && (
          <h2 className="text-xl font-roboto font-bold text-white">Classistant</h2>
        )}
        <button onClick={toggleSidebar} className="text-gray-300 hover:text-blue-500">
          {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>
      </div>
      {isSidebarOpen && (
        <>
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 bg-gray-900 text-white placeholder-gray-400 rounded-full border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex space-x-2 mb-6">
            <button
              onClick={handleAddCourse}
              className="p-2 rounded-full bg-gray-900 text-green-400 hover:bg-gray-700 transition-all duration-200"
              title="Add Chat"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={handleRemoveCourse}
              className="p-2 rounded-full bg-gray-900 text-red-400 hover:bg-gray-700 transition-all duration-200"
              title="Remove Chat"
            >
              <Trash size={20} />
            </button>
            <button
              onClick={handleShareCourse}
              className="p-2 rounded-full bg-gray-900 text-yellow-400 hover:bg-gray-700 transition-all duration-200"
              title="Share Chat"
            >
              <Share2 size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
            {filteredCourses.map((course, idx) => (
              <SidebarItem
                key={course.chatId}
                title={course.title}
                lessons={course.lessons}
                chatId={course.chatId}
                isActive={activeCourse === idx}
                onClick={() => setActiveCourse(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// SingleFileUploader Component
const SingleFileUploader = ({ chatId }) => {
  
  const auth = getAuth();
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const idToken = await auth.currentUser.getIdToken();
        const user = auth.currentUser;
        const response = await fetch('/files/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: user.role === 'student' ? 'student_upload' : 'teacher_upload',
            jsonData: {},
            chatId: chatId
          })
        });
        const data = await response.json();
        alert(`File uploaded successfully! File ID: ${data.fileId}`);
        return data.fileId;
      } catch (error) {
        console.error('File upload error:', error);
      }
    }
  };

  return (
    <label
      htmlFor="file-upload"
      className="p-3 rounded-full transition-all duration-200 text-gray-400 hover:bg-gray-600 cursor-pointer"
      title="Upload a file"
    >
      <FileUp size={20} />
      <input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />
    </label>
  );
};

// Chat Message Component
const ChatMessage = ({ sender, message }) => (
  <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div
      className={`max-w-2xl p-4 shadow-sm rounded-xl ${
        sender === 'user'
          ? 'bg-gray-600 text-white'
          : 'bg-gray-800 text-white border-l-4 border-blue-600'
      }`}
    >
      {sender === 'user' ? (
        <p>{message}</p>
      ) : (
        <MarkdownRenderer content={message} />
      )}
      <div className="mt-2 text-xs text-gray-400">
        {sender === 'user' ? 'You' : 'Tibby'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  </div>
);

// ChatUI Component
const ChatUI = ({ course, setSelectedAid, addLearningAid }) => {
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingAid, setIsLoadingAid] = useState(false);
  const [isAidModalOpen, setIsAidModalOpen] = useState(false);
  const chatContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    if (!course || !course.chatId) return;
    const fetchMessages = async () => {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(`/messages/${course.chatId}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const data = await response.json();
        setMessages(data.map(msg => ({
          sender: msg.senderId === auth.currentUser.uid ? 'user' : msg.senderId === 'ai' ? 'bot' : 'unknown',
          message: msg.text
        })));
        
      } catch (error) {
        console.error('Fetch messages error:', error);
        setMessages([{ sender: 'bot', message: `Welcome to ${course.title}! How can I assist you today?` }]);
      }
    };
    fetchMessages();
  }, [course?.chatId]);

  const handleSend = async () => {
  if (!input.trim() || !course?.chatId) return;
  try {
    const idToken = await auth.currentUser.getIdToken();
    const newMessage = { sender: 'user', message: input };
    setMessages(prev => [...prev, newMessage]);

    // Save user's message to Firebase
    await fetch('/messages/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        text: input,
        chatId: course.chatId
      })
    });

    // Send message to AI and get response
    const response = await fetch('/chat_with_memory/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        chatId: course.chatId,
        userMessage: input
      })
    });

    const data = await response.json();
    setMessages(prev => [...prev, { sender: 'bot', message: data.response }]);
    setInput('');
  } catch (error) {
    console.error('Message send error:', error);
  }
};

  const handleCreateAid = async (type, topic = null) => {
    if (!course?.chatId) return;
    setIsAidModalOpen(false);
    setIsLoadingAid(true);
    
    try {
      const idToken = await auth.currentUser.getIdToken();
      const aidTitle = topic ? `${topic} - ${type.charAt(0).toUpperCase() + type.slice(1)}` : `${course.title} - ${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now().toString().slice(-4)}`;
      let jsonData;

      if (type === 'summary') {
        const response = await fetch('/visualsummary/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ topic: topic || 'space exploration', rag: 'no info' })
        });
        if (!response.ok) throw new Error('Generate summary failed');
        const data = await response.json();
        jsonData = data.jsonData;
      } else if (type === 'quiz') {
        const response = await fetch('/quiz/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ topic: topic || course.title, rag: 'no info' })
        });
        if (!response.ok) throw new Error('Generate quiz failed');
        const data = await response.json();
        jsonData = data.jsonData;
      } else {
        jsonData = { type };
      }

      const fileResponse = await fetch('/files/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          fileName: `${aidTitle}.json`,
          fileType: 'ai_generated',
          jsonData: jsonData,
          chatId: course.chatId
        })
      });
      const fileData = await fileResponse.json();

      await fetch('/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          text: `Created new ${type}: ${aidTitle}`,
          chatId: course.chatId,
          senderId: 'ai',
          generatedFileId: fileData.fileId
        })
      });

      const newAid = { type, title: aidTitle, fileId: fileData.fileId };
      addLearningAid(newAid);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', message: `Created new ${type}: ${aidTitle}` }
      ]);
    } catch (error) {
      console.error('Create aid error:', error);
    } finally {
      setIsLoadingAid(false);
    }
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      console.log("Starting voice recording...");
      setTimeout(() => {
        setInput("Voice input example: Summarize this lesson");
        setIsRecording(false);
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };
    
    const chatContainer = chatContainerRef.current;
    chatContainer?.addEventListener('scroll', handleScroll);
    return () => chatContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  if (!course) {
    return <div className="flex-1 flex items-center justify-center">Loading chat...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-900 relative">
      <div className="p-6 bg-gray-800 border-b border-gray-700 shadow-sm">
        <h2 className="text-2xl font-roboto font-bold text-white">{course.title}</h2>
      </div>
      <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} sender={msg.sender} message={msg.message} />
        ))}
      </div>
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-100 transition-all duration-200"
        >
          <ArrowDown size={20} className="text-gray-600" />
        </button>
      )}
      <div className="p-4 bg-gray-800 border-t border-gray-700 shadow-sm">
        <div className="relative flex items-center bg-gray-900 border border-gray-700 focus-within:ring-2 focus-within:ring-blue-500">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question or request a learning aid..."
            className="flex-1 p-3 pl-4 pr-32 border-0 bg-transparent focus:outline-none font-roboto text-white placeholder-gray-400"
          />
          <div className="absolute right-2 flex items-center space-x-1">
            <SingleFileUploader chatId={course.chatId} />
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              <Mic size={18} />
            </button>
            <button
              onClick={() => setIsAidModalOpen(true)}
              disabled={isLoadingAid}
              className={`p-2 rounded-full ${isLoadingAid ? 'animate-spin text-gray-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              <Plus size={18} />
            </button>
            <button
              onClick={handleSend}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      <AidSelectionModal
        isOpen={isAidModalOpen}
        onClose={() => setIsAidModalOpen(false)}
        onSelect={handleCreateAid}
      />
    </div>
  );
};

// Mind Map Component
const MindMap = ({ title, onClose, fileId }) => {
  
  const [content, setContent] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(`/files/${fileId}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const data = await response.json();
        setContent(data.jsonData);
      } catch (error) {
        console.error('Fetch mind map error:', error);
      }
    };
    if (fileId) fetchContent();
  }, [fileId]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-800">
      <div className="p-6 bg-white border-b border-gray-200 rounded-b-3xl shadow-sm flex items-center justify-between">
        <h2 className="text-2xl font-roboto font-bold text-gray-800">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 bg-gray-600 text-gray-600 rounded-full hover:bg-gray-600 transition-all duration-200"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-gray-100 h-full rounded-2xl flex items-center justify-center shadow-sm">
          <p className="text-gray-500 font-roboto">
            {content ? 'Mind Map: ' + JSON.stringify(content) : 'Loading Mind Map...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Quiz Component
const Quiz = ({ title, onClose, fileId }) => {
  
  const [content, setContent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const auth = getAuth();
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(`/files/${fileId}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const data = await response.json();
        setContent(data.jsonData);
        setScore(data.jsonData.latestScore); // Load latest score from Firestore
      } catch (error) {
        console.error('Fetch quiz error:', error);
      }
    };
    if (fileId) fetchContent();
  }, [fileId]);

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = async () => {
    if (submitted || !content) return;
    let correctCount = 0;
    content.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correctCount++;
    });
    const newScore = `${correctCount}/${content.questions.length}`;
    setScore(newScore);
    setSubmitted(true);

    // Update Firestore with the latest score
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`/files/${fileId}`, {
        method: 'PATCH', // Assuming PATCH to update existing file
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          fileName: `${content.title}.json`,
          fileType: 'ai_generated',
          jsonData: { ...content, latestScore: newScore }
        })
      });
    } catch (error) {
      console.error('Update score error:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-800">
      <div className="p-6 bg-gray-900 border-b border-gray-800 shadow-sm flex items-center justify-between">
        <h2 className="text-2xl font-roboto font-bold text-gray-200">{title}</h2>
        <div className="flex items-center space-x-4">
          {score && <p className="text-sm text-gray-600">Latest Score: {score}</p>}
          <button
            onClick={onClose}
            className="p-2 bg-gray-600 text-gray-200 rounded-full hover:bg-gray-200 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {content ? (
          <div className="space-y-6">
            {content.questions.map((q, idx) => (
              <div key={idx} className="bg-gray-600 p-4 rounded-2xl shadow-sm">
                <p className="font-roboto text-gray-100 mb-2">{q.question}</p>
                <p className="text-sm text-gray-300 mb-2">Difficulty: {q.difficulty}</p>
                <div className="space-y-2">
                  {q.options.map((option, optIdx) => {
                    const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
                    return (
                      <button
                        key={optIdx}
                        onClick={() => !submitted && handleAnswerChange(idx, optionLetter)}
                        disabled={submitted}
                        className={`w-full p-2 rounded-full border text-left font-roboto text-gray-white ${
                          submitted
                            ? optionLetter === q.correctAnswer
                              ? 'bg-green-800 border-green-400'
                              : answers[idx] === optionLetter
                              ? 'bg-red-800 border-red-400'
                              : 'border-gray-300'
                            : answers[idx] === optionLetter
                            ? 'bg-gray-800 border-blue-400'
                            : 'border-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {optionLetter} {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!submitted && (
              <button
                onClick={handleSubmit}
                className="mt-4 p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-roboto"
              >
                Submit Quiz
              </button>
            )}
            {submitted && (
              <p className="mt-4 text-lg font-roboto text-gray-800">Your Score: {score}</p>
            )}
          </div>
        ) : (
          <p>Loading Quiz...</p>
        )}
      </div>
    </div>
  );
};

// Visual Summary Component
// const VisualSummary = ({ title, onClose, fileId }) => {
//   
//   const [content, setContent] = useState(null);

//   useEffect(() => {
//     const fetchContent = async () => {
//       try {
//         const idToken = await auth.currentUser.getIdToken();
//         const response = await fetch(`/files/${fileId}`, {
//           headers: { 'Authorization': `Bearer ${idToken}` }
//         });
//         const data = await response.json();
//         setContent(data.jsonData);
//       } catch (error) {
//         console.error('Fetch summary error:', error);
//       }
//     };
//     if (fileId) fetchContent();
//   }, [fileId]);

//   return (
//     <div className="flex-1 flex flex-col h-screen bg-gray-50">
//       <div className="p-6 bg-white border-b border-gray-200 rounded-b-3xl shadow-sm flex items-center justify-between">
//         <h2 className="text-2xl font-roboto font-bold text-gray-800">{title}</h2>
//         <button
//           onClick={onClose}
//           className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200"
//         >
//           <X size={20} />
//         </button>
//       </div>
//       <div className="flex-1 p-6 overflow-y-auto">
//         <div className="bg-gray-100 h-full rounded-2xl flex items-center justify-center shadow-sm">
//           <p className="text-gray-500 font-roboto">
//             {content ? 'Summary: ' + JSON.stringify(content) : 'Loading Summary...'}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// Learning Aid Item Component
const LearningAidItem = ({ type, title, onClick, fileId }) => {
  const getIcon = () => {
    switch (type) {
      case 'mindmap':
        return <BookOpen size={20} className="text-blue-600" />;
      case 'quiz':
        return <Search size={20} className="text-green-600" />;
      case 'summary':
        return <Share2 size={20} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-gray-600 rounded-2xl shadow-sm mb-4 cursor-pointer hover:bg-gray-500 transition-all duration-200"
    >
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div>
          <h3 className="text-sm font-roboto  text-gray-300">{title}</h3>
          <p className="text-sm text-gray-400 font-roboto">
            {type === 'mindmap' ? 'Mind Map' : type === 'quiz' ? 'Quiz' : 'Visual Summary'}
          </p>
        </div>
      </div>
    </div>
  );
};

const AidSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [summaryTopic, setSummaryTopic] = useState('');
  const [quizTopic, setQuizTopic] = useState('');

  if (!isOpen) return null;

  const handleSelect = (type) => {
    if (type === 'summary' && !summaryTopic.trim()) {
      alert('Please enter a topic for the Visual Summary');
      return;
    }
    if (type === 'quiz' && !quizTopic.trim()) {
      alert('Please enter a topic for the Quiz');
      return;
    }
    onSelect(type, type === 'summary' ? summaryTopic : type === 'quiz' ? quizTopic : null);
    setSummaryTopic('');
    setQuizTopic('');
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-96 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-roboto font-semibold text-gray-200">Create Learning Aid</h3>
          <button onClick={onClose} className="text-gray-200 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-200 font-roboto mb-6">What type of learning aid would you like to create?</p>
        <div className="space-y-3">
          <button
            onClick={() => handleSelect('mindmap')}
            className="w-full p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-200 font-roboto"
          >
            Mind Map
          </button>
          <button
            onClick={() => handleSelect('quiz')}
            className="w-full p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-200 font-roboto"
          >
            Quiz
          </button>
          <input
            type="text"
            value={quizTopic}
            onChange={(e) => setQuizTopic(e.target.value)}
            placeholder="Enter topic for Quiz (e.g., World War II)"
            className="w-full p-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 font-roboto"
          />
          <button
            onClick={() => handleSelect('summary')}
            className="w-full p-3 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-all duration-200 font-roboto"
          >
            Visual Summary
          </button>
          <input
            type="text"
            value={summaryTopic}
            onChange={(e) => setSummaryTopic(e.target.value)}
            placeholder="Enter topic for Visual Summary (e.g., Space Exploration)"
            className="w-full p-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-roboto"
          />
        </div>
      </div>
    </div>
  );
};

// Interaction Canvas Component
const InteractionCanvas = ({ isOpen, toggleCanvas, learningAids, setSelectedAid }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'type'

  if (!isOpen) return null;

  const filteredAids = learningAids
    .filter(aid => 
      aid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aid.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      // Default to newest first based on fileId (assuming it's timestamp-based)
      return b.fileId.localeCompare(a.fileId);
    });

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 h-screen p-6 flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-roboto font-bold text-white">Learning Aids</h2>
        <button onClick={toggleCanvas} className="text-gray-600 hover:text-blue-600">
          <X size={24} />
        </button>
      </div>
      
      {/* Search and Sort Controls */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search aids..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-full border border-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 font-roboto bg-gray-600"
          />
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        <div className="flex justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 rounded-lg border border-gray-900 text-sm font-roboto text-white focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-600"
          >
            <option value="newest">Newest First</option>
            <option value="type">By Type</option>
          </select>
        </div>
      </div>

      {/* Learning Aids List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
        {filteredAids.length > 0 ? (
          filteredAids.map((aid) => (
            <LearningAidItem
              key={aid.fileId}
              type={aid.type}
              title={aid.title}
              fileId={aid.fileId}
              onClick={() => setSelectedAid(aid)}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 mt-8">
            {searchQuery ? 'No matching aids found' : 'No learning aids created yet'}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Chatbot Page Component
const Chatbot = () => {
  const [activeCourse, setActiveCourse] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [selectedAid, setSelectedAid] = useState(null);
  const [learningAids, setLearningAids] = useState([]);
  const [courses, setCourses] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    if (storedUser) {
      setUserId(storedUser.uid);
      setIdToken(storedUser.idToken);
    } else {
      console.error("User not logged in");
    }
  }, []);

  useEffect(() => {
    if (!userId || !idToken) return;

    const fetchUserAndCourses = async () => {
      try {
        console.log('ID TOKEN IS HERE', idToken);
        const userData = await getUser(userId, idToken);
        setUserRole(userData.role);

        // Fetching the learning aids
        const filesResponse = await fetch('/files/list/', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const filesData = await filesResponse.json();
        const aids = filesData
          .filter(file => file.fileType === 'ai_generated')
          .map(file => ({
            type: file.jsonData.type || 'summary', // Default to summary if type not specified
            title: file.fileName,
            fileId: file.fileId
          }));
        setLearningAids(aids);

        // Fetch existing chats for the user from the new /chats/ endpoint
        const chatsResponse = await fetch('/chats/', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const chatsData = await chatsResponse.json();

        if (chatsData.length > 0) {
          // Map the fetched chats to the courses format expected by the frontend
          setCourses(chatsData.map(chat => ({
            chatId: chat.chatId,
            title: chat.title,
            lessons: [] // Lessons are still static; you could fetch related data here if needed
          })));
        } else {
          // If no chats exist, create a default chat
          const chatResponse = await fetch('/chats/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ title: "Default Chat" })
          });
          const chatData = await chatResponse.json();
          setCourses([{
            chatId: chatData.chatId,
            title: "Default Chat",
            lessons: [{ title: "Introduction", description: "Getting started." }]
          }]);
        }
      } catch (error) {
        console.error('Fetch data error:', error);
        // Fallback to a static default chat if fetching fails
        setCourses([{
          chatId: 'default-chat-id',
          title: "Default Chat",
          lessons: [{ title: "Introduction", description: "Getting started." }]
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndCourses();
  }, [userId, idToken]);

  const addLearningAid = (newAid) => {
    setLearningAids((prev) => [...prev, newAid]);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCanvas = () => setIsCanvasOpen(!isCanvasOpen);
  const closeAid = () => setSelectedAid(null);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-roboto relative">
      <Sidebar
        courses={courses}
        setCourses={setCourses}
        activeCourse={activeCourse}
        setActiveCourse={setActiveCourse}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      {selectedAid ? (
        <>
          {selectedAid.type === 'mindmap' && (
            <MindMap 
              title={selectedAid.title} 
              fileId={selectedAid.fileId}
              onClose={closeAid} 
            />
          )}
          {selectedAid.type === 'quiz' && (
            <Quiz 
              title={selectedAid.title} 
              fileId={selectedAid.fileId}
              onClose={closeAid} 
            />
          )}
          {selectedAid.type === 'summary' && (
            <VisualSummary 
              title={selectedAid.title} 
              fileId={selectedAid.fileId}
              onClose={closeAid} 
            />
          )}
        </>
      ) : (
        <ChatUI 
          course={courses[activeCourse]} 
          setSelectedAid={setSelectedAid} 
          addLearningAid={addLearningAid}
        />
      )}
      <InteractionCanvas
        isOpen={isCanvasOpen}
        toggleCanvas={toggleCanvas}
        learningAids={learningAids}
        setSelectedAid={setSelectedAid}
      />
      <button
        onClick={toggleCanvas}
        className="absolute top-4 right-4 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
      >
        <BookOpen size={22} />
      </button>
    </div>
  );
};

export default Chatbot;